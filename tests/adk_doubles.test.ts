/**
 * @module: Small Business Loan Agent
 * @file: tests/adk_doubles.test.ts
 * @description: Offline regression suite for the Gemini driver using SDK test doubles, with network access killed
 * @author: Maíra Pontin
 * @created: 2026-09-23
 * @updated: 2026-09-28T10:56:05
 * @version: 1.1.0
 * @reviewer:
 * @ai_reviewer:
 * @reviewer_date:
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// genai.ts reads the key at evaluation time. A placeholder makes the singleton
// non-null so the adk driver takes its Gemini branch; generateContent is then
// replaced per test below, and fetch is killed so no call can escape to the API.
process.env.GOOGLE_GENAI_API_KEY = 'offline-test-double';

globalThis.fetch = (async () => {
  throw new Error('network access is disabled in the offline Gemini suite');
}) as typeof fetch;

const { genAI, rotateApiKey, getApiKeyStatus } = await import(
  '../src/services/genai'
);
const { orchestratorFor, applyGeoRepairEvidence } = await import(
  '../src/services/orchestrator'
);
const { ProcessStateService, SAMPLE_APPLICATIONS } = await import(
  '../src/services/loanService'
);
const { clearCache } = await import('../src/services/responseCache');

const MODEL = 'gemini-2.0-flash';
const CLEAN = 'SBL-2025-02142';
const AGRO = 'SBL-2025-07788';
const BLOCKED = 'SBL-2025-08123';

const BUSINESS_BY_LOAN: Record<string, string> = {
  [CLEAN]: SAMPLE_APPLICATIONS[CLEAN].data.business_name,
  [AGRO]: 'Fazenda Santa Clara Agropastoril LTDA',
  [BLOCKED]: 'Agropecuária Rio Verde S.A.',
};

interface Call {
  model: string;
  contents: unknown;
  toolsConfigured: boolean;
}

function toolCall(name: string) {
  return { parts: [{ functionCall: { name, args: {} } }] };
}

function noToolCall() {
  return { parts: [{ text: 'No further verification is needed.' }] };
}

/** Replaces generateContent with a scripted turn-taking double; records calls. */
function useGemini(script: (object | Error)[]): Call[] {
  const calls: Call[] = [];
  let turn = 0;

  (genAI as any).models.generateContent = async (request: any) => {
    calls.push({
      model: request.model,
      contents: structuredClone(request.contents),
      toolsConfigured: Boolean(request.config?.tools),
    });

    const step = script[Math.min(turn++, script.length - 1)];
    if (step instanceof Error) throw step;
    return { candidates: [{ content: { parts: (step as any).parts ?? [] } }] };
  };

  return calls;
}

async function startAdk(loanRequestId: string) {
  clearCache();
  ProcessStateService.reset(loanRequestId);
  const application = structuredClone(SAMPLE_APPLICATIONS[loanRequestId].data);
  return orchestratorFor('adk').start(loanRequestId, application);
}

function statusOf(loanRequestId: string, step: string) {
  const state = ProcessStateService.getProcessStatus(loanRequestId);
  return state?.steps[step as keyof typeof state.steps]?.status;
}

test('the adk driver is instantiated per request, the stateless ones are shared', () => {
  assert.notEqual(orchestratorFor('adk'), orchestratorFor('adk'));
  assert.equal(orchestratorFor('deterministic'), orchestratorFor('deterministic'));
  assert.equal(orchestratorFor('adk-sim'), orchestratorFor('adk-sim'));
});

test('a Gemini pick that breaks pipeline order is refused, not executed', async () => {
  const calls = useGemini([
    toolCall('run_underwriting'),
    toolCall('run_pricing'),
    toolCall('run_geo_verification'),
  ]);

  const result = await startAdk(BLOCKED);

  assert.equal(result.orchestrator, 'adk');
  assert.equal(statusOf(BLOCKED, 'UnderwritingAgent'), 'not_started');
  assert.equal(statusOf(BLOCKED, 'PricingAgent'), 'not_started');
  assert.equal(statusOf(BLOCKED, 'GeoVerificationAgent'), 'pending_approval');
  assert.match(result.content, /before its prerequisites were met/);
  assert.ok(
    calls.every((call) => call.model === MODEL && call.toolsConfigured),
    'every planning call must offer the pipeline tools'
  );
});

test('a pricing-first model never crashes the run and still prices last', async () => {
  useGemini([toolCall('run_pricing'), noToolCall()]);

  const result = await startAdk(CLEAN);

  assert.equal(result.requiresApproval, true);
  assert.equal(statusOf(CLEAN, 'PricingAgent'), 'completed');
  assert.match(result.content, /Tier 1 - Low Risk/);
});

test('completed steps are reported back to Gemini as function responses', async () => {
  const calls = useGemini([
    toolCall('run_document_extraction'),
    toolCall('run_geo_verification'),
    toolCall('run_underwriting'),
    toolCall('run_pricing'),
  ]);

  await startAdk(CLEAN);

  const afterDocument = JSON.stringify(calls[1].contents);
  assert.match(afterDocument, /functionResponse/);
  assert.match(afterDocument, /run_document_extraction/);
  assert.match(afterDocument, /(?:Cymbal|Yataí) (?:Coffee Roasters|Finance)/);
  assert.match(JSON.stringify(calls[3].contents), /run_underwriting/);
});

test('one failed Gemini call latches the driver off the API for the whole run', async () => {
  const calls = useGemini([new Error('429 RESOURCE_EXHAUSTED')]);

  const result = await startAdk(CLEAN);

  assert.equal(calls.length, 1, 'no Gemini call may follow the first failure');
  assert.match(result.content, /Gemini API error: 429 RESOURCE_EXHAUSTED/);
  assert.equal(result.requiresApproval, true);
  assert.equal(statusOf(CLEAN, 'PricingAgent'), 'completed');
});

test('concurrent adk runs never share a Gemini conversation', async () => {
  const calls = useGemini([
    toolCall('run_document_extraction'),
    toolCall('run_geo_verification'),
    toolCall('run_underwriting'),
    toolCall('run_pricing'),
    noToolCall(),
  ]);

  const [clean, agro] = await Promise.all([startAdk(CLEAN), startAdk(AGRO)]);

  assert.equal(clean.requiresApproval, true);
  assert.equal(agro.requiresApproval, true);

  for (const call of calls) {
    const json = JSON.stringify(call.contents);
    const loans = Object.keys(BUSINESS_BY_LOAN).filter((id) => json.includes(id));
    assert.ok(loans.length <= 1, `one conversation referenced ${loans.join(', ')}`);

    const owner = Object.values(BUSINESS_BY_LOAN).find((name) => json.includes(name));
    if (owner && loans.length === 1) {
      assert.equal(owner, BUSINESS_BY_LOAN[loans[0]], 'step data leaked across loans');
    }
  }

  const ids = calls.flatMap((call) =>
    Object.keys(BUSINESS_BY_LOAN).filter((id) =>
      JSON.stringify(call.contents).includes(id)
    )
  );
  assert.ok(ids.includes(CLEAN) && ids.includes(AGRO), 'both loans must be planned');
});

test('Gemini trusting repair evidence does not skip the fresh geo re-verification', async () => {
  useGemini([
    toolCall('run_document_extraction'),
    toolCall('run_geo_verification'),
    noToolCall(),
    { parts: [{ text: '{"trust": true, "reason": "operator laudo accepted"}' }] },
    noToolCall(),
  ]);

  clearCache();
  ProcessStateService.reset(BLOCKED);
  const application = structuredClone(SAMPLE_APPLICATIONS[BLOCKED].data);
  const halted = await orchestratorFor('adk').start(BLOCKED, application);
  assert.match(halted.content, /geo-environmental verification is BLOCKED/);

  const repaired = applyGeoRepairEvidence(BLOCKED, {
    survey_confirmed_area_ha: 1180,
    deforestation_exclusion_ref: 'unverified-reference',
    legal_reserve_correction_pct: 80,
    reviewer: 'Operator (test)',
  });
  assert.equal(repaired?.status, 'repaired');

  // Drop the response cache so the resume's plan() consumes its own scripted
  // turn — otherwise the cached plan params shift every response one slot and
  // preflight would reach the JSON-parse catch instead of the trust judgment.
  clearCache();
  const resumed = await orchestratorFor('adk').resume(BLOCKED);

  assert.match(
    resumed.content,
    /Gemini trusted the evidence/,
    'the trust branch must be the path under test'
  );
  assert.match(
    resumed.content,
    /re-verification returned/,
    'a Gemini trust judgment may accompany the deterministic re-check, never replace it'
  );
  assert.equal(resumed.requiresApproval, true);
});

test('Phase 6.4 secret rotation: rotates key at runtime without process restart', () => {
  const initial = getApiKeyStatus();
  assert.equal(initial.configured, true);

  const res = rotateApiKey('rotated-test-key-9988');
  assert.equal(res.success, true);
  assert.match(res.fingerprint!, /^rota\.\.\.9988$/);
  assert.equal(process.env.GOOGLE_GENAI_API_KEY, 'rotated-test-key-9988');

  const updated = getApiKeyStatus();
  assert.equal(updated.configured, true);
  assert.equal(updated.fingerprint, 'rota...9988');

  // Rotate back to original test double
  rotateApiKey('offline-test-double');
});

test('Caso 2 degradação graciosa: alerts user and exposes methodology on API failure', async () => {
  const application = structuredClone(SAMPLE_APPLICATIONS[CLEAN].data);
  const result = await orchestratorFor('adk').start(CLEAN, application);

  assert.equal(result.degraded, true);
  assert.ok(result.degradationReason);
  assert.match(result.degradationReason, /contingência determinística/);
  assert.ok(result.methodology);
  assert.equal(result.methodology.isDegraded, true);
  assert.match(result.content, /AVISO DE DEGRADAÇÃO GRACIOSA/);
});


