/**
 * @module: Small Business Loan Agent
 * @file: AGENTS.md
 * @description: Project instructions and architecture overview
 * @author: Maíra Pontin
 * @created: 2025-09-21
 * @updated: 260922_232638
 * @version: 1.1.0
 * @reviewer:
 * @ai_reviewer:
 * @reviewer_date:
 */

# Small Business Loan Agent — Project Instructions

## Current Phase: ADK Integration (Phase 1-2 complete)

The multi-agent pipeline is fully wired and functional. Phase 1-2 of the ADK integration are complete: `@google/genai` is wired, API key management is in place, and `RealAdkOrchestrator` calls Gemini when `GOOGLE_GENAI_API_KEY` is set. Without the key, it gracefully degrades to deterministic mode. The UI toggle for `adk` mode is not yet added (Phase 4 pending).

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
| `nextStep()` | Fixed order | Fixed order + hardcoded rationale | Routes from Gemini's tool-call |
| `preflight()` | No-op | Re-verifies geo evidence deterministically | Falls back to deterministic for now |
| LLM calls | None | None (hardcoded strings) | Real Gemini API calls via `@google/genai` |

The `adk-sim` driver remains as a demo placeholder with hardcoded rationales. The `adk` driver (`RealAdkOrchestrator`) is the real implementation — it calls Gemini's tool-calling API and falls back to deterministic mode when the API key is missing or the call fails. The `PIPELINE` array, `AgentStep` executors, and `ProcessStateService` stay untouched — only the reasoning layer changes. See `plans/adk-integration.md` for the full plan and progress.

### What Is Real vs. Simulated

| Layer | Status |
|---|---|
| Pipeline steps (Document, Geo, Underwriting, Pricing, Decision) | Real — deterministic logic, auditable output |
| Process state management (`ProcessStateService`) | Real — in-memory, full lifecycle |
| Geo-verification with CAR/DETER checks | Real — deterministic rules against mock geospatial data |
| Human-in-the-loop approval gate | Real — `classifyIntent()` routes yes/no/resume |
| `@google/genai` dependency | **Imported** — `src/services/genai.ts` singleton + `src/services/adkTools.ts` tool schemas |
| LLM reasoning (`adk` driver) | **Real** — Gemini tool-calling when `GOOGLE_GENAI_API_KEY` is set; `adk-sim` still uses hardcoded rationales |
| ADK tool-calling | **Implemented** — `RealAdkOrchestrator.plan()` calls Gemini, extracts tool-call, routes to pipeline step |
| API key / environment config | **Configured** — `.env.example` template, `.gitignore` excludes `.env`, health endpoint reports status |
| Persistence (Firestore, database) | **Not implemented** — in-memory only |
| UI toggle for `adk` mode | **Not implemented** — Phase 4 pending |

## Consequences of Demo Mode

### What works today
- Full pipeline execution end-to-end with 4 sample loans
- Geo-verification blocking and repair flow (operator uploads evidence, system re-verifies)
- Human approval/rejection gate
- Three orchestrator drivers (deterministic, adk-sim, adk) — `adk` selectable via API, not yet in UI
- Real Gemini tool-calling when `GOOGLE_GENAI_API_KEY` is set
- Graceful degradation to deterministic when API key is missing or Gemini call fails
- Process state inspection and repair console
- Underwriting rules and decision records

### What does NOT work (yet)
- No UI toggle for `adk` mode (Phase 4) — must select via API request body
- No multi-turn tool-calling loop (Phase 3) — `plan()` extracts first tool-call but doesn't iterate
- No LLM-generated narratives — output text is still templates
- No real geo-spatial data — uses mock CAR/DETER datasets
- No persistence — server restart loses all process state
- No authentication or authorization
- No multi-tenancy

### What must change for production
1. ~~**Wire `@google/genai`**~~ — **Done** (Phase 1-2)
2. ~~**Add API key management**~~ — **Done** (Phase 1)
3. **Complete tool-calling loop** — iterate through multiple Gemini tool-calls (Phase 3)
4. **Add UI toggle for `adk` mode** — Phase 4
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
