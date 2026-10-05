/**
 * @module: Small Business Loan Agent
 * @file: src/services/agroRiskService.ts
 * @description: Agente de Análise de Risco Agro: Fatores climáticos, sazonalidade de safra e risco de volatilidade de preços/hedge
 * @author: Maíra Pontin
 * @created: 2026-10-02
 * @version: 1.0.0
 */

import { AgroRiskReport, DataCollectionSnapshot, LoanApplicationData } from '../types';

export function runAgroRiskAnalysis(
  loanRequestId: string,
  application: LoanApplicationData,
  dataCollection?: DataCollectionSnapshot | null
): AgroRiskReport {
  const isAgro = Boolean(application.property) || application.industry?.toLowerCase().includes('agri');
  const isBlockedLoan = loanRequestId === 'SBL-2025-08123';

  // 1. Fatores Climáticos (Balanço hídrico, precipitação, índice de anomalia NDVI)
  // Região do Médio-Norte de Mato Grosso (Lucas do Rio Verde / Sorriso)
  const waterBalanceIndex = isBlockedLoan ? 0.64 : isAgro ? 0.88 : 0.95;
  const waterStatus =
    waterBalanceIndex < 0.6
      ? ('SEVERE_DROUGHT' as const)
      : waterBalanceIndex < 0.75
      ? ('MODERATE_DEFICIT' as const)
      : ('FAVORABLE' as const);

  const accumulatedRain = isBlockedLoan ? 1120 : isAgro ? 1480 : 1600;
  const normalRain = 1520;
  const ndviIndex = isBlockedLoan ? 0.68 : isAgro ? 0.82 : 0.85;
  const ndviAnomaly = isBlockedLoan ? -8.2 : isAgro ? 2.5 : 0;

  // 2. Sazonalidade & Produtividade Estressada
  const plantingStatus = isBlockedLoan ? ('LATE' as const) : ('OPTIMAL' as const);
  const expectedYieldLossPct = isBlockedLoan ? 12.5 : isAgro ? 3.2 : 0;
  const baseYield = dataCollection?.production.average_yield_sc_ha || 60.0;
  const stressedYield = Number((baseYield * (1 - expectedYieldLossPct / 100)).toFixed(1));

  // 3. Risco de Preço & Estrutura de Hedge
  // % da produção travada em Barter ou CPR com tradings
  const hedgedPct = isBlockedLoan ? 40.0 : isAgro ? 65.0 : 80.0;
  const unhedgedPct = 100.0 - hedgedPct;
  const breakEvenPrice = 96.5; // R$ / sc (custo operacional de produção estimado)
  const currentSpot = dataCollection?.commodities.cepea_esalq_spot_brl || 138.5;
  const marginSafety = Number((((currentSpot - breakEvenPrice) / breakEvenPrice) * 100).toFixed(1));

  // Nível de risco geral do agronegócio
  let overallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  if (waterStatus === 'SEVERE_DROUGHT' || expectedYieldLossPct > 10 || unhedgedPct > 55) {
    overallRiskLevel = 'HIGH';
  } else if (waterStatus === 'MODERATE_DEFICIT' || expectedYieldLossPct > 5 || unhedgedPct > 40) {
    overallRiskLevel = 'MODERATE';
  }

  // Covenants de mitigação de risco
  const covenants: string[] = [
    'Obrigação de contratação de Seguro Paramétrico Agrícola para estiagem ou chuva excessiva',
    `Trava mínima de hedge de 60% da safra esperada (${stressedYield} sc/ha) antes do plantio`,
    'Penhor mercantil de primeiro grau sobre a safra de grãos 2025/2026',
  ];

  if (overallRiskLevel === 'HIGH' || isBlockedLoan) {
    covenants.push('Apresentação de CPR Física com entrega em armazém credenciado como reforço de garantia');
  }

  return {
    loan_request_id: loanRequestId,
    overall_risk_level: overallRiskLevel,
    climate: {
      water_balance_index: waterBalanceIndex,
      water_balance_status: waterStatus,
      accumulated_rainfall_mm: accumulatedRain,
      historical_average_rainfall_mm: normalRain,
      ndvi_vegetative_vigor_index: ndviIndex,
      ndvi_anomaly_pct: ndviAnomaly,
    },
    seasonality: {
      planting_window_status: plantingStatus,
      expected_yield_loss_pct: expectedYieldLossPct,
      stressed_yield_sc_ha: stressedYield,
      harvest_schedule: 'Fevereiro a Março (Safra Verão)',
    },
    price_and_hedge: {
      hedged_production_pct: hedgedPct,
      unhedged_exposure_pct: unhedgedPct,
      break_even_price_brl_sc: breakEvenPrice,
      margin_safety_pct: marginSafety,
      hedge_instrument: 'Barter Fertilizantes + CPR Financeira B3',
    },
    risk_mitigation_covenants: covenants,
  };
}
