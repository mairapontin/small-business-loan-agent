/**
module: Yataí Finance
description: Evidence-backed review of the predictive study (docs), its two backend modules, and the agronomy open-data research report, with a ranked improvement plan.
category: TBD
type: TBD
example:
id:
status: New
version: 1.0.0
author: Maíra Pontin <maira.pontin@yataifinance.com>
ai_author:
author_date: 2026-09-22T22:19:36
reviewer:
ai_reviewer:
reviewer_date:
updated: 2026-09-24T21:42:50
file: backend/portal-api/src/predictive/docs/auditoria/analise_e_melhorias_20260922.md
file_visibility: public
source:
 */

# Analysis and improvements — predictive study, ported code, agronomy data research

**Reviewed:** 2026-09-22. **Surface covered:** 14 markdown documents, 11 Python files (981 lines), 1 research report, 7 test files.
**Method:** full read of every file in scope, AST comparison of the two on-disk copies of the package, cross-check of numeric claims against the sources cited for them.
**Language:** English, per the global response policy. The rest of `docs/auditoria/` is Portuguese; say the word and I will translate this file to match the corpus.

---

## 0. Two structural findings that frame everything else

**0.1 The package exists twice on disk and only one copy can run.**

| Tree | Imports resolve? | Headers | Tests |
|---|---|---|---|
| `small-business-loan-agent/predictive/` | **No** — no `yatai_api/` parent, no `pyproject.toml`, no `setup.py` | stale (`@custom updated 2026-09-08T21:13:06`) | none |
| `yatai-dev/backend/portal-api/src/predictive/` | Yes | current (`260920_231828`) | 7 files, 68 test functions |

Every file in both trees declares `@file backend/portal-api/src/predictive/...` and every intra-package import is `yatai_api.predictive.*`. The `.pyc` caches under the orphan copy were produced from the `yatai-dev` tree. Code bodies are byte-identical; only metadata diverges.

**Improvement:** make `small-business-loan-agent/predictive/` a pointer, not a copy — either delete it, or replace its `.py` files with a `README.md` that names the canonical path. Today nothing warns a reader they are looking at a stale fork of the financial math. This is a live hazard, not tidiness: the docs integrity suite (`test_docs_integrity.py`, 15 tests) validates markdown structure but cannot see that two full copies of ten audited files disagree about their own review metadata. **Not done in this pass — removing a tree is destructive and the choice is yours. A single warning line in that folder's `docs/index.md` is the reversible alternative.**

**0.2 `domain/` and `temporal/` do not talk to each other, and nothing is built on top.**

`credit_math.py` and `point_in_time.py` are imported by nothing outside `predictive/__init__.py`. The temporal layer imports neither. `predictive/__init__.py`'s own description promises "engines, scenarios, decision records" — none of those directories exist. Completeness is accurately described as *foundations done, nothing built on them yet*.

**Improvement:** either state that in `docs/index.md` explicitly, or drop the promise from the header. The plan (`plano_trabalho.md` §3.2) describes a dossier generator; a reader of `index.md` will not learn that zero engine code exists.

---

## 1. The code: ranked defects and fixes

Severity order is by consequence for a credit decision, not by line count.

### P0-1 — Two public, exported, *contradictory* implementations of the point-in-time rule

`domain/point_in_time.py:36-57` and `temporal/resolution.py:54-63` implement the same domain concept — "which version was in force at the decision instant" — with **opposite precedence**.

- `resolution.py` ranks source tier first (`-observation.tier.value`). A `REGIONAL_BENCHMARK` observation published later **loses** to an older `PRODUCER_VALIDATED` one.
- `point_in_time.py` ignores `tier` and `ingested_time` entirely. There the later record **wins**.

Both are re-exported from `predictive/__init__.py` as first-class API. For a system whose headline guarantee is "later revisions never alter past inputs," two disagreeing implementations of that guarantee is the most serious finding in this review.

`point_in_time.py` is strictly worse on every other axis too: `str(source_version)` tie-break sorts lexicographically (`"10" < "9"`, `"v2" > "v10"`); bare `KeyError` on missing `available_time` (line 42) and `effective_from` (line 43) while line 44 correctly uses `.get` — three access styles in sixteen lines; no `require_aware()` call, so a naive datetime raises `TypeError` from inside `max()`, far from the cause, and not the `ValueError` the caller expects; `.get("effective_to")` conflates "absent" with "explicitly null"; returns `None` with no reason code, so "no records" is indistinguishable from "all expired" — the `missing_features` reporting style used in `feature_store.py:71-75` exists precisely to avoid that; and on a full tie `max()` returns the first element, making the result input-order-dependent, which is what `resolution.py:20-21` was commented to prevent.

**Fix:** delete `domain/point_in_time.py` and its 5 tests, or reduce it to a thin adapter that maps the dict shape onto `Observation` + `TemporalStamps` and delegates to `resolve()`, kept out of `__all__` and labelled as the legacy-baseline-replay shim. Add a test asserting the two entry points agree on a shared fixture. If it survives in any form, it must call `require_aware()`, use `TemporalStamps`-validated input rather than `Mapping[str, Any]`, and version-sort through the adapter.

### P0-2 — `ObservationValue` has no `Decimal`; the float leak sits directly upstream of Decimal-only math

`observation.py:37` admits `StrictFloat` and nothing decimal-typed. `credit_math.py` is written entirely in `Decimal` and demands `Decimal` inputs. Any bridge must choose `Decimal(str(v))` or `Decimal(v)`; the latter propagates the binary representation exactly (`0.1` → `0.1000000000000000055511151231257827021181583404541015625`), and nothing in the codebase enforces the safe form while `__init__.py` exports both halves as if they compose.

Same union also accepts `StrictBool`, so `price_tonnes = True` validates.

**Fix:** add `Decimal` to the `ObservationValue` union, drop `StrictBool`, and add a tested converter contract at the adapter boundary. Whichever way this goes, it decides whether the DSCR and all-in-rate paths are auditable at all.

### P0-3 — `credit_math.py` error contract is escapable, and results depend on global Decimal state

- No function validates **finiteness**. `Decimal("Infinity") < 0` is `False`, so an infinite `new_value` clears the guard at line 32; `Inf > Inf` is `False` so line 41 passes; then `Inf - Inf` raises `InvalidOperation`, not `ValueError`. NaN likewise raises `InvalidOperation` on comparison. **All 15 tests catch `ValueError`**, so `InvalidOperation` escapes the documented contract of all eight functions undetected.
- `line 112` uses `Decimal ** Decimal` with a fractional exponent. The C `_decimal` accelerator implements that; the pure-Python fallback raises `InvalidOperation`. Any runtime without `_decimal` breaks `xnpv`, and therefore `all_in_effective_annual_rate`. No comment records the dependency.
- No `localcontext()`. Default is 28 digits / `ROUND_HALF_EVEN`. If any caller anywhere calls `decimal.setcontext(...)` — routine in a financial codebase — every number in the module changes, including a converged IRR. `snapshot.py` content-hashes values for reproducibility, so an implicit global-precision dependency is a latent audit defect.
- `line 140`: the `1e-7` convergence test is an **absolute currency residual**, so achieved rate precision is `~1e-7 / |dXNPV/dr|`. A R$500k/60-month facility and a R$5k/6-month facility get orders-of-magnitude different IRR precision from the same call, for a metric a borrower uses to compare offers.
- `line 146`: after 220 iterations the midpoint is returned with no flag, no raise, no log. A caller cannot distinguish a converged rate from a best-effort guess in a credit-decision path.
- `xnpv` recomputes `min(day for day, _ in cashflows)` on every call (line 108) and `all_in_effective_annual_rate` calls it 2–220 times over the same series. The base date is invariant; hoist it.
- Asymmetric validation in `cash_available_for_debt_service`: lines 58-60 check three of five operands, skipping `operating_cash_before_non_cash_charges` and `working_capital_increase`. A working-capital *release* legitimately increases cash, so skipping it may be correct — but the docstring must say so, because as written it reads as an oversight.
- `lines 44, 83`: `max(D("0"), ...)` silently discards real economics. A disposal proceed exceeding replacement cost means capital was released; a negative shortfall means surplus liquidity. Both are thrown away with no signal.
- `line 129` writes `f_high` and line 143 rewrites it, but nothing reads it after line 134 — dead assignment left over from a generic bisection template.
- `normalized_overhead` (line 91) consumes an `Iterable` with `sum()`, so passing a generator makes "overlap" silently 0 on a second read. Type should be `Collection`.
- Empty-input error is inconsistent: `xnpv([])` says `"cashflows required"`, `all_in_effective_annual_rate([])` says `"cashflows need positive and negative amounts"` — misleading for an empty list.
- `dscr` (line 70) does not state its sign semantics: negative `cash_available` yields a negative DSCR, and nothing tells the caller whether to floor at 0 before comparing to a covenant. That is a classic covenant-dispute bug.

**Fix, minimal set:** add a `_require_finite()` helper to all eight entry points and widen the test suite's expected exception to `(ValueError, InvalidOperation)` or convert `InvalidOperation` → `ValueError` at the boundary; wrap every public function in `decimal.localcontext()` with an explicit precision; make the IRR residual relative (`|f| <= eps * sum(|amounts|)`) or test interval width; return `(rate, converged)` or raise on non-convergence; hoist the base date.

### P0-4 — Look-ahead hole in the scoring path: negative age earns full confidence

`confidence.py:69-75`: the first branch returns `1.0` for `age_days <= staleness_full_confidence_days`, and that field permits `0` (`Field(ge=0)`). So any `age_days < 0` → `1.0`. `score_feature` never asserts `available_time <= decision_time`. Via `FeatureStore` the visibility filter guarantees it — but `resolve()` does **not**, and both `resolve()` and `score_feature()` are public in `__all__`. A caller feeding an unfiltered list gets 100% confidence on a fact published in the future. This is the same class of bug the package exists to prevent, in the one path that skips the guard. No test covers it.

**Fix:** `if age_days < 0: raise ValueError`. Also: `staleness_zero_confidence_days = inf` passes `gt=0`, makes `span = inf`, and pins `staleness_factor` at `1.0` forever — an infinite staleness window with no error; add a finite upper bound. Add `Field(ge=0, le=1)` to `FeatureConfidence.score` instead of relying on the reader tracing three multiplications. `policy_id`/`policy_version` accept empty strings and land in the canonical hash, so two different policies can both hash as `{"id": "", "version": ""}`.

### P1-5 — `snapshot_id` does not address the content that decided inclusion

`ResolvedFeature` (`resolution.py:83-95`) drops `ingested_time`, `event_time`, and the entire validity window; `_canonical_content` (`snapshot.py:122-136`) hashes what survives. Consequences:

- Two snapshots built from records differing in `effective_from`/`effective_to`, but with the same surviving set and values, produce **identical `snapshot_id`** despite different inclusion reasons. `plano_trabalho.md` §3.4's Definition-of-Done gate is "point-in-time reproduction" — the content hash does not cover the inclusion decision.
- `superseded_observation_ids` is excluded, so a snapshot where a record beat three competitors hashes identically to one where it beat none. A regulator asking "what did you override?" cannot be answered from the id.
- `evidence_hash` is declared on `Observation` (`observation.py:68`), dropped by `ResolvedFeature`, never reaches `_canonical_content`. The chain of custody terminates one hop short of the artifact meant to prove reproducibility — dead weight today.
- `build()` is the only sanctioned construction path and nothing enforces it: `FeatureSnapshot(...)` is public and pydantic accepts direct construction, so a caller can mint a `snapshot_id` that does not match its content, silently defeating the whole guarantee.
- `CANONICAL_SCHEMA_VERSION = "1"` is embedded but never validated on read, so bumping it makes history unverifiable rather than versioned-and-routed.
- `content_hash` uses `json.dumps` with no `allow_nan=False`, so `inf`/`nan` serialize as bare `Infinity`/`NaN` — invalid JSON that still hashes.
- `value()` returns `object`, strictly weaker than the `ObservationValue` alias available one line away, forcing `isinstance` narrowing on every consumer.
- `entry()` (`snapshot.py:89-93`) is an O(n) linear scan over a tuple already sorted by `feature_name`; a 50-feature snapshot queried per feature is quadratic. `functools.cached_property` fits the frozen model.

**Fix:** include validity window, `ingested_time`, `evidence_hash` and `superseded_observation_ids` in the canonical projection; add a `model_validator(mode="after")` recomputing the id; add `allow_nan=False`; widen `value()`'s return type; index `entry()`.

### P1-6 — Units are never reconciled, so resolution can silently mix scales

`unit` is free-text with zero normalization. It appears in no precedence key and is compared nowhere. A `PRODUCER_VALIDATED` observation in USD/kg can supersede an `EXTERNAL_SPECIFIC` one in BRL/kg and `ResolvedFeature` carries whichever unit the winner had. A 5x FX error in a derived feature is a plausible end state. `resolve()` is where the winner is chosen and `unit` sits on the line above it.

**Fix:** refuse to mix units in `resolve()`, or emit a reason code. Normalize through a unit registry at the adapter.

### P1-7 — Audit trail under-reports on duplicate `observation_id`

`resolution.py:75-81` filters superseded records by **id equality**, not object identity. Two distinct `Observation`s sharing `observation_id` where one loses → both excluded → the audit record claims nothing was superseded. `observation_id` uniqueness is assumed but not enforced anywhere (`observation.py` validates no identity field for non-emptiness: `""` passes for `observation_id`, `entity_id`, `source_id`). `test_full_tie_is_broken_deterministically_and_independently_of_input_order` passes while the property it names is false, because the tie-break's final slot is the same unenforced id. Related: `entity_id=""` combined with `feature_store.py:106`'s equality check means a request for entity `""` matches every malformed row; `test_no_cross_entity_leakage` would not catch it.

**Fix:** `if obs is not winner`; add `min_length=1` to identity fields; add a uniqueness guard or document that the store owns it.

### P1-8 — The in-memory store mutates mid-decision

`memory_store.py:31-35` `add`/`extend` mutate `self._observations` while `FeatureStore` holds the reference (`feature_store.py:37`). Two `snapshot()` calls for the same `decision_time` can return different results. The docstring names "legacy baseline replay" as a use case — a replay that mutates mid-run yields non-reproducible baselines, and the failure gets attributed to the model. Also undocumented there: `fetch` ignores `effective_at` (correct per `ports.py:24-26`, but a reader of this file alone cannot tell bug from contract); no protocol-conformance assertion; O(n) scan per fetch with no index.

**Fix:** freeze after construction, or snapshot the list at `fetch` entry, or make mutation opt-in by name. One sentence documenting the `effective_at` omission.

### P1-9 — `effective_at`, the second time axis, is undocumented and untested

`feature_store.py:50`: `as_of = effective_at or decision_time`. Visibility gates at `decision_time` (line 108), effectiveness at `as_of` (line 109). Passing a future `effective_at` pulls in values not yet in force at decision time. That is *not* a strict look-ahead breach — `available_time` still guards real leakage, and forecasting a known-future contract value is a legitimate predictive need — but the parameter has no docstring, no constraint relating it to `available_at`, and **no test exercises it**. For the method whose stated purpose is "the look-ahead rule cannot be bypassed by accident," an untested second axis is the main completeness gap in the orchestration layer. Same truthiness-on-Optional idiom at `timestamps.py:74`; `is not None` is meant.

### P2-10 — Type visibility and packaging

- **`py.typed` is already present** at `src/yatai_api/py.typed`, empty and tracked in git since commit `8ccfb40`. The earlier review claim that the marker was missing is **wrong** — see §6. Nothing to do here; the annotations are PEP 561-visible, and `mypy src/` passes clean (68 tests, 72 source files).
- `temporal/__init__.py` omits four public names from its facade: `require_aware`, `to_utc`, `content_hash`, `CANONICAL_SCHEMA_VERSION`. `to_utc` is needed by anyone re-implementing canonicalization, so callers are pushed into the deep imports the facade exists to prevent.
- Root `predictive/__init__.py` imports `domain` but never `temporal`, so `import yatai_api.predictive` exposes the credit math and not the `FeatureStore` that `feature_store.py`'s header calls "the single entry point for every engine." Asymmetric.
- `credit_math.py` has no `__all__`, so `predictive/__init__.py` hand-maintains a nine-name list that must be kept in sync manually.
- `timestamps.py:74` vs `:87` disagree on the default for `effective_from`.

### P2-11 — Governance headers are 18% of the codebase and every review field is empty

≈180 of 981 lines are header metadata. `@custom reviewer`, `@ai_reviewer`, `@reviewer_date`, `@id`, `@example` are **empty in all 11 files**; `@custom status new` / `@version 01_01` never advanced. For a codebase whose pitch is auditability, an unreviewed and unexamplified header on every financial-math file undercuts it. `test_docs_integrity.py` enforces markdown structure in 15 tests but not that review fields are filled.

Also style: `D = Decimal` module alias (`credit_math.py:26`); `'''` in `domain/` vs `"""` in all nine `temporal/` files; `__all__` sorted classes-then-functions rather than ASCII, which diffs badly when a class is added.

### P2-12 — Where the tests' blind spots are

68 test functions across 7 files; the behavioral core is decently covered, and several findings above are pre-existing tests' blind spots rather than absent suites. But `observation.py`, `ports.py` and `memory_store.py` have **zero tests of their own** — and those are exactly the three files holding the highest-severity type-level defects (P0-2 float leak, unbounded `fetch`, P1-8 mid-decision mutation). The untested seams are where the design errors live. Notable gaps: `Decimal("Infinity")`/NaN rejection, IRR non-convergence, tolerance scale-invariance, naive-datetime `TypeError`, `"9"` vs `"10"` version ordering, agreement between `point_in_time` and `resolve()`, negative `age_days`, `effective_at > decision_time`, direct `FeatureSnapshot(...)` bypass, duplicate `observation_id`, mixed-unit supersession.

---

## 2. The study: documentation gaps

The document set is genuinely strong on substance — 6 non-mixing categories, 4 separated decision records, 17 engines, 40-item `PENDING_POLICY` register, the discipline of refusing to invent thresholds. The gaps are all in **traceability and canonicality**, which is the same failure mode as §0.1: the content is right, the wiring is missing.

**2.1 `logica_planilhas.md` cites zero cell addresses** despite stating a strict evidentiary rule that every claim must be traceable to a cell. Two gate lists inside the file disagree (§2 "caixa após dívida" vs §5 "documentação"). `Origem:` points outside the repository.
*Fix:* add sheet+cell to each of the claims that currently assert one; pick one canonical gate list and have the other reference it; bring the external artifact in-repo or drop the pointer.

**2.2 `observacoes_e_inferencias.md` has no severity, no sampling method, and unresolvable references.** Formula counts (19 sheets/1187 formulas; 39/845/24 veryHidden; 69/1393) are reported without the method that produced them. The recalculation evidence is not in the repo, so the claim is unverifiable. A referenced PDF does not exist. Questions 2–8 are not linked to the `PENDING_POLICY` items they block. Filename note: `observacoes.md` does not exist; the real file is `observacoes_e_inferencias.md` (confirmed against `SHA256SUMS_pacote_origem.txt`).
*Fix:* prefix each inference with `Inferência:` plus a severity; state the extraction method and version; commit the recalculation log or delete the claim; cross-link to `pendencias_politica.md` item numbers.

**2.3 `pauta_decisoes_produto.md` is not actionable as a decision register.** No ID, owner, priority, status or due-date columns. Provenance is asymmetric: §2.10's content comes from code, not from a spreadsheet, but is presented identically to the ones that come from sheets. §2.4/2.8/2.9 label context as `Contexto de produto` where siblings use `Contexto observado`. The worked example is not reproducible. The rename from `pauta_decisoes_dono_produto.md` is undocumented.
*Fix:* add the five columns; normalize the two context labels; add a provenance column that distinguishes `planilha` / `código` / `inferência`.

**2.4 `revisoes/00_metodologia.md` is a contract, not a result.** No owner, no per-round dates, no status, no links to artifacts. Round 4's sole artifact is a PNG with no captured log, so that round's verdict cannot be re-derived.
*Fix:* record the pytest output for every round, or mark round 4 `evidence missing`.

**2.5 `pendencias_politica.md` items 32–40 are the register's weak point — and correctly so.** Two numeric constants already sit in production code (`risk_multiplier = 1.3` in `yatai_api/routers/risk_engine.py`; the sub-declaration proxy `< 0.6`) and were **never approved**. The document flags this honestly. The number-identifier convention (32–40 continue a global numbering and therefore appear out of sequence) is documented and right — do not renumber.
*Fix:* gate those two constants behind an explicit `PENDING_POLICY` return until approved, or record the approval. A code constant that predates the product decision is the exact failure the golden rule exists to prevent.

---

## 3. The agronomy open-data research report

`yatai-knowledge/DEEP_RESEARCH_AGRONOMY_OPEN_DATA.md` (v1.0.0, 2026-09-22, 21 sources, 4 areas). Structure and tiering are sound; 18 sources are Tier-1. The defects are uncited specifics and coverage holes, and the report itself discloses three access failures ([12] IBGE 403, [13] CONAB CSS-only, [19] INPE redirect) — honest, but the claims that depended on them still stand.

**3.1 Claims needing a source or removal:** FarmMaps (no citation at all); "500 stations"; "358 million tonnes 2025/26" traced to an inaccessible source; "MapBiomas used by lenders" under-cited; the ZARC regulatory-requirement statement cites no regulation; "banks willing to pay" is an unsourced generalization.

**3.2 Areas missing that the credit use-case requires:** CAR data model (the report uses CAR in the socioambiental logic but never describes its fields, its autodeclaratory nature, or its divergence from INCRA/SNCR — `fontes_dados.md` covers all three); SCR/CACR and credit registries; producer financials (ERP/NF-e/DRE); CEPEA and B3 price series; Proagro; Plano Safra; iSPA. Only 3 platforms appear in Area 4, all Tier-2, with no independent evaluation.
**3.3 No per-source data-quality column** (resolution, latency, revision policy, licence-for-commercial-redistribution) even though the report's own recommendations turn on those properties. **No critical/negative perspective** — no source is argued against. **No build-vs-buy cost estimate**, which §3 of the project's token-budget rules effectively requires.

**3.4 Cross-reference opportunity (the real win).** The report and `docs/fontes/fontes_dados.md` cover overlapping sources and each holds what the other lacks. `fontes_dados.md` has the Brazilian institutional depth the report is missing (BACEN SGS/PTAX, CACR/Sicor, Registrato/SCR, Open Finance, CPR registradoras, IBAMA embargos, FUNAI, CNUC, INCRA/SIGEF, CNFP) and a data-dictionary discipline (`valor_contratado_cacr` ≠ `saldo_devedor_scr` ≠ `area_cultivada_satellite` ≠ `area_declarada_proposta`, never merged without an explicit rule). The report has remote-sensing depth `fontes_dados.md` lacks (CHIRPS v2→v3 migration deadline December 2026, SMAP L3 pixel/mission facts, AlphaEarth 64-dim 10 m embeddings 2017–2025, Sentinel-1/2 vs Landsat revisit tradeoffs). Neither file references the other. Merge them into one catalogue with a tier + quality + licence column and one "must never be fused without a rule" section — that removes the drift risk of two catalogues ageing separately.

**3.5 One security note worth carrying forward.** `fontes_dados.md` records that the TerraBrasilis homepage returned foreign promotional content in the extracted HTML — a possible content-injection or compromise indicator — and states explicitly that no instruction from it was followed. Good. Make the mitigation permanent and mechanical: ingest only from documented download/service endpoints, with domain, schema, hash and signature validation, never from a landing page.

---

## 4. Priority order

| # | Item | Why first | Est. effort |
|---|---|---|---|
| 1 | P0-1 reconcile the two point-in-time implementations | Two disagreeing public versions of the product's headline guarantee | S |
| 2 | P0-2 `Decimal` in `ObservationValue` + converter contract | Decides whether the DSCR/all-in paths are auditable at all | S |
| 3 | P0-3 finiteness + `localcontext()` + relative IRR tolerance | Closes an uncaught exception class and a reproducibility hole | S |
| 4 | P0-4 raise on negative `age_days` | One line closes a look-ahead hole in the scoring path | XS |
| 5 | P1-5 canonical content: window, `ingested_time`, `evidence_hash`, bypass guard | Without it, §3.4's Definition-of-Done gate is not demonstrable | M |
| 6 | P1-7/8/9 identity validation, store immutability, `effective_at` docs+tests | The three untested seams; each is a one-file change | S each |
| 7 | P2-10 facade exports and `__all__` | Cheap; `py.typed` already exists, so only the exports need work | XS |
| 8 | §0.1 collapse the duplicate tree | Removes a live maintenance hazard; the deletion itself is yours to approve | XS |
| 9 | §2 doc traceability columns and links | Makes the decision register actionable | M |
| 10 | §3.4 merge the two catalogues | Stops two source lists ageing apart | M |

## 5. Already applied in this pass (2026-09-22, canonical `yatai-dev` tree only)

Three changes needed no product decision, so they are done and verified:

| Change | File | Verification |
|---|---|---|
| Raise on negative `age_days` (P0-4) | `temporal/confidence.py:71-73` | `staleness_factor(-1.0)` now raises `ValueError`; ramp still returns `1.0 / 0.5 / 0.0` at `0 / 197.5 / 400` days with a 30→365 horizon |
| Export the four missing public helpers (P2-10) and re-sort `__all__` into true ASCII order | `temporal/__init__.py` | 19 names, all resolve via `getattr`; `to_utc`, `require_aware`, `content_hash`, `CANONICAL_SCHEMA_VERSION` now reachable through the facade |
| Registered this audit in the site nav | `predictive/mkdocs.yml`, `docs/index.md` | CI builds the predictive site with `mkdocs build --strict` (`.github/workflows/ci.yml:124`); all five `Auditoria` nav targets and all 13 relative links in `index.md` resolve, so the strict build is safe |

**Gate commands run against the project venv** (`backend/portal-api/.venv`, the interpreter CI reproduces via `poetry install --with dev`) — the earlier "pytest is not installed" caveat was mine reading the wrong interpreter, see §6:
| Gate | Command | Result |
|---|---|---|
| Predictive tests | `pytest tests/predictive -q` | **68 passed** in 0.15s |
| Full backend tests | `pytest tests/ --ignore=tests/db -q` | **137 passed** in 12.4s (2 pre-existing `starlette.testclient` deprecation warnings) |
| Lint | `ruff check src/` | exit 0, clean |
| Types | `mypy src/` | `Success: no issues found in 72 source files` |
| End-to-end | `FeatureStore.snapshot()` | `sha256:` id built, value resolved, no missing features |

Only `python -m build --wheel` and the `tests/db` job remain for full CI parity; both are untouched by these edits.

**Docs-integrity suite is unaffected by this file:** `test_docs_integrity.py:28` pins `REPORT` to `docs/plano_trabalho.md`, so the editorial-marker and numeric-reference tests do not read the `auditoria/` folder. The fixed list in `test_core_files_exist_and_are_nonempty` does not require updating for a new page.

The four P0 and five P1 findings are **not** implemented, because each one either changes a public API (`point_in_time.py`), changes a historical hash (`snapshot.py` canonical content), or selects between two designs (units, `Decimal` in the value union). Those need your verdict, not a default.

## 6. Corrections to the upstream review

The code findings above were carried over from an automated review of `small-business-loan-agent/predictive/`. Two of its claims did not survive verification against the canonical tree and the project venv, and one of them was briefly "fixed" here before being caught. Recording them so nobody re-implements a phantom:

| Upstream claim | Verified state | Evidence |
|---|---|---|
| "No `py.typed` anywhere in `src/yatai_api/`" (ranked 10th) | **False.** `src/yatai_api/py.typed` exists, empty, and is tracked | `git ls-files` returns it; `git cat-file -s HEAD:…/py.typed` → `0`; introduced by commit `8ccfb40`. The Write that "created" it produced an identical empty blob, so it never appears in `git status` — which is how the error surfaced |
| "The `Observation` field is `quality`" (implied by the smoke-test payload) | **False.** The field is `quality_status`, and `extra="forbid"` rejects `quality` with `ValidationError` | Observed directly: constructing `Observation(quality=…)` raised `Extra inputs are not permitted` — the strict-config guard working as specified |

Also corrected, from my own first pass rather than the upstream review: the "pytest is not installed, suite not run" note in §5 was measured against the wrong interpreter (`C:\Users\maira\miniforge3`). The project venv has the full dev group, and every gate in §5 is now green.

## 7. Research-backed recommendations (2026-09-23)

Each open item from §1 is restated with a recommended resolution grounded in external authoritative sources. Citations are numbered [1]–[5] (Python/IRR), [20]–[27] (bitemporal/MDM), [40]–[48] (units/lineage); full URLs at the end.

### 7.1 P0-1 — Reconcile the two point-in-time implementations

**Recommendation:** delete `domain/point_in_time.py` or reduce it to a labelled legacy adapter outside `__all__`.

**Evidence:**
- `str(source_version)` tie-break in `point_in_time.py:59` is a confirmed bug: semver.org mandates numeric tuple comparison, so `"1.9" > "1.10"` lexicographically but `1.9 < 1.10` numerically [26]. The same bug exists in `resolution.py:63`.
- Tier-based source precedence (higher tier wins, then recency) is standard MDM practice: Reltio defaults to recency but supports trust ranking by source reliability [24]; IBM InfoSphere uses explicit rule-based survivorship [25]. `resolution.py`'s precedence key is architecturally correct; `point_in_time.py`'s tier-blind approach is not.
- Feast prevents label leakage by joining on `event_timestamp` to ensure only features available before the decision point are used [22]. The two-implementation pattern violates this: a caller cannot know which rule applied.

**Patch sketch:**
```python
# Delete domain/point_in_time.py and its 5 tests, or:
# Keep as adapter, remove from __all__, add deprecation warning
def select_point_in_time_record(records, decision_time):
    warnings.warn("use temporal.resolution.resolve() instead", DeprecationWarning)
    observations = [_dict_to_observation(r) for r in records]
    return resolve(observations)
```

### 7.2 P0-2 — Add `Decimal` to `ObservationValue`, drop `StrictBool`

**Recommendation:** add `Decimal` to the union, drop `StrictBool`, add a tested converter at the adapter boundary.

**Evidence:**
- `Decimal(float)` produces an inexact binary representation: `Decimal(0.1)` → `Decimal('0.1000000000000000055511151231257827...')` [1]. The safe form is `Decimal(str(float))` or `Decimal.from_float()`.
- `credit_math.py` is written entirely in `Decimal` and demands `Decimal` inputs. The float leak upstream means any bridge must choose a conversion strategy; nothing enforces the safe form.
- `StrictBool` in the union allows `price_tonnes = True` to validate, which is nonsensical for a continuous quantity.

**Patch sketch:**
```python
# observation.py
from decimal import Decimal
ObservationValue = Union[StrictInt, StrictFloat, Decimal, StrictStr]
# Drop StrictBool

# adapter boundary (e.g., memory_store.py or a new converter)
def to_observation_value(v) -> ObservationValue:
    if isinstance(v, float):
        return Decimal(str(v))
    return v
```

### 7.3 P0-3 — Finiteness, `localcontext()`, relative IRR tolerance

**Recommendation:** (a) add `_require_finite()` to all eight entry points; (b) wrap every public function in `decimal.localcontext()` with explicit precision; (c) switch IRR to relative tolerance or test interval width; (d) raise on non-convergence.

**Evidence:**
- `decimal.InvalidOperation` inherits from `ArithmeticError`, not `ValueError` [1,2]. All 15 tests catch `ValueError`, so `InvalidOperation` escapes the contract undetected.
- `Decimal('NaN') < 0` returns `False` (untrapped), so the `if new_value < 0` guard silently passes NaN [1]. `Decimal('Infinity')` likewise passes.
- `getcontext()` is per-thread but module-global within a thread. If any caller changes `getcontext().prec`, all subsequent `Decimal` arithmetic uses the new precision silently. `localcontext()` is the recommended mitigation [1].
- Excel XIRR uses Newton-Raphson with convergence criterion on the **rate** (|x_n - x_{n+1}| <= ~1e-6), not on the NPV residual [3]. The code's absolute tolerance on the residual is unconventional and scale-dependent.
- numpy-financial `rate()` uses Newton with `tol=1e-7, maxiter=100` [4]; scipy `brentq` defaults to `xtol=2e-12, rtol=8.88e-16, maxiter=100` [5]. Silent fallback to midpoint is not standard practice.

**Patch sketch:**
```python
from decimal import localcontext, InvalidOperation

def _require_finite(v: Decimal, name: str) -> None:
    if not v.is_finite():
        raise ValueError(f"{name} must be finite, got {v}")

def economic_depreciation(new_value, residual_value, remaining_life_years):
    with localcontext() as ctx:
        ctx.prec = 28
        for v, name in [(new_value, "new_value"), (residual_value, "residual_value"), (remaining_life_years, "remaining_life_years")]:
            _require_finite(v, name)
        # ... existing logic ...

def all_in_effective_annual_rate(cashflows):
    # ... bracket check ...
    for _ in range(220):
        mid = (low + high) / D("2")
        f_mid = xnpv(mid, cashflows)
        if abs(f_mid) < D("0.0000001") * sum(abs(a) for _, a in cashflows):  # relative
            return mid
        # ... bisection ...
    raise ValueError("IRR did not converge within 220 iterations")
```

### 7.4 P1-5 — Snapshot must address the inclusion decision

**Recommendation:** include validity window, `ingested_time`, `evidence_hash`, and `superseded_observation_ids` in the canonical projection; add a `model_validator(mode="after")` recomputing the id; add `allow_nan=False`.

**Evidence:**
- BCBS 239 Principle 4 requires accuracy, completeness, consistency, and timeliness of risk data, with reproducibility and auditability as core compliance expectations [40]. The ECB's 2024 supervisory guide reinforces that lineage must allow supervisors to trace any reported figure back to source systems [40b].
- SR 11-7 (revised 2026 as SR 26-02) requires institutions to document "assumptions and data" used as model inputs, maintain records ensuring models are "reproducible and auditable" [42]. It does not prescribe content-addressed hashing, but the principle is clear.
- W3C PROV defines entities (what was derived), activities (what was done), and agents (who did it) — a general provenance model applicable to any domain [48]. The FAIR Cookbook maps PROV to the Reusability principle: provenance metadata enables others to understand and reproduce data processing [48a].
- No standard prescribes exactly which fields a financial decision snapshot must include — this is an architectural choice [43a]. But the excluded fields (effective_from, effective_to, ingested_time, evidence_hash, superseded_observation_ids) are exactly the ones that explain *why* a record was included.

**Patch sketch:**
```python
# snapshot.py _canonical_content
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
        # NEW:
        "effective_from": to_utc(e.effective_from).isoformat(),
        "effective_to": to_utc(e.effective_to).isoformat() if e.effective_to else None,
        "ingested_time": to_utc(e.ingested_time).isoformat(),
        "evidence_hash": e.evidence_hash,
        "superseded_observation_ids": list(e.resolved.superseded_observation_ids),
    }
    for e in entries
],

# Add model_validator
@model_validator(mode="after")
def _recompute_id(self):
    object.__setattr__(self, "snapshot_id", _compute_id(self._canonical_content()))
```

### 7.5 P1-6 — Unit reconciliation

**Recommendation:** refuse to mix units in `resolve()`, or emit a reason code. Normalize through a unit registry at the adapter.

**Evidence:**
- UCUM is the de facto standard for machine-readable unit coding in clinical systems (mandated by HL7/FHIR), but has no native coverage of financial/currency units [41]. Financial unit coding has no equivalent de facto standard.
- OpenLineage has no unit or currency facet — dataset facets cover schema, ownership, lineage, and lifecycle, but not measurement units [43].
- The Mars Climate Orbiter (1999, $125M loss) was destroyed because Lockheed Martin delivered thruster data in pound-seconds while NASA expected newton-seconds [46]. Unit-confusion risk is real.
- No existing data-contract spec provides a standard way to declare "this field is in BRL" vs "USD" — this appears to be a genuine gap [43,44,45].

**Patch sketch:**
```python
# resolution.py resolve()
def resolve(candidates):
    usable = [obs for obs in candidates if obs.quality_status is not QualityStatus.REJECTED]
    if not usable:
        return None
    units = {obs.unit for obs in usable if obs.unit is not None}
    if len(units) > 1:
        # Emit reason code or raise
        raise ValueError(f"Cannot resolve observations with mixed units: {units}")
    winner = max(usable, key=_precedence_key)
    # ...
```

### 7.6 P1-8 — Store immutability during a decision

**Recommendation:** freeze after construction, or snapshot the list at `fetch` entry.

**Evidence:**
- Snapshot isolation guarantees all reads see a consistent snapshot as of the transaction start, preventing non-repeatable reads and phantoms [23]. For a decision-time store, this means the data should not mutate mid-decision.
- `memory_store.py:31-35` `add`/`extend` mutate `self._observations` while `FeatureStore` holds the reference. Two `snapshot()` calls for the same `decision_time` can return different results.

**Patch sketch:**
```python
# memory_store.py
class InMemoryObservationStore:
    def __init__(self, observations=(), frozen=False):
        self._observations = list(observations)
        self._frozen = frozen

    def freeze(self):
        self._frozen = True

    def add(self, observation):
        if self._frozen:
            raise RuntimeError("Store is frozen; cannot add observations")
        self._observations.append(observation)
```

### 7.7 P1-9 — `effective_at` is safe but undocumented

**Recommendation:** document the parameter and add a test. The truthiness pattern is safe for `Optional[datetime]`.

**Evidence:**
- In Python, `datetime` objects are **always truthy**, including `datetime.min`. The `or` operator only triggers on `None` [27]. So `as_of = effective_at or decision_time` is safe for `Optional[datetime]`.
- However, the parameter has no docstring, no constraint relating it to `available_at`, and no test exercises it.

**Patch sketch:**
```python
# feature_store.py
def snapshot(
    self,
    decision_time: datetime,
    entity_id: str,
    features: Sequence[str],
    effective_at: datetime | None = None,
    # ^ If provided, selects the version in force at this time rather than decision_time.
    # Must be >= decision_time for forecasting use cases. No look-ahead breach: available_time
    # still gates real leakage.
):
```

### 7.8 P2-11 — Governance headers

**Recommendation:** fill in `@reviewer`, `@ai_reviewer`, `@reviewer_date` after human review. Advance `@version` from `01_01` to `01_02` after the first review cycle. Add `@example` blocks to at least the public functions in `credit_math.py`.

No external evidence needed — this is internal governance discipline.

### 7.9 P2-12 — Test blind spots

**Recommendation:** add tests for the defects identified in §7.3 (InvalidOperation, NaN, Infinity), §7.4 (snapshot bypass), §7.5 (mixed units), §7.6 (store mutation), §7.7 (effective_at), and the semver bug in §7.1.

No external evidence needed — this is test coverage discipline.

---

**Sources**

[1] Python `decimal` module documentation: https://docs.python.org/3/library/decimal.html
[2] StackOverflow — decimal.InvalidOperation in Python: https://stackoverflow.com/questions/34546357/decimal-invalidoperation-in-python
[3] Thomas Weitzel — Internal rate of return calculation: https://weitzel.dev/blog/calculating-internal-interest-rate/
[4] numpy-financial source code (GitHub): https://github.com/numpy/numpy-financial/blob/main/numpy_financial/_financial.py
[5] scipy.optimize.brentq documentation: https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.brentq.html
[20] Temporal database — Wikipedia: https://en.wikipedia.org/wiki/Temporal_database
[21] SQL2011Temporal — PostgreSQL wiki: https://wiki.postgresql.org/wiki/SQL2011Temporal
[22] Point-in-time joins — Feast docs: https://docs.feast.dev/getting-started/concepts/point-in-time-joins
[23] Repeatable Read vs Snapshot Isolation: https://jaymcor.github.io/notes/isolation_rr_si.html
[24] Reltio Survivorship: https://community.reltio.com/reltio-best-practices/mdm-survivorship
[25] IBM InfoSphere MDM Survivorship: https://www.ibm.com/docs/en/imdm/11.6.0?topic=data-understanding-merge-party-survivorship-rules
[26] Semantic Versioning 2.0.0: https://semver.org/
[27] Python datetime truthiness — StackOverflow: https://stackoverflow.com/questions/72945055/can-python-date-time-datetime-objects-have-a-boolean-value-of-false
[40] BCBS 239 — Solidatus: https://www.solidatus.com/bcbs-239/
[40b] ECB Guide on risk data aggregation: https://www.bankingsupervision.europa.eu/ecb/pub/pdf/ssm.supervisory_guides240503_riskreporting.en.pdf
[41] UCUM specification: https://ucum.org/ucum
[42] SR 11-7 — ModelOp: https://www.modelop.com/ai-governance/ai-regulations-standards/sr-11-7
[42a] Federal Reserve SR 26-02: https://www.federalreserve.gov/supervisionreg/srletters/SR2602.pdf
[43] OpenLineage Dataset Facets: https://openlineage.io/docs/spec/facets/dataset-facets/
[43a] OpenLineage Spec (GitHub): https://github.com/OpenLineage/OpenLineage/blob/main/spec/OpenLineage.md
[44] datacontract.com: https://datacontract.com/
[45] Semantic Arts — ABCs of QUDT: https://www.semanticarts.com/the-abcs-of-qudt/
[46] SimScale — Mars Climate Orbiter: https://www.simscale.com/blog/nasa-mars-climate-orbiter-metric/
[47] OvalEdge — BCBS 239 Guide 2026: https://www.ovaledge.com/blog/bcbs-239-principles
[48] W3C PROV-Overview: https://www.w3.org/TR/prov-overview/
[48a] FAIR Cookbook — Provenance: https://fairplus.github.io/the-fair-cookbook/content/recipes/reusability/provenance.html

