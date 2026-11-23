"""La configuración de Sentry tiene que ser aceptada por el SDK instalado, y no
puede sacar datos personales.

**Que el SDK la acepte.** En las pruebas no hay DSN, así que `sentry_sdk.init`
nunca corre y una versión mayor del SDK que deje de aceptar una opción pasa el
CI en verde. En producción sí hay DSN, y el `init` corre al importar `app.main`:
el proceso no arranca. Pasó con sentry-sdk 3.0, que rechazó `send_default_pii`.

**Que no saque datos personales.** sentry-sdk 3 reemplazó `send_default_pii` por
`data_collection`, y sus valores por defecto recolectan casi todo: IP, cuerpos
de petición, valores de las consultas SQL, prompts de IA y argumentos de los
jobs. Un intake o un pre-registro lleva nombre, correo y teléfono del donante.
La prueba de comportamiento manda una petición real que falla y revisa lo que
saldría hacia Sentry.
"""

import json

import pytest
import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from sentry_sdk.transport import Transport

from app.utils.sentry_setup import (
    DATA_COLLECTION,
    api_sentry_options,
    worker_sentry_options,
)

TEST_DSN = "https://public@o1.ingest.sentry.io/1"
DONOR_EMAIL = "persona.donante@example.com"
DONOR_PHONE = "5512345678"
CLIENT_IP = "203.0.113.77"
SESSION_TOKEN = "eyJ0ZXN0IjoidG9rZW4ifQ.not-a-real-session"


class _MemoryTransport(Transport):
    def __init__(self, options=None):
        super().__init__(options)
        self.envelopes = []

    def capture_envelope(self, envelope):
        self.envelopes.append(envelope)

    def serialized(self) -> str:
        chunks = []
        for envelope in self.envelopes:
            for item in envelope.items:
                payload = item.payload.json if item.payload.json is not None else item.payload.bytes
                chunks.append(payload if isinstance(payload, (bytes, str)) else json.dumps(payload))
        return " ".join(c.decode() if isinstance(c, bytes) else c for c in chunks)


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


@pytest.mark.parametrize("build_options", [api_sentry_options, worker_sentry_options])
def test_both_processes_restrict_data_collection(build_options):
    assert build_options(TEST_DSN, "test")["data_collection"] == DATA_COLLECTION


def test_data_collection_turns_off_every_personal_data_category():
    assert DATA_COLLECTION["user_info"] is False
    assert DATA_COLLECTION["cookies"] == {"mode": "off"}
    assert DATA_COLLECTION["http_bodies"] == []
    assert DATA_COLLECTION["database_query_data"] is False
    assert DATA_COLLECTION["gen_ai"] == {"inputs": False, "outputs": False}
    assert DATA_COLLECTION["queues"] is False
    assert DATA_COLLECTION["stack_frame_variables"] is False
    assert DATA_COLLECTION["http_headers"]["request"]["mode"] == "allowlist"


def test_a_failing_request_sends_neither_donor_data_nor_client_ip():
    transport = _MemoryTransport()
    sentry_sdk.init(**api_sentry_options(TEST_DSN, "test"), transport=transport)

    app = FastAPI()

    @app.post("/intake")
    async def intake(request: Request):
        await request.json()
        raise RuntimeError("intake failed")

    client = TestClient(app, raise_server_exceptions=False)
    response = client.post(
        "/intake?source=test",
        json={"donor_email": DONOR_EMAIL, "donor_phone": DONOR_PHONE},
        headers={
            "x-forwarded-for": CLIENT_IP,
            "cf-connecting-ip": CLIENT_IP,
            "cookie": f"session={DONOR_EMAIL}",
            "authorization": f"Bearer {SESSION_TOKEN}",
            "user-agent": "sentry-setup-test",
        },
    )
    sentry_sdk.flush()

    assert response.status_code == 500
    sent = transport.serialized()
    assert "intake failed" in sent, "el error no llegó a salir: la prueba no estaría midiendo nada"
    assert "sentry-setup-test" in sent, "el user-agent sí debe salir: sirve para depurar"
    assert DONOR_EMAIL not in sent
    assert DONOR_PHONE not in sent
    assert CLIENT_IP not in sent
    assert SESSION_TOKEN not in sent
