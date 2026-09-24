/**
 * @module: Small Business Loan Agent
 * @file: AGENTS.md
 * @description: Project instructions and architecture overview
 * @author: Maíra Pontin
 * @created: 2025-09-21
 * @updated: 260923_160544
 * @version: 1.1.0
 * @reviewer:
 * @ai_reviewer:
 * @reviewer_date:
 */

# Small Business Loan Agent — Project Instructions

## Current Phase: ADK Integration (Phase 1-5 complete)

The multi-agent pipeline is fully wired and functional. Phase 1-4 of the ADK integration are complete: `@google/genai` is wired, API key management is in place, `RealAdkOrchestrator` calls Gemini with multi-turn tool-calling when `GOOGLE_GENAI_API_KEY` is set, after each step completes the result is sent back to Gemini to decide the next tool, and the UI now includes a toggle for all three orchestrator modes (deterministic, adk-sim, adk). Without the key, it gracefully degrades to deterministic mode.

Phase 5 (testing & validation) is complete: 16 offline tests in `tests/` (`npm test`), no network access. Validation found five defects, all fixed at root cause — see the "Order enforcement" section below.

## Architecture

### Pipeline

```
DocumentExtractionAgent → GeoVerificationAgent → UnderwritingAgent → PricingAgent → LoanDecisionAgent
```

All five agents run as deterministic `AgentStep` executors in `src/services/orchestrator.ts`. The risk math, eligibility thresholds, and BLOCK rules are real and auditable — they do not depend on which orchestrator driver is selected.

### Three Orchestrator Drivers

All inherit from `PipelineOrchestrator` (abstract base class) and share the same pipeline, the same executors, and the same state service. They differ in how they reason about step ordering:

| | `deterministic` | `adk-sim` | `adk` |
|---|---|---|---|
| Step order | Fixed sequence, no commentary | Same fixed sequence, logs a rationale per step | Gemini decides via tool-calling |
| `plan()` | No-op | Pushes a trace line about planning | Calls Gemini to decide first tool |
| `nextStep()` | Fixed order | Fixed order + hardcoded rationale | Multi-turn: sends step results to Gemini, gets next tool-call |
| `preflight()` | No-op | Re-verifies geo evidence deterministically | Falls back to deterministic for now |
| LLM calls | None | None (hardcoded strings) | Real Gemini API calls via `@google/genai` |

The `adk-sim` driver remains as a demo placeholder with hardcoded rationales. The `adk` driver (`RealAdkOrchestrator`) is the real implementation — it calls Gemini's tool-calling API and falls back to deterministic mode when the API key is missing or the call fails. The `PIPELINE` array, `AgentStep` executors, and `ProcessStateService` stay untouched — only the reasoning layer changes. See `plans/adk-integration.md` for the full plan and progress.

### Order Enforcement (Phase 5 fixes)

Gemini **proposes** the next step; the pipeline decides whether it may run. Four guards make that true:

| Guard | Where | Behaviour |
|---|---|---|
| Pipeline position is the precondition | `prerequisitesMet()` + `resolveToolCall()` in `orchestrator.ts` | A picked step runs only after every step before it has completed. An illegal pick is refused, traced, and the policy-correct step runs instead. |
| Precondition failure halts, never throws | `PRICING_STEP` | Missing underwriting report returns a `halt` outcome, not an exception escaping `runPipeline`. |
| Failure latch | `geminiUnavailable` on `RealAdkOrchestrator` | The first API error turns Gemini off for the rest of the run. One failing call costs one call, not one per step. |
| Per-request driver instance | `orchestratorFor('adk')` | `RealAdkOrchestrator` holds a Gemini `conversation`, so it is constructed fresh per request; concurrent loans never share a conversation. The stateless drivers stay shared singletons. |

The risk math, eligibility thresholds and BLOCK rules remain outside LLM reach regardless of driver.


### What Is Real vs. Simulated

| Layer | Status |
|---|---|
| Pipeline steps (Document, Geo, Underwriting, Pricing, Decision) | Real — deterministic logic, auditable output |
| Process state management (`ProcessStateService`) | Real — in-memory, full lifecycle |
| Geo-verification with CAR/DETER checks | Real — deterministic rules against mock geospatial data |
| Human-in-the-loop approval gate | Real — `classifyIntent()` routes yes/no/resume |
| `@google/genai` dependency | **Imported** — `src/services/genai.ts` singleton + `src/services/adkTools.ts` tool schemas |
| LLM reasoning (`adk` driver) | **Real** — Gemini tool-calling when `GOOGLE_GENAI_API_KEY` is set; `adk-sim` still uses hardcoded rationales |
| ADK tool-calling | **Implemented** — multi-turn loop: `plan()` gets first tool-call, `nextStep()` sends results back and gets subsequent calls |
| Order enforcement over LLM picks | **Real** — `prerequisitesMet()` refuses a Gemini pick that breaks pipeline order; covered by offline regression tests |
| Test suite | **Real** — `npm test` runs 16 offline tests (`tests/orchestrator.test.ts`, `tests/adk_doubles.test.ts`); Gemini is replaced by in-process doubles and `fetch` is disabled, so no test touches the network |
| API key / environment config | **Configured** — `.env.example` template, `.gitignore` excludes `.env`, health endpoint reports status |
| Persistence (Firestore, database) | **Not implemented** — in-memory only |
| UI toggle for `adk` mode | **Implemented** — Phase 4 complete, all three drivers selectable in UI |

## Consequences of Demo Mode

### What works today
- Full pipeline execution end-to-end with 4 sample loans
- Geo-verification blocking and repair flow (operator uploads evidence, system re-verifies)
- Human approval/rejection gate
- Three orchestrator drivers (deterministic, adk-sim, adk) — all three selectable in the UI and via API
- 16 offline regression tests (`npm test`) covering driver parity, blocking, repair and the Phase 5 defect fixes
- Real Gemini tool-calling when `GOOGLE_GENAI_API_KEY` is set
- Graceful degradation to deterministic when API key is missing or Gemini call fails
- Process state inspection and repair console
- Underwriting rules and decision records

### What does NOT work (yet)
- No LLM-generated narratives — output text is still templates
- No real geo-spatial data — uses mock CAR/DETER datasets
- No persistence — server restart loses all process state
- No authentication or authorization
- No multi-tenancy

### What must change for production
1. ~~**Wire `@google/genai`**~~ — **Done** (Phase 1-2)
2. ~~**Add API key management**~~ — **Done** (Phase 1)
3. ~~**Complete tool-calling loop**~~ — **Done** (Phase 3)
4. ~~**Add UI toggle for `adk` mode**~~ — **Done** (Phase 4)
5. **Replace in-memory state** with Firestore or a durable store
6. **Replace mock geo data** with real CAR/DETER/SICAR API integrations
7. **Add authentication** — at minimum, operator identity for the approval gate
8. **Add rate limiting, caching, and monitoring** for Gemini API calls (Phase 6)

## Running the Project

```bash
# Install dependencies
npm install

# Start on default port 3000
npm run dev

# Start on a custom port (e.g., 3001)
PORT=3001 npm run dev

# Type-check
npm run lint

# Run the offline test suite (16 tests, no network)
npm test

# Production build + run
npm run build && npm start
```

The UI is at `http://localhost:<PORT>`. The API health check is at `/api/health`.

## Port Convention

This project defaults to port 3000 but respects `PORT` env var. Port 3000 may be occupied by the Yatai Finance Platform (Docker). If so, use `PORT=3001`.

## Key Files

- `server.ts` — Express server, API routes, PORT config
- `src/services/orchestrator.ts` — Pipeline orchestrator, all three drivers, the ADK seam
- `src/services/genai.ts` — GoogleGenAI singleton (null when API key missing)
- `src/services/adkTools.ts` — Gemini tool declarations for pipeline steps
- `src/services/loanService.ts` — Process state service, sample data, underwriting rules
- `src/services/geoVerificationService.ts` — Geo-verification logic, CAR/DETER checks
- `src/types.ts` — All shared types, 8-value OverallStatus enum
- `src/App.tsx` — React UI, 3 tabs, orchestrator toggle
- `tests/orchestrator.test.ts` — driver parity, halt/block/repair/resume and approval-gate regressions (no API key)
- `tests/adk_doubles.test.ts` — offline Gemini doubles: order enforcement, failure latch, conversation isolation
