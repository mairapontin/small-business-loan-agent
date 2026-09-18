
"""
@module Yataí Finance
@file services/portal-api/src/yatai_api/predictive/adapters/__init__.py
@custom file_visibility public
@custom id
@description Adapters implementing predictive module ports (in-memory, file-based).
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

from yatai_api.predictive.adapters.memory_store import InMemoryObservationStore

__all__ = ["InMemoryObservationStore"]
