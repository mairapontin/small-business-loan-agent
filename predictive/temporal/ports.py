
"""
@module Yataí Finance
@file services/portal-api/src/yatai_api/predictive/temporal/ports.py
@custom file_visibility public
@custom id
@description Persistence port for observations, keeping the temporal domain free of storage concerns.
@custom status new
@version 01_01
@author Maira Pontin <maira.pontin@yataifinance.com>
@custom ai_author AI Qoder
@custom author_date 260905_022137
@custom reviewer
@custom ai_reviewer
@custom reviewer_date
@custom updated 260909_143626
@example

The port is synchronous on purpose: the temporal layer is pure computation, so the
domain stays async-free. When this is wired to a caller and a CPU-heavy fetch is
needed, the future database adapter is wrapped in an executor at the API boundary
instead of turning the whole domain async.

ObservationQuery.available_at is a push-down hint so an adapter can filter in the
database. FeatureStore always re-applies the visibility rule after fetching, so an
adapter that ignores the hint stays correct.
"""

from collections.abc import Sequence
from datetime import datetime
from typing import Protocol, runtime_checkable

from pydantic import BaseModel, ConfigDict, model_validator

from yatai_api.predictive.temporal.observation import Observation
from yatai_api.predictive.temporal.timestamps import require_aware


class ObservationQuery(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    entity_id: str
    feature_names: tuple[str, ...]
    available_at: datetime
    effective_at: datetime | None = None

    @model_validator(mode="after")
    def check_query(self) -> "ObservationQuery":
        require_aware(self.available_at, "available_at")
        if self.effective_at is not None:
            require_aware(self.effective_at, "effective_at")
        if not self.feature_names:
            raise ValueError("feature_names must not be empty")
        return self


@runtime_checkable
class ObservationStore(Protocol):
    def fetch(self, query: ObservationQuery) -> Sequence[Observation]: ...
