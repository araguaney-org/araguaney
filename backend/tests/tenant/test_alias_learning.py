"""Fase 28, task 6: a name becomes an alias once enough distinct people choose
the same product for it.

The threshold value lives only in the environment (public repository), so the
tests set it themselves. What they pin down is the mechanism: distinct people,
off by default, and a removed alias never comes back on its own.
"""

import pytest

from app.models.audit_log import AuditLog
from app.models.product_alias import ProductAlias
from app.models.product_mapping_choice import ProductMappingChoice


def _choose(client, world, user, text, product=None):
    res = client.post(
        "/v1/catalog/mapping-choices",
        json={
            "free_text": text,
            "chosen_product_type_id": str((product or world.product_type).id),
        },
        headers=world.token(user),
    )
    assert res.status_code == 204


def _learned(world):
    return world.db.query(ProductAlias).filter_by(
        product_type_id=world.product_type.id, source="learned"
    ).all()


@pytest.fixture
def learning_on(monkeypatch):
    monkeypatch.setenv("ALIAS_LEARNING_MIN_USERS", "2")


def test_the_name_inside_the_line_is_stored_with_the_choice(client, world):
    """Quantities and presentations are not part of the name: "24 Bonafont
    600ml" is asking for Bonafont."""
    _choose(client, world, world.coordinator_a, "24 Bonafont 600ml")
    row = world.db.query(ProductMappingChoice).one()
    assert row.alias_candidate == "bonafont"


def test_two_distinct_people_graduate_the_name(client, world, learning_on):
    _choose(client, world, world.coordinator_a, "10 Bonafont")
    assert _learned(world) == []

    _choose(client, world, world.coordinator_b, "bonafont 1 litro")
    learned = _learned(world)
    assert [a.alias for a in learned] == ["bonafont"]
    assert learned[0].normalized == "bonafont"

    audit = world.db.query(AuditLog).filter_by(action="PRODUCT_ALIAS_LEARNED").one()
    assert audit.extra["alias"] == "bonafont"
    assert audit.extra["confirmations"] == 2


def test_one_person_repeating_the_name_teaches_nothing(client, world, learning_on):
    """Repetition by a single account is exactly what poisoning looks like."""
    for _ in range(5):
        _choose(client, world, world.coordinator_a, "bonafont")
    assert _learned(world) == []


def test_learning_is_off_without_a_configured_threshold(client, world, monkeypatch):
    monkeypatch.delenv("ALIAS_LEARNING_MIN_USERS", raising=False)
    _choose(client, world, world.coordinator_a, "bonafont")
    _choose(client, world, world.coordinator_b, "bonafont")
    assert _learned(world) == []
    # The choice itself is still recorded: learning is the optional part.
    assert world.db.query(ProductMappingChoice).count() == 2


@pytest.mark.parametrize("value", ["1", "0", "-3", "dos", ""])
def test_a_threshold_below_two_or_garbled_means_off(client, world, monkeypatch, value):
    """With one confirmation, a single person would teach every center."""
    monkeypatch.setenv("ALIAS_LEARNING_MIN_USERS", value)
    _choose(client, world, world.coordinator_a, "bonafont")
    _choose(client, world, world.coordinator_b, "bonafont")
    assert _learned(world) == []


def test_a_name_the_catalog_already_finds_is_not_learned(client, world, learning_on):
    """"agua" already finds "Agua 1L"; the alias would change nothing."""
    _choose(client, world, world.coordinator_a, "6 aguas")
    _choose(client, world, world.coordinator_b, "agua")
    assert world.db.query(ProductMappingChoice).filter_by(alias_candidate="agua").count() == 1
    assert _learned(world) == []


def test_a_whole_sentence_is_not_a_name(client, world, learning_on):
    text = "traigo unas botellas grandes de agua purificada para los niños"
    _choose(client, world, world.coordinator_a, text)
    _choose(client, world, world.coordinator_b, text)
    assert world.db.query(ProductMappingChoice).filter(
        ProductMappingChoice.alias_candidate.is_not(None)
    ).count() == 0
    assert _learned(world) == []


def test_a_removed_alias_does_not_come_back_on_its_own(client, world, learning_on):
    _choose(client, world, world.coordinator_a, "bonafont")
    _choose(client, world, world.coordinator_b, "bonafont")
    [alias] = _learned(world)

    res = client.delete(
        f"/v1/product-types/{world.product_type.id}/aliases/{alias.id}",
        headers=world.token(world.admin),
    )
    assert res.status_code == 204

    # The choices that graduated it are still there; a new one must not
    # bring it back.
    _choose(client, world, world.coordinator_a, "Bonafont")
    _choose(client, world, world.coordinator_b, "bonafont")
    assert _learned(world) == []


def test_a_removed_alias_can_still_be_added_by_hand(client, world, learning_on):
    """Rejection blocks inference, not an explicit decision by a person."""
    _choose(client, world, world.coordinator_a, "bonafont")
    _choose(client, world, world.coordinator_b, "bonafont")
    [alias] = _learned(world)
    client.delete(
        f"/v1/product-types/{world.product_type.id}/aliases/{alias.id}",
        headers=world.token(world.admin),
    )

    res = client.post(
        f"/v1/product-types/{world.product_type.id}/aliases",
        json={"alias": "Bonafont"},
        headers=world.token(world.admin),
    )
    assert res.status_code == 201
    assert res.json()["source"] == "manual"
