/**
 * @module: Small Business Loan Agent
 * @file: tests/orchestrator.test.ts
 * @description: No-key regression suite for the three orchestrator drivers — fallback, state parity, halt and geo-repair flows
 * @author: Maíra Pontin
 * @created: 2026-09-23
 * @updated: 260923_155446
 * @version: 1.0.0
 * @reviewer:
 * @ai_reviewer:
 * @reviewer_date:
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// The driver reads the key when genai.ts is first evaluated, so the modules
// under test are imported dynamically, after the key is guaranteed absent.
delete process.env.GOOGLE_GENAI_API_KEY;

const { orchestratorFor, applyGeoRepairEvidence } = await import(
  '../src/services/orchestrator'
);
const { ProcessStateService, SAMPLE_APPLICATIONS } = await import(
  '../src/services/loanService'
);
const { genAI } = await import('../src/services/genai');

const SAMPLES = Object.keys(SAMPLE_APPLICATIONS);
const FULL_GEO_REPAIR = {
  survey_confirmed_area_ha: 1180,
  deforestation_exclusion_ref: 'LAUDO-2026-077',
  legal_reserve_correction_pct: 80,
  reviewer: 'Operator (test)',
};

async function run(driver: string, loanRequestId: string) {
  ProcessStateService.reset(loanRequestId);
  const application = structuredClone(SAMPLE_APPLICATIONS[loanRequestId].data);
  return orchestratorFor(driver).start(loanRequestId, application);
}

/** Step statuses, current step and issue log — the parts parity must match. */
function stateShape(loanRequestId: string) {
  const state = ProcessStateService.getProcessStatus(loanRequestId);
  if (!state) return null;
  return {
    overall_status: state.overall_status,
    current_step: state.current_step,
    steps: Object.fromEntries(
      Object.entries(state.steps).map(([name, step]) => [name, step.status])
    ),
    issues: state.issues.map((i) => `${i.step}:${i.description}:${i.resolved}`),
  };
}

function payloadShape(loanRequestId: string) {
  const state = ProcessStateService.getProcessStatus(loanRequestId);
  if (!state) return null;
  const json = JSON.stringify(
    Object.fromEntries(
      Object.entries(state.steps).map(([name, step]) => [name, step.data])
    )
  );
  return json.replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, '<timestamp>');
}

test('genAI singleton is null without an API key', () => {
  assert.equal(genAI, null);
});

test('adk driver degrades to deterministic and says so in the trace', async () => {
  const result = await run('adk', 'SBL-2025-02142');
  assert.match(result.content, /GOOGLE_GENAI_API_KEY not set/);
  assert.match(result.content, /Do you approve this loan\?/);
  assert.equal(result.requiresApproval, true);
  assert.equal(result.orchestrator, 'adk');
});

for (const sample of SAMPLES) {
  test(`all three drivers reach the same state on ${sample}`, async () => {
    const baseline = await run('deterministic', sample);
    const baselineState = stateShape(sample);
    const baselinePayload = payloadShape(sample);

    for (const driver of ['adk-sim', 'adk']) {
      const result = await run(driver, sample);
      assert.deepEqual(
        { driver, state: stateShape(sample) },
        { driver, state: baselineState },
        `${driver} diverged from deterministic on ${sample}`
      );
      assert.equal(payloadShape(sample), baselinePayload);
      assert.equal(
        result.content.replace(/Decision trace[\s\S]*?\n\n/, ''),
        baseline.content,
        `${driver} narrated a different outcome on ${sample}`
      );
    }
  });
}

test('incomplete application halts at DocumentExtractionAgent', async () => {
  await run('deterministic', 'SBL-2025-00391');
  const state = ProcessStateService.getProcessStatus('SBL-2025-00391');

  assert.equal(state?.steps.DocumentExtractionAgent.status, 'pending_approval');
  assert.equal(state?.steps.GeoVerificationAgent.status, 'not_started');
  assert.match(state?.issues[0].description ?? '', /loan_amount_requested/);
});

test('blocked property stops the pipeline before any credit analysis', async () => {
  await run('deterministic', 'SBL-2025-08123');
  const state = ProcessStateService.getProcessStatus('SBL-2025-08123');

  assert.equal(state?.steps.GeoVerificationAgent.status, 'pending_approval');
  assert.equal(state?.steps.UnderwritingAgent.status, 'not_started');
  assert.equal(state?.steps.PricingAgent.status, 'not_started');
});

test('partial geo repair keeps the block; full repair lets resume reach approval', async () => {
  await run('deterministic', 'SBL-2025-08123');

  const partial = applyGeoRepairEvidence('SBL-2025-08123', {
    survey_confirmed_area_ha: 1180,
    reviewer: 'Operator (test)',
  });
  assert.equal(partial?.status, 'still_blocked');

  const full = applyGeoRepairEvidence('SBL-2025-08123', FULL_GEO_REPAIR);
  assert.equal(full?.status, 'repaired');

  const resumed = await orchestratorFor('deterministic').resume('SBL-2025-08123');
  assert.equal(resumed.requiresApproval, true);

  const state = ProcessStateService.getProcessStatus('SBL-2025-08123');
  assert.equal(state?.steps.UnderwritingAgent.status, 'completed');
  assert.equal(state?.steps.PricingAgent.status, 'completed');
  assert.match(resumed.content, /Tier 3 - Elevated Risk/);
  assert.ok(
    state?.issues.every((i) => i.resolved),
    'resolved evidence must close the raised issues'
  );
});

test('approval gate stays closed until a human says yes', async () => {
  await run('deterministic', 'SBL-2025-02142');
  const approved = await orchestratorFor('deterministic').approve('SBL-2025-02142');

  assert.match(approved.content, /has been approved/);
  assert.equal(
    ProcessStateService.getProcessStatus('SBL-2025-02142')?.overall_status,
    'approved'
  );
});
