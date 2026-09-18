
"""
@module Yataí Finance
@file services/portal-api/src/yatai_api/predictive/temporal/resolution.py
@custom file_visibility public
@custom id
@description Deterministic resolution of competing observations into a single value per feature.
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

Precedence: tier, then latest available_time, then latest ingested_time, then
source_version, then observation_id. The last two exist only to make a full tie
deterministic; no ordering ever depends on the value itself.
"""

from collections.abc import Iterable
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from yatai_api.predictive.temporal.observation import (
    Observation,
    ObservationValue,
    QualityStatus,
    SourceTier,
)


class ResolvedFeature(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    feature_name: str
    entity_id: str
    value: ObservationValue
    unit: str | None
    tier_used: SourceTier
    is_fallback: bool
    quality_status: QualityStatus
    observation_id: str
    source_id: str
    source_version: str
    available_time: datetime
    superseded_observation_ids: tuple[str, ...] = ()


def _precedence_key(
    observation: Observation,
) -> tuple[int, datetime, datetime, str, str]:
    return (
        -observation.tier.value,
        observation.stamps.available_time,
        observation.stamps.ingested_time,
        observation.source_version,
        observation.observation_id,
    )


def resolve(candidates: Iterable[Observation]) -> ResolvedFeature | None:
    """Pick the authoritative observation among candidates already filtered for visibility."""
    usable = [
        obs for obs in candidates if obs.quality_status is not QualityStatus.REJECTED
    ]
    if not usable:
        return None

    winner = max(usable, key=_precedence_key)
    superseded = tuple(
        sorted(
            obs.observation_id
            for obs in usable
            if obs.observation_id != winner.observation_id
        )
    )

    return ResolvedFeature(
        feature_name=winner.feature_name,
        entity_id=winner.entity_id,
        value=winner.value,
        unit=winner.unit,
        tier_used=winner.tier,
        is_fallback=winner.tier is SourceTier.FALLBACK,
        quality_status=winner.quality_status,
        observation_id=winner.observation_id,
        source_id=winner.source_id,
        source_version=winner.source_version,
        available_time=winner.stamps.available_time,
        superseded_observation_ids=superseded,
    )
