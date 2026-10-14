"""A center without a timezone still cuts its day in UTC.

Both `_resolve_dates` and the intake capture date used `date.today()`, which
reads the process's local clock. Production happens to run UTC — the
`python:3.12-slim` image sets no timezone — so the numbers were right by
accident rather than by decision, and the accident held only while nobody set
`TZ`.

Phase 27 moved the day to the center's own calendar, but only for centers that
have a zone recorded. These tests pin the fallback: with no zone, nothing
changes from before the phase.
"""

from datetime import date, datetime, timezone

from app.routers import report
from app.services import intake_service


def test_the_default_window_ends_on_the_utc_day(monkeypatch):
    """01:00 UTC on the 5th is still the 4th in Mexico City. Without a center
    zone the window ends on the 5th, the day the stored timestamps are in."""
    monkeypatch.setattr(
        report, "_now", lambda: datetime(2026, 9, 5, 1, 0, tzinfo=timezone.utc)
    )

    start, end = report._resolve_dates(None, None)

    assert end == date(2026, 9, 5)
    assert start == date(2026, 8, 7)  # 30 days inclusive


def test_the_reports_clock_is_utc():
    """Not merely aware: UTC. An aware clock in another zone would still cut
    the day somewhere the stored timestamps do not."""
    assert report._now().utcoffset() == timezone.utc.utcoffset(None)


def test_the_capture_date_without_a_zone_is_the_utc_day(monkeypatch):
    """The shelf-life rule measures from the capture date against expiry dates
    that are plain calendar days. Which day that is cannot depend on where the
    server happens to be running."""
    monkeypatch.setattr(
        intake_service, "_now", lambda: datetime(2026, 9, 5, 1, 0, tzinfo=timezone.utc)
    )
    assert intake_service._capture_date() == date(2026, 9, 5)
