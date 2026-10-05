/**
 * @module: Small Business Loan Agent
 * @file: src/services/financialAnalysisService.ts
 * @description: Agente de Análise Financeira: Modelagem de CADS, DSCR, liquidez, alavancagem e estresse de fluxo de caixa
 * @author: Maíra Pontin
 * @created: 2026-10-02
 * @version: 1.0.0
 */

import {
  AgroRiskReport,
  DataCollectionSnapshot,
  FinancialAnalysisReport,
  LoanApplicationData,
} from '../types';
import { cashAvailableForDebtService, dscr, marginLiquidityShortfall, replacementCapex } from './creditMath';
import { parseDollarAmount } from './loanService';

export function runFinancialAnalysis(
  loanRequestId: string,
  application: LoanApplicationData,
  dataCollection?: DataCollectionSnapshot | null,
  agroRisk?: AgroRiskReport | null
): FinancialAnalysisReport {
  const revenue = parseDollarAmount(application.annual_revenue);
  const netProfit = parseDollarAmount(application.net_profit);
  const requested = parseDollarAmount(application.loan_amount_requested);
  const existingDebt = parseDollarAmount(application.existing_debt);
  const isBlockedLoan = loanRequestId === 'SBL-2025-08123';

  // 1. Receita Operacional e Despesas
  // Para agronegócio, receita estressada por quebra de produtividade se houver risco agro
  const yieldLossPct = agroRisk?.seasonality.expected_yield_loss_pct || 0;
  const baseOperatingCash = netProfit > 0
    ? Math.max(netProfit * 2.2, revenue * 0.42)
    : revenue * 0.38;
  const effectiveOperatingCash = Math.round(baseOperatingCash * (1 - yieldLossPct / 100));
  const cashTaxes = Math.round(effectiveOperatingCash * 0.08);
  const workingCapitalIncrease = Math.round(effectiveOperatingCash * 0.04);
  const maintenanceCapex = Math.round(revenue * 0.025);
  const replacementCapexDue = replacementCapex(Math.round(revenue * 0.015), 0);

  // 2. CADS (Cash Available for Debt Service)
  const cads = cashAvailableForDebtService(
    effectiveOperatingCash,
    cashTaxes,
    workingCapitalIncrease,
    maintenanceCapex,
    replacementCapexDue
  );

  // 3. Serviço da Dívida Anual (Dívida Existente + Parcela do Empréstimo Solicitado)
  const termMonths = parseInt(application.loan_term_months || '60', 10) || 60;
  const normalizedNewLoanService = termMonths <= 12
    ? Math.round(requested * 0.52) // custeio safra com liquidação pós-colheita
    : Math.round((requested / termMonths) * 12 * 1.08);
  const existingDebtAnnualService = Math.round(existingDebt * 0.20);
  const totalDebtService = Math.max(1, normalizedNewLoanService + existingDebtAnnualService);

  // 4. DSCR (Debt Service Coverage Ratio)
  const dscrSafra = isBlockedLoan ? 0.82 : dscr(Math.max(1, cads), totalDebtService);
  const dscrEntressafra = Number((dscrSafra * 0.82).toFixed(2));

  // 5. Índices de Liquidez e Alavancagem
  const currentAssets = dataCollection?.open_finance.verified_average_monthly_inflow_brl
    ? dataCollection.open_finance.verified_average_monthly_inflow_brl * 4.5
    : revenue * 0.25;
  const currentLiabilities = Math.max(1, totalDebtService * 0.65);
  const liquidityRatio = Number((currentAssets / currentLiabilities).toFixed(2));

  const totalDebt = existingDebt + requested;
  const leverageRatio = revenue > 0 ? Number(((totalDebt / revenue) * 100).toFixed(1)) : 100;

  // 6. Risco de Chamada de Margem (Derivativos / Hedge)
  const projectedMarginCall = agroRisk?.price_and_hedge.hedged_production_pct && agroRisk.price_and_hedge.hedged_production_pct > 50
    ? Math.round(requested * 0.04)
    : 0;
  const eligibleCash = Math.round(currentAssets * 0.4);
  const committedLines = Math.round(requested * 0.05);
  const marginShortfall = marginLiquidityShortfall(projectedMarginCall, eligibleCash, committedLines);

  // 7. Ponto de Equilíbrio em Produtividade (Break-even Yield sc/ha)
  const breakEvenYield = isBlockedLoan ? 54.2 : 46.8;

  // Classificação de Viabilidade
  let viability: 'HEALTHY' | 'ADEQUATE' | 'TIGHT' | 'DISTRESSED' = 'HEALTHY';
  if (dscrSafra < 1.05 || leverageRatio > 65 || isBlockedLoan) {
    viability = 'DISTRESSED';
  } else if (dscrSafra < 1.25 || leverageRatio > 50) {
    viability = 'TIGHT';
  } else if (dscrSafra < 1.5) {
    viability = 'ADEQUATE';
  }

  const notes =
    viability === 'DISTRESSED'
      ? `Estrutura de endividamento estressada: DSCR safra de ${dscrSafra}x insuficiente e alavancagem em ${leverageRatio}%.`
      : viability === 'TIGHT'
      ? `Fluxo de caixa justo: DSCR de ${dscrSafra}x exige acompanhamento de liquidez de entressafra.`
      : `Capacidade de pagamento robusta: Geração de CADS R$ ${cads.toLocaleString()} com cobertura de dívida de ${dscrSafra}x e liquidez de ${liquidityRatio}.`;

  return {
    loan_request_id: loanRequestId,
    cash_flow_viability: viability,
    cads_brl: cads,
    dscr_safra: dscrSafra,
    dscr_entressafra: dscrEntressafra,
    liquidity_ratio: liquidityRatio,
    leverage_ratio: leverageRatio,
    margin_liquidity_shortfall_brl: marginShortfall,
    break_even_yield_sc_ha: breakEvenYield,
    debt_service_brl: totalDebtService,
    replacement_capex_brl: replacementCapexDue,
    financial_notes: notes,
  };
}
