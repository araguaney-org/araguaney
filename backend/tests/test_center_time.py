"""Phase 27: the helpers that decide which calendar day an instant belongs to.

Fixed instants throughout. With the real clock these tests would only fail
during the hours when the local day and the UTC day differ, which is exactly
the bug they exist to catch.
"""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

import pytest
from pydantic import ValidationError

from app.routers import report
from app.schemas.center import CenterCreate, CenterUpdate
from app.services import intake_service
from app.utils.center_time import (
    day_window_utc,
    local_date,
    single_timezone_for_country,
    timezones_for_country,
    validate_timezone,
    zone_for,
    zone_name,
)

TAMPA = ZoneInfo("America/New_York")
# 20:30 on July 4th in Tampa (EDT, UTC-4) is already July 5th in UTC.
EVENING_IN_TAMPA = datetime(2025, 7, 5, 0, 30, tzinfo=timezone.utc)


class TestValidation:
    def test_a_real_iana_name_is_accepted(self):
        assert validate_timezone("America/New_York") == "America/New_York"

    def test_an_invented_name_fails_when_written(self):
        """It has to fail in the form, not months later inside a report."""
        with pytest.raises(ValueError):
            validate_timezone("America/Tampa")

    def test_blank_means_no_zone(self):
        assert validate_timezone("  ") is None
        assert validate_timezone(None) is None

    def test_the_center_schemas_validate_the_zone(self):
        assert CenterCreate(name="Tampa", timezone="America/New_York").timezone == "America/New_York"
        with pytest.raises(ValidationError):
            CenterCreate(name="Tampa", timezone="EST5EDT-ish")
        with pytest.raises(ValidationError):
            CenterUpdate(timezone="Not/AZone")


class TestZoneResolution:
    def test_no_zone_is_utc(self):
        assert zone_for(None) is timezone.utc
        assert zone_name(zone_for(None)) == "UTC"

    def test_an_unreadable_stored_value_degrades_to_utc(self):
        """A value written by hand before validation existed must not take the
        report down with it."""
        assert zone_for("Nowhere/Land") is timezone.utc

    def test_a_named_zone_keeps_its_name(self):
        assert zone_name(zone_for("America/New_York")) == "America/New_York"


class TestDayBoundary:
    def test_an_evening_capture_in_tampa_is_that_local_day(self):
        assert local_date(EVENING_IN_TAMPA, TAMPA) == date(2025, 7, 4)
        assert local_date(EVENING_IN_TAMPA, timezone.utc) == date(2025, 7, 5)

    def test_naive_values_from_sqlite_are_read_as_utc(self):
        assert local_date(EVENING_IN_TAMPA.replace(tzinfo=None), TAMPA) == date(2025, 7, 4)

    def test_the_window_runs_from_local_midnight_to_the_next(self):
        lower, upper = day_window_utc(date(2025, 7, 4), date(2025, 7, 4), TAMPA)
        assert lower == datetime(2025, 7, 4, 4, 0)  # 00:00 EDT
        assert upper == datetime(2025, 7, 5, 4, 0)  # exclusive
        assert lower.tzinfo is None and upper.tzinfo is None

    def test_the_window_follows_daylight_saving(self):
        """In January Tampa is UTC-5, not UTC-4: a fixed offset would be wrong
        for half the year."""
        lower, _ = day_window_utc(date(2025, 1, 15), date(2025, 1, 15), TAMPA)
        assert lower == datetime(2025, 1, 15, 5, 0)


class TestCountryZones:
    def test_the_list_is_narrowed_by_country(self):
        zones = timezones_for_country("US")
        assert "America/New_York" in zones
        assert "America/Mexico_City" not in zones

    def test_without_a_country_every_zone_is_offered(self):
        assert len(timezones_for_country(None)) > 300

    def test_a_single_zone_country_needs_no_question(self):
        assert single_timezone_for_country("VE") == "America/Caracas"

    def test_a_multi_zone_country_is_left_empty_rather_than_guessed(self):
        assert single_timezone_for_country("US") is None
        assert single_timezone_for_country("MX") is None
        assert single_timezone_for_country(None) is None


class TestCaptureDate:
    def test_the_capture_date_is_the_centers_day(self, monkeypatch):
        """The shelf-life rule compares this day with a printed expiry date: it
        has to be the day of whoever is holding the box."""
        monkeypatch.setattr(intake_service, "_now", lambda: EVENING_IN_TAMPA)
        assert intake_service._capture_date(TAMPA) == date(2025, 7, 4)


class TestReportWindow:
    def test_the_default_window_ends_on_the_centers_today(self, monkeypatch):
        monkeypatch.setattr(report, "_now", lambda: EVENING_IN_TAMPA)
        start, end = report._resolve_dates(None, None, TAMPA)
        assert end == date(2025, 7, 4)
        assert start == date(2025, 6, 5)
