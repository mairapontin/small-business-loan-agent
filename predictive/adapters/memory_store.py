"""
@module Yataí Finance
@file services/portal-api/src/yatai_api/predictive/adapters/memory_store.py
@custom file_visibility public
@custom id
@description In-memory ObservationStore adapter for fixtures, tests and the legacy baseline replay.
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
"""

from collections.abc import Iterable, Sequence

from yatai_api.predictive.temporal.observation import Observation
from yatai_api.predictive.temporal.ports import ObservationQuery


class InMemoryObservationStore:
    """Honours the available_at hint so adapter-level filtering is exercised by tests."""

    def __init__(self, observations: Iterable[Observation] = ()) -> None:
        self._observations: list[Observation] = list(observations)

    def add(self, observation: Observation) -> None:
        self._observations.append(observation)

    def extend(self, observations: Iterable[Observation]) -> None:
        self._observations.extend(observations)

    def fetch(self, query: ObservationQuery) -> Sequence[Observation]:
        wanted = set(query.feature_names)
        return [
            obs
            for obs in self._observations
            if obs.entity_id == query.entity_id
            and obs.feature_name in wanted
            and obs.stamps.is_visible_at(query.available_at)
        ]
