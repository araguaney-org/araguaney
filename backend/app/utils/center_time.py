"""El día de un centro: en qué calendario cae una captura o un reporte (Fase 27).

Las marcas de tiempo se guardan en UTC y así siguen. Lo que cambia es dónde se
corta el día al leerlas: un día es del centro que lo vive, no del servidor ni de
quien mira el reporte. Un centro sin zona capturada sigue en UTC, así que nada
se mueve hasta que alguien la registra.

Todo el cálculo de fronteras vive aquí, en Python, a propósito: `date_trunc` y
`AT TIME ZONE` no existen en SQLite, que es donde corren las pruebas. Si la
frontera del día se calculara en SQL, las pruebas dejarían de vigilar justo el
cálculo que esta fase cambia.
"""

from datetime import date, datetime, time, timedelta, timezone, tzinfo
from functools import lru_cache
from importlib import resources
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError, available_timezones

UTC_NAME = "UTC"


def validate_timezone(name: str | None) -> str | None:
    """Acepta un nombre IANA real (`America/New_York`) o nada.

    Un nombre inventado tiene que fallar al escribirlo, en el formulario, y no
    meses después en la consulta de un reporte.
    """
    if name is None:
        return None
    cleaned = name.strip()
    if not cleaned:
        return None
    if cleaned not in _known_timezones():
        raise ValueError(f"'{cleaned}' no es una zona horaria IANA válida")
    return cleaned


def zone_for(name: str | None) -> tzinfo:
    """La zona de un centro, o UTC si no tiene una capturada."""
    if not name:
        return timezone.utc
    try:
        return ZoneInfo(name)
    except (ZoneInfoNotFoundError, ValueError):
        # Solo llega aquí un valor escrito antes de la validación o a mano en la
        # base. UTC es el comportamiento previo a la fase: degradar a él es
        # seguro, y un reporte que se cae no le sirve a nadie.
        return timezone.utc


def zone_name(tz: tzinfo) -> str:
    """El nombre que se le enseña a quien lee: `America/New_York` o `UTC`."""
    return getattr(tz, "key", None) or UTC_NAME


def local_date(instant: datetime, tz: tzinfo) -> date:
    """El día del calendario en que cae un instante, visto desde `tz`."""
    if instant.tzinfo is None:
        # SQLite devuelve las marcas sin zona; lo guardado siempre es UTC.
        instant = instant.replace(tzinfo=timezone.utc)
    return instant.astimezone(tz).date()


def day_window_utc(start: date, end: date, tz: tzinfo) -> tuple[datetime, datetime]:
    """Los instantes UTC que delimitan los días `start`..`end` del centro.

    El inicio es inclusivo y el final **exclusivo** (la medianoche local del día
    siguiente), así que una fila cae en la ventana si `inicio <= t < fin`.

    Se devuelven sin `tzinfo` y ya convertidos a UTC: SQLite guarda las marcas
    sin zona y compara texto, así que un valor con zona se compararía por su
    hora local y no por el instante. Postgres los recibe igual de bien.
    """
    lower = datetime.combine(start, time.min, tzinfo=tz)
    upper = datetime.combine(end + timedelta(days=1), time.min, tzinfo=tz)
    return _naive_utc(lower), _naive_utc(upper)


def timezones_for_country(country_code: str | None) -> list[str]:
    """Las zonas de un país, para acotar la lista al dar de alta un centro.

    México tiene cuatro husos y Estados Unidos más de veinte, así que el país no
    alcanza para deducir la zona: sirve para que la lista no tenga seiscientas.
    Sin país, o con uno que la tabla no conoce, se devuelve la lista completa.
    """
    by_country = _zones_by_country()
    if country_code and country_code.upper() in by_country:
        return list(by_country[country_code.upper()])
    return sorted(_known_timezones())


def single_timezone_for_country(country_code: str | None) -> str | None:
    """La zona de un país que tiene una sola; `None` si tiene varias o ninguna.

    Venezuela o Colombia no dejan lugar a dudas y no hace falta preguntar. Para
    México o Estados Unidos se deja vacía: adivinar sería peor que UTC, porque
    UTC al menos está igual de desalineado para todo el mundo.
    """
    if not country_code:
        return None
    zones = _zones_by_country().get(country_code.upper(), ())
    return zones[0] if len(zones) == 1 else None


def _naive_utc(instant: datetime) -> datetime:
    return instant.astimezone(timezone.utc).replace(tzinfo=None)


@lru_cache(maxsize=1)
def _known_timezones() -> frozenset[str]:
    return frozenset(available_timezones())


@lru_cache(maxsize=1)
def _zones_by_country() -> dict[str, tuple[str, ...]]:
    """`zone.tab` del paquete `tzdata`: código de país → zonas, en su orden.

    Se lee del paquete y no del sistema porque la imagen `python:3.12-slim` no
    trae `/usr/share/zoneinfo`.
    """
    text = resources.files("tzdata").joinpath("zoneinfo/zone.tab").read_text(encoding="utf-8")
    table: dict[str, list[str]] = {}
    for line in text.splitlines():
        if not line or line.startswith("#"):
            continue
        fields = line.split("\t")
        if len(fields) >= 3:
            table.setdefault(fields[0], []).append(fields[2])
    return {code: tuple(zones) for code, zones in table.items()}
