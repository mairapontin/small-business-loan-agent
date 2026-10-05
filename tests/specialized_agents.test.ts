/**
 * @module: Small Business Loan Agent
 * @file: tests/specialized_agents.test.ts
 * @description: Offline tests for the 5 specialized agents (Data Collection, Compliance, Agro Risk, Financial Analysis, Opinion)
 * @author: Maíra Pontin
 * @created: 2026-10-02
 * @version: 1.0.0
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runDataCollection } from '../src/services/dataCollectionService';
import { runComplianceAnalysis } from '../src/services/complianceService';
import { runAgroRiskAnalysis } from '../src/services/agroRiskService';
import { runFinancialAnalysis } from '../src/services/financialAnalysisService';
import { runOpinionConsolidation } from '../src/services/opinionService';
import {
  ProcessStateService,
  SAMPLE_APPLICATIONS,
} from '../src/services/loanService';
import { orchestratorFor } from '../src/services/orchestrator';

test('Agente de Coleta de Dados: gathers SCR, Open Finance, production and commodity prices', () => {
  const loanId = 'SBL-2025-07788';
  const app = SAMPLE_APPLICATIONS[loanId].data;
  const snapshot = runDataCollection(loanId, app);

  assert.equal(snapshot.loan_request_id, loanId);
  // SCR Bacen
  assert.ok(snapshot.scr.total_exposure_brl > 0, 'SCR exposure should be present');
  assert.ok(snapshot.scr.sfn_institutions_count >= 1);
  assert.equal(snapshot.scr.standing, 'REGULAR');
  // Open Finance
  assert.ok(snapshot.open_finance.verified_average_monthly_inflow_brl > 0);
  assert.ok(snapshot.open_finance.revenue_reconciliation_pct > 90);
  // Production Agro
  assert.equal(snapshot.production.crop, 'Soja');
  assert.ok(snapshot.production.average_yield_sc_ha > 50);
  // Commodity Prices
  assert.ok(snapshot.commodities.cepea_esalq_spot_brl > 100);
  assert.ok(snapshot.commodities.cbot_future_usd_bushel > 0);
});

test('Agente de Compliance: flags blocked findings and passes compliant files', () => {
  const cleanId = 'SBL-2025-02142';
  const cleanApp = SAMPLE_APPLICATIONS[cleanId].data;
  const cleanReport = runComplianceAnalysis(cleanId, cleanApp);
  assert.equal(cleanReport.overall_status, 'CLEARED');
  assert.equal(cleanReport.internal_policies_cleared, true);

  const blockedId = 'SBL-2025-08123';
  const blockedApp = SAMPLE_APPLICATIONS[blockedId].data;
  const blockedReport = runComplianceAnalysis(blockedId, blockedApp, {
    property_id: 'CAR-MT-9902',
    decision_time: new Date().toISOString(),
    overall_status: 'BLOCKED',
    checks: [],
    risk_flags: [],
    blocking_findings: ['DETER deforestation alert inside property boundary'],
    notes: 'Blocked',
  });
  assert.equal(blockedReport.overall_status, 'BLOCKED');
  assert.ok(blockedReport.blocking_findings.length > 0);
});

test('Agente de Análise de Risco Agro: evaluates climate, NDVI, yield loss and hedge exposure', () => {
  const loanId = 'SBL-2025-07788';
  const app = SAMPLE_APPLICATIONS[loanId].data;
  const dataColl = runDataCollection(loanId, app);
  const agro = runAgroRiskAnalysis(loanId, app, dataColl);

  assert.equal(agro.overall_risk_level, 'LOW');
  assert.ok(agro.climate.water_balance_index > 0.7);
  assert.equal(agro.climate.water_balance_status, 'FAVORABLE');
  assert.ok(agro.climate.ndvi_vegetative_vigor_index > 0.7);
  assert.ok(agro.price_and_hedge.hedged_production_pct >= 50);
  assert.ok(agro.risk_mitigation_covenants.length >= 2);
});

test('Agente de Análise Financeira: calculates CADS, DSCR and leverage according to credit_math', () => {
  const loanId = 'SBL-2025-07788';
  const app = SAMPLE_APPLICATIONS[loanId].data;
  const dataColl = runDataCollection(loanId, app);
  const agro = runAgroRiskAnalysis(loanId, app, dataColl);
  const fin = runFinancialAnalysis(loanId, app, dataColl, agro);

  assert.ok(fin.cads_brl > 0, 'CADS must be positive');
  assert.ok(fin.dscr_safra > 1.0, 'DSCR safra must cover debt service');
  assert.ok(fin.liquidity_ratio > 0);
  assert.ok(fin.leverage_ratio > 0);
  assert.ok(['HEALTHY', 'ADEQUATE', 'TIGHT'].includes(fin.cash_flow_viability));
});

test('Agente de Parecer: synthesizes all reports into formal credit opinion and covenants', () => {
  const loanId = 'SBL-2025-07788';
  const app = SAMPLE_APPLICATIONS[loanId].data;
  const dataColl = runDataCollection(loanId, app);
  const comp = runComplianceAnalysis(loanId, app);
  const agro = runAgroRiskAnalysis(loanId, app, dataColl);
  const fin = runFinancialAnalysis(loanId, app, dataColl, agro);
  const opinion = runOpinionConsolidation(loanId, app, dataColl, comp, agro, fin, {
    risk_tier: 'Tier 1 - Low Risk',
    interest_rate: '6.50%',
    monthly_payment: '$15,000',
    total_interest: '$30,000',
    rate_justification: 'Prime agricultural credit profile',
  });

  assert.ok(opinion.decision_letter_id.startsWith('DL-'));
  assert.ok(['FAVORABLE', 'FAVORABLE_WITH_CONDITIONS'].includes(opinion.recommendation));
  assert.ok(opinion.executive_summary.includes('PARECER FAVORÁVEL'));
  assert.ok(opinion.covenants_and_safeguards.length >= 3);
});

test('Pipeline execution enriches process state with specialized_reports', async () => {
  const loanId = 'SBL-2025-07788';
  ProcessStateService.reset(loanId);
  const orchestrator = orchestratorFor('deterministic');
  await orchestrator.start(loanId, SAMPLE_APPLICATIONS[loanId].data);
  await orchestrator.approve(loanId);

  const state = ProcessStateService.getProcessStatus(loanId);
  assert.ok(state?.specialized_reports, 'specialized_reports must be populated');
  assert.ok(state?.specialized_reports?.data_collection, 'data_collection report exists');
  assert.ok(state?.specialized_reports?.compliance, 'compliance report exists');
  assert.ok(state?.specialized_reports?.agro_risk, 'agro_risk report exists');
  assert.ok(state?.specialized_reports?.financial_analysis, 'financial_analysis report exists');
  assert.ok(state?.specialized_reports?.opinion, 'opinion report exists');
  assert.equal(state?.specialized_reports?.opinion.hitl_operator_signoff.status, 'APPROVED');
});
