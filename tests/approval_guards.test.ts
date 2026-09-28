/**
 * @module: Small Business Loan Agent
 * @file: tests/approval_guards.test.ts
 * @description: Regression suite for the approval-gate, intent-classification, internal-record and geo-evidence defects proven by offline probes on 2026-09-26
 * @author: Maíra Pontin
 * @created: 2026-09-28T10:15:00
 * @updated: 2026-09-28T10:56:05
 * @version: 1.0.0
 * @reviewer:
 * @ai_reviewer:
 * @reviewer_date:
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

delete process.env.GOOGLE_GENAI_API_KEY;

const { orchestratorFor, classifyIntent } = await import(
  '../src/services/orchestrator'
);
const { ProcessStateService, SAMPLE_APPLICATIONS } = await import(
  '../src/services/loanService'
);
const { runGeoVerification, defaultSource } = await import(
  '../src/services/geoVerificationService'
);

const baseApp = () => structuredClone(SAMPLE_APPLICATIONS['SBL-2025-02142'].data);

async function start(id: string, app: ReturnType<typeof baseApp>) {
  ProcessStateService.reset(id);
  return orchestratorFor('deterministic').start(id, structuredClone(app));
}

function underwritingOf(id: string) {
  return ProcessStateService.getProcessStatus(id)?.steps.UnderwritingAgent
    .data as any;
}

test('approve refuses a file the underwriting rules mark INELIGIBLE', async () => {
  const app = baseApp();
  app.years_in_business = '0';
  await start('SBL-2026-90001', app);
  assert.equal(underwritingOf('SBL-2026-90001').eligibility_status, 'INELIGIBLE');

  const result = await orchestratorFor('deterministic').approve('SBL-2026-90001');

  assert.match(result.content, /Cannot approve/);
  assert.notEqual(
    ProcessStateService.getProcessStatus('SBL-2026-90001')?.overall_status,
    'approved'
  );
});

test('approve refuses a previously rejected file', async () => {
  await start('SBL-2026-90002', baseApp());
  await orchestratorFor('deterministic').reject('SBL-2026-90002');

  const result = await orchestratorFor('deterministic').approve('SBL-2026-90002');

  assert.match(result.content, /Cannot approve/);
  assert.equal(
    ProcessStateService.getProcessStatus('SBL-2026-90002')?.overall_status,
    'rejected'
  );
});

test('a decision is final: approve cannot run twice', async () => {
  await start('SBL-2026-90003', baseApp());
  const first = await orchestratorFor('deterministic').approve('SBL-2026-90003');
  assert.match(first.content, /has been approved/);

  const second = await orchestratorFor('deterministic').approve('SBL-2026-90003');

  assert.match(second.content, /Cannot approve/);
});

test('a decision is final: reject cannot undo an approval', async () => {
  await start('SBL-2026-90004', baseApp());
  const first = await orchestratorFor('deterministic').approve('SBL-2026-90004');
  assert.match(first.content, /has been approved/);

  const result = await orchestratorFor('deterministic').reject('SBL-2026-90004');

  assert.match(result.content, /Cannot reject/);
  assert.equal(
    ProcessStateService.getProcessStatus('SBL-2026-90004')?.overall_status,
    'approved'
  );
});

test('a negated approval is classified as reject, an affirmation stays approve', () => {
  assert.equal(classifyIntent('not approved'), 'reject');
  assert.equal(classifyIntent("don't approve this loan"), 'reject');
  assert.equal(classifyIntent('do not approve'), 'reject');
  assert.equal(classifyIntent('approved'), 'approve');
  assert.equal(classifyIntent('yes'), 'approve');
});

test('an unknown loan id reports the missing internal record instead of borrowing another profile', async () => {
  await start('SBL-2026-77777', baseApp());
  const underwriting = underwritingOf('SBL-2026-77777');

  assert.equal(underwriting.internal_record_matched, false);
  assert.equal(underwriting.credit_score, undefined);
  assert.match(underwriting.verification_notes, /No internal record/);
});

test('an unverified deforestation exclusion report downgrades BLOCK to REVIEW, not PASS', () => {
  const app = structuredClone(SAMPLE_APPLICATIONS['SBL-2025-08123'].data);
  const report = runGeoVerification(
    app,
    '2026-09-28T12:00:00.000Z',
    defaultSource,
    {
      survey_confirmed_area_ha: 1180,
      legal_reserve_correction_pct: 80,
      deforestation_exclusion_ref: 'unverified-reference',
      reviewer: 'Operator (test)',
    }
  );
  const deforestation = report.checks.find((c) => c.id === 'deforestation');

  assert.equal(deforestation?.status, 'REVIEW');
  assert.equal(report.overall_status, 'REVIEW');
});
