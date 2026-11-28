"""Pure rules behind alias learning (Fase 28, task 6)."""

import pytest

from app.utils.alias_learning import min_distinct_users
from app.utils.text_matching import alias_candidate


@pytest.mark.parametrize(
    "text, expected",
    [
        ("10 frazadas", "frazadas"),
        ("Advil 400mg", "advil"),
        ("ACETAMINOFÉN", "acetaminofen"),
        ("2 cajas de Bonafont 600 ml", "bonafont"),
        ("Bonafont 1 litro", "bonafont"),
        ("3 cajas", None),
        ("24", None),
        ("x2", None),
        ("traigo unas botellas grandes de agua purificada", None),
    ],
)
def test_alias_candidate(text, expected):
    assert alias_candidate(text) == expected


def test_threshold_is_read_from_the_environment(monkeypatch):
    monkeypatch.setenv("ALIAS_LEARNING_MIN_USERS", "3")
    assert min_distinct_users() == 3


def test_threshold_unset_means_off(monkeypatch):
    monkeypatch.delenv("ALIAS_LEARNING_MIN_USERS", raising=False)
    assert min_distinct_users() is None
