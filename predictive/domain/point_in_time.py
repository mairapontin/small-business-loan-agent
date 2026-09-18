
'''
@module Yataí Finance
@file services/portal-api/src/yatai_api/predictive/domain/point_in_time.py
@custom file_visibility public
@custom id
@description Point-in-time selection: version in force at a decision time; later revisions never alter past inputs.
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
'''

from __future__ import annotations

from collections.abc import Iterable, Mapping
from datetime import datetime
from typing import Any


def select_point_in_time_record(
    records: Iterable[Mapping[str, Any]],
    decision_time: datetime,
) -> Mapping[str, Any] | None:
    """Selects the most recent version legitimately available and in force at the cut-off.

    Rules:
    - available_time must be less than or equal to decision_time;
    - effective_from must be less than or equal to decision_time;
    - a missing effective_to means open validity;
    - a present effective_to must be later than decision_time;
    - among candidates, the highest available_time wins, then the highest source_version.
    """
    candidates = []
    for record in records:
        available = record["available_time"]
        effective_from = record["effective_from"]
        effective_to = record.get("effective_to")
        if available > decision_time:
            continue
        if effective_from > decision_time:
            continue
        if effective_to is not None and effective_to <= decision_time:
            continue
        candidates.append(record)

    if not candidates:
        return None
    return max(
        candidates,
        key=lambda item: (item["available_time"], str(item.get("source_version", ""))),
    )
