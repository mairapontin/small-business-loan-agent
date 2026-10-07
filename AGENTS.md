/**
 * @module: Small Business Loan Agent
 * @file: AGENTS.md
 * @description: Project instructions and architecture overview
 * @author: Maíra Pontin
 * @created: 2025-09-21
 * @updated: 2026-10-05T08:58:00
 * @version: 1.2.0
 * @reviewer:
 * @ai_reviewer:
 * @reviewer_date:
 */

# Small Business Loan Agent — Project Instructions

## Current Phase: ADK Integration (Phase 1-6 fully complete, including 6.4 Secret Rotation)

The multi-agent pipeline is fully wired and functional. All ADK integration phases are complete:
- **Phase 1-4** (2026-09-22–23): `@google/genai` wired, API key management, `RealAdkOrchestrator` with multi-turn tool-calling, UI toggle for all three orchestrator modes
- **Phase 5** (2026-09-23): 16 offline tests (`npm test`), pipeline order enforcement, five defects fixed at root cause
- **Phase 6** (2026-09-24–10-05): Production hardening complete:
  - Rate limiting (sliding-window, 60 calls/min)
  - Response caching (in-memory, 5-min TTL, SHA-256 keys)
  - Structured monitoring (latency, success/failure, per-loan tracking)
  - **Phase 6.4 Secret rotation** (2026-10-05): `rotateApiKey()` live re-instantiation, `POST /api/admin/rotate-key`, and key fingerprint monitoring via `/api/health`
- **Approval-gate hardening** (2026-09-28): Geo laudo evidence downgrades BLOCK to REVIEW only, never PASS; missing internal records report absence instead of borrowing another profile. Suite grew to 33 offline tests.

Without the API key, it gracefully degrades to deterministic mode.

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

The `adk-sim` driver remains as a demo placeholder with hardcoded rationales. The `adk` driver (`RealAdkOrchestrator`) is the real implementation — it calls Gemini's tool-calling API and falls back to deterministic mode when the API key is missing or the call fails. The `PIPELINE` array, `AgentStep` executors, and `ProcessStateService` stay untouched — only the reasoning layer changes. See `.qoder/plans/adk-integration.md` for the full plan and progress.

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
| Test suite | **Real** — `npm test` runs 34 offline tests (`tests/orchestrator.test.ts`, `tests/adk_doubles.test.ts`, `tests/approval_guards.test.ts`, `tests/pdf_report.test.ts`, `tests/specialized_agents.test.ts`); Gemini is replaced by in-process doubles and `fetch` is disabled, so no test touches the network |
| API key / environment config | **Configured** — `.env.example` template, `.gitignore` excludes `.env` and `.qoder/*` (with `!.qoder/plans/` so plans stay versioned), health endpoint reports status |
| Persistence (Firestore, database) | **Not implemented** — in-memory only |
| UI toggle for `adk` mode | **Implemented** — Phase 4 complete, all three drivers selectable in UI |

## Consequences of Demo Mode

### What works today
- Full pipeline execution end-to-end with 4 sample loans
- Geo-verification blocking and repair flow (operator uploads evidence, system re-verifies)
- Human approval/rejection gate
- Three orchestrator drivers (deterministic, adk-sim, adk) — all three selectable in the UI and via API
- 34 offline regression tests (`npm test`) covering driver parity, blocking, repair, the Phase 5 defect fixes and the approval-gate guards
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
5. ~~**Add rate limiting, caching, and monitoring**~~ — **Done** (Phase 6)
6. ~~**Secret rotation**~~ — **Done** (Phase 6.4: live key rotation via `rotateApiKey()` / `POST /api/admin/rotate-key`)
7. **Replace in-memory state** with Firestore or a durable store
8. **Replace mock geo data** with real CAR/DETER/SICAR API integrations
9. **Add authentication** — at minimum, operator identity for the approval gate

## Running the Project

```bash
# Install dependencies
npm install

# Start the server (always pass the project port, see Port Convention)
PORT=3123 npm run dev

# Type-check
npm run lint

# Run the offline test suite (34 tests, no network)
npm test

# Production build + run
npm run build && npm start
```

The UI is at `http://localhost:3123`. The API health check is at `http://localhost:3123/api/health`.

## Port Convention

This project runs on **port 3123**. Always start it with `PORT=3123 npm run dev`.

Ports **3000, 3001 and 3002 are off-limits** — never bind this project to any of them. They belong
to the Yatai Finance Platform (Docker) and to other local services, and occupying them breaks
work happening in parallel elsewhere on the machine.

The `PORT` default in `server.ts` is `3123`, so a bare `npm run dev` no longer lands on a reserved
port (fixed in `d7dd15d`). Passing `PORT=3123` explicitly stays the convention: the guard is visible
in the launch command and survives any future change to the default. Re-check with
`grep -n "process.env.PORT" server.ts`.

The Express server hosts Vite in `middlewareMode` (`server.ts`, "Vite middleware setup"), so the UI
and the API share port 3123. The `port: 3130` in `vite.config.ts` is inert on this path — it only
applies if Vite is started standalone with `npx vite`.

## Key Files

- `server.ts` — Express server, API routes, PORT config
- `src/services/orchestrator.ts` — Pipeline orchestrator, all three drivers, the ADK seam
- `src/services/genai.ts` — GoogleGenAI singleton (null when API key missing)
- `src/services/adkTools.ts` — Gemini tool declarations for pipeline steps
- `src/services/rateLimiter.ts` — Sliding-window rate limiter for Gemini calls (60/min default)
- `src/services/responseCache.ts` — In-memory response cache (5-min TTL, SHA-256 keys)
- `src/services/monitor.ts` — Structured logging for Gemini calls (latency, success/failure, per-loan)
- `src/services/loanService.ts` — Process state service, sample data, underwriting rules
- `src/services/geoVerificationService.ts` — Geo-verification logic, CAR/DETER checks
- `src/types.ts` — All shared types, 8-value OverallStatus enum
- `src/App.tsx` — React UI, 3 tabs, orchestrator toggle
- `tests/orchestrator.test.ts` — driver parity, halt/block/repair/resume and approval-gate regressions (no API key)
- `tests/adk_doubles.test.ts` — offline Gemini doubles: order enforcement, failure latch, conversation isolation
- `tests/approval_guards.test.ts` — approval-gate intent, missing internal-record reporting and geo-evidence downgrades (no API key)
- `.qoder/plans/adk-integration.md` — ADK integration plan and phase progress (repo-tracked; other `.qoder/` content is gitignored)
