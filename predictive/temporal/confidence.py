
"""
@module Yataí Finance
@file services/portal-api/src/yatai_api/predictive/temporal/confidence.py
@custom file_visibility public
@custom id
@description Evidence confidence from tier, quality and staleness, driven by an injected policy.
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

Confidence measures how well a value is supported by evidence. It is not a measure
of economic risk (plano_trabalho.md §12.1): a well-documented drought is high
confidence and high risk at the same time. Never sum or trade one against the other.

All weights and staleness windows live in the policy, not in this module, because
the thresholds are still PENDING_POLICY.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from yatai_api.predictive.temporal.observation import QualityStatus, SourceTier
from yatai_api.predictive.temporal.resolution import ResolvedFeature
from yatai_api.predictive.temporal.timestamps import require_aware

_SECONDS_PER_DAY = 86400.0


class ConfidencePolicy(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    policy_id: str
    policy_version: str
    tier_weight: dict[SourceTier, float]
    quality_weight: dict[QualityStatus, float]
    staleness_full_confidence_days: float = Field(ge=0)
    staleness_zero_confidence_days: float = Field(gt=0)

    @model_validator(mode="after")
    def check_policy(self) -> "ConfidencePolicy":
        missing_tiers = set(SourceTier) - set(self.tier_weight)
        if missing_tiers:
            raise ValueError(
                f"tier_weight missing entries: {sorted(t.name for t in missing_tiers)}"
            )
        missing_statuses = set(QualityStatus) - set(self.quality_weight)
        if missing_statuses:
            raise ValueError(
                f"quality_weight missing entries: {sorted(s.value for s in missing_statuses)}"
            )
        for weight in (*self.tier_weight.values(), *self.quality_weight.values()):
            if not 0.0 <= weight <= 1.0:
                raise ValueError("weights must be within [0, 1]")
        if self.staleness_full_confidence_days >= self.staleness_zero_confidence_days:
            raise ValueError(
                "staleness_full_confidence_days must be less than staleness_zero_confidence_days"
            )
        return self

    def staleness_factor(self, age_days: float) -> float:
        if age_days <= self.staleness_full_confidence_days:
            return 1.0
        if age_days >= self.staleness_zero_confidence_days:
            return 0.0
        span = self.staleness_zero_confidence_days - self.staleness_full_confidence_days
        return 1.0 - (age_days - self.staleness_full_confidence_days) / span


class FeatureConfidence(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    score: float
    tier_component: float
    quality_component: float
    staleness_component: float
    age_days: float
    policy_id: str
    policy_version: str


def score_feature(
    resolved: ResolvedFeature,
    decision_time: datetime,
    policy: ConfidencePolicy,
) -> FeatureConfidence:
    require_aware(decision_time, "decision_time")
    age_days = (
        decision_time - resolved.available_time
    ).total_seconds() / _SECONDS_PER_DAY

    tier_component = policy.tier_weight[resolved.tier_used]
    quality_component = policy.quality_weight[resolved.quality_status]
    staleness_component = policy.staleness_factor(age_days)

    return FeatureConfidence(
        score=tier_component * quality_component * staleness_component,
        tier_component=tier_component,
        quality_component=quality_component,
        staleness_component=staleness_component,
        age_days=age_days,
        policy_id=policy.policy_id,
        policy_version=policy.policy_version,
    )
