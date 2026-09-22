# ADK Integration Plan — From `adk-sim` to Real Gemini Root Agent

## Status: Planned (not started)

This document describes the evolution from the current `adk-sim` mock orchestrator to a real Google ADK root agent powered by Gemini. The current demo/prototype phase keeps `adk-sim` as a placeholder with hardcoded rationales. This plan outlines what must change to make the reasoning layer real.

---

## Current State (Demo Phase)

### What exists today

- **`AdkOrchestrator` class** in `src/services/orchestrator.ts` (line 560-651)
  - `plan()` — pushes a hardcoded trace line: `"woken for {loanRequestId}; planning verification order from the current process state"`
  - `nextStep()` — calls `super.nextStep()` (same fixed order as deterministic), then logs a hardcoded rationale from the `DECISION_RATIONALE` map
  - `preflight()` — re-verifies geo evidence on resume, but uses deterministic logic, not LLM judgment

- **`@google/genai` dependency** — installed in `package.json` but **not imported anywhere**

- **No API key configuration** — no `GOOGLE_GENAI_API_KEY` env var, no secret management

- **Pipeline executors are real** — `DOCUMENT_STEP`, `GEO_STEP`, `UNDERWRITING_STEP`, `PRICING_STEP` are deterministic and auditable. They do not depend on which orchestrator driver is selected.

### What works

- Full pipeline execution end-to-end
- Geo-verification blocking and repair flow
- Human-in-the-loop approval gate
- Two orchestrator modes selectable in UI
- Process state inspection and repair console

### What doesn't work

- No autonomous reasoning — step selection is hardcoded
- No LLM-generated narratives — all output text is templates
- No evidence interpretation — geo repair evidence is re-verified deterministically, not judged by an LLM
- No natural language explanations — rationales are hardcoded strings

---

## Target State (Production ADK Integration)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ADK Root Agent (Gemini)                   │
│                                                              │
│  - Receives loan application                                │
│  - Decides which verification agent to invoke next          │
│  - Interprets results and explains reasoning                │
│  - Judges operator-supplied repair evidence                 │
│  - Generates natural language narratives                    │
│                                                              │
│  Tool-calls:                                                │
│  - run_document_extraction(application)                     │
│  - run_geo_verification(application, evidence?)             │
│  - run_underwriting(application, geo_report)                │
│  - run_pricing(application, underwriting_report)            │
│  - finalize_decision(application, pricing_report)           │
└─────────────────────────────────────────────────────────────┘
                            ↓
              ┌─────────────────────────────┐
              │   PipelineOrchestrator      │
              │   (abstract base class)     │
              └─────────────────────────────┘
                            ↓
        ┌──────────────────────────────────────────┐
        │   AgentStep Executors (unchanged)        │
        │                                          │
        │   DOCUMENT_STEP                          │
        │   GEO_STEP                               │
        │   UNDERWRITING_STEP                      │
        │   PRICING_STEP                           │
        │                                          │
        │   These remain deterministic.            │
        │   The LLM decides WHEN to call them,     │
        │   not WHAT they compute.                 │
        └──────────────────────────────────────────┘
```

### Key Design Principles

1. **LLM decides orchestration, not computation** — Gemini chooses which agent to invoke and why, but the agent executors themselves remain deterministic. Risk math, eligibility thresholds, and BLOCK rules are not subject to LLM interpretation.

2. **Tool-calling, not prompt-chaining** — The root agent uses Gemini's native tool-calling to invoke pipeline steps. Each tool-call returns structured data (the step's output), which Gemini can then reason about.

3. **Audit trail is mandatory** — Every LLM decision (which agent to invoke, why, how it interpreted the result) must be logged in the `RunContext.trace` array for regulatory compliance.

4. **Graceful degradation** — If the LLM call fails (timeout, rate limit, API error), the system should fall back to `DeterministicOrchestrator` behavior rather than crashing.

---

## Step-by-Step Implementation Plan

### Phase 1: Prerequisites (1-2 days)

#### 1.1 Add API key management

**File:** `server.ts`

```typescript
import { GoogleGenAI } from '@google/genai';

const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;
if (!GOOGLE_GENAI_API_KEY) {
  console.warn('GOOGLE_GENAI_API_KEY not set — ADK orchestrator will not be available');
}

const genAI = GOOGLE_GENAI_API_KEY ? new GoogleGenAI({ apiKey: GOOGLE_GENAI_API_KEY }) : null;
```

**File:** `.env.example` (new file)

```bash
# Google Gemini API key for ADK root agent
# Get yours at https://makersuite.google.com/app/apikey
GOOGLE_GENAI_API_KEY=your_api_key_here

# Server port (default: 3000)
PORT=3000
```

**File:** `.env` (add to `.gitignore`)

```bash
GOOGLE_GENAI_API_KEY=...
PORT=3000
```

**File:** `.gitignore`

```bash
# Add this line
.env
```

#### 1.2 Define tool schemas for Gemini

**File:** `src/services/adkTools.ts` (new file)

```typescript
import { Tool, FunctionDeclaration } from '@google/genai';

export const pipelineTools: Tool = {
  functionDeclarations: [
    {
      name: 'run_document_extraction',
      description: 'Extract and validate critical fields from the loan application document',
      parameters: {
        type: 'OBJECT',
        properties: {
          application: {
            type: 'OBJECT',
            description: 'The loan application data',
          },
        },
        required: ['application'],
      },
    },
    {
      name: 'run_geo_verification',
      description: 'Verify territorial and environmental status of the collateral property using CAR/DETER data',
      parameters: {
        type: 'OBJECT',
        properties: {
          application: {
            type: 'OBJECT',
            description: 'The loan application data',
          },
          repair_evidence: {
            type: 'OBJECT',
            description: 'Optional operator-supplied evidence to override a previous BLOCKED status',
          },
        },
        required: ['application'],
      },
    },
    {
      name: 'run_underwriting',
      description: 'Evaluate credit eligibility based on financial data and geo-verification results',
      parameters: {
        type: 'OBJECT',
        properties: {
          application: {
            type: 'OBJECT',
            description: 'The loan application data',
          },
          geo_report: {
            type: 'OBJECT',
            description: 'The geo-verification report',
          },
        },
        required: ['application', 'geo_report'],
      },
    },
    {
      name: 'run_pricing',
      description: 'Calculate loan pricing (interest rate, monthly payment, risk tier) based on underwriting results',
      parameters: {
        type: 'OBJECT',
        properties: {
          application: {
            type: 'OBJECT',
            description: 'The loan application data',
          },
          underwriting_report: {
            type: 'OBJECT',
            description: 'The underwriting report',
          },
        },
        required: ['application', 'underwriting_report'],
      },
    },
  ],
};
```

### Phase 2: Implement Real ADK Orchestrator (3-5 days)

#### 2.1 Create `RealAdkOrchestrator` class

**File:** `src/services/orchestrator.ts`

```typescript
export class RealAdkOrchestrator extends PipelineOrchestrator {
  readonly id = 'adk' as const;
  readonly label = 'ADK root agent (Gemini)';

  private genAI: GoogleGenAI | null;

  constructor(genAI: GoogleGenAI | null) {
    super();
    this.genAI = genAI;
  }

  protected async plan(loanRequestId: string, ctx: RunContext) {
    if (!this.genAI) {
      ctx.trace.push('ADK root agent unavailable (no API key); falling back to deterministic planning');
      return;
    }

    ctx.trace.push(`woken for ${loanRequestId}; asking Gemini to plan verification order`);

    // TODO: Implement real Gemini call
    // const response = await this.genAI.models.generateContent({
    //   model: 'gemini-2.0-flash-exp',
    //   contents: `You are a loan verification coordinator. Given the current process state for ${loanRequestId}, decide which verification agent to invoke next and explain why.`,
    //   config: {
    //     tools: [pipelineTools],
    //   },
    // });
    // ctx.trace.push(`Gemini plan: ${response.text}`);
  }

  protected async nextStep(
    data: PipelineData,
    completed: Set<StepName>,
    ctx: RunContext
  ): Promise<StepName | null> {
    if (!this.genAI) {
      return super.nextStep(data, completed, ctx);
    }

    // TODO: Ask Gemini which agent to invoke next
    // For now, fall back to deterministic order
    const name = super.nextStep(data, completed, ctx);
    if (name) {
      ctx.trace.push(`${name} <- deterministic fallback (Gemini integration not yet implemented)`);
    }
    return name;
  }

  protected async preflight(
    data: PipelineData,
    completed: Set<StepName>,
    ctx: RunContext
  ): Promise<OrchestrationResult | null> {
    if (!this.genAI) {
      return null;
    }

    // TODO: Ask Gemini to judge operator-supplied repair evidence
    // For now, fall back to deterministic re-verification
    return null;
  }
}
```

#### 2.2 Update `OrchestratorId` type

**File:** `src/types.ts`

```typescript
export type OrchestratorId = 'deterministic' | 'adk-sim' | 'adk';
```

#### 2.3 Register the new orchestrator

**File:** `src/services/orchestrator.ts`

```typescript
export const ORCHESTRATORS: Record<OrchestratorId, PipelineOrchestrator> = {
  deterministic: new DeterministicOrchestrator(),
  'adk-sim': new AdkOrchestrator(),
  adk: new RealAdkOrchestrator(genAI), // from server.ts
};
```

### Phase 3: Wire Tool-Calling (2-3 days)

#### 3.1 Implement tool execution loop

When Gemini returns a tool-call, execute the corresponding pipeline step and return the result to Gemini for further reasoning.

```typescript
private async executeToolCall(toolCall: FunctionCall, data: PipelineData): Promise<any> {
  const { name, args } = toolCall;
  
  switch (name) {
    case 'run_document_extraction':
      return DOCUMENT_STEP.run(data);
    case 'run_geo_verification':
      return GEO_STEP.run(data);
    case 'run_underwriting':
      return UNDERWRITING_STEP.run(data);
    case 'run_pricing':
      return PRICING_STEP.run(data);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

#### 3.2 Handle multi-turn reasoning

Gemini may call multiple tools in sequence. Implement a loop that:
1. Sends the current state to Gemini
2. Receives a tool-call
3. Executes the tool
4. Returns the result to Gemini
5. Repeats until Gemini stops calling tools

### Phase 4: Update UI (1 day)

#### 4.1 Add `adk` option to orchestrator toggle

**File:** `src/App.tsx`

```typescript
const [orchestrator, setOrchestrator] = useState<OrchestratorId>('deterministic');
```

**File:** `src/components/ChatConsole.tsx`

Add a third option to the orchestrator selector:

```typescript
<select value={orchestrator} onChange={(e) => setOrchestrator(e.target.value as OrchestratorId)}>
  <option value="deterministic">Deterministic</option>
  <option value="adk-sim">ADK (Simulated)</option>
  <option value="adk">ADK (Gemini)</option>
</select>
```

#### 4.2 Display LLM reasoning trace

When `orchestrator === 'adk'`, show the `ctx.trace` array in the chat output so the user can see Gemini's reasoning.

### Phase 5: Testing & Validation (2-3 days)

#### 5.1 Unit tests

- Test that `RealAdkOrchestrator` falls back to deterministic when `genAI` is null
- Test that tool-calls are correctly routed to pipeline steps
- Test that the trace array captures all LLM decisions

#### 5.2 Integration tests

- Run the full pipeline with `orchestrator === 'adk'` and verify it produces the same results as `deterministic`
- Test error handling: what happens when Gemini times out or returns an error?

#### 5.3 Manual testing

- Run all 4 sample loans through the `adk` orchestrator
- Verify that Gemini's rationales make sense
- Check that the audit trail is complete

### Phase 6: Production Hardening (ongoing)

#### 6.1 Rate limiting

Add rate limiting for Gemini API calls to avoid quota exhaustion.

#### 6.2 Caching

Cache Gemini responses for identical inputs to reduce API costs.

#### 6.3 Monitoring

Add logging for:
- Gemini API call latency
- Token usage
- Error rates
- Fallback events (when `genAI` is null)

#### 6.4 Secret rotation

Implement a mechanism to rotate the `GOOGLE_GENAI_API_KEY` without restarting the server.

---

## What Changes vs. What Stays the Same

### Changes

| Component | Change |
|---|---|
| `AdkOrchestrator` class | Replace with `RealAdkOrchestrator` that calls Gemini |
| `plan()` method | Implement real Gemini call to decide verification order |
| `nextStep()` method | Implement real Gemini tool-calling to select next agent |
| `preflight()` method | Implement real Gemini judgment on repair evidence |
| `OrchestratorId` type | Add `'adk'` to the union |
| UI orchestrator toggle | Add third option for `adk` |
| `server.ts` | Initialize `GoogleGenAI` with API key |
| `.env` | Add `GOOGLE_GENAI_API_KEY` |

### Stays the Same

| Component | Why |
|---|---|
| `PIPELINE` array | Order is policy, not preference — both drivers must respect it |
| `AgentStep` executors | Risk math must remain deterministic and auditable |
| `ProcessStateService` | State management is infrastructure, not reasoning |
| `classifyIntent()` | Human-in-the-loop routing is not LLM-dependent |
| `approve()` / `reject()` | Approval gate is driver-agnostic |
| Underwriting rules | Business logic is not subject to LLM interpretation |
| Geo-verification logic | CAR/DETER checks are deterministic rules |

---

## Prerequisites

1. **Google Gemini API key** — Get one at https://makersuite.google.com/app/apikey
2. **`@google/genai` package** — Already installed (`"latest"`)
3. **Node.js 18+** — Required for `@google/genai`
4. **Environment variable support** — Server must read `.env` file (use `dotenv` or similar)

---

## Risks and Mitigations

### Risk 1: Gemini API latency

**Problem:** Gemini calls add 1-5 seconds per step, making the pipeline slower.

**Mitigation:**
- Cache responses for identical inputs
- Use `gemini-2.0-flash-exp` (faster than `gemini-1.5-pro`)
- Fall back to `DeterministicOrchestrator` if latency exceeds threshold

### Risk 2: Gemini API costs

**Problem:** Each pipeline run makes multiple Gemini calls, which can be expensive at scale.

**Mitigation:**
- Cache responses aggressively
- Use smaller models for simple decisions (e.g., `gemini-2.0-flash-lite`)
- Monitor token usage and set alerts

### Risk 3: LLM hallucination

**Problem:** Gemini might make incorrect decisions or misinterpret evidence.

**Mitigation:**
- Keep pipeline executors deterministic — LLM decides orchestration, not computation
- Log all LLM decisions for audit
- Implement human-in-the-loop review for high-risk decisions

### Risk 4: API key compromise

**Problem:** If the API key is leaked, attackers can exhaust your quota or incur charges.

**Mitigation:**
- Never commit `.env` to git
- Use secret management (e.g., Google Secret Manager) in production
- Rotate keys regularly
- Set up billing alerts

### Risk 5: Gemini API downtime

**Problem:** If Gemini is unavailable, the `adk` orchestrator cannot function.

**Mitigation:**
- Fall back to `DeterministicOrchestrator` when `genAI` is null
- Implement retry logic with exponential backoff
- Monitor API status and alert on outages

---

## Success Criteria

The ADK integration is complete when:

1. ✅ `RealAdkOrchestrator` can run the full pipeline with real Gemini calls
2. ✅ Gemini's rationales are logged in the trace array
3. ✅ The UI allows selecting `adk` as the orchestrator
4. ✅ All 4 sample loans run successfully with `orchestrator === 'adk'`
5. ✅ The system falls back to deterministic when Gemini is unavailable
6. ✅ API key is managed securely (not hardcoded, not committed)
7. ✅ Audit trail is complete and traceable

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|---|---|---|
| Phase 1: Prerequisites | 1-2 days | None |
| Phase 2: Implement Real ADK Orchestrator | 3-5 days | Phase 1 |
| Phase 3: Wire Tool-Calling | 2-3 days | Phase 2 |
| Phase 4: Update UI | 1 day | Phase 2 |
| Phase 5: Testing & Validation | 2-3 days | Phase 3, 4 |
| Phase 6: Production Hardening | Ongoing | Phase 5 |
| **Total** | **9-14 days** | |

---

## Next Steps

1. **Decide when to start** — Is the demo phase sufficient for now, or do we need real ADK reasoning for an upcoming milestone?
2. **Get API key** — Request a Google Gemini API key and set up billing
3. **Review this plan** — Discuss any architectural concerns or alternative approaches
4. **Start Phase 1** — Add API key management and tool schemas

---

## References

- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [@google/genai npm package](https://www.npmjs.com/package/@google/genai)
- [Gemini API Quickstart](https://ai.google.dev/gemini-api/docs/quickstart)
- [Gemini Tool-Calling Guide](https://ai.google.dev/gemini-api/docs/tool-calling)
