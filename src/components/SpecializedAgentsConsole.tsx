/**
 * @module: Small Business Loan Agent
 * @file: src/components/SpecializedAgentsConsole.tsx
 * @description: Painel Interativo dos 5 Agentes Especializados de Inteligência de Crédito Agro e PME
 * @author: Maíra Pontin
 * @created: 2026-10-02
 * @version: 1.0.0
 */

import React, { useState } from 'react';
import { ProcessState, SpecializedReports } from '../types';
import {
  Database,
  ShieldCheck,
  Sprout,
  TrendingUp,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  CloudRain,
  Activity,
  FileDown,
  Info,
  DollarSign,
  Scale,
  BarChart3,
} from 'lucide-react';
import { runDataCollection } from '../services/dataCollectionService';
import { runComplianceAnalysis } from '../services/complianceService';
import { runAgroRiskAnalysis } from '../services/agroRiskService';
import { runFinancialAnalysis } from '../services/financialAnalysisService';
import { runOpinionConsolidation } from '../services/opinionService';
import { downloadLoanUnderwritingPdf } from '../services/pdfReportGenerator';
import { SAMPLE_APPLICATIONS } from '../services/loanService';
import { AgentPerformanceDashboard } from './AgentPerformanceDashboard';

interface SpecializedAgentsConsoleProps {
  processState: ProcessState | null;
  activeLoanId: string;
  onDownloadPdf?: () => void;
}

export const SpecializedAgentsConsole: React.FC<SpecializedAgentsConsoleProps> = ({
  processState,
  activeLoanId,
  onDownloadPdf,
}) => {
  const [selectedAgentTab, setSelectedAgentTab] = useState<
    'dashboard' | 'opinion' | 'collection' | 'compliance' | 'agro_risk' | 'financial'
  >('dashboard');

  // Recupera relatórios salvos ou sintetiza com base no estado atual
  const appData =
    (processState?.steps.DocumentExtractionAgent?.data as any) ||
    SAMPLE_APPLICATIONS[activeLoanId]?.data ||
    SAMPLE_APPLICATIONS['SBL-2025-02142'].data;

  const geoReport = processState?.steps.GeoVerificationAgent?.data || null;
  const pricingData = processState?.steps.PricingAgent?.data || null;

  const dataCollection =
    processState?.specialized_reports?.data_collection ||
    runDataCollection(activeLoanId, appData);

  const compliance =
    processState?.specialized_reports?.compliance ||
    runComplianceAnalysis(activeLoanId, appData, geoReport);

  const agroRisk =
    processState?.specialized_reports?.agro_risk ||
    runAgroRiskAnalysis(activeLoanId, appData, dataCollection);

  const financial =
    processState?.specialized_reports?.financial_analysis ||
    runFinancialAnalysis(activeLoanId, appData, dataCollection, agroRisk);

  const hitlStatus =
    processState?.overall_status === 'approved'
      ? ('APPROVED' as const)
      : processState?.overall_status === 'rejected'
      ? ('REJECTED' as const)
      : ('PENDING' as const);

  const opinion =
    processState?.specialized_reports?.opinion ||
    runOpinionConsolidation(
      activeLoanId,
      appData,
      dataCollection,
      compliance,
      agroRisk,
      financial,
      pricingData,
      {
        status: hitlStatus,
        operator: 'Comitê de Crédito / HITL',
        timestamp: new Date().toISOString(),
      }
    );

  const handleDownloadReport = () => {
    if (onDownloadPdf) {
      onDownloadPdf();
    } else if (processState) {
      downloadLoanUnderwritingPdf({ processState });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col min-h-[680px] overflow-hidden">
      {/* Top Banner */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900">
              Arquitetura de Agentes Especializados de Crédito
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
              5 Motores Ativos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Coleta bitemporal, compliance regulatório, modelagem de risco agronômico, credit math e parecer técnico
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() =>
              setSelectedAgentTab(selectedAgentTab === 'dashboard' ? 'opinion' : 'dashboard')
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              selectedAgentTab === 'dashboard'
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            {selectedAgentTab === 'dashboard' ? 'Ver Parecer Técnico' : 'Dashboard D3 (Performance)'}
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            Baixar Parecer Técnico (PDF)
          </button>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-4 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setSelectedAgentTab('dashboard')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            selectedAgentTab === 'dashboard'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-blue-600" />
          Dashboard de Performance (D3.js)
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
            Tempo & Sucesso
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedAgentTab('opinion')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            selectedAgentTab === 'opinion'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-emerald-600" />
          5. Agente de Parecer
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] uppercase ${
              opinion.recommendation === 'FAVORABLE'
                ? 'bg-emerald-100 text-emerald-800'
                : opinion.recommendation === 'FAVORABLE_WITH_CONDITIONS'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {opinion.recommendation.replace(/_/g, ' ')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedAgentTab('collection')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            selectedAgentTab === 'collection'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-blue-600" />
          1. Agente de Coleta de Dados
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600">
            SCR & Open Finance
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedAgentTab('compliance')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            selectedAgentTab === 'compliance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          2. Agente de Compliance
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] ${
              compliance.overall_status === 'CLEARED'
                ? 'bg-emerald-100 text-emerald-800'
                : compliance.overall_status === 'REVIEW'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {compliance.overall_status}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedAgentTab('agro_risk')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            selectedAgentTab === 'agro_risk'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sprout className="w-4 h-4 text-emerald-600" />
          3. Agente de Risco Agro
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] ${
              agroRisk.overall_risk_level === 'LOW'
                ? 'bg-emerald-100 text-emerald-800'
                : agroRisk.overall_risk_level === 'MODERATE'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {agroRisk.overall_risk_level} RISK
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedAgentTab('financial')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            selectedAgentTab === 'financial'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-blue-700" />
          4. Agente Financeiro
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-100 text-blue-800">
            DSCR {financial.dscr_safra}x
          </span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* ============================================================== */}
        {/* 0. DASHBOARD D3: PERFORMANCE & SUCESSO DOS 5 AGENTES           */}
        {/* ============================================================== */}
        {selectedAgentTab === 'dashboard' && (
          <AgentPerformanceDashboard
            processState={processState}
            activeLoanId={activeLoanId}
            onSelectAgentTab={(tab) => setSelectedAgentTab(tab)}
          />
        )}

        {/* ============================================================== */}
        {/* 1. AGENTE DE PARECER                                           */}
        {/* ============================================================== */}
        {selectedAgentTab === 'opinion' && (
          <div className="space-y-6">
            <div
              className={`p-5 rounded-xl border flex items-start justify-between gap-4 ${
                opinion.recommendation === 'FAVORABLE'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : opinion.recommendation === 'FAVORABLE_WITH_CONDITIONS'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-rose-50/70 border-rose-200'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Deliberação do Agente de Parecer
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Ref: {opinion.decision_letter_id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {opinion.executive_summary}
                </h3>
                <p className="text-xs text-slate-600">
                  Parecer consolidado em {new Date(opinion.dossier_timestamp).toLocaleString()} • Bitemporal
                  auditado com carimbo de tempo inviolável.
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Portão Humano (HITL)
                </span>
                <div className="mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                      opinion.hitl_operator_signoff.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : opinion.hitl_operator_signoff.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-900 animate-pulse'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {opinion.hitl_operator_signoff.status === 'APPROVED'
                      ? 'Homologado por Autoridade'
                      : opinion.hitl_operator_signoff.status === 'REJECTED'
                      ? 'Declinado pelo Comitê'
                      : 'Aguardando Aprovação'}
                  </span>
                </div>
              </div>
            </div>

            {/* Metodologia de Deliberação Utilizada */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Scale className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-800">
                  Metodologia de Deliberação:
                </span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-blue-100 text-blue-800">
                  {processState?.methodology?.name || 'Orquestração Determinística (5 Agentes)'}
                </span>
                {processState?.methodology?.isDegraded && (
                  <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Degradação Graciosa Ativa (Caso 2)
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Auditoria XAI: Risco financeiro, ambiental e elegibilidade calculados fora de LLMs
              </span>
            </div>

            {/* Grid de Termos & Indicadores Síntese */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Valor Recomendado</span>
                <div className="text-base font-bold text-slate-900 mt-1">{opinion.recommended_amount}</div>
                <span className="text-[10px] text-slate-400">Empréstimo Solicitado</span>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Taxa de Juros (APR)</span>
                <div className="text-base font-bold text-blue-700 mt-1">{opinion.recommended_rate}</div>
                <span className="text-[10px] text-slate-400">{opinion.risk_tier}</span>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Cobertura de Dívida</span>
                <div className="text-base font-bold text-emerald-700 mt-1">{financial.dscr_safra}x DSCR</div>
                <span className="text-[10px] text-slate-400">Geração CADS R$ {(financial.cads_brl / 1000).toFixed(0)}k</span>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Risco Agro & Clima</span>
                <div className="text-base font-bold text-slate-900 mt-1">{agroRisk.overall_risk_level}</div>
                <span className="text-[10px] text-slate-400">NDVI {agroRisk.climate.ndvi_vegetative_vigor_index} • {agroRisk.price_and_hedge.hedged_production_pct}% Hedge</span>
              </div>
            </div>

            {/* Covenants e Salvaguardas Contratuais */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-blue-600" />
                Covenants Mandatórios e Condições Precedentes
              </h4>
              <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                {opinion.covenants_and_safeguards.map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Policy Items */}
            {opinion.pending_policy_items.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Itens em Protocolo PENDING_POLICY (Deliberação do Comitê)
                </h4>
                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 space-y-2">
                  {opinion.pending_policy_items.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-900">
                      <span className="font-mono font-bold text-amber-700">[{i + 1}]</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. AGENTE DE COLETA DE DADOS                                   */}
        {/* ============================================================== */}
        {selectedAgentTab === 'collection' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* SCR Bacen */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-blue-600" />
                    SCR Bacen (Sistema de Informações de Crédito)
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    Base: {dataCollection.scr.last_consulted_month}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Exposição Total no SFN:</span>
                    <span className="font-semibold text-slate-800">
                      R$ {dataCollection.scr.total_exposure_brl.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Uso de Limite Bancário:</span>
                    <span className="font-semibold text-slate-800">
                      {dataCollection.scr.credit_limit_used_pct}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operações em Atraso:</span>
                    <span
                      className={`font-semibold ${
                        dataCollection.scr.overdue_operations_count === 0
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {dataCollection.scr.overdue_operations_count} operação(ões)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Instituições no SFN:</span>
                    <span className="font-semibold text-slate-800">
                      {dataCollection.scr.sfn_institutions_count} bancos
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Classificação de Apontamento:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        dataCollection.scr.standing === 'REGULAR'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {dataCollection.scr.standing}
                    </span>
                  </div>
                </div>
              </div>

              {/* Open Finance */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Open Finance (Extratos & Entradas Reais)
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    {dataCollection.open_finance.connected_accounts_count} contas sincronizadas
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Entrada Média Mensal:</span>
                    <span className="font-semibold text-slate-800">
                      R$ {dataCollection.open_finance.verified_average_monthly_inflow_brl.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reconciliação com Faturamento:</span>
                    <span className="font-semibold text-emerald-700">
                      {dataCollection.open_finance.revenue_reconciliation_pct}% verificado
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Queima Média Operacional:</span>
                    <span className="font-semibold text-slate-800">
                      R$ {dataCollection.open_finance.cash_burn_rate_monthly_brl.toLocaleString()}/mês
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Saúde de Caixa Bancário:</span>
                    <span className="font-semibold text-emerald-700">
                      {dataCollection.open_finance.bank_standing}
                    </span>
                  </div>
                </div>
              </div>

              {/* Produção Agro */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    Dados de Produção da Fazenda
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    Safra {dataCollection.production.crop_year}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cultura Declarada:</span>
                    <span className="font-semibold text-slate-800">
                      {dataCollection.production.crop} ({dataCollection.production.planted_area_ha} ha plantados)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Produtividade Média Histórica:</span>
                    <span className="font-semibold text-slate-800">
                      {dataCollection.production.average_yield_sc_ha} sc/ha ({dataCollection.production.historical_yield_sc_ha.join(', ')} sc/ha)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Benchmark Conab/IMEA Regional:</span>
                    <span className="font-semibold text-slate-800">
                      {dataCollection.production.regional_benchmark_conab_sc_ha} sc/ha
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rendimento vs Regional:</span>
                    <span className="font-semibold text-emerald-700">
                      +{dataCollection.production.yield_vs_benchmark_pct - 100 > 0 ? (dataCollection.production.yield_vs_benchmark_pct - 100).toFixed(1) : 0}% acima da média
                    </span>
                  </div>
                </div>
              </div>

              {/* Preços de Commodities */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    Cotações & Paridade de Exportação
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    {dataCollection.commodities.quotation_date}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Preço Spot CEPEA/Esalq MT:</span>
                    <span className="font-semibold text-slate-800">
                      R$ {dataCollection.commodities.cepea_esalq_spot_brl.toFixed(2)} / sc
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Futuros CBOT (Chicago):</span>
                    <span className="font-semibold text-slate-800">
                      USD ${dataCollection.commodities.cbot_future_usd_bushel.toFixed(2)} / bushel
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Basis Regional (Exportação):</span>
                    <span className="font-semibold text-slate-800">
                      USD ${dataCollection.commodities.basis_regional_usd_bushel.toFixed(2)} / bushel
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paridade Efetiva Líquida:</span>
                    <span className="font-semibold text-blue-700">
                      R$ {dataCollection.commodities.effective_parity_brl_sc.toFixed(2)} / sc
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. AGENTE DE COMPLIANCE                                        */}
        {/* ============================================================== */}
        {selectedAgentTab === 'compliance' && (
          <div className="space-y-6">
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                compliance.overall_status === 'CLEARED'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : compliance.overall_status === 'REVIEW'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-rose-50/70 border-rose-200'
              }`}
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Enquadramento Geral de Compliance
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {compliance.audit_notes}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-md text-xs font-bold uppercase ${
                  compliance.overall_status === 'CLEARED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : compliance.overall_status === 'REVIEW'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {compliance.overall_status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase">Políticas Internas</span>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Tempo de Operação: {compliance.internal_policies_cleared ? '✅ Atende' : '❌ Inoperante'}</div>
                  <div>Setores Restritos: ✅ Sem vedação</div>
                  <div>Alavancagem Máxima: ✅ Adequado</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase">Socioambiental</span>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Status CAR: {compliance.car_status}</div>
                  <div>Alertas DETER: {compliance.deforestation_alerts}</div>
                  <div>Embargos IBAMA: {compliance.ibama_embargoes}</div>
                  <div>Reserva Legal: {compliance.legal_reserve_compliance_pct}%</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase">Listas Restritivas</span>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Trabalho Escravo: ✅ {compliance.restrictive_lists.slave_labor_blacklist}</div>
                  <div>Lista PEP: ✅ {compliance.restrictive_lists.pep}</div>
                  <div>Sanções OFAC: ✅ {compliance.restrictive_lists.ofac_sanctions}</div>
                </div>
              </div>
            </div>

            {compliance.blocking_findings.length > 0 && (
              <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/50 space-y-2">
                <span className="text-xs font-bold text-rose-800 uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Impedimentos Bloqueantes Identificados
                </span>
                {compliance.blocking_findings.map((f, i) => (
                  <div key={i} className="text-xs text-rose-900 font-medium">
                    • {f}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. AGENTE DE RISCO AGRO                                        */}
        {/* ============================================================== */}
        {selectedAgentTab === 'agro_risk' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Clima & Satélite */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <CloudRain className="w-4 h-4 text-blue-600" />
                  Monitoramento Climático & NDVI
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Índice Balanço Hídrico:</span>
                    <span className="font-semibold text-slate-800">
                      {agroRisk.climate.water_balance_index} ({agroRisk.climate.water_balance_status})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chuva Acumulada no Ciclo:</span>
                    <span className="font-semibold text-slate-800">
                      {agroRisk.climate.accumulated_rainfall_mm} mm (Média: {agroRisk.climate.historical_average_rainfall_mm} mm)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vigor Vegetativo NDVI:</span>
                    <span className="font-semibold text-emerald-700">
                      {agroRisk.climate.ndvi_vegetative_vigor_index} (Anomalia: {agroRisk.climate.ndvi_anomaly_pct > 0 ? `+${agroRisk.climate.ndvi_anomaly_pct}` : agroRisk.climate.ndvi_anomaly_pct}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Sazonalidade & Produtividade */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Sazonalidade & Quebra Esperada
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Janela de Plantio:</span>
                    <span className="font-semibold text-slate-800">
                      {agroRisk.seasonality.planting_window_status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quebra de Safra Estimada:</span>
                    <span className="font-semibold text-slate-800">
                      {agroRisk.seasonality.expected_yield_loss_pct}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Produtividade Estressada:</span>
                    <span className="font-semibold text-slate-800">
                      {agroRisk.seasonality.stressed_yield_sc_ha} sc/ha
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cronograma de Colheita:</span>
                    <span className="font-semibold text-slate-800">
                      {agroRisk.seasonality.harvest_schedule}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risco de Preço & Hedge */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  Estrutura de Comercialização & Hedge
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Produção Travada (Hedge):</span>
                    <span className="font-semibold text-emerald-700">
                      {agroRisk.price_and_hedge.hedged_production_pct}% da safra
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Exposição Spot Desprotegida:</span>
                    <span className="font-semibold text-slate-800">
                      {agroRisk.price_and_hedge.unhedged_exposure_pct}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Preço de Equilíbrio (Breakeven):</span>
                    <span className="font-semibold text-slate-800">
                      R$ {agroRisk.price_and_hedge.break_even_price_brl_sc.toFixed(2)} / sc
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Margem de Segurança Efetiva:</span>
                    <span className="font-semibold text-emerald-700">
                      +{agroRisk.price_and_hedge.margin_safety_pct}% acima do breakeven
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. AGENTE DE ANÁLISE FINANCEIRA                                */}
        {/* ============================================================== */}
        {selectedAgentTab === 'financial' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-blue-900 uppercase">
                  Motor Financeiro & Modelagem CADS / DSCR (Predictive Engine)
                </div>
                <div className="text-sm font-semibold text-blue-950 mt-0.5">
                  {financial.financial_notes}
                </div>
              </div>
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-blue-600 text-white uppercase">
                {financial.cash_flow_viability}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">CADS Líquido</span>
                <div className="text-base font-bold text-slate-900 mt-1">
                  R$ {financial.cads_brl.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">Cash Available for Debt Service</span>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">DSCR Safra</span>
                <div className="text-base font-bold text-emerald-700 mt-1">
                  {financial.dscr_safra}x
                </div>
                <span className="text-[10px] text-slate-400">Entressafra: {financial.dscr_entressafra}x</span>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Liquidez Corrente</span>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {financial.liquidity_ratio}
                </div>
                <span className="text-[10px] text-slate-400">Ativo / Passivo Circulante</span>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Alavancagem Real</span>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {financial.leverage_ratio}%
                </div>
                <span className="text-[10px] text-slate-400">Dívida Total / Faturamento</span>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
              <div className="font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Variáveis da Equação de Fluxo de Caixa (Predictive Domain Spec)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400">Serviço da Dívida Anual:</span>{' '}
                  <strong className="text-slate-800">R$ {financial.debt_service_brl.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Capex de Reposição:</span>{' '}
                  <strong className="text-slate-800">R$ {financial.replacement_capex_brl.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Risco Chamada Margem:</span>{' '}
                  <strong className="text-slate-800">R$ {financial.margin_liquidity_shortfall_brl.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Produtividade Breakeven:</span>{' '}
                  <strong className="text-slate-800">{financial.break_even_yield_sc_ha} sc/ha</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
