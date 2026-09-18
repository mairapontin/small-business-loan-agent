
"""
@module Yataí Finance
@file services/portal-api/src/yatai_api/predictive/temporal/observation.py
@custom file_visibility public
@custom id
@description Immutable observation record: one value, one source, one temporal position.
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

An Observation is never updated in place. A revision published by IBGE, CONAB or a
price feed enters as a new Observation with its own available_time, so a decision
taken before the revision keeps reproducing the value it actually used.
"""

from enum import IntEnum, StrEnum

from pydantic import (
    BaseModel,
    ConfigDict,
    StrictBool,
    StrictFloat,
    StrictInt,
    StrictStr,
)

from yatai_api.predictive.temporal.timestamps import TemporalStamps

ObservationValue = StrictBool | StrictInt | StrictFloat | StrictStr | None


class SourceTier(IntEnum):
    """Resolution hierarchy (arquitetura_modelagem.md §11). Lower value wins."""

    PRODUCER_VALIDATED = 1
    EXTERNAL_SPECIFIC = 2
    REGIONAL_BENCHMARK = 3
    FALLBACK = 4


class QualityStatus(StrEnum):
    VALID = "valid"
    SUSPECT = "suspect"
    REJECTED = "rejected"


class Observation(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    observation_id: str
    feature_name: str
    entity_id: str
    value: ObservationValue
    unit: str | None = None
    source_id: str
    source_version: str
    tier: SourceTier
    quality_status: QualityStatus = QualityStatus.VALID
    stamps: TemporalStamps
    evidence_hash: str | None = None
