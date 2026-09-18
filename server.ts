import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  ELIGIBILITY_RULES,
  MOCK_INTERNAL_RECORDS,
  ProcessStateService,
  SAMPLE_APPLICATIONS,
  calculateLoanPricing,
  determineRiskTier,
  evaluateUnderwriting,
  finalizeLoanDecision,
  parseDollarAmount,
} from './src/services/loanService';
import { LoanApplicationData, PricingResult, UnderwritingReport } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', runtime: 'node', service: 'small-business-loan-agent' });
  });

  app.get('/api/samples', (req: Request, res: Response) => {
    res.json({ samples: SAMPLE_APPLICATIONS });
  });

  app.get('/api/rules', (req: Request, res: Response) => {
    res.json({ rules: ELIGIBILITY_RULES, internal_records: MOCK_INTERNAL_RECORDS });
  });

  app.get('/api/processes', (req: Request, res: Response) => {
    const processes = ProcessStateService.getAll();
    res.json({ processes });
  });

  app.get('/api/processes/:id', (req: Request, res: Response) => {
    const process = ProcessStateService.getProcessStatus(req.params.id);
    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }
    res.json({ process });
  });

  app.post('/api/processes/:id/reset', (req: Request, res: Response) => {
    ProcessStateService.reset(req.params.id);
    res.json({ status: 'reset', loan_request_id: req.params.id });
  });

  app.post('/api/processes/:id/repair', (req: Request, res: Response) => {
    const { step_name, updated_fields } = req.body;
    try {
      const updatedProcess = ProcessStateService.repairStepData(
        req.params.id,
        step_name || 'DocumentExtractionAgent',
        updated_fields || {}
      );
      res.json({
        status: 'repaired',
        process: updatedProcess,
        message: `Successfully repaired ${step_name} for ${req.params.id}. Workflow marked active and ready to resume.`,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Agent Chat / Multi-Agent Orchestrator
  app.post('/api/agent/chat', async (req: Request, res: Response) => {
    const { message, activeLoanId } = req.body;
    const text = (message || '').trim();
    const lower = text.toLowerCase();

    // Extract or infer loan_request_id
    const idMatch = text.match(/SBL-\d{4}-\d{5}/i);
    const loanRequestId = idMatch ? idMatch[0].toUpperCase() : activeLoanId || 'SBL-2025-02142';

    const toolCallsLog: Array<{ tool: string; status: 'running' | 'success' | 'error' | 'halted'; details?: any }> = [];

    // Check existing state
    let state = ProcessStateService.getProcessStatus(loanRequestId);

    // Scenario 1: Human Approval Response
    if (lower === 'yes' || lower === 'approve' || lower.includes('approve this loan') || lower.includes('approved')) {
      if (!state || !state.steps.PricingAgent.data) {
        return res.json({
          role: 'agent',
          loanRequestId,
          content: `Cannot finalize loan decision for ${loanRequestId}: Pricing analysis has not been completed yet. Please process the loan application first.`,
          toolCalls: [],
        });
      }

      toolCallsLog.push({ tool: 'check_process_status', status: 'success', details: { overall_status: state.overall_status } });

      // Run LoanDecisionAgent
      toolCallsLog.push({ tool: 'LoanDecisionAgent', status: 'running' });
      const appData = state.steps.DocumentExtractionAgent.data as LoanApplicationData;
      const pricingData = state.steps.PricingAgent.data as PricingResult;
      const decisionResult = finalizeLoanDecision(appData, pricingData, loanRequestId);

      ProcessStateService.updateStepStatus(loanRequestId, 'LoanDecisionAgent', 'completed', decisionResult);
      toolCallsLog[toolCallsLog.length - 1].status = 'success';
      toolCallsLog[toolCallsLog.length - 1].details = decisionResult;

      const finalResponse = `Loan ${loanRequestId} has been approved.\nDecision letter ${decisionResult.decision_letter_id} has been generated.\n\nApproved terms:\n- Amount: ${decisionResult.approved_amount}\n- Interest Rate: ${decisionResult.approved_rate}\n- Term: ${decisionResult.approved_term}\n\nConditions:\n${decisionResult.conditions.map((c) => `- ${c}`).join('\n')}`;

      return res.json({
        role: 'agent',
        loanRequestId,
        content: finalResponse,
        toolCalls: toolCallsLog,
        process: ProcessStateService.getProcessStatus(loanRequestId),
      });
    }

    if (lower === 'no' || lower === 'reject' || lower.includes('reject loan') || lower.includes('rejected')) {
      if (state) {
        ProcessStateService.updateStepStatus(loanRequestId, 'LoanDecisionAgent', 'rejected', { decision: 'REJECTED' });
      }
      return res.json({
        role: 'agent',
        loanRequestId,
        content: `Application ${loanRequestId} will not proceed. The loan has been declined per your decision.`,
        toolCalls: [],
        process: ProcessStateService.getProcessStatus(loanRequestId),
      });
    }

    // Scenario 2: Resume workflow after repair
    const isResume = lower.includes('resume') || lower.includes('continue');

    if (isResume) {
      if (!state) {
        return res.json({
          role: 'agent',
          loanRequestId,
          content: `No active workflow found for ${loanRequestId} to resume. Please initiate processing first.`,
          toolCalls: [],
        });
      }

      toolCallsLog.push({ tool: 'check_process_status', status: 'success', details: { action: 'resume', state } });

      const { nextStep, completedStepsData } = ProcessStateService.findResumePoint(state);

      if (!nextStep) {
        return res.json({
          role: 'agent',
          loanRequestId,
          content: `Process ${loanRequestId} is already complete! All steps have been executed.`,
          toolCalls: toolCallsLog,
          process: state,
        });
      }

      // Check halt condition
      const halt = ProcessStateService.determineHaltAction(nextStep, state.overall_status, state.issues);
      if (halt) {
        toolCallsLog.push({ tool: nextStep, status: 'halted', details: halt });
        return res.json({
          role: 'agent',
          loanRequestId,
          content: `I encountered an issue resuming your application.\n${halt.error}\n\nPlease repair the pending data in the Firestore Process State console before resuming.`,
          toolCalls: toolCallsLog,
          process: state,
        });
      }

      // Resume pipeline from nextStep
      const appData = (completedStepsData.DocumentExtractionAgent ||
        state.steps.DocumentExtractionAgent.data ||
        SAMPLE_APPLICATIONS[loanRequestId]?.data ||
        SAMPLE_APPLICATIONS['SBL-2025-02142'].data) as LoanApplicationData;

      let underwritingReport = state.steps.UnderwritingAgent.data as UnderwritingReport;
      if (!underwritingReport || nextStep === 'UnderwritingAgent') {
        toolCallsLog.push({ tool: 'UnderwritingAgent', status: 'running' });
        underwritingReport = evaluateUnderwriting(appData, loanRequestId);
        ProcessStateService.updateStepStatus(loanRequestId, 'UnderwritingAgent', 'completed', underwritingReport);
        toolCallsLog[toolCallsLog.length - 1].status = 'success';
        toolCallsLog[toolCallsLog.length - 1].details = underwritingReport;
      }

      let pricingResult = state.steps.PricingAgent.data as PricingResult;
      if (!pricingResult || nextStep === 'PricingAgent' || nextStep === 'UnderwritingAgent') {
        toolCallsLog.push({ tool: 'PricingAgent', status: 'running' });
        pricingResult = calculateLoanPricing(appData, underwritingReport, loanRequestId);
        ProcessStateService.updateStepStatus(loanRequestId, 'PricingAgent', 'completed', pricingResult);
        toolCallsLog[toolCallsLog.length - 1].status = 'success';
        toolCallsLog[toolCallsLog.length - 1].details = pricingResult;
      }

      const summaryContent = `Resume completed successfully!\n\nLoan Application Summary:\n- Business: ${appData.business_name}\n- Owner: ${appData.owner_name}\n- Loan Amount: ${appData.loan_amount_requested}\n- Annual Revenue: ${appData.annual_revenue}\n- Eligibility: ${underwritingReport.eligibility_status}\n- Risk Tier: ${pricingResult.risk_tier}\n- Interest Rate: ${pricingResult.interest_rate}\n- Monthly Payment: ${pricingResult.monthly_payment}\n- Total Interest: ${pricingResult.total_interest}\n\nDo you approve this loan? (yes/no)`;

      return res.json({
        role: 'agent',
        loanRequestId,
        content: summaryContent,
        requiresApproval: true,
        toolCalls: toolCallsLog,
        process: ProcessStateService.getProcessStatus(loanRequestId),
      });
    }

    // Scenario 3: Process loan application (standard flow)
    // Step 1: check_process_status
    state = ProcessStateService.createProcess(loanRequestId);
    toolCallsLog.push({
      tool: 'check_process_status',
      status: 'success',
      details: { status: 'initialized', action: 'proceed_to_analysis', message: `New process initialized for ${loanRequestId}` },
    });

    // Determine document data
    const sample = SAMPLE_APPLICATIONS[loanRequestId] || SAMPLE_APPLICATIONS['SBL-2025-02142'];
    const docData: LoanApplicationData = JSON.parse(JSON.stringify(sample.data));

    // If user prompt asks for incomplete / 00391, ensure missing loan_amount
    if (loanRequestId === 'SBL-2025-00391' || lower.includes('incomplete')) {
      docData.loan_amount_requested = '';
    }

    // Step 2: DocumentExtractionAgent
    toolCallsLog.push({ tool: 'DocumentExtractionAgent', status: 'running' });

    // Validate critical fields
    const criticalFields = ['business_name', 'owner_name', 'loan_amount_requested', 'annual_revenue'];
    const missing = criticalFields.filter((f) => !docData[f as keyof LoanApplicationData] || String(docData[f as keyof LoanApplicationData]).trim() === '');

    if (missing.length > 0) {
      // Missing fields -> Halt with Pending Approval issue!
      const issueDesc = `Missing ${missing.length} critical field(s): ${missing.join(', ')}`;
      ProcessStateService.markStepForReview(loanRequestId, 'DocumentExtractionAgent', issueDesc, missing, docData);
      toolCallsLog[toolCallsLog.length - 1].status = 'error';
      toolCallsLog[toolCallsLog.length - 1].details = { error: issueDesc, missing_fields: missing };

      // Before-tool callback halts UnderwritingAgent
      const halt = ProcessStateService.determineHaltAction(
        'UnderwritingAgent',
        'pending_approval',
        ProcessStateService.getProcessStatus(loanRequestId)?.issues || []
      );
      toolCallsLog.push({ tool: 'UnderwritingAgent', status: 'halted', details: halt });

      const haltResponse = `I encountered an error while processing your application.\nCannot proceed to UnderwritingAgent: Pending approval\n- Missing ${missing.length} critical field(s): ${missing.join(', ')}\n\nPlease provide a complete document or update the application with the required field before we can proceed.\nThe workflow has been stopped.\n\nReference: ${loanRequestId}`;

      return res.json({
        role: 'agent',
        loanRequestId,
        content: haltResponse,
        toolCalls: toolCallsLog,
        process: ProcessStateService.getProcessStatus(loanRequestId),
      });
    }

    // Document extraction succeeded
    ProcessStateService.updateStepStatus(loanRequestId, 'DocumentExtractionAgent', 'completed', docData);
    toolCallsLog[toolCallsLog.length - 1].status = 'success';
    toolCallsLog[toolCallsLog.length - 1].details = docData;

    // Step 3: UnderwritingAgent
    toolCallsLog.push({ tool: 'UnderwritingAgent', status: 'running' });
    const underwritingReport = evaluateUnderwriting(docData, loanRequestId);
    ProcessStateService.updateStepStatus(loanRequestId, 'UnderwritingAgent', 'completed', underwritingReport);
    toolCallsLog[toolCallsLog.length - 1].status = 'success';
    toolCallsLog[toolCallsLog.length - 1].details = underwritingReport;

    // Step 4: PricingAgent
    toolCallsLog.push({ tool: 'PricingAgent', status: 'running' });
    const pricingResult = calculateLoanPricing(docData, underwritingReport, loanRequestId);
    ProcessStateService.updateStepStatus(loanRequestId, 'PricingAgent', 'completed', pricingResult);
    toolCallsLog[toolCallsLog.length - 1].status = 'success';
    toolCallsLog[toolCallsLog.length - 1].details = pricingResult;

    // Human in the Loop Gate presentation
    const summaryResponse = `Loan Application Summary:\n- Business: ${docData.business_name}\n- Owner: ${docData.owner_name}\n- Loan Amount: ${docData.loan_amount_requested}\n- Annual Revenue: ${docData.annual_revenue}\n- Eligibility: ${underwritingReport.eligibility_status}\n- Risk Tier: ${pricingResult.risk_tier}\n- Interest Rate: ${pricingResult.interest_rate}\n- Monthly Payment: ${pricingResult.monthly_payment}\n- Total Interest: ${pricingResult.total_interest}\n\nDo you approve this loan? (yes/no)`;

    return res.json({
      role: 'agent',
      loanRequestId,
      content: summaryResponse,
      requiresApproval: true,
      toolCalls: toolCallsLog,
      process: ProcessStateService.getProcessStatus(loanRequestId),
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI Studio] Small Business Loan Agent server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
