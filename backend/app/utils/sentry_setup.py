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


def api_sentry_options(dsn: str, environment: str) -> dict[str, Any]:
    """Opciones de la API: errores y trazas de FastAPI y SQLAlchemy, sin PII."""
    return {
        "dsn": dsn,
        "environment": environment,
        "integrations": [FastApiIntegration(), SqlalchemyIntegration()],
        "traces_sample_rate": TRACES_SAMPLE_RATE,
        "send_default_pii": False,
    }


def worker_sentry_options(dsn: str, environment: str) -> dict[str, Any]:
    """Opciones del worker de ARQ, que corre en su propio proceso."""
    return {
        "dsn": dsn,
        "environment": environment,
        "traces_sample_rate": TRACES_SAMPLE_RATE,
    }
