import React from 'react';
import { X, Layers, Cpu, Shield, Database, UserCheck, RefreshCw, GitBranch } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                System Architecture & Multi-Agent Pattern
              </h3>
              <p className="text-xs text-slate-500">
                Google Agent Development Kit (ADK) Sequential Multi-Agent Architecture
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          {/* Sequential Workflow Steps */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Sequential Multi-Agent Execution Flow
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold mb-1.5">
                  Step 1
                </span>
                <p className="font-semibold text-slate-800">DocumentExtraction</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Multimodal extraction of business info, financials & loan amounts.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="inline-block px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold mb-1.5">
                  Step 2
                </span>
                <p className="font-semibold text-slate-800">UnderwritingAgent</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Validates against Cymbal Bank internal records & checks 5 lending rules.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold mb-1.5">
                  Step 3
                </span>
                <p className="font-semibold text-slate-800">PricingAgent</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Calculates interest rate based on risk tiers (Tier 1-4) & monthly payments.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold mb-1.5">
                  Step 4
                </span>
                <p className="font-semibold text-slate-800">LoanDecisionAgent</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Triggered strictly after Human Approval (HITL) to issue official decision letter.
                </p>
              </div>
            </div>
          </div>

          {/* Key Capabilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
              <div className="flex items-center gap-2 text-blue-700 font-medium text-xs">
                <UserCheck className="w-4 h-4" />
                Human-in-the-Loop (HITL) Gate
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The orchestrator halts execution after the Pricing step, presents a structured
                summary to the user, and waits for explicit approval before calling the Loan Decision agent.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-700 font-medium text-xs">
                <RefreshCw className="w-4 h-4" />
                Repair & Resume Support
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If documents have missing critical fields, the agent stops and writes issues to
                Firestore. An operator repairs the data offline, and the workflow resumes from the checkpoint.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
              <div className="flex items-center gap-2 text-amber-700 font-medium text-xs">
                <Shield className="w-4 h-4" />
                Before / After Callbacks
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                State checks before each tool call enforce prerequisites. After-agent callbacks persist
                validated Pydantic models directly to Firestore collection <code className="bg-slate-100 px-1 py-0.5 rounded">process_states</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-700 font-medium text-xs">
                <Cpu className="w-4 h-4" />
                LLM-as-Judge Validation Gate
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates trajectory correctness and data grounding, ensuring no fabricated numbers
                or unauthorized tool executions before final responses reach the client.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
