from datetime import date, datetime, timedelta, timezone, tzinfo
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request
from sqlalchemy.orm import Session

from app.arq_pool import enqueue
from app.database import get_db
from app.dependencies import get_current_user, tenant_scope
from app.models.box import BOX_STATUSES
from app.models.user import User
from app.repositories.export_job_repository import ExportJobRepository
from app.repositories.report_repository import ReportRepository
from app.schemas.export_job import ExportJobOut
from app.schemas.report import (
    ActivityPoint,
    CategoryBreakdown,
    CenterBreakdown,
    CountryPoint,
    ReportSummary,
    ShrinkageSummary,
)
from app.utils.center_time import local_date, zone_for, zone_name
from app.utils.errors import api_error
from app.utils.cloudflare import get_client_ip
from app.utils.rate_limit import limiter

router = APIRouter(prefix="/v1/reports", tags=["reports"])

_DEFAULT_DAYS = 30
_MAX_RANGE_DAYS = 366


def _now() -> datetime:
    """El reloj de los reportes, en UTC y por separado para poder fijarlo.

    Existe como función y no como una llamada suelta porque una prueba de la
    frontera del día necesita un instante fijo: con el reloj real, la prueba
    solo fallaría durante las horas en que el día local y el UTC difieren.
    """
    return datetime.now(timezone.utc)


def _resolve_dates(
    start: date | None, end: date | None, tz: tzinfo = timezone.utc
) -> tuple[date, date]:
    # "Hoy" es el día del centro consultado (Fase 27), y el repositorio corta
    # la ventana en esa misma zona con `day_window_utc`: las dos mitades tienen
    # que coincidir o la ventana por omisión termina antes de lo capturado esa
    # tarde. Antes salía de `date.today()`, el reloj del proceso, que no es de
    # nadie.
    today = local_date(_now(), tz)
    end = end or today
    start = start or (today - timedelta(days=_DEFAULT_DAYS - 1))
    if start > end:
        start = end
    if (end - start).days > _MAX_RANGE_DAYS:
        start = end - timedelta(days=_MAX_RANGE_DAYS)
    return start, end


def _report_zone(repo: ReportRepository, scope: UUID | None) -> tzinfo:
    """La zona en que se cortan los días de este reporte.

    Un reporte acotado a un centro usa la del centro: dos personas que miran el
    mismo centro desde lugares distintos ven los mismos números. El agregado
    nacional mezcla centros en husos distintos y no tiene un día propio, así que
    sigue en UTC y lo declara (`ReportSummary.timezone`).
    """
    if scope is None:
        return timezone.utc
    return zone_for(repo.center_timezone(scope))


def _report_window(
    repo: ReportRepository, user: User, start: date | None, end: date | None
) -> tuple[UUID | None, tzinfo, date, date]:
    """Alcance, zona y días de un reporte, resueltos juntos para que no se
    desalineen: la ventana se corta en la zona del mismo alcance que se cuenta."""
    scope = tenant_scope(user)
    tz = _report_zone(repo, scope)
    s, e = _resolve_dates(start, end, tz)
    return scope, tz, s, e


def _require_campaign_access(repo: ReportRepository, user: User, campaign_id: UUID) -> None:
    if user.center_role == "national_admin":
        return
    if not repo.is_campaign_member(user.id, campaign_id):
        raise api_error("FORBIDDEN", "No tienes acceso a esta campaña", status_code=403)


@router.get("/campaign/{campaign_id}/summary", response_model=ReportSummary)
@limiter.limit("60/minute")
def get_summary(
    request: Request,
    campaign_id: UUID,
    start: date | None = Query(None),
    end: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = ReportRepository(db)
    _require_campaign_access(repo, current_user, campaign_id)
    scope, tz, s, e = _report_window(repo, current_user, start, end)
    return {**repo.summary(campaign_id, scope, s, e, tz), "timezone": zone_name(tz)}


@router.get("/campaign/{campaign_id}/shrinkage", response_model=ShrinkageSummary)
@limiter.limit("60/minute")
def get_shrinkage(
    request: Request,
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    scope: UUID | None = Depends(tenant_scope),
):
    """Merma de la campaña. Sin rango de fechas: un envío se recibe semanas
    después de despacharse, y la ventana del resto del reporte lo dejaría fuera."""
    repo = ReportRepository(db)
    _require_campaign_access(repo, current_user, campaign_id)
    return repo.shrinkage(campaign_id, scope)


@router.get("/campaign/{campaign_id}/activity", response_model=list[ActivityPoint])
@limiter.limit("60/minute")
def get_activity(
    request: Request,
    campaign_id: UUID,
    start: date | None = Query(None),
    end: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = ReportRepository(db)
    _require_campaign_access(repo, current_user, campaign_id)
    scope, tz, s, e = _report_window(repo, current_user, start, end)
    return repo.activity(campaign_id, scope, s, e, tz)


@router.get("/campaign/{campaign_id}/by-category", response_model=list[CategoryBreakdown])
@limiter.limit("60/minute")
def get_by_category(
    request: Request,
    campaign_id: UUID,
    start: date | None = Query(None),
    end: date | None = Query(None),
    # Sin filtro: "capturado en la ventana", sea cual sea su estado de hoy —
    # el nombre de la pantalla móvil. Con `status=SEALED` se lee como stock.
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if status is not None and status not in BOX_STATUSES:
        raise api_error("INVALID_STATUS", f"Status must be one of {BOX_STATUSES}", field="status")
    repo = ReportRepository(db)
    _require_campaign_access(repo, current_user, campaign_id)
    scope, tz, s, e = _report_window(repo, current_user, start, end)
    return repo.by_category(campaign_id, scope, s, e, tz, status=status)


@router.get("/campaign/{campaign_id}/by-center", response_model=list[CenterBreakdown])
@limiter.limit("60/minute")
def get_by_center(
    request: Request,
    campaign_id: UUID,
    start: date | None = Query(None),
    end: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = ReportRepository(db)
    _require_campaign_access(repo, current_user, campaign_id)
    scope, tz, s, e = _report_window(repo, current_user, start, end)
    return repo.by_center(campaign_id, scope, s, e, tz)


@router.get("/campaign/{campaign_id}/countries", response_model=list[CountryPoint])
@limiter.limit("60/minute")
def get_countries(
    request: Request,
    campaign_id: UUID,
    start: date | None = Query(None),
    end: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = ReportRepository(db)
    _require_campaign_access(repo, current_user, campaign_id)
    scope, tz, s, e = _report_window(repo, current_user, start, end)
    return repo.countries(campaign_id, scope, s, e, tz)


@router.post("/campaign/{campaign_id}/export.csv", response_model=ExportJobOut, status_code=202)
@limiter.limit("10/minute")
def export_csv(
    request: Request,
    campaign_id: UUID,
    background_tasks: BackgroundTasks,
    start: date | None = Query(None),
    end: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Queue the campaign CSV export generation (rate-limited: 10/min). Poll GET /v1/exports/{id}."""
    repo = ReportRepository(db)
    _require_campaign_access(repo, current_user, campaign_id)
    scope, tz, s, e = _report_window(repo, current_user, start, end)

    job = ExportJobRepository(db).create(
        kind="REPORT_EXPORT_CSV",
        params={
            "campaign_id": str(campaign_id),
            "center_id": str(scope) if scope else None,
            "start": s.isoformat(),
            "end": e.isoformat(),
            "timezone": zone_name(tz),
        },
        requested_by=current_user.id,
        center_id=scope,
    )
    enqueue(background_tasks, "generate_report_export_csv_task", str(job.id))
    return ExportJobOut(id=job.id, kind=job.kind, status=job.status, error=None)
