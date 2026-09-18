
"""
@module Yataí Finance
@file services/portal-api/src/yatai_api/predictive/temporal/snapshot.py
@custom file_visibility public
@custom id
@description Immutable point-in-time feature snapshot with a content-addressed identifier.
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

snapshot_id is a sha256 over the canonical JSON of the snapshot content only. The
model deliberately carries no wall-clock creation field: reproducing a past decision
must yield the same identifier, otherwise the point-in-time gate in
plano_trabalho.md §3.4 cannot be demonstrated.
"""

import hashlib
import json
from collections.abc import Iterable, Sequence
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from yatai_api.predictive.temporal.confidence import ConfidencePolicy, FeatureConfidence
from yatai_api.predictive.temporal.resolution import ResolvedFeature
from yatai_api.predictive.temporal.timestamps import require_aware, to_utc

CANONICAL_SCHEMA_VERSION = "1"


class SnapshotEntry(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    resolved: ResolvedFeature
    confidence: FeatureConfidence


class FeatureSnapshot(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    snapshot_id: str
    decision_time: datetime
    entity_id: str
    entries: tuple[SnapshotEntry, ...]
    missing_features: tuple[str, ...]
    confidence_policy_id: str
    confidence_policy_version: str

    @classmethod
    def build(
        cls,
        *,
        decision_time: datetime,
        entity_id: str,
        entries: Iterable[SnapshotEntry],
        missing_features: Iterable[str],
        policy: ConfidencePolicy,
    ) -> "FeatureSnapshot":
        require_aware(decision_time, "decision_time")
        ordered_entries = tuple(sorted(entries, key=lambda e: e.resolved.feature_name))
        ordered_missing = tuple(sorted(missing_features))

        content = _canonical_content(
            decision_time=decision_time,
            entity_id=entity_id,
            entries=ordered_entries,
            missing_features=ordered_missing,
            policy=policy,
        )

        return cls(
            snapshot_id=content_hash(content),
            decision_time=decision_time,
            entity_id=entity_id,
            entries=ordered_entries,
            missing_features=ordered_missing,
            confidence_policy_id=policy.policy_id,
            confidence_policy_version=policy.policy_version,
        )

    def entry(self, feature_name: str) -> SnapshotEntry | None:
        for candidate in self.entries:
            if candidate.resolved.feature_name == feature_name:
                return candidate
        return None

    def value(self, feature_name: str) -> object:
        found = self.entry(feature_name)
        return None if found is None else found.resolved.value

    def fallback_features(self) -> tuple[str, ...]:
        return tuple(
            e.resolved.feature_name for e in self.entries if e.resolved.is_fallback
        )


def _canonical_content(
    *,
    decision_time: datetime,
    entity_id: str,
    entries: Sequence[SnapshotEntry],
    missing_features: Sequence[str],
    policy: ConfidencePolicy,
) -> dict[str, object]:
    """Everything that must reproduce identically, and nothing else."""
    return {
        "schema_version": CANONICAL_SCHEMA_VERSION,
        "decision_time": to_utc(decision_time).isoformat(),
        "entity_id": entity_id,
        "confidence_policy": {
            "id": policy.policy_id,
            "version": policy.policy_version,
        },
        "features": [
            {
                "feature_name": e.resolved.feature_name,
                "value": e.resolved.value,
                "unit": e.resolved.unit,
                "tier_used": e.resolved.tier_used.name,
                "is_fallback": e.resolved.is_fallback,
                "quality_status": e.resolved.quality_status.value,
                "observation_id": e.resolved.observation_id,
                "source_id": e.resolved.source_id,
                "source_version": e.resolved.source_version,
                "available_time": to_utc(e.resolved.available_time).isoformat(),
            }
            for e in entries
        ],
        "missing_features": list(missing_features),
    }


def content_hash(content: dict[str, object]) -> str:
    payload = json.dumps(
        content, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    )
    return "sha256:" + hashlib.sha256(payload.encode("utf-8")).hexdigest()
