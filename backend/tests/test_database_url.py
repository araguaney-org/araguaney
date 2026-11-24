"""La URL de la base siempre se resuelve al driver que está instalado.

Railway entrega `postgresql://...` y una configuración vieja puede traer
`postgresql+psycopg2://...` o `postgres://...`. El backend instala psycopg 3, así
que cualquiera de esas formas tiene que terminar en `postgresql+psycopg://`: si
no, el engine intenta cargar un driver que no está y el proceso no arranca.
"""

import pytest

from app.database import sqlalchemy_url


@pytest.mark.parametrize(
    "given",
    [
        "postgresql://u:p@host:5432/db",
        "postgres://u:p@host:5432/db",
        "postgresql+psycopg2://u:p@host:5432/db",
        "postgresql+psycopg://u:p@host:5432/db",
    ],
)
def test_every_postgres_form_uses_psycopg3(given):
    assert sqlalchemy_url(given) == "postgresql+psycopg://u:p@host:5432/db"


def test_query_string_and_credentials_survive():
    url = "postgresql://user:p%40ss@host:6543/db?sslmode=require"
    assert sqlalchemy_url(url) == "postgresql+psycopg://user:p%40ss@host:6543/db?sslmode=require"


def test_other_databases_are_left_alone():
    assert sqlalchemy_url("sqlite://") == "sqlite://"
    assert sqlalchemy_url("sqlite:///./local.db") == "sqlite:///./local.db"
