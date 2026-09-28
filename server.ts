/**
 * @module: Small Business Loan Agent
 * @file: server.ts
 * @description: Express server, API routes, PORT config
 * @author: Maíra Pontin
 * @created: 2025-09-21
 * @updated: 260924_012808
 * @version: 1.1.0
 * @reviewer:
 * @ai_reviewer:
 * @reviewer_date:
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { genAI } from './src/services/genai';
import { getRateLimitStats } from './src/services/rateLimiter';
import { getCacheStats } from './src/services/responseCache';
import { getMonitorStats } from './src/services/monitor';
import {
  ELIGIBILITY_RULES,
  MOCK_INTERNAL_RECORDS,
  ProcessStateService,
  SAMPLE_APPLICATIONS,
} from './src/services/loanService';
import {
  applyGeoRepairEvidence,
  classifyIntent,
  orchestratorFor,
} from './src/services/orchestrator';
import { GeoRepairEvidence, LoanApplicationData } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Which document the demo agent "received". Unknown ids fall back to the
// complete sample so a typo in chat never dead-ends the walkthrough.
function resolveApplication(
  loanRequestId: string,
  lowerText: string
): LoanApplicationData {
  const sample =
    SAMPLE_APPLICATIONS[loanRequestId] || SAMPLE_APPLICATIONS['SBL-2025-02142'];
  const data: LoanApplicationData = JSON.parse(JSON.stringify(sample.data));

  if (loanRequestId === 'SBL-2025-00391' || lowerText.includes('incomplete')) {
    data.loan_amount_requested = '';
  }

  return data;
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      runtime: 'node',
      service: 'small-business-loan-agent',
      genai: genAI ? 'configured' : 'missing-api-key',
      rateLimit: getRateLimitStats(),
      cache: getCacheStats(),
      monitor: getMonitorStats(),
    });
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
    const { step_name, updated_fields, evidence } = req.body;

    try {
      if (step_name === 'GeoVerificationAgent') {
        const repair: GeoRepairEvidence = evidence || updated_fields || {};
        const outcome = applyGeoRepairEvidence(req.params.id, repair);
        if (!outcome) {
          return res.status(404).json({ error: 'Process not found' });
        }

        return res.json({
          ...outcome,
          process: ProcessStateService.getProcessStatus(req.params.id),
        });
      }

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

  // Agent Chat — the HTTP layer only routes intent to the selected driver.
  // Every step decision, halt and approval string lives in services/orchestrator.
  app.post('/api/agent/chat', async (req: Request, res: Response) => {
    const { message, activeLoanId, orchestrator: requested } = req.body;
    const text = (message || '').trim();
    const lower = text.toLowerCase();

    const idMatch = text.match(/SBL-\d{4}-\d{5}/i);
    const loanRequestId =
      idMatch ? idMatch[0].toUpperCase() : activeLoanId || 'SBL-2025-02142';

    try {
      const orchestrator = orchestratorFor(requested);
      const intent = classifyIntent(lower);
      const result = await (intent === 'approve'
        ? orchestrator.approve(loanRequestId)
        : intent === 'reject'
        ? orchestrator.reject(loanRequestId)
        : intent === 'resume'
        ? orchestrator.resume(loanRequestId)
        : orchestrator.start(
            loanRequestId,
            resolveApplication(loanRequestId, lower)
          ));

      res.json({
        role: 'agent',
        loanRequestId,
        ...result,
        process: ProcessStateService.getProcessStatus(loanRequestId),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message, loanRequestId });
    }
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
