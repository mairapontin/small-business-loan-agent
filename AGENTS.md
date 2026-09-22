# Small Business Loan Agent — Project Instructions

## Current Phase: Demo / Prototype

This project is in **demo/prototype mode**. The multi-agent pipeline is fully wired and functional, but the LLM layer is simulated. No real Gemini/ADK calls are made at runtime.

## Architecture

### Pipeline

```
DocumentExtractionAgent → GeoVerificationAgent → UnderwritingAgent → PricingAgent → LoanDecisionAgent
```

All five agents run as deterministic `AgentStep` executors in `src/services/orchestrator.ts`. The risk math, eligibility thresholds, and BLOCK rules are real and auditable — they do not depend on which orchestrator driver is selected.

### Two Orchestrator Drivers

Both inherit from `PipelineOrchestrator` (abstract base class) and share the same pipeline, the same executors, and the same state service. They differ only in how they reason about step ordering:

| | `deterministic` | `adk-sim` |
|---|---|---|
| Step order | Fixed sequence, no commentary | Same fixed sequence, but logs a rationale per step |
| `plan()` | No-op | Pushes a trace line about planning |
| `preflight()` | No-op | Re-verifies geo evidence on resume instead of trusting stored reports |
| LLM calls | None | None (hardcoded strings) |

The `adk-sim` driver is a **placeholder** for a real Google ADK root agent. The seam is designed so that swapping `plan()` and `preflight()` for real Gemini tool-calls requires no changes to the pipeline executors.

**Evolution path:** `adk-sim` → real ADK root agent. Replace `plan()` with Gemini deciding which verification agent to invoke and why (tool-call to `run_geo_verification`, `run_underwriting`, etc.). Replace `preflight()` with Gemini interpreting operator-supplied repair evidence and deciding whether to trust it. The `PIPELINE` array, `AgentStep` executors, and `ProcessStateService` stay untouched — only the reasoning layer changes. See `plans/adk-integration.md` for the full upgrade plan.

### What Is Real vs. Simulated

| Layer | Status |
|---|---|
| Pipeline steps (Document, Geo, Underwriting, Pricing, Decision) | Real — deterministic logic, auditable output |
| Process state management (`ProcessStateService`) | Real — in-memory, full lifecycle |
| Geo-verification with CAR/DETER checks | Real — deterministic rules against mock geospatial data |
| Human-in-the-loop approval gate | Real — `classifyIntent()` routes yes/no/resume |
| `@google/genai` dependency | Installed but **not imported anywhere** |
| LLM reasoning (step selection, evidence interpretation) | **Simulated** — hardcoded rationales |
| ADK tool-calling | **Not implemented** |
| Persistence (Firestore, database) | **Not implemented** — in-memory only |
| API key / environment config for Gemini | **Not configured** |

## Consequences of Demo Mode

### What works today
- Full pipeline execution end-to-end with 4 sample loans
- Geo-verification blocking and repair flow (operator uploads evidence, system re-verifies)
- Human approval/rejection gate
- Two orchestrator modes selectable in UI
- Process state inspection and repair console
- Underwriting rules and decision records

### What does NOT work
- No autonomous reasoning — the system cannot interpret novel situations or explain decisions in natural language beyond templates
- No LLM-generated narratives — all output text is hardcoded
- No real geo-spatial data — uses mock CAR/DETER datasets
- No persistence — server restart loses all process state
- No authentication or authorization
- No multi-tenancy

### What must change for production
1. **Wire `@google/genai`** into `AdkOrchestrator.plan()` and `preflight()` — replace hardcoded rationales with real Gemini tool-calls
2. **Add API key management** — `GOOGLE_GENAI_API_KEY` env var, secret rotation
3. **Replace in-memory state** with Firestore or a durable store
4. **Replace mock geo data** with real CAR/DETER/SICAR API integrations
5. **Add authentication** — at minimum, operator identity for the approval gate
6. **Add audit logging** — every LLM decision must be traceable for regulatory compliance
7. **Add rate limiting and error handling** for external API calls

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
- `src/services/orchestrator.ts` — Pipeline orchestrator, both drivers, the ADK seam
- `src/services/loanService.ts` — Process state service, sample data, underwriting rules
- `src/services/geoVerificationService.ts` — Geo-verification logic, CAR/DETER checks
- `src/types.ts` — All shared types, 8-value OverallStatus enum
- `src/App.tsx` — React UI, 3 tabs, orchestrator toggle
