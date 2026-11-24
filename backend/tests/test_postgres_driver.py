"""Lo que solo se ve contra un Postgres de verdad.

Las pruebas corren sobre SQLite (ver CLAUDE.md, "Las pruebas corren sobre
SQLite"), y el cambio de driver a psycopg 3 vive justo en esa brecha: psycopg 3
manda los parámetros aparte al servidor, y Postgres no acepta parámetros en
`SET`. Un `SET LOCAL x = :valor` que con psycopg2 funcionaba revienta con
psycopg 3, y ninguna prueba sobre SQLite lo nota.

Se saltan si `TEST_POSTGRES_URL` no está definida. Para correrlas:

    docker run -d --name pg-test -e POSTGRES_PASSWORD=test -p 55432:5432 postgres:16
    TEST_POSTGRES_URL=postgresql://postgres:test@localhost:55432/postgres pytest tests/test_postgres_driver.py
"""

import os
from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.database import sqlalchemy_url

PG_URL = os.environ.get("TEST_POSTGRES_URL")

pytestmark = pytest.mark.skipif(not PG_URL, reason="TEST_POSTGRES_URL no definida")


@pytest.fixture
def pg_session(monkeypatch):
    engine = create_engine(sqlalchemy_url(PG_URL))
    Session = sessionmaker(bind=engine)
    monkeypatch.setattr("app.database.SessionLocal", Session)
    yield Session
    engine.dispose()


def test_engine_uses_psycopg3():
    engine = create_engine(sqlalchemy_url(PG_URL))
    try:
        assert engine.dialect.driver == "psycopg"
        with engine.connect() as conn:
            assert conn.execute(text("SELECT 1")).scalar() == 1
    finally:
        engine.dispose()


@pytest.mark.parametrize("center_id", ["", "7b0f0a2e-5c1d-4c8e-9a51-2f3d0c6b9e11"])
def test_get_db_sets_the_tenant_for_the_transaction_only(pg_session, center_id):
    """`get_db` fija el centro para las políticas RLS dentro de la transacción y
    se borra al terminarla, como `SET LOCAL`."""
    from app.database import get_db

    request = SimpleNamespace(state=SimpleNamespace(rls_center_id=center_id))
    gen = get_db(request)
    db = next(gen)
    try:
        inside = db.execute(text("SELECT current_setting('app.current_center_id', true)")).scalar()
        assert inside == center_id
        db.commit()
        after = db.execute(text("SELECT current_setting('app.current_center_id', true)")).scalar()
        assert after in (None, ""), "el valor se filtró fuera de la transacción"
    finally:
        gen.close()
