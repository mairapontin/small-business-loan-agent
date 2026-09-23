import {
  GeoRepairEvidence,
  GeoVerificationReport,
  LoanApplicationData,
  OrchestratorId,
  PricingResult,
  ProcessState,
  StepName,
  ToolCall,
  UnderwritingReport,
} from '../types';
import {
  ALL_STEPS,
  ProcessStateService,
  SAMPLE_APPLICATIONS,
  calculateLoanPricing,
  evaluateUnderwriting,
  finalizeLoanDecision,
} from './loanService';
import {
  defaultSource,
  runGeoVerification,
  summarizeGeoReport,
} from './geoVerificationService';
import { genAI } from './genai';
import { PIPELINE_TOOLS } from './adkTools';

/**
 * The orchestration seam.
 *
 * Two drivers share one pipeline: `DeterministicOrchestrator` walks the steps in
 * fixed order; `AdkOrchestrator` decides, step by step, which verification to
 * call next and says why. What they do NOT get to change is the risk math —
 * both call the same `AgentStep` executors below, so eligibility thresholds,
 * reason codes and impeditve BLOCK rules stay deterministic and auditable no
 * matter who drives. That is the whole point of the split.
 */

export interface OrchestrationResult {
  content: string;
  toolCalls: ToolCall[];
  requiresApproval?: boolean;
  orchestrator: OrchestratorId;
}

interface PipelineData {
  loanRequestId: string;
  application: LoanApplicationData;
  geoReport: GeoVerificationReport | null;
  underwriting: UnderwritingReport | null;
  pricing: PricingResult | null;
}

interface RunContext {
  log: ToolCall[];
  trace: string[];
}

type StepOutcome =
  | { kind: 'completed'; payload: any }
  | {
      kind: 'halt';
      payload: any;
      issue: string; // recorded on the ProcessState issue log
      headline: string; // reason clause after "Cannot proceed to <blocked step>:"
      detail: string; // what the operator must do next
      missingFields?: string[];
    };

interface AgentStep {
  name: StepName;
  run(data: PipelineData): StepOutcome;
}

const ANALYSIS_STEPS = ALL_STEPS.slice(0, ALL_STEPS.length - 1);
const APPROVAL_GATE: StepName = 'LoanDecisionAgent';

const CRITICAL_FIELDS: (keyof LoanApplicationData)[] = [
  'business_name',
  'owner_name',
  'loan_amount_requested',
  'annual_revenue',
];

const DOCUMENT_STEP: AgentStep = {
  name: 'DocumentExtractionAgent',
  run(data) {
    const app = data.application;
    const missing = CRITICAL_FIELDS.filter(
      (f) => !String(app[f] ?? '').trim()
    );

    if (missing.length > 0) {
      const issue = `Missing ${missing.length} critical field(s): ${missing.join(', ')}`;
      return {
        kind: 'halt',
        payload: app,
        issue,
        headline: `Pending approval - ${issue}`,
        detail:
          'Please provide a complete document or update the application with the required field before we can proceed.',
        missingFields: missing,
      };
    }

    return { kind: 'completed', payload: app };
  },
};

const GEO_STEP: AgentStep = {
  name: 'GeoVerificationAgent',
  run(data) {
    const report = runGeoVerification(
      data.application,
      new Date().toISOString(),
      defaultSource
    );

    if (report.overall_status !== 'BLOCKED') {
      return { kind: 'completed', payload: report };
    }

    return {
      kind: 'halt',
      payload: report,
      issue: `Impedimento territorial/ambiental: ${report.blocking_findings.join('; ')}`,
      headline: 'geo-environmental verification is BLOCKED',
      detail: `${summarizeGeoReport(report)}\n\nThe workflow has been stopped. Provide the required evidence (re-survey, deforestation exclusion report, embargo lift, or legal-reserve regularization) in the Firestore State & Repair console, then resume.`,
    };
  },
};

const UNDERWRITING_STEP: AgentStep = {
  name: 'UnderwritingAgent',
  run(data) {
    return {
      kind: 'completed',
      payload: evaluateUnderwriting(
        data.application,
        data.loanRequestId,
        data.geoReport
      ),
    };
  },
};

const PRICING_STEP: AgentStep = {
  name: 'PricingAgent',
  run(data) {
    if (!data.underwriting) {
      throw new Error('PricingAgent requires an underwriting report');
    }
    return {
      kind: 'completed',
      payload: calculateLoanPricing(
        data.application,
        data.underwriting,
        data.loanRequestId
      ),
    };
  },
};

// Order is policy, not preference: credit analysis must never run on an
// unverified property. Both drivers honour it.
const PIPELINE: AgentStep[] = [
  DOCUMENT_STEP,
  GEO_STEP,
  UNDERWRITING_STEP,
  PRICING_STEP,
];

function stepFor(name: StepName): AgentStep {
  const step = PIPELINE.find((s) => s.name === name);
  if (!step) throw new Error(`No executor for step ${name}`);
  return step;
}

function stepAfter(name: StepName): StepName | null {
  const index = ANALYSIS_STEPS.indexOf(name);
  return index >= 0 && index < ANALYSIS_STEPS.length - 1
    ? ANALYSIS_STEPS[index + 1]
    : null;
}

function fold(data: PipelineData, name: StepName, payload: any) {
  if (name === 'DocumentExtractionAgent') data.application = payload;
  else if (name === 'GeoVerificationAgent') data.geoReport = payload;
  else if (name === 'UnderwritingAgent') data.underwriting = payload;
  else if (name === 'PricingAgent') data.pricing = payload;
}

function completedSteps(state: ProcessState): Set<StepName> {
  const done = new Set<StepName>();
  for (const name of PIPELINE) {
    if (['completed', 'approved'].includes(state.steps[name.name].status)) {
      done.add(name.name);
    }
  }
  return done;
}

function hydrate(state: ProcessState, loanRequestId: string): PipelineData {
  const fallback =
    SAMPLE_APPLICATIONS[loanRequestId]?.data ??
    SAMPLE_APPLICATIONS['SBL-2025-02142'].data;
  return {
    loanRequestId,
    application:
      (state.steps.DocumentExtractionAgent.data as LoanApplicationData) ??
      fallback,
    geoReport: state.steps.GeoVerificationAgent.data as GeoVerificationReport,
    underwriting: state.steps.UnderwritingAgent.data as UnderwritingReport,
    pricing: state.steps.PricingAgent.data as PricingResult,
  };
}

function emptyPipelineData(
  loanRequestId: string,
  application: LoanApplicationData
): PipelineData {
  return {
    loanRequestId,
    application,
    geoReport: null,
    underwriting: null,
    pricing: null,
  };
}

function approvalQuestion(data: PipelineData): string {
  const app = data.application;
  const underwriting = data.underwriting;
  const pricing = data.pricing;
  if (!underwriting || !pricing) {
    throw new Error(
      'Approval gate reached without an underwriting and pricing result'
    );
  }

  const geo = data.geoReport;
  const geoLine =
    geo && geo.checks.length > 0
      ? `\n- Geo-Environmental (${geo.property_id}): ${geo.overall_status}`
      : '';

  return `Loan Application Summary:\n- Business: ${app.business_name}\n- Owner: ${app.owner_name}\n- Loan Amount: ${app.loan_amount_requested}\n- Annual Revenue: ${app.annual_revenue}\n- Eligibility: ${underwriting.eligibility_status}${geoLine}\n- Risk Tier: ${pricing.risk_tier}\n- Interest Rate: ${pricing.interest_rate}\n- Monthly Payment: ${pricing.monthly_payment}\n- Total Interest: ${pricing.total_interest}`;
}

export type Intent = 'approve' | 'reject' | 'resume' | 'process';

// Standalone so the HTTP layer can route without importing a driver instance.
export function classifyIntent(lower: string): Intent {
  if (
    lower === 'yes' ||
    lower === 'approve' ||
    lower.includes('approve this loan') ||
    lower.includes('approved')
  ) {
    return 'approve';
  }
  if (
    lower === 'no' ||
    lower === 'reject' ||
    lower.includes('reject loan') ||
    lower.includes('rejected')
  ) {
    return 'reject';
  }
  if (lower.includes('resume') || lower.includes('continue')) return 'resume';
  return 'process';
}

export abstract class PipelineOrchestrator {
  abstract readonly id: OrchestratorId;
  abstract readonly label: string;

  async start(
    loanRequestId: string,
    application: LoanApplicationData
  ): Promise<OrchestrationResult> {
    const ctx = this.newContext();
    ProcessStateService.createProcess(loanRequestId);
    ctx.log.push({
      tool: 'check_process_status',
      status: 'success',
      details: {
        status: 'initialized',
        action: 'proceed_to_analysis',
        message: `New process initialized for ${loanRequestId}`,
      },
    });
    await this.plan(loanRequestId, ctx);

    return this.runPipeline(
      emptyPipelineData(loanRequestId, application),
      new Set<StepName>(),
      ctx
    );
  }

  async resume(loanRequestId: string): Promise<OrchestrationResult> {
    const ctx = this.newContext();
    const state = ProcessStateService.getProcessStatus(loanRequestId);

    if (!state) {
      return this.result(
        ctx,
        `No active workflow found for ${loanRequestId} to resume. Please initiate processing first.`
      );
    }

    ctx.log.push({
      tool: 'check_process_status',
      status: 'success',
      details: { action: 'resume', state },
    });
    await this.plan(loanRequestId, ctx);

    const completed = completedSteps(state);
    const data = hydrate(state, loanRequestId);
    const next = this.firstPending(completed);

    if (!next) {
      return this.result(
        ctx,
        `Process ${loanRequestId} is already complete! All steps have been executed.`
      );
    }

    const halt = ProcessStateService.determineHaltAction(
      next,
      state.overall_status,
      state.issues
    );
    if (halt) {
      ctx.log.push({ tool: next, status: 'halted', details: halt });
      return this.result(
        ctx,
        `I encountered an issue resuming your application.\n${halt.error}\n\nPlease repair the pending data in the Firestore Process State console before resuming.`
      );
    }

    return this.runPipeline(data, completed, ctx, 'Resume completed successfully!\n\n');
  }

  async approve(loanRequestId: string): Promise<OrchestrationResult> {
    const ctx = this.newContext();
    const state = ProcessStateService.getProcessStatus(loanRequestId);

    if (!state || !state.steps.PricingAgent.data) {
      return this.result(
        ctx,
        `Cannot finalize loan decision for ${loanRequestId}: Pricing analysis has not been completed yet. Please process the loan application first.`
      );
    }

    ctx.log.push({
      tool: 'check_process_status',
      status: 'success',
      details: { overall_status: state.overall_status },
    });
    ctx.log.push({ tool: APPROVAL_GATE, status: 'running' });

    const decision = finalizeLoanDecision(
      state.steps.DocumentExtractionAgent.data as LoanApplicationData,
      state.steps.PricingAgent.data as PricingResult,
      loanRequestId,
      state.steps.GeoVerificationAgent.data as GeoVerificationReport | null
    );

    ProcessStateService.updateStepStatus(
      loanRequestId,
      APPROVAL_GATE,
      'completed',
      decision
    );
    const approved = ProcessStateService.getProcessStatus(loanRequestId);
    if (approved) approved.overall_status = 'approved';
    const last = ctx.log[ctx.log.length - 1];
    last.status = 'success';
    last.details = decision;

    const conditions = decision.conditions.map((c) => `- ${c}`).join('\n');
    return this.result(
      ctx,
      `Loan ${loanRequestId} has been approved.\nDecision letter ${decision.decision_letter_id} has been generated.\n\nApproved terms:\n- Amount: ${decision.approved_amount}\n- Interest Rate: ${decision.approved_rate}\n- Term: ${decision.approved_term}\n\nConditions:\n${conditions}`
    );
  }

  async reject(loanRequestId: string): Promise<OrchestrationResult> {
    const ctx = this.newContext();
    const state = ProcessStateService.getProcessStatus(loanRequestId);
    if (state) {
      ProcessStateService.updateStepStatus(
        loanRequestId,
        APPROVAL_GATE,
        'rejected',
        { decision: 'REJECTED' }
      );
      state.overall_status = 'rejected';
    }
    return this.result(
      ctx,
      `Application ${loanRequestId} will not proceed. The loan has been declined per your decision.`
    );
  }

  /** Order is fixed for every driver: the first unfinished step in the policy. */
  protected firstPending(completed: Set<StepName>): StepName | null {
    const pending = PIPELINE.find((s) => !completed.has(s.name));
    return pending ? pending.name : null;
  }

  /** Which agent runs next. */
  protected async nextStep(
    _data: PipelineData,
    completed: Set<StepName>,
    _ctx: RunContext
  ): Promise<StepName | null> {
    return this.firstPending(completed);
  }

  /** Judgment applied once, before the loop, on already-held evidence. */
  protected async preflight(
    _data: PipelineData,
    _completed: Set<StepName>,
    _ctx: RunContext
  ): Promise<OrchestrationResult | null> {
    return null;
  }

  protected async plan(_loanRequestId: string, _ctx: RunContext) {}

  private newContext(): RunContext {
    return { log: [], trace: [] };
  }

  private async runPipeline(
    data: PipelineData,
    completed: Set<StepName>,
    ctx: RunContext,
    intro = ''
  ): Promise<OrchestrationResult> {
    const preflightResult = await this.preflight(data, completed, ctx);
    if (preflightResult) return preflightResult;

    const currentState = ProcessStateService.getProcessStatus(data.loanRequestId);
    if (currentState && currentState.overall_status !== 'in_progress') {
      currentState.overall_status = 'in_progress';
    }

    for (;;) {
      const name = await this.nextStep(data, completed, ctx);
      if (!name) break;

      const step = stepFor(name);
      ctx.log.push({ tool: step.name, status: 'running' });
      const outcome = step.run(data);
      const last = ctx.log[ctx.log.length - 1];

      if (outcome.kind === 'halt') {
        ProcessStateService.markStepForReview(
          data.loanRequestId,
          step.name,
          outcome.issue,
          outcome.missingFields ?? [],
          outcome.payload,
          'blocked'
        );
        last.status = 'error';
        last.details = outcome.missingFields
          ? { error: outcome.issue, missing_fields: outcome.missingFields }
          : outcome.payload;

        const blocked = stepAfter(step.name);
        if (blocked) {
          const state = ProcessStateService.getProcessStatus(data.loanRequestId);
          const halt = ProcessStateService.determineHaltAction(
            blocked,
            state?.overall_status ?? 'pending_approval',
            state?.issues ?? []
          );
          ctx.log.push({ tool: blocked, status: 'halted', details: halt });
        }

        return this.result(
          ctx,
          `I encountered an issue while processing your application.\nCannot proceed to ${blocked ?? APPROVAL_GATE}: ${outcome.headline}\n\n${outcome.detail}\n\nReference: ${data.loanRequestId}`
        );
      }

      last.status = 'success';
      last.details = outcome.payload;
      ProcessStateService.updateStepStatus(
        data.loanRequestId,
        step.name,
        'completed',
        outcome.payload
      );
      fold(data, step.name, outcome.payload);
      completed.add(step.name);
    }

    const pipelineState = ProcessStateService.getProcessStatus(data.loanRequestId);
    if (pipelineState) pipelineState.overall_status = 'pending_approval';

    return this.result(
      ctx,
      `${intro}${approvalQuestion(data)}\n\nDo you approve this loan? (yes/no)`,
      true
    );
  }

  protected result(
    ctx: RunContext,
    content: string,
    requiresApproval?: boolean
  ): OrchestrationResult {
    const body =
      ctx.trace.length > 0
        ? `Decision trace (${this.label}):\n${ctx.trace
            .map((line) => `  ${line}`)
            .join('\n')}\n\n${content}`
        : content;

    return {
      content: body,
      toolCalls: ctx.log,
      requiresApproval,
      orchestrator: this.id,
    };
  }
}

export class DeterministicOrchestrator extends PipelineOrchestrator {
  readonly id = 'deterministic' as const;
  readonly label = 'Deterministic driver';
}

const DECISION_RATIONALE: Record<string, (data: PipelineData) => string> = {
  DocumentExtractionAgent: () =>
    'application document not yet parsed; nothing can be scored before extraction',
  GeoVerificationAgent: (data) =>
    data.application.property
      ? `collateral includes ${data.application.property.property_id}, so territorial evidence must be on file before credit analysis`
      : 'no rural collateral declared; still call the adapter so non-applicability is evidence, not an assumption',
  UnderwritingAgent: (data) =>
    data.geoReport && data.geoReport.risk_flags.length > 0
      ? `territorial status ${data.geoReport.overall_status} with ${data.geoReport.risk_flags.length} finding(s); eligibility rules must absorb them`
      : 'territorial status is clean; eligibility rules apply on the financials alone',
  PricingAgent: () =>
    'eligibility and risk flags fix the pricing tier; terms must be shown before any human approval',
};

/**
 * Stands in for a real ADK root agent: async-trigger style reasoning over which
 * verification to call next, plus the judgment to re-check operator-supplied
 * evidence instead of trusting a stored report. Swap `plan`/`preflight` for
 * Gemini tool-calls and the rest of this class keeps working.
 */
export class AdkOrchestrator extends PipelineOrchestrator {
  readonly id = 'adk-sim' as const;
  readonly label = 'ADK-style reasoning driver';

  protected async plan(loanRequestId: string, ctx: RunContext) {
    ctx.trace.push(
      `woken for ${loanRequestId}; planning verification order from the current process state`
    );
  }

  protected async nextStep(
    data: PipelineData,
    completed: Set<StepName>,
    ctx: RunContext
  ): Promise<StepName | null> {
    const name = await super.nextStep(data, completed, ctx);
    if (name) {
      ctx.trace.push(`${name} <- ${DECISION_RATIONALE[name](data)}`);
    }
    return name;
  }

  protected async preflight(
    data: PipelineData,
    completed: Set<StepName>,
    ctx: RunContext
  ): Promise<OrchestrationResult | null> {
    const report = data.geoReport;
    if (
      !completed.has('GeoVerificationAgent') ||
      !report?.repair_evidence
    ) {
      return null;
    }

    const evidenceKeys = Object.keys(report.repair_evidence)
      .filter((k) => k !== 'reviewer')
      .join(', ');
    ctx.log.push({ tool: 'GeoVerificationAgent#recheck', status: 'running' });
    ctx.trace.push(
      `stored geo report carries operator evidence (${evidenceKeys || 'reviewer sign-off'}); re-verifying against the current CAR/DETER snapshot rather than trusting it`
    );

    const fresh = runGeoVerification(
      data.application,
      new Date().toISOString(),
      defaultSource,
      report.repair_evidence
    );
    const last = ctx.log[ctx.log.length - 1];

    if (fresh.overall_status === 'BLOCKED') {
      ProcessStateService.markStepForReview(
        data.loanRequestId,
        'GeoVerificationAgent',
        `Impedimento territorial/ambiental: ${fresh.blocking_findings.join('; ')}`,
        [],
        fresh
      );
      last.status = 'error';
      last.details = fresh;
      ctx.log.push({
        tool: 'UnderwritingAgent',
        status: 'halted',
        details: {
          error: `Cannot proceed to UnderwritingAgent: ${fresh.blocking_findings.join('; ')}`,
        },
      });
      return this.result(
        ctx,
        `I encountered an issue resuming your application.\nCannot proceed to UnderwritingAgent: re-verification of the repaired evidence is still BLOCKED.\n\n${summarizeGeoReport(fresh)}\n\nThe evidence on file does not clear the impeditve findings. Reference: ${data.loanRequestId}`
      );
    }

    const stored: GeoVerificationReport = {
      ...fresh,
      repair_evidence: report.repair_evidence,
    };
    ProcessStateService.updateStepStatus(
      data.loanRequestId,
      'GeoVerificationAgent',
      'completed',
      stored
    );
    data.geoReport = stored;
    last.status = 'success';
    last.details = fresh;
    ctx.trace.push(`re-verification returned ${fresh.overall_status}; continuing`);

    return null;
  }
}

/**
 * Real ADK root agent powered by Gemini tool-calling. Replaces the hardcoded
 * rationales in AdkOrchestrator with actual LLM reasoning. The LLM decides which
 * verification agent to invoke and why, but the agent executors themselves remain
 * deterministic — risk math, eligibility thresholds, and BLOCK rules are not
 * subject to LLM interpretation.
 *
 * Graceful degradation: if genAI is null (no API key) or the API call fails,
 * falls back to deterministic behavior.
 */
export class RealAdkOrchestrator extends PipelineOrchestrator {
  readonly id = 'adk' as const;
  readonly label = 'Real ADK driver (Gemini)';

  private conversation: any[] = [];
  private pendingToolCall: { name: string; args: any } | null = null;

  protected async plan(loanRequestId: string, ctx: RunContext) {
    if (!genAI) {
      ctx.trace.push(
        `GOOGLE_GENAI_API_KEY not set; falling back to deterministic mode for ${loanRequestId}`
      );
      return;
    }

    try {
      ctx.trace.push(
        `woken for ${loanRequestId}; calling Gemini to plan verification order`
      );

      this.conversation = [
        {
          role: 'user',
          parts: [
            {
              text: `You are a loan verification orchestrator. Process ${loanRequestId} by calling the available tools in the correct order. Start with document extraction, then geo-verification (if applicable), then underwriting, then pricing. Call each tool one at a time and wait for results before proceeding.`,
            },
          ],
        },
      ];

      const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: this.conversation,
        config: {
          tools: PIPELINE_TOOLS,
        },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates in Gemini response');
      }

      const parts = candidates[0].content?.parts || [];
      const toolCalls = parts.filter((p: any) => p.functionCall);

      if (toolCalls.length > 0 && toolCalls[0].functionCall?.name) {
        const first = toolCalls[0].functionCall;
        const toolName = first.name!;
        this.pendingToolCall = {
          name: toolName,
          args: first.args || {},
        };
        ctx.trace.push(`Gemini decided: call ${toolName} next`);
      }

      this.conversation.push({
        role: 'model',
        parts: parts.map((p: any) => ({
          text: p.text,
          functionCall: p.functionCall,
        })),
      });
    } catch (err: any) {
      ctx.trace.push(`Gemini API error: ${err.message}; falling back to deterministic`);
      this.pendingToolCall = null;
    }
  }

  protected async nextStep(
    data: PipelineData,
    completed: Set<StepName>,
    ctx: RunContext
  ): Promise<StepName | null> {
    if (!genAI || !this.pendingToolCall) {
      return super.nextStep(data, completed, ctx);
    }

    const toolName = this.pendingToolCall.name;
    const stepName = this.toolNameToStepName(toolName);

    if (!stepName || completed.has(stepName)) {
      return super.nextStep(data, completed, ctx);
    }

    this.pendingToolCall = null;
    return stepName;
  }

  protected async preflight(
    data: PipelineData,
    completed: Set<StepName>,
    ctx: RunContext
  ): Promise<OrchestrationResult | null> {
    const report = data.geoReport;
    if (!completed.has('GeoVerificationAgent') || !report?.repair_evidence) {
      return null;
    }

    if (!genAI) {
      return this.deterministicPreflight(data, completed, ctx);
    }

    try {
      ctx.log.push({ tool: 'GeoVerificationAgent#recheck', status: 'running' });
      ctx.trace.push(
        'stored geo report carries operator evidence; asking Gemini to judge whether to trust it'
      );

      const evidenceSummary = JSON.stringify(report.repair_evidence, null, 2);
      const reportSummary = summarizeGeoReport(report);

      const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `A loan application was BLOCKED on geo-verification. The operator has supplied repair evidence. Judge whether the evidence clears the blocking findings.

Original geo report:
${reportSummary}

Repair evidence:
${evidenceSummary}

Respond with JSON: {"trust": true/false, "reason": "explanation"}`,
              },
            ],
          },
        ],
      });

      const text =
        response.candidates?.[0]?.content?.parts?.[0]?.text || '{"trust": false}';
      const judgment = JSON.parse(text);

      if (!judgment.trust) {
        ctx.trace.push(`Gemini judged evidence insufficient: ${judgment.reason}`);
        ctx.log[ctx.log.length - 1].status = 'error';
        ctx.log[ctx.log.length - 1].details = { judgment };
        return this.result(
          ctx,
          `I encountered an issue resuming your application.\nCannot proceed to UnderwritingAgent: Gemini judged the repair evidence insufficient.\n\nReason: ${judgment.reason}\n\nReference: ${data.loanRequestId}`
        );
      }

      ctx.trace.push(`Gemini trusted the evidence: ${judgment.reason}`);
      ctx.log[ctx.log.length - 1].status = 'success';
      ctx.log[ctx.log.length - 1].details = { judgment };
      return null;
    } catch (err: any) {
      ctx.trace.push(`Gemini preflight error: ${err.message}; falling back to deterministic`);
      return this.deterministicPreflight(data, completed, ctx);
    }
  }

  private deterministicPreflight(
    data: PipelineData,
    completed: Set<StepName>,
    ctx: RunContext
  ): OrchestrationResult | null {
    const report = data.geoReport;
    if (!report?.repair_evidence) return null;

    const fresh = runGeoVerification(
      data.application,
      new Date().toISOString(),
      defaultSource,
      report.repair_evidence
    );

    if (fresh.overall_status === 'BLOCKED') {
      ProcessStateService.markStepForReview(
        data.loanRequestId,
        'GeoVerificationAgent',
        `Impedimento territorial/ambiental: ${fresh.blocking_findings.join('; ')}`,
        [],
        fresh
      );
      return this.result(
        ctx,
        `I encountered an issue resuming your application.\nCannot proceed to UnderwritingAgent: re-verification of the repaired evidence is still BLOCKED.\n\n${summarizeGeoReport(fresh)}\n\nThe evidence on file does not clear the impeditve findings. Reference: ${data.loanRequestId}`
      );
    }

    const stored: GeoVerificationReport = {
      ...fresh,
      repair_evidence: report.repair_evidence,
    };
    ProcessStateService.updateStepStatus(
      data.loanRequestId,
      'GeoVerificationAgent',
      'completed',
      stored
    );
    data.geoReport = stored;
    return null;
  }

  private toolNameToStepName(toolName: string): StepName | null {
    const mapping: Record<string, StepName> = {
      run_document_extraction: 'DocumentExtractionAgent',
      run_geo_verification: 'GeoVerificationAgent',
      run_underwriting: 'UnderwritingAgent',
      run_pricing: 'PricingAgent',
    };
    return mapping[toolName] || null;
  }
}

export const ORCHESTRATORS: Record<OrchestratorId, PipelineOrchestrator> = {
  deterministic: new DeterministicOrchestrator(),
  'adk-sim': new AdkOrchestrator(),
  adk: new RealAdkOrchestrator(),
};

export function orchestratorFor(kind?: unknown): PipelineOrchestrator {
  if (kind === 'adk') return ORCHESTRATORS.adk;
  if (kind === 'adk-sim') return ORCHESTRATORS['adk-sim'];
  return ORCHESTRATORS.deterministic;
}

export interface GeoRepairOutcome {
  status: 'still_blocked' | 'repaired';
  report: GeoVerificationReport;
  message: string;
}

/**
 * Operator evidence, not an orchestration decision: the driver still gets to
 * decide afterwards whether to trust the stored report (see AdkOrchestrator).
 */
export function applyGeoRepairEvidence(
  loanRequestId: string,
  repair: GeoRepairEvidence
): GeoRepairOutcome | null {
  const state = ProcessStateService.getProcessStatus(loanRequestId);
  if (!state) return null;

  const appData = state.steps.DocumentExtractionAgent.data as LoanApplicationData;
  const report = runGeoVerification(
    appData,
    new Date().toISOString(),
    defaultSource,
    repair
  );

  if (report.overall_status === 'BLOCKED') {
    ProcessStateService.markStepForReview(
      loanRequestId,
      'GeoVerificationAgent',
      `Impedimento territorial/ambiental: ${report.blocking_findings.join('; ')}`,
      [],
      report
    );
    return {
      status: 'still_blocked',
      report,
      message:
        'Geo verification still blocked after repair. Provide the missing evidence.',
    };
  }

  ProcessStateService.updateStepStatus(
    loanRequestId,
    'GeoVerificationAgent',
    'completed',
    { ...report, repair_evidence: repair }
  );

  const updated = ProcessStateService.getProcessStatus(loanRequestId);
  if (updated) {
    for (const issue of updated.issues) {
      if (issue.step === 'GeoVerificationAgent' && !issue.resolved) {
        issue.resolved = true;
        issue.resolved_at = new Date().toISOString();
        issue.resolved_by = repair.reviewer || 'Operator (Geo Evidence Repair)';
      }
    }
    updated.overall_status = 'in_progress';
  }

  return {
    status: 'repaired',
    report,
    message: `GeoVerificationAgent cleared for ${loanRequestId}. Workflow marked active and ready to resume.`,
  };
}
