import React, { useState, useEffect } from 'react';
import { AgentPipeline } from './components/AgentPipeline';
import { ChatConsole } from './components/ChatConsole';
import { FirestoreConsole } from './components/FirestoreConsole';
import { UnderwritingInspector } from './components/UnderwritingInspector';
import { ArchitectureModal } from './components/ArchitectureModal';
import { ChatMessage, EligibilityRule, ProcessState } from './types';
import {
  Building2,
  Database,
  ShieldCheck,
  MessageSquare,
  Layers,
  FileCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'agent' | 'firestore' | 'underwriting'>('agent');
  const [activeLoanId, setActiveLoanId] = useState<string>('SBL-2025-02142');
  const [processes, setProcesses] = useState<ProcessState[]>([]);
  const [rules, setRules] = useState<EligibilityRule[]>([]);
  const [internalRecords, setInternalRecords] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [showArchModal, setShowArchModal] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'agent',
      content:
        "Welcome to Cymbal Bank's Small Business Loan Processing System.\n\nI am the root Orchestrator coordinating 4 specialized sub-agents:\n1. DocumentExtractionAgent — Multimodal PDF extraction\n2. UnderwritingAgent — Cymbal Bank records & 5 lending eligibility rules\n3. PricingAgent — Risk-based interest rates & amortization terms\n4. LoanDecisionAgent — Human-in-the-Loop decision finalization\n\nChoose a sample application below to begin:",
      timestamp: new Date().toISOString(),
    },
  ]);

  // Fetch initial data
  useEffect(() => {
    fetchProcesses();
    fetchRules();
  }, []);

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
        body: JSON.stringify({ message: text, activeLoanId }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      if (data.loanRequestId && data.loanRequestId !== activeLoanId) {
        setActiveLoanId(data.loanRequestId);
      }

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: data.content,
        timestamp: new Date().toISOString(),
        toolCalls: data.toolCalls || [],
        requiresApproval: data.requiresApproval,
        loanRequestId: data.loanRequestId,
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

  const handleRepairProcess = async (loanId: string, updatedFields: Record<string, any>) => {
    try {
      const res = await fetch(`/api/processes/${loanId}/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_name: 'DocumentExtractionAgent',
          updated_fields: updatedFields,
        }),
      });

      if (res.ok) {
        await fetchProcesses();
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'system',
            content: `Firestore State Repaired: loan_amount_requested set to ${updatedFields.loan_amount_requested} for ${loanId}. Status set to active. Ready to resume.`,
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
                  Cymbal Bank
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
            </div>

            {/* Architecture Modal Button */}
            <button
              type="button"
              onClick={() => setShowArchModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs"
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Architecture</span>
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
            onClick={() => setActiveTab('firestore')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'firestore'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Firestore State & Repair Console
            {currentProcess?.overall_status === 'pending_approval' && (
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
            <AgentPipeline processState={currentProcess} />

            {/* Chat Interaction Interface */}
            <ChatConsole
              messages={messages}
              loading={loading}
              onSendMessage={handleSendMessage}
              onApprove={handleApprove}
              onReject={handleReject}
              onSelectSample={handleSelectSample}
            />
          </div>
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
          <UnderwritingInspector rules={rules} internalRecords={internalRecords} />
        )}
      </main>

      {/* Architecture Overview Modal */}
      <ArchitectureModal isOpen={showArchModal} onClose={() => setShowArchModal(false)} />
    </div>
  );
}
