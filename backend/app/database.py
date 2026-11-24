from typing import Generator

from fastapi import Request
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool
from app.config import settings

# Formas de URL de Postgres que pueden llegar del entorno. Railway entrega
# `postgresql://`, que SQLAlchemy 2.1 ya resuelve a psycopg 3, pero una
# configuración vieja puede traer `postgresql+psycopg2://` (driver que ya no se
# instala) o `postgres://` (que SQLAlchemy no acepta). Se normalizan aquí para no
# depender del valor por defecto ni de que alguien cambie la variable a mano.
_POSTGRES_SCHEMES = ("postgresql+psycopg2://", "postgresql+psycopg://", "postgresql://", "postgres://")


def sqlalchemy_url(url: str) -> str:
    """URL con el driver explícito: psycopg 3 para Postgres, intacta para lo demás."""
    for scheme in _POSTGRES_SCHEMES:
        if url.startswith(scheme):
            return "postgresql+psycopg://" + url[len(scheme):]
    return url


# TCP keepalives prevent Railway/PgBouncer from silently dropping idle
# connections, which otherwise surfaces as "server closed the connection
# unexpectedly" on the first query after an idle period.
_KEEPALIVE_ARGS = {
    "keepalives": 1,
    "keepalives_idle": 30,
    "keepalives_interval": 10,
    "keepalives_count": 5,
}

if settings.pgbouncer_mode:
    # PgBouncer in transaction-pooling mode manages the connection pool itself.
    # NullPool: SQLAlchemy opens/closes a connection per request (no client pool).
    # prepare_threshold=None: disables prepared statements (incompatible with
    # PgBouncer transaction mode).
    engine = create_engine(
        sqlalchemy_url(settings.database_url),
        poolclass=NullPool,
        connect_args={"prepare_threshold": None, **_KEEPALIVE_ARGS},
    )
else:
    engine = create_engine(
        sqlalchemy_url(settings.database_url),
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args=_KEEPALIVE_ARGS,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db(request: Request) -> Generator[Session, None, None]:
    """Yield a DB session with Row-Level Security context set per transaction.

    RLSContextMiddleware stores center_id (from JWT) in request.state.rls_center_id.
    We pass it via SET LOCAL so Postgres tenant policies are activated automatically.
    national_admin → '' → policy sees all rows.
    """
    db = SessionLocal()
    center_id = getattr(request.state, "rls_center_id", "")
    try:
        # `set_config(..., true)` y no `SET LOCAL ... = :cid`: psycopg 3 manda
        # los parámetros aparte al servidor, y Postgres no los acepta en `SET`.
        # El tercer argumento hace lo mismo que LOCAL: el valor muere con la
        # transacción. tests/test_postgres_driver.py lo vigila contra un Postgres
        # real, porque sobre SQLite no se puede ver.
        db.execute(text("SELECT set_config('app.current_center_id', :cid, true)"), {"cid": center_id})
        yield db
    finally:
        db.close()
