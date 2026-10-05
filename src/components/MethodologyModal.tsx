/**
 * @module: Small Business Loan Agent
 * @file: src/components/MethodologyModal.tsx
 * @description: Modal explicativo com transparência total sobre a Metodologia Ativa e a Política de Degradação Graciosa (Caso 2)
 * @author: Maíra Pontin
 * @created: 2026-10-05
 * @version: 1.0.0
 */

import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Bot,
  Scale,
  Sparkles,
  CheckCircle2,
  X,
  HelpCircle,
  Cpu,
  Layers,
  FileCheck2,
} from 'lucide-react';
import { MethodologyInfo, OrchestratorId } from '../types';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMethodology?: MethodologyInfo | null;
  activeOrchestrator: OrchestratorId;
  genAiConfigured?: boolean;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose,
  activeMethodology,
  activeOrchestrator,
  genAiConfigured,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Governança de Metodologia & Transparência (XAI)
              </h2>
              <p className="text-xs text-slate-500">
                Arquitetura de deliberação, regras bancárias e garantia de contingência
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Active Methodology Card */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Metodologia em Operação
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white">
                {activeMethodology?.badge || 'Regras Ativas'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {activeMethodology?.name ||
                (activeOrchestrator === 'adk'
                  ? 'ADK Root Agent (Gemini)'
                  : activeOrchestrator === 'adk-sim'
                  ? 'ADK Simulado'
                  : 'Orquestração Determinística')}
            </h3>
            <p className="mt-1 text-slate-600 leading-relaxed">
              {activeMethodology?.description ||
                'O pipeline coordena 5 agentes de crédito para extração, verificação socioambiental, underwriting, precificação e parecer com portão humano.'}
            </p>

            {activeMethodology?.activeFeatures && (
              <div className="mt-3 pt-3 border-t border-blue-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {activeMethodology.activeFeatures.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-blue-950 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Graceful Degradation (Case 2) Banner */}
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-amber-900">
                    O que é o Caso 2: Degradação Graciosa (*Graceful Degradation*)?
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                    Garantia de Não-Interrupção
                  </span>
                </div>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  Caso a chamada ao modelo Gemini (ADK) falhe por esgotamento de cota (429), instabilidade de rede ou ausência de chave de API no servidor, o sistema <strong>nunca interrompe a análise de crédito do produtor</strong>.
                </p>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  O orquestrador aciona imediatamente a <strong>contingência determinística automática</strong>: o pipeline passa a executar a ordem estrita de políticas com 100% de rigor regulatório, emitindo alertas visuais para que o operador esteja sempre ciente da metodologia em uso.
                </p>
                <div className="mt-2 p-2.5 rounded-lg bg-white/80 border border-amber-200 text-[11px] text-amber-950 flex items-center justify-between">
                  <span>Status da chave Gemini no servidor:</span>
                  <span
                    className={`font-bold font-mono px-2 py-0.5 rounded ${
                      genAiConfigured
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {genAiConfigured ? 'GOOGLE_GENAI_API_KEY Configurada' : 'Ausente (Degradação Graciosa Ativa)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* The 3 Orchestration Modes Matrix */}
          <div>
            <h4 className="font-bold text-xs text-slate-900 mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-600" />
              Matriz Comparativa das Três Metodologias do Sistema
            </h4>
            <div className="space-y-2.5">
              {/* Mode 1: Deterministic */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                <Scale className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">1. Determinística (Regras de Negócio Puras)</strong>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Ordem sequencial imutável: Extração → Geo/CAR → Underwriting → Pricing → Decisão. Risco financeiro e socioambiental calculado estritamente por código, sem nenhuma chamada a LLM.
                  </p>
                </div>
              </div>

              {/* Mode 2: ADK-Sim */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                <Bot className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">2. ADK Simulado (Didático / Demonstração)</strong>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Mesmo motor determinístico, porém emitindo justificativas analíticas pré-computadas em cada passo para validar raciocínio e re-checagem de evidências territoriais.
                  </p>
                </div>
              </div>

              {/* Mode 3: Real ADK */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">3. ADK Root Agent (Gemini 2.0 Flash com Tool-Calling)</strong>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    O Gemini raciocina e seleciona dinamicamente a próxima etapa via chamada nativa de ferramentas (*tool-calling*). O pipeline possui travas de segurança (*Order Enforcement*): a IA propõe, mas a política de crédito aprova a execução. Se a IA falhar, entra em <strong>Degradação Graciosa</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Golden Rules */}
          <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 text-[11px] space-y-1">
            <span className="font-bold text-slate-900 block">
              Princípios de Governança Inegociáveis (Yataí Finance):
            </span>
            <ul className="list-disc list-inside text-slate-600 space-y-0.5">
              <li><strong>Matemática fora do LLM:</strong> CADS, DSCR e LTV nunca são estimados por IA; são calculados por fórmulas matemáticas puras.</li>
              <li><strong>Portão Humano (HITL):</strong> O sistema atua como copiloto; a aprovação formal de crédito é sempre prerrogativa do analista humano.</li>
              <li><strong>Transparência Obrigatória:</strong> O usuário sempre sabe com clareza qual metodologia está operando a análise.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
