/**
 * @module: Small Business Loan Agent
 * @file: src/components/ChatConsole.tsx
 * @description: Chat console component with orchestrator driver selector
 * @author: Maíra Pontin
 * @created: 2025-09-21
 * @updated: 260923_032530
 * @version: 1.1.0
 * @reviewer:
 * @ai_reviewer:
 * @reviewer_date:
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, OrchestratorId } from '../types';
import {
  Send,
  Bot,
  User,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Terminal,
  AlertCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  HelpCircle,
  ShieldCheck,
  Scale,
} from 'lucide-react';

interface ChatConsoleProps {
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (text: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onSelectSample: (loanId: string, promptText: string) => void;
  orchestrator: OrchestratorId;
  onOrchestratorChange: (id: OrchestratorId) => void;
  genAiConfigured?: boolean;
  onOpenMethodologyModal?: () => void;
}

const DRIVERS: { id: OrchestratorId; label: string; hint: string }[] = [
  {
    id: 'deterministic',
    label: 'Deterministic',
    hint: 'Walks the fixed step order with no narration.',
  },
  {
    id: 'adk-sim',
    label: 'ADK-sim',
    hint: 'Reasons about which agent runs next and re-verifies repaired evidence.',
  },
  {
    id: 'adk',
    label: 'ADK',
    hint: 'Real Gemini tool-calling with multi-turn reasoning (requires API key).',
  },
];

export interface DegradationDetails {
  badgeLabel: string;
  badgeType: 'MISSING_API_KEY' | 'RATE_LIMIT' | 'API_ERROR' | 'RULE_FALLBACK';
  headline: string;
  description: string;
}

export function detectDegradation(msg: ChatMessage): DegradationDetails | null {
  if (msg.role !== 'agent') return null;

  const explicitDegraded = Boolean(msg.degraded || msg.methodology?.isDegraded);
  const text = msg.content || '';

  const hasMissingKey =
    text.includes('GOOGLE_GENAI_API_KEY not set') ||
    Boolean(
      msg.degradationReason &&
        (msg.degradationReason.includes('API_KEY') ||
          msg.degradationReason.includes('Chave de API') ||
          msg.degradationReason.includes('não configurada'))
    );

  const hasRateLimit =
    text.includes('429') ||
    text.includes('Quota Exceeded') ||
    text.includes('Rate limit exceeded') ||
    Boolean(
      msg.degradationReason &&
        (msg.degradationReason.includes('429') ||
          msg.degradationReason.includes('cota') ||
          msg.degradationReason.includes('Quota'))
    );

  const hasApiError =
    text.includes('Gemini API error') ||
    text.includes('Gemini error in multi-turn') ||
    text.includes('network access is disabled') ||
    text.includes('AVISO DE DEGRADAÇÃO GRACIOSA') ||
    text.includes('falling back to deterministic');

  if (!explicitDegraded && !hasMissingKey && !hasRateLimit && !hasApiError) {
    return null;
  }

  if (hasRateLimit) {
    return {
      badgeLabel: 'Cota da API Excedida (HTTP 429)',
      badgeType: 'RATE_LIMIT',
      headline: 'Degradação Graciosa: Limite de Requisições Atingido',
      description:
        msg.degradationReason ||
        'A cota ou limite de chamadas ao Gemini 2.0 Flash foi atingido. Para não interromper a análise de crédito, o orquestrador transferiu a execução para o motor de regras determinísticas.',
    };
  }

  if (hasMissingKey) {
    return {
      badgeLabel: 'Chave de API Ausente',
      badgeType: 'MISSING_API_KEY',
      headline: 'Degradação Graciosa: GOOGLE_GENAI_API_KEY Não Configurada',
      description:
        msg.degradationReason ||
        'A variável GOOGLE_GENAI_API_KEY não foi configurada no ambiente. O sistema acionou a contingência determinística automática garantindo o processamento completo do dossiê.',
    };
  }

  let extractedError = '';
  const match = text.match(/Gemini API error:\s*([^;\n]+)/);
  if (match) extractedError = match[1];

  return {
    badgeLabel: 'Falha Temporária na API Gemini',
    badgeType: 'API_ERROR',
    headline: 'Degradação Graciosa: Falha na Resposta de IA',
    description:
      msg.degradationReason ||
      (extractedError
        ? `A chamada ao Gemini falhou (${extractedError}). O mecanismo de trava (failure latch) transferiu os passos restantes para regras determinísticas.`
        : 'Instabilidade de conexão ou resposta inválida na API do Gemini. A esteira foi completada com segurança pelo motor determinístico.'),
  };
}

export const ChatConsole: React.FC<ChatConsoleProps> = ({
  messages,
  loading,
  onSendMessage,
  onApprove,
  onReject,
  onSelectSample,
  orchestrator,
  onOrchestratorChange,
  genAiConfigured,
  onOpenMethodologyModal,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const lastMessage = messages[messages.length - 1];
  const waitingForApproval = lastMessage?.requiresApproval && !loading;

  const lastAgentMsg = [...messages].reverse().find((m) => m.role === 'agent');
  const lastDegradation = lastAgentMsg ? detectDegradation(lastAgentMsg) : null;
  const isGlobalDegradedActive =
    (orchestrator === 'adk' && !genAiConfigured) || Boolean(lastDegradation);

  const driverLabel = (id?: OrchestratorId) =>
    DRIVERS.find((d) => d.id === id)?.label;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              Small Business Loan Orchestrator
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            </h2>
            <p className="text-[11px] text-slate-500">
              Gemini-powered ADK Multi-Agent System
            </p>
          </div>
        </div>

        {/* Quick action chips */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectSample('SBL-2025-02142', 'Process this loan application for SBL-2025-02142')}
            className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 transition-colors"
          >
            Happy Path (Complete)
          </button>
          <button
            type="button"
            onClick={() => onSelectSample('SBL-2025-00391', 'Process this application for SBL-2025-00391')}
            className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-700 text-slate-600 transition-colors"
          >
            Pause Flow (Incomplete)
          </button>
          <button
            type="button"
            onClick={() => onSelectSample('SBL-2025-07788', 'Process this loan application for SBL-2025-07788')}
            className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-700 text-slate-600 transition-colors"
          >
            Agro MT (Clean)
          </button>
          <button
            type="button"
            onClick={() => onSelectSample('SBL-2025-08123', 'Process this loan application for SBL-2025-08123')}
            className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-rose-400 hover:text-rose-700 text-slate-600 transition-colors"
          >
            Agro MT (Blocked)
          </button>
        </div>
      </div>

      {/* Orchestration driver selector */}
      <div className="px-5 py-2 border-b border-slate-100 bg-white flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Driver
          </span>
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
            {DRIVERS.map((d) => {
              const active = orchestrator === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  title={d.hint}
                  disabled={loading}
                  onClick={() => onOrchestratorChange(d.id)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    active
                      ? 'bg-white text-blue-700 shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {orchestrator === 'adk' && !genAiConfigured && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-medium animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Sem API Key: O modo ADK ativará a <strong>Degradação Graciosa (Caso 2)</strong></span>
            </div>
          )}

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {DRIVERS.find((d) => d.id === orchestrator)?.hint}
          </span>
        </div>

        {onOpenMethodologyModal && (
          <button
            type="button"
            onClick={onOpenMethodologyModal}
            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Metodologia & Transparência
          </button>
        )}
      </div>

      {/* Sticky Global Degradation Alert Banner */}
      {isGlobalDegradedActive && (
        <div className="px-5 py-2.5 bg-amber-50/95 border-b border-amber-300 flex items-center justify-between flex-wrap gap-2 text-xs text-amber-950 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Alerta de Degradação Ativo (Caso 2):</strong> O pipeline está operando em <strong>contingência determinística automática</strong>. Análise de crédito, verificação CAR e cálculos matemáticos continuam 100% ativos.
            </span>
          </div>
          {onOpenMethodologyModal && (
            <button
              type="button"
              onClick={onOpenMethodologyModal}
              className="text-amber-900 hover:text-amber-950 font-bold text-[11px] underline flex items-center gap-1 ml-auto shrink-0"
            >
              Entenda o Fallback
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Messages stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => {
          const isAgent = msg.role === 'agent';
          const isSystem = msg.role === 'system';
          const degradation = isAgent ? detectDegradation(msg) : null;

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isAgent ? 'justify-start' : 'justify-end'}`}
            >
              {isAgent && (
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  isAgent
                    ? 'bg-slate-50 border border-slate-200/80 text-slate-800'
                    : 'bg-blue-600 text-white shadow-xs'
                }`}
              >
                {/* Bubble Header for Agent */}
                {isAgent && (
                  <div className="mb-2.5 pb-2 border-b border-slate-200/60 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        Yataí Loan Orchestrator
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {degradation ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs animate-pulse"
                        title={degradation.description}
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        FALLBACK: {degradation.badgeLabel.toUpperCase()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {msg.orchestrator === 'adk'
                          ? '✨ ADK (Gemini 2.0)'
                          : msg.orchestrator === 'adk-sim'
                          ? '🤖 ADK Simulado'
                          : '⚖️ Regras Determinísticas'}
                      </span>
                    )}
                  </div>
                )}

                {/* Tool call timeline if any */}
                {isAgent && msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mb-3 pb-3 border-b border-slate-200/70 space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Agent Tool Trajectory
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.toolCalls.map((tc, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono ${
                            tc.status === 'success'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tc.status === 'halted'
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : tc.status === 'error'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                          }`}
                        >
                          <Terminal className="w-3 h-3 opacity-70" />
                          {tc.tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alerta Proeminente de Caso 2: Degradação Graciosa com UI Badge Explicativo */}
                {isAgent && degradation && (
                  <div className="mb-3.5 p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-950 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs uppercase tracking-wider text-amber-900">
                              Alerta de Degradação Graciosa (Caso 2)
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200 text-amber-950 border border-amber-300">
                              <ArrowRight className="w-3 h-3 text-amber-700" />
                              ADK → Regras Determinísticas
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${
                              degradation.badgeType === 'MISSING_API_KEY'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : degradation.badgeType === 'RATE_LIMIT'
                                ? 'bg-rose-100 text-rose-900 border-rose-300'
                                : 'bg-orange-100 text-orange-900 border-orange-300'
                            }`}
                          >
                            {degradation.badgeLabel}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white/85 border border-amber-200 text-xs">
                          <span className="font-semibold text-amber-950 block mb-0.5">
                            Motivo do Fallback para Regras Determinísticas:
                          </span>
                          <p className="text-amber-800 leading-relaxed text-[11px]">
                            {degradation.description}
                          </p>
                        </div>

                        <div className="pt-0.5 flex items-center justify-between flex-wrap gap-2 text-[11px] text-amber-900">
                          <div className="flex items-center gap-1.5 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>
                              <strong>Garantia Regulatória:</strong> Todas as 5 etapas, regras de corte e checagens CAR/DETER continuam 100% auditáveis.
                            </span>
                          </div>
                          {onOpenMethodologyModal && (
                            <button
                              type="button"
                              onClick={onOpenMethodologyModal}
                              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline inline-flex items-center gap-0.5 ml-auto"
                            >
                              Saiba mais
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* HITL interactive action prompt */}
                {isAgent && msg.requiresApproval && (
                  <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={onApprove}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve Loan
                    </button>
                    <button
                      type="button"
                      onClick={onReject}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium text-xs transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject Application
                    </button>
                  </div>
                )}

                {/* Message footer with exact methodology badge */}
                <div
                  className={`text-[10px] mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2 ${
                    isAgent ? 'text-slate-500' : 'text-blue-100'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isAgent && (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] ${
                          degradation
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                            : msg.orchestrator === 'adk'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200 font-medium'
                            : msg.orchestrator === 'adk-sim'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200 font-medium'
                            : 'bg-slate-200 text-slate-700 border border-slate-300 font-medium'
                        }`}
                      >
                        {degradation ? (
                          <>
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                            Degradação Graciosa: {degradation.badgeLabel}
                          </>
                        ) : msg.orchestrator === 'adk' ? (
                          <>
                            <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                            ADK (Gemini Tool-Calling)
                          </>
                        ) : msg.orchestrator === 'adk-sim' ? (
                          <>
                            <Bot className="w-2.5 h-2.5 text-blue-600" />
                            ADK Simulado
                          </>
                        ) : (
                          <>
                            <Scale className="w-2.5 h-2.5 text-slate-600" />
                            Regras Determinísticas
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {isAgent && onOpenMethodologyModal && (
                    <button
                      type="button"
                      onClick={onOpenMethodologyModal}
                      className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
                    >
                      <HelpCircle className="w-3 h-3" />
                      Metodologia
                    </button>
                  )}
                </div>
              </div>

              {!isAgent && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500 animate-spin" />
              <span>Coordinating sub-agents & checking Firestore state...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          Try:
        </span>
        <button
          type="button"
          onClick={() => onSendMessage('Process this loan application for SBL-2025-02142')}
          disabled={loading}
          className="shrink-0 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Process SBL-2025-02142
        </button>
        <button
          type="button"
          onClick={() => onSendMessage('Process this application for SBL-2025-00391')}
          disabled={loading}
          className="shrink-0 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Process SBL-2025-00391 (Incomplete)
        </button>
        <button
          type="button"
          onClick={() => onSendMessage('Resume processing for SBL-2025-00391')}
          disabled={loading}
          className="shrink-0 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Resume SBL-2025-00391
        </button>
        <button
          type="button"
          onClick={() => onSendMessage('Process this loan application for SBL-2025-08123')}
          disabled={loading}
          className="shrink-0 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Process SBL-2025-08123 (Agro Blocked)
        </button>
        <button
          type="button"
          onClick={() => onSendMessage('Resume processing for SBL-2025-08123')}
          disabled={loading}
          className="shrink-0 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Resume SBL-2025-08123 (after geo repair)
        </button>
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            waitingForApproval
              ? 'Type "yes" to approve or "no" to reject...'
              : 'Ask agent or enter "Process this loan application for SBL-..."'
          }
          disabled={loading}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
