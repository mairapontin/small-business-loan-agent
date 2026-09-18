
"""
@module Yataí Finance
@file services/portal-api/src/yatai_api/predictive/temporal/timestamps.py
@custom file_visibility public
@custom id
@description Bitemporal stamps and the single definition of point-in-time visibility.
@custom status new
@version 01_01
@author Maira Pontin <maira.pontin@yataifinance.com>
@custom ai_author AI Qoder
@custom author_date 260905_022137
@custom reviewer
@custom ai_reviewer
@custom reviewer_date
@custom updated 260908_211306
@example

Timestamp contract (plano_trabalho.md §12):
    event_time      when the fact happened in the world
    available_time  when the fact became usable by a decision
    ingested_time   when the platform stored the fact
    effective_from  start of the validity window of the value
    effective_to    end of the validity window (exclusive), open when None

Look-ahead prevention depends on available_time, never on event_time. A satellite
pass from 10 days ago that was only published today must stay invisible to a
decision taken yesterday.
"""

from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, model_validator


def require_aware(value: datetime, field_name: str) -> datetime:
    if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
        raise ValueError(f"{field_name} must be timezone-aware")
    return value


def to_utc(value: datetime) -> datetime:
    """Normalize to UTC so equal instants produce equal canonical representations."""
    return value.astimezone(UTC)


class TemporalStamps(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    event_time: datetime
    available_time: datetime
    ingested_time: datetime
    effective_from: datetime | None = None
    effective_to: datetime | None = None

    @model_validator(mode="after")
    def check_ordering(self) -> "TemporalStamps":
        for name in (
            "event_time",
            "available_time",
            "ingested_time",
            "effective_from",
            "effective_to",
        ):
            value = getattr(self, name)
            if value is not None:
                require_aware(value, name)

        if self.event_time > self.available_time:
            raise ValueError("event_time must not be after available_time")
        if self.available_time > self.ingested_time:
            raise ValueError("available_time must not be after ingested_time")
        if self.effective_to is not None:
            start = self.effective_from or self.event_time
            if start >= self.effective_to:
                raise ValueError("effective_from must be before effective_to")
        return self

    def is_visible_at(self, decision_time: datetime) -> bool:
        """Whether a decision taken at decision_time is allowed to see this fact."""
        require_aware(decision_time, "decision_time")
        return self.available_time <= decision_time

    def is_effective_at(self, as_of: datetime) -> bool:
        """Whether the value is valid for the instant as_of, per its validity window."""
        require_aware(as_of, "as_of")
        if self.effective_from is not None and as_of < self.effective_from:
            return False
        return self.effective_to is None or as_of < self.effective_to
