"""Phase 27, end to end: a center in Tampa sees its days, the national
aggregate keeps UTC and says so.

Three boxes in center A, with fixed timestamps:

    UTC instant              Tampa (EDT)          UTC day
    2025-07-04 03:30         July 3, 23:30        July 4
    2025-07-04 15:00         July 4, 11:00        July 4
    2025-07-05 00:30         July 4, 20:30        July 5

Cut in Tampa: one box on the 3rd, two on the 4th. Cut in UTC: two on the
4th, one on the 5th. The difference is the whole bug.
"""

from datetime import date, datetime, timezone

import pytest

from app.models.box import Box
from app.models.intake import Intake
from app.models.product_type import ProductType
from app.routers import report

NOW = datetime(2025, 7, 5, 1, 0, tzinfo=timezone.utc)  # July 4, 21:00 in Tampa


@pytest.fixture()
def tampa(world, monkeypatch):
    world.center_a.timezone = "America/New_York"
    intake = Intake(
        center_id=world.center_a.id,
        campaign_id=world.campaign.id,
        received_by_user_id=world.coordinator_a.id,
    )
    world.db.add(intake)
    world.db.flush()
    for i, stamp in enumerate((
        datetime(2025, 7, 4, 3, 30),
        datetime(2025, 7, 4, 15, 0),
        datetime(2025, 7, 5, 0, 30),
    )):
        world.db.add(Box(
            code=f"BX-TPA{i}", center_id=world.center_a.id, intake_id=intake.id,
            product_type_id=world.product_type.id, status="SEALED",
            batch="L1", expiry_date=date(2027, 1, 1), quantity=1, unit="unidades",
            created_at=stamp,
        ))
    world.db.commit()
    monkeypatch.setattr(report, "_now", lambda: NOW)
    return world


def _activity(client, world, user, **params):
    res = client.get(
        f"/v1/reports/campaign/{world.campaign.id}/activity",
        params=params,
        headers=world.token(user),
    )
    assert res.status_code == 200, res.text
    return {row["date"]: row["total"] for row in res.json()}


def test_the_center_sees_its_own_days(client, tampa):
    assert _activity(client, tampa, tampa.coordinator_a) == {"2025-07-03": 1, "2025-07-04": 2}


def test_an_evening_capture_counts_in_todays_window(client, tampa):
    """At 21:00 in Tampa, "today" is July 4th and must include the 20:30 box."""
    res = client.get(
        f"/v1/reports/campaign/{tampa.campaign.id}/summary",
        params={"start": "2025-07-04", "end": "2025-07-04"},
        headers=tampa.token(tampa.coordinator_a),
    )
    body = res.json()
    assert body["total_boxes"] == 2
    assert body["timezone"] == "America/New_York"


def test_the_national_aggregate_stays_in_utc_and_says_so(client, tampa):
    assert _activity(client, tampa, tampa.admin) == {"2025-07-04": 2, "2025-07-05": 1}
    res = client.get(
        f"/v1/reports/campaign/{tampa.campaign.id}/summary",
        headers=tampa.token(tampa.admin),
    )
    assert res.json()["timezone"] == "UTC"


def test_a_center_without_a_zone_is_unchanged(client, tampa):
    tampa.center_a.timezone = None
    tampa.db.commit()
    assert _activity(client, tampa, tampa.coordinator_a) == {"2025-07-04": 2, "2025-07-05": 1}


def test_the_timezone_list_is_narrowed_by_country(client, world):
    res = client.get(
        "/v1/centers/timezones", params={"country_code": "us"}, headers=world.token(world.admin)
    )
    assert res.status_code == 200
    body = res.json()
    assert body["country_code"] == "US"
    assert "America/New_York" in body["timezones"]


def test_only_the_national_admin_lists_timezones(client, world):
    res = client.get("/v1/centers/timezones", headers=world.token(world.coordinator_a))
    assert res.status_code == 403


@pytest.mark.parametrize(
    ("zone", "rejected"),
    [("America/New_York", False), (None, True)],
)
def test_a_capture_in_tampa_measures_shelf_life_from_the_local_day(
    client, world, monkeypatch, zone, rejected
):
    """Captured at 21:00 on July 4th in Tampa, with a 365-day minimum and an
    expiry of July 4th 2026: exactly 365 days from the local day, so accepted.
    Measured from the UTC day (July 5th) it is 364 and the box is rejected,
    which is still what happens to a center with no zone recorded."""
    from app.services import intake_service

    world.center_a.timezone = zone
    medicine = ProductType(
        display_name="Paracetamol 500 mg", category="MEDICINE", inn_name="paracetamol",
        form="tablet", strength="500 mg", min_shelf_life_days=365, is_controlled=False,
    )
    world.db.add(medicine)
    world.db.commit()
    monkeypatch.setattr(intake_service, "_now", lambda: NOW)

    res = client.post(
        "/v1/intakes",
        json={
            "campaign_id": str(world.campaign.id),
            "boxes": [{
                "product_type_id": str(medicine.id),
                "quantity": 10,
                "unit": "cajas",
                "batch": "L-77",
                "expiry_date": "2026-07-04",
            }],
        },
        headers=world.token(world.coordinator_a),
    )
    assert res.status_code == 201, res.text
    box = res.json()["boxes"][0]
    assert (box["status"] == "REJECTED") is rejected, box.get("reject_reason")
