"""La configuración de Sentry tiene que ser aceptada por el SDK instalado.

En las pruebas no hay DSN, así que `sentry_sdk.init` nunca corre y una versión
mayor del SDK que deje de aceptar una opción pasa el CI en verde. En producción
sí hay DSN, y el `init` corre al importar `app.main`: el proceso no arranca.
Pasó con sentry-sdk 3.0, que rechaza `send_default_pii` con un `TypeError`.

Estas pruebas inicializan el SDK con las mismas opciones que usan la API y el
worker, con un transporte en memoria, y comprueban que un error llega a salir.
"""

import pytest
import sentry_sdk
from sentry_sdk.transport import Transport

from app.utils.sentry_setup import api_sentry_options, worker_sentry_options

TEST_DSN = "https://public@o1.ingest.sentry.io/1"


class _MemoryTransport(Transport):
    def __init__(self, options=None):
        super().__init__(options)
        self.envelopes = []

    def capture_envelope(self, envelope):
        self.envelopes.append(envelope)


@pytest.fixture(autouse=True)
def _reset_sentry():
    yield
    sentry_sdk.init()  # sin DSN: deja el SDK desactivado para el resto de la suite


@pytest.mark.parametrize("build_options", [api_sentry_options, worker_sentry_options])
def test_installed_sdk_accepts_our_options_and_sends_errors(build_options):
    transport = _MemoryTransport()
    sentry_sdk.init(**build_options(TEST_DSN, "test"), transport=transport)

    try:
        raise RuntimeError("sentry setup check")
    except RuntimeError as exc:
        sentry_sdk.capture_exception(exc)
    sentry_sdk.flush()

    assert transport.envelopes, "el SDK aceptó la configuración pero no envió el error"


def test_api_options_never_send_personal_data():
    """Sin PII de beneficiarios ni de donantes en los reportes de error (CLAUDE.md §9)."""
    assert api_sentry_options(TEST_DSN, "test")["send_default_pii"] is False
