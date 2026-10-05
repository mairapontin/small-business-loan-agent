/**
 * @module: Small Business Loan Agent
 * @file: src/services/dataCollectionService.ts
 * @description: Agente de Coleta de Dados: Integração simulada e bitemporal com SCR Bacen, Open Finance, Dados de Produção e Preços de Commodities
 * @author: Maíra Pontin
 * @created: 2026-10-02
 * @version: 1.0.0
 */

import {
  CommodityPricesData,
  DataCollectionSnapshot,
  LoanApplicationData,
  OpenFinanceData,
  ProductionAgroData,
  ScrBacenData,
} from '../types';
import { parseDollarAmount } from './loanService';

export function runDataCollection(
  loanRequestId: string,
  application: LoanApplicationData,
  pointInTime: string = new Date().toISOString()
): DataCollectionSnapshot {
  const isAgro = Boolean(application.property) || application.industry?.toLowerCase().includes('agri');
  const revenue = parseDollarAmount(application.annual_revenue);
  const requested = parseDollarAmount(application.loan_amount_requested);
  const declaredDebt = parseDollarAmount(application.existing_debt);

  // 1. SCR Bacen (Sistema de Informações de Créditos do Banco Central)
  const isBlockedLoan = loanRequestId === 'SBL-2025-08123';
  const totalExposure = declaredDebt > 0 ? declaredDebt : Math.round(revenue * 0.35);
  const limitUsedPct = isBlockedLoan ? 92.5 : revenue > 1000000 ? 58.4 : 44.0;
  const overdueCount = isBlockedLoan ? 1 : 0;
  const historicalDelayDays = isBlockedLoan ? 18 : 0;
  const scrStanding = isBlockedLoan
    ? 'WATCHLIST'
    : limitUsedPct > 80
    ? 'WATCHLIST'
    : 'REGULAR';

  const scr: ScrBacenData = {
    total_exposure_brl: totalExposure,
    credit_limit_used_pct: limitUsedPct,
    overdue_operations_count: overdueCount,
    historical_delay_max_days: historicalDelayDays,
    sfn_institutions_count: revenue > 2000000 ? 4 : 2,
    standing: scrStanding,
    last_consulted_month: pointInTime.substring(0, 7),
  };

  // 2. Open Finance (Extratos bancários categorizados e faturamento líquido)
  const monthlyInflow = Math.round(revenue / 12);
  const reconciliationPct = isBlockedLoan ? 84.5 : 98.7;
  const cashBurn = Math.round(monthlyInflow * 0.72);
  const openFinance: OpenFinanceData = {
    connected_accounts_count: isAgro ? 3 : 2,
    verified_average_monthly_inflow_brl: monthlyInflow,
    revenue_reconciliation_pct: reconciliationPct,
    cash_burn_rate_monthly_brl: cashBurn,
    bank_standing: reconciliationPct > 90 ? 'EXCELLENT' : 'STABLE',
  };

  // 3. Dados de Produção Agro (Área plantada, histórico de produtividade e benchmark Conab)
  const areaHa = application.property?.declared_area_ha || (isAgro ? 1200 : 0);
  const crop = application.property?.crop || (isAgro ? 'Soja' : 'N/A');
  const histYield = isAgro ? [58.2, 61.5, 59.8] : [0, 0, 0];
  const avgYield = isAgro ? 59.8 : 0;
  const conabBenchmark = isAgro ? 57.4 : 0; // Benchmark IMEA/Conab para MT
  const yieldPct = conabBenchmark > 0 ? Number(((avgYield / conabBenchmark) * 100).toFixed(1)) : 100;

  const production: ProductionAgroData = {
    crop,
    crop_year: '2025/2026',
    planted_area_ha: areaHa,
    historical_yield_sc_ha: histYield,
    average_yield_sc_ha: avgYield,
    regional_benchmark_conab_sc_ha: conabBenchmark,
    yield_vs_benchmark_pct: yieldPct,
  };

  // 4. Preços de Commodities (CEPEA/Esalq spot, CBOT futuros e Basis MT)
  const cepeaSpot = isAgro ? 138.5 : 0; // R$ / saca em Rondonópolis/MT
  const cbotUsd = isAgro ? 11.85 : 0; // USD / bushel
  const basisUsd = isAgro ? -0.95 : 0; // Basis exportação Paranaguá/Santos
  const parityBrl = isAgro ? 136.2 : 0;

  const commodities: CommodityPricesData = {
    cepea_esalq_spot_brl: cepeaSpot,
    cbot_future_usd_bushel: cbotUsd,
    basis_regional_usd_bushel: basisUsd,
    effective_parity_brl_sc: parityBrl,
    quotation_date: pointInTime.substring(0, 10),
  };

  return {
    loan_request_id: loanRequestId,
    scr,
    open_finance: openFinance,
    production,
    commodities,
    event_time: pointInTime,
    available_time: pointInTime,
  };
}
