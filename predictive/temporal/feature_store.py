
"""
@module Yataí Finance
@file services/portal-api/src/yatai_api/predictive/temporal/feature_store.py
@custom file_visibility public
@custom id
@description Orchestrates fetch, visibility filtering, resolution and confidence into a snapshot.
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

Single entry point for every engine that needs data: an engine never queries the
store directly, so the look-ahead rule cannot be bypassed by accident.
"""

from collections import defaultdict
from collections.abc import Iterable, Sequence
from datetime import datetime

from yatai_api.predictive.temporal.confidence import ConfidencePolicy, score_feature
from yatai_api.predictive.temporal.observation import Observation, QualityStatus
from yatai_api.predictive.temporal.ports import ObservationQuery, ObservationStore
from yatai_api.predictive.temporal.resolution import resolve
from yatai_api.predictive.temporal.snapshot import FeatureSnapshot, SnapshotEntry
from yatai_api.predictive.temporal.timestamps import require_aware


class FeatureStore:
    def __init__(self, store: ObservationStore, policy: ConfidencePolicy) -> None:
        self._store = store
        self._policy = policy

    def snapshot(
        self,
        *,
        entity_id: str,
        feature_names: Iterable[str],
        decision_time: datetime,
        effective_at: datetime | None = None,
    ) -> FeatureSnapshot:
        require_aware(decision_time, "decision_time")
        requested = tuple(dict.fromkeys(feature_names))
        as_of = effective_at or decision_time

        query = ObservationQuery(
            entity_id=entity_id,
            feature_names=requested,
            available_at=decision_time,
            effective_at=as_of,
        )
        candidates = self._eligible(
            self._store.fetch(query),
            entity_id=entity_id,
            requested=requested,
            decision_time=decision_time,
            as_of=as_of,
        )

        grouped: dict[str, list[Observation]] = defaultdict(list)
        for observation in candidates:
            grouped[observation.feature_name].append(observation)

        entries: list[SnapshotEntry] = []
        missing: list[str] = []
        for feature_name in requested:
            resolved = resolve(grouped.get(feature_name, ()))
            if resolved is None:
                missing.append(feature_name)
                continue
            entries.append(
                SnapshotEntry(
                    resolved=resolved,
                    confidence=score_feature(resolved, decision_time, self._policy),
                )
            )

        return FeatureSnapshot.build(
            decision_time=decision_time,
            entity_id=entity_id,
            entries=entries,
            missing_features=missing,
            policy=self._policy,
        )

    @staticmethod
    def _eligible(
        observations: Sequence[Observation],
        *,
        entity_id: str,
        requested: Sequence[str],
        decision_time: datetime,
        as_of: datetime,
    ) -> list[Observation]:
        wanted = set(requested)
        return [
            obs
            for obs in observations
            if obs.entity_id == entity_id
            and obs.feature_name in wanted
            and obs.quality_status is not QualityStatus.REJECTED
            and obs.stamps.is_visible_at(decision_time)
            and obs.stamps.is_effective_at(as_of)
        ]
