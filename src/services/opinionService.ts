/**
 * @module: Small Business Loan Agent
 * @file: src/services/opinionService.ts
 * @description: Agente de Parecer: Consolidação multidisciplinar de todos os relatórios de inteligência em parecer técnico executivo para comitê
 * @author: Maíra Pontin
 * @created: 2026-10-02
 * @version: 1.0.0
 */

import {
  AgroRiskReport,
  ComplianceReport,
  DataCollectionSnapshot,
  FinancialAnalysisReport,
  LoanApplicationData,
  OpinionReport,
  PricingResult,
} from '../types';

export function runOpinionConsolidation(
  loanRequestId: string,
  application: LoanApplicationData,
  dataCollection: DataCollectionSnapshot,
  compliance: ComplianceReport,
  agroRisk: AgroRiskReport,
  financial: FinancialAnalysisReport,
  pricing?: PricingResult | null,
  hitlSignoff?: { status: 'PENDING' | 'APPROVED' | 'REJECTED'; operator?: string; timestamp?: string }
): OpinionReport {
  const cleanId = loanRequestId.replace(/^SBL-/, '');
  const decisionLetterId = `DL-${cleanId}-001`;

  // Análise da recomendação com base nas 4 frentes:
  // 1. Compliance
  const isComplianceBlocked = compliance.overall_status === 'BLOCKED';
  const isComplianceReview = compliance.overall_status === 'REVIEW';

  // 2. Financeiro
  const isFinancialDistressed = financial.cash_flow_viability === 'DISTRESSED';
  const isFinancialTight = financial.cash_flow_viability === 'TIGHT';

  // 3. Agro
  const isAgroHighRisk = agroRisk.overall_risk_level === 'HIGH';

  let recommendation: 'FAVORABLE' | 'FAVORABLE_WITH_CONDITIONS' | 'UNFAVORABLE' = 'FAVORABLE';
  if (isComplianceBlocked || isFinancialDistressed) {
    recommendation = 'UNFAVORABLE';
  } else if (isComplianceReview || isFinancialTight || isAgroHighRisk) {
    recommendation = 'FAVORABLE_WITH_CONDITIONS';
  }

  // Covenants consolidados
  const covenants: string[] = [
    'Constituição de penhor de safra e trava de domicílio bancário dos recebíveis de grãos',
    'Monitoramento socioambiental e agronômico trimestral contínuo via sensoriamento remoto (CAR/DETER/NDVI)',
    'Apresentação de balanço patrimonial e DRE auditados no encerramento da safra',
  ];

  for (const c of agroRisk.risk_mitigation_covenants) {
    if (!covenants.includes(c)) covenants.push(c);
  }

  if (compliance.overall_status === 'REVIEW') {
    covenants.push('Comprovação documental de quitação ou exclusão técnica dos apontamentos socioambientais');
  }

  // Pending Policy Items (itens para deliberação do comitê)
  const pendingPolicy: string[] = [];
  if (financial.dscr_safra < 1.3) {
    pendingPolicy.push(`DSCR safra de ${financial.dscr_safra}x abaixo da meta ideal de 1.30x — requer aprovação de exceção pelo Comitê Sênior`);
  }
  if (agroRisk.price_and_hedge.unhedged_exposure_pct > 30) {
    pendingPolicy.push(`Exposição a preço spot de ${agroRisk.price_and_hedge.unhedged_exposure_pct}% acima do limite padrão de 30%`);
  }
  if (dataCollection.scr.credit_limit_used_pct > 75) {
    pendingPolicy.push(`Uso de limite no SCR Bacen em ${dataCollection.scr.credit_limit_used_pct}%`);
  }

  // Resumo Executivo
  const executiveSummary =
    recommendation === 'UNFAVORABLE'
      ? `PARECER DESFAVORÁVEL: Operação com impedimentos críticos identificados pelo Agente de Compliance (${compliance.blocking_findings.join('; ') || 'incompatibilidade de política'}). Viabilidade de caixa estressada.`
      : recommendation === 'FAVORABLE_WITH_CONDITIONS'
      ? `PARECER FAVORÁVEL COM CONDIÇÕES: Operação estruturável para ${application.business_name}. Cobertura de dívida DSCR de ${financial.dscr_safra}x, geração de CADS de R$ ${financial.cads_brl.toLocaleString()} e risco agro em nível ${agroRisk.overall_risk_level}. Exige cumprimento dos covenants precedentes.`
      : `PARECER FAVORÁVEL: Excelente perfil de crédito para ${application.business_name}. Compliance 100% conforme, risco agro baixo com vigor vegetativo NDVI saudável e sólida geração de caixa livre de R$ ${financial.cads_brl.toLocaleString()}.`;

  const approvedTerm = `${application.loan_term_months || 60} meses`;
  const approvedAmount = application.loan_amount_requested || '$150,000';
  const approvedRate = pricing?.interest_rate || '6.50%';
  const riskTier = pricing?.risk_tier || (recommendation === 'FAVORABLE' ? 'Tier 1 - Low Risk' : 'Tier 2 - Moderate Risk');

  return {
    loan_request_id: loanRequestId,
    decision_letter_id: decisionLetterId,
    recommendation,
    executive_summary: executiveSummary,
    recommended_amount: approvedAmount,
    recommended_rate: approvedRate,
    recommended_term: approvedTerm,
    risk_tier: riskTier,
    covenants_and_safeguards: covenants,
    pending_policy_items: pendingPolicy,
    hitl_operator_signoff: {
      required: true,
      status: hitlSignoff?.status || 'PENDING',
      operator: hitlSignoff?.operator,
      timestamp: hitlSignoff?.timestamp,
    },
    dossier_timestamp: new Date().toISOString(),
  };
}
