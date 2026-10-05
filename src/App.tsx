import React, { useState, useEffect } from 'react';
import { AgentPipeline } from './components/AgentPipeline';
import { ChatConsole } from './components/ChatConsole';
import { FirestoreConsole } from './components/FirestoreConsole';
import { UnderwritingInspector } from './components/UnderwritingInspector';
import { ArchitectureModal } from './components/ArchitectureModal';
import { DriveExplorer } from './components/DriveExplorer';
import { SpecializedAgentsConsole } from './components/SpecializedAgentsConsole';
import { MethodologyModal } from './components/MethodologyModal';
import { ChatMessage, EligibilityRule, OrchestratorId, ProcessState, MethodologyInfo } from './types';
import { DriveFile } from './services/driveService';
import { downloadLoanUnderwritingPdf } from './services/pdfReportGenerator';
import {
  Building2,
  Database,
  ShieldCheck,
  MessageSquare,
  Layers,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  FolderOpen,
  FileDown,
  Cpu,
  Scale,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'agent' | 'agents' | 'drive' | 'firestore' | 'underwriting'>('agent');
  const [activeLoanId, setActiveLoanId] = useState<string>('SBL-2025-02142');
  const [processes, setProcesses] = useState<ProcessState[]>([]);
  const [rules, setRules] = useState<EligibilityRule[]>([]);
  const [internalRecords, setInternalRecords] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [showArchModal, setShowArchModal] = useState<boolean>(false);
  const [showMethodologyModal, setShowMethodologyModal] = useState<boolean>(false);
  const [latestMethodology, setLatestMethodology] = useState<MethodologyInfo | null>(null);
  const [healthStatus, setHealthStatus] = useState<{ genai: 'configured' | 'missing-api-key' } | null>(null);
  const [orchestrator, setOrchestrator] = useState<OrchestratorId>('deterministic');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'agent',
      content:
        "Welcome to Yataí Finance's Credit Intelligence & Loan Processing System.\n\nI am the root Orchestrator coordinating 5 specialized credit intelligence agents across the end-to-end pipeline:\n\n1. Agente de Coleta de Dados — Integração com SCR Bacen, Open Finance, dados de produção (safra/produtividade) e cotações de commodities (CEPEA/CBOT)\n2. Agente de Compliance — Verificação de políticas internas, enquadramento regulatório, listas restritivas e conformidade socioambiental (CAR, DETER, IBAMA)\n3. Agente de Análise de Risco Agro — Fatores climáticos (balanço hídrico, NDVI), sazonalidade de colheita e risco de preço/hedge\n4. Agente de Análise Financeira — Modelagem preditiva de CADS, DSCR safra/entressafra, liquidez e alavancagem\n5. Agente de Parecer — Consolidação multidisciplinar, covenants de mitigação, comitê Human-in-the-Loop e emissão do Laudo Técnico em PDF\n\nEscolha uma aplicação de crédito abaixo ou utilize a aba 'Agentes Especializados' para inspecionar os motores em detalhes:",
      timestamp: new Date().toISOString(),
    },
  ]);

  // Fetch initial data
  useEffect(() => {
    fetchProcesses();
    fetchRules();
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthStatus(data);
      }
    } catch (e) {
      console.error('Error fetching health:', e);
    }
  };

  const fetchProcesses = async () => {
    try {
      const res = await fetch('/api/processes');
      if (res.ok) {
        const data = await res.json();
        setProcesses(data.processes || []);
      }
    } catch (e) {
      console.error('Error fetching processes:', e);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
        setInternalRecords(data.internal_records || {});
      }
    } catch (e) {
      console.error('Error fetching rules:', e);
    }
  };

  const currentProcess = processes.find((p) => p.loan_request_id === activeLoanId) || null;

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, activeLoanId, orchestrator }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      if (data.loanRequestId && data.loanRequestId !== activeLoanId) {
        setActiveLoanId(data.loanRequestId);
      }

      if (data.methodology) {
        setLatestMethodology(data.methodology);
      }

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: data.content,
        timestamp: new Date().toISOString(),
        toolCalls: data.toolCalls || [],
        requiresApproval: data.requiresApproval,
        loanRequestId: data.loanRequestId,
        orchestrator: data.orchestrator,
        methodology: data.methodology,
        degraded: data.degraded,
        degradationReason: data.degradationReason,
      };

      setMessages((prev) => [...prev, agentMsg]);

      // Refresh processes
      await fetchProcesses();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'agent',
          content: `Error executing workflow: ${err.message}. Please check connection or retry.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    handleSendMessage('yes');
  };

  const handleReject = () => {
    handleSendMessage('no');
  };

  const handleSelectSample = (loanId: string, promptText: string) => {
    setActiveLoanId(loanId);
    handleSendMessage(promptText);
  };

  const handleRepairProcess = async (
    loanId: string,
    updatedFields: Record<string, any>,
    stepName: string = 'DocumentExtractionAgent'
  ) => {
    try {
      const res = await fetch(`/api/processes/${loanId}/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_name: stepName,
          updated_fields: updatedFields,
        }),
      });

      if (res.ok) {
        await fetchProcesses();
        const data = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'system',
            content:
              data.status === 'still_blocked'
                ? `Geo verification still blocked for ${loanId}: some findings remain. Add the missing evidence.`
                : `Firestore state repaired for ${stepName} on ${loanId}. Status set to active. Ready to resume.`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.error('Repair error:', e);
    }
  };

  const handleResetProcess = async (loanId: string) => {
    try {
      await fetch(`/api/processes/${loanId}/reset`, { method: 'POST' });
      await fetchProcesses();
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'system',
          content: `State cleared for ${loanId}.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  const handleResumeWorkflow = (loanId: string) => {
    setActiveTab('agent');
    handleSendMessage(`Resume processing for ${loanId}`);
  };

  const handleSelectDriveFileForExtraction = (file: DriveFile) => {
    setActiveTab('agent');
    handleSendMessage(
      `Process loan application document "${file.name}" imported from Google Drive (File ID: ${file.id}) for loan ${activeLoanId}`
    );
  };

  const handleDownloadPdf = () => {
    if (currentProcess) {
      downloadLoanUnderwritingPdf({
        processState: currentProcess,
        rules,
        internalRecords,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-none">
                  Yataí Finance
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">
                  Small Business Loan Agent
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Google ADK Multi-Agent System • Gemini 3.1 Pro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Test Loan Pill */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <span className="px-2 text-slate-400 font-medium">Loan ID:</span>
              <button
                type="button"
                onClick={() => setActiveLoanId('SBL-2025-02142')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeLoanId === 'SBL-2025-02142'
                    ? 'bg-white text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SBL-2025-02142 (Complete)
              </button>
              <button
                type="button"
                onClick={() => setActiveLoanId('SBL-2025-00391')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeLoanId === 'SBL-2025-00391'
                    ? 'bg-white text-amber-800 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SBL-2025-00391 (Incomplete)
              </button>
              <button
                type="button"
                onClick={() => setActiveLoanId('SBL-2025-07788')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeLoanId === 'SBL-2025-07788'
                    ? 'bg-white text-emerald-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SBL-2025-07788 (Agro Clean)
              </button>
              <button
                type="button"
                onClick={() => setActiveLoanId('SBL-2025-08123')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeLoanId === 'SBL-2025-08123'
                    ? 'bg-white text-rose-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SBL-2025-08123 (Agro Blocked)
              </button>
            </div>

            {/* Interactive Methodology & Graceful Degradation Badge */}
            <button
              type="button"
              onClick={() => setShowMethodologyModal(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors shadow-2xs ${
                latestMethodology?.isDegraded || (orchestrator === 'adk' && healthStatus?.genai !== 'configured')
                  ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
                  : orchestrator === 'adk'
                  ? 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
                  : orchestrator === 'adk-sim'
                  ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Transparência Regulatória: Clique para visualizar a metodologia em uso e salvaguardas de contingência"
            >
              {latestMethodology?.isDegraded || (orchestrator === 'adk' && healthStatus?.genai !== 'configured') ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Degradação Graciosa (Caso 2)</span>
                </>
              ) : orchestrator === 'adk' ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>ADK (Gemini 2.0 Flash)</span>
                </>
              ) : orchestrator === 'adk-sim' ? (
                <>
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span>ADK Simulado</span>
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5 text-slate-600" />
                  <span>Determinístico</span>
                </>
              )}
            </button>

            {/* Architecture Modal Button */}
            <button
              type="button"
              onClick={() => setShowArchModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs"
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Architecture</span>
            </button>

            {/* PDF Summary Report Download */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!currentProcess}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-xs font-semibold text-blue-700 transition-colors shadow-xs disabled:opacity-40"
              title="Download PDF Underwriting Report for active loan"
            >
              <FileDown className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Download PDF Report</span>
            </button>
          </div>
        </div>

        {/* Subnav Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 border-t border-slate-100 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('agent')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'agent'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Agent Orchestrator & Chat
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agents')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'agents'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4 text-blue-600" />
            Agentes Especializados (5 Motores)
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
              5
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drive')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'drive'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Google Drive Files
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('firestore')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'firestore'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Firestore State & Repair Console
            {(currentProcess?.overall_status === 'pending_approval' || currentProcess?.overall_status === 'blocked') && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('underwriting')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'underwriting'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Underwriting Rules & Records
          </button>
        </div>
      </header>

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'agent' && (
          <div className="space-y-6">
            {/* Top Workflow Status Banner */}
            <AgentPipeline
              processState={currentProcess}
              rules={rules}
              internalRecords={internalRecords}
              onApprove={handleApprove}
              onReject={handleReject}
              onDownloadPdf={handleDownloadPdf}
            />

            {/* Chat Interaction Interface */}
            <ChatConsole
              messages={messages}
              loading={loading}
              onSendMessage={handleSendMessage}
              onApprove={handleApprove}
              onReject={handleReject}
              onSelectSample={handleSelectSample}
              orchestrator={orchestrator}
              onOrchestratorChange={setOrchestrator}
              genAiConfigured={healthStatus?.genai === 'configured'}
              onOpenMethodologyModal={() => setShowMethodologyModal(true)}
            />
          </div>
        )}

        {activeTab === 'agents' && (
          <SpecializedAgentsConsole
            processState={currentProcess}
            activeLoanId={activeLoanId}
            onDownloadPdf={handleDownloadPdf}
          />
        )}

        {activeTab === 'drive' && (
          <DriveExplorer onSelectFileForExtraction={handleSelectDriveFileForExtraction} />
        )}

        {activeTab === 'firestore' && (
          <FirestoreConsole
            processes={processes}
            activeLoanId={activeLoanId}
            onSelectProcess={(id) => setActiveLoanId(id)}
            onRepairProcess={handleRepairProcess}
            onResetProcess={handleResetProcess}
            onResumeWorkflow={handleResumeWorkflow}
          />
        )}

        {activeTab === 'underwriting' && (
          <UnderwritingInspector
            rules={rules}
            internalRecords={internalRecords}
            currentProcess={currentProcess}
            onDownloadPdf={handleDownloadPdf}
          />
        )}
      </main>

      {/* Architecture Overview Modal */}
      <ArchitectureModal isOpen={showArchModal} onClose={() => setShowArchModal(false)} />

      {/* Methodology & Graceful Degradation Transparency Modal */}
      <MethodologyModal
        isOpen={showMethodologyModal}
        onClose={() => setShowMethodologyModal(false)}
        activeMethodology={latestMethodology || currentProcess?.methodology}
        activeOrchestrator={orchestrator}
        genAiConfigured={healthStatus?.genai === 'configured'}
      />
    </div>
  );
}
