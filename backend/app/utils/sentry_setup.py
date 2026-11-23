"""Opciones de `sentry_sdk.init` para la API y el worker.

Viven aquí y no escritas en cada `init` para que `tests/test_sentry_setup.py`
inicialice el SDK con exactamente lo mismo que producción. En las pruebas no hay
DSN y el `init` real nunca corre, así que sin esa prueba una versión mayor del
SDK que rechace una opción pasaría el CI y tumbaría el arranque en producción.
"""

from typing import Any

from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

TRACES_SAMPLE_RATE = 0.1

# Qué datos recolecta el SDK por su cuenta (sentry-sdk 3 reemplazó
# `send_default_pii` por esta estructura).
#
# Los valores por defecto de la 3 recolectan casi todo, y un intake o un
# pre-registro lleva nombre, correo y teléfono de quien dona. Un reporte de
# error tiene que servir para encontrar el fallo sin sacar a nadie del sistema:
#
# - `user_info`: sin IP ni usuario.
# - `cookies`: fuera; llevan la sesión.
# - `http_headers`: solo los que describen la petición. En lista blanca y no
#   negra, porque la negra del SDK deja pasar `cf-connecting-ip` y
#   `x-forwarded-for`, que son la IP de la persona.
# - `http_bodies`: ninguno. Es donde viajan los datos del donante. Con 2.x sí se
#   enviaban; apagarlo es deliberado.
# - `database_query_data`: la consulta sí, sus valores no.
# - `gen_ai`: ni el texto libre del donante ni lo que responde el modelo.
# - `queues`: los argumentos de los jobs de ARQ pueden llevar datos personales.
# - `stack_frame_variables`: apagadas. Cuesta depurar más, pero el `scope` de
#   ASGI vive en las variables locales de casi todos los frames de una petición
#   y trae los encabezados crudos como lista de tuplas. El SDK censura por
#   nombre de clave, así que no los reconoce: salían la cookie, la IP y el
#   `Authorization` con el token de sesión. La prueba de comportamiento de
#   tests/test_sentry_setup.py lo encontró.
DATA_COLLECTION: dict[str, Any] = {
    "user_info": False,
    "cookies": {"mode": "off"},
    "http_headers": {
        "request": {
            "mode": "allowlist",
            "terms": ["user-agent", "content-type", "content-length", "accept", "cf-ray"],
        }
    },
    "http_bodies": [],
    "database_query_data": False,
    "gen_ai": {"inputs": False, "outputs": False},
    "queues": False,
    "stack_frame_variables": False,
}


def api_sentry_options(dsn: str, environment: str) -> dict[str, Any]:
    """Opciones de la API: errores y trazas de FastAPI y SQLAlchemy."""
    return {
        "dsn": dsn,
        "environment": environment,
        "integrations": [FastApiIntegration(), SqlalchemyIntegration()],
        "traces_sample_rate": TRACES_SAMPLE_RATE,
        "data_collection": DATA_COLLECTION,
    }


def worker_sentry_options(dsn: str, environment: str) -> dict[str, Any]:
    """Opciones del worker de ARQ, que corre en su propio proceso."""
    return {
        "dsn": dsn,
        "environment": environment,
        "traces_sample_rate": TRACES_SAMPLE_RATE,
        "data_collection": DATA_COLLECTION,
    }
