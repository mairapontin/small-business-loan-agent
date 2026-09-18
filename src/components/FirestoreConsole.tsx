import React, { useState } from 'react';
import { ProcessState, StepName } from '../types';
import {
  Database,
  Wrench,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
  FileCode,
  Check,
} from 'lucide-react';

interface FirestoreConsoleProps {
  processes: ProcessState[];
  activeLoanId: string;
  onSelectProcess: (loanId: string) => void;
  onRepairProcess: (loanId: string, updatedFields: Record<string, any>) => Promise<void>;
  onResetProcess: (loanId: string) => Promise<void>;
  onResumeWorkflow: (loanId: string) => void;
}

export const FirestoreConsole: React.FC<FirestoreConsoleProps> = ({
  processes,
  activeLoanId,
  onSelectProcess,
  onRepairProcess,
  onResetProcess,
  onResumeWorkflow,
}) => {
  const activeProcess = processes.find((p) => p.loan_request_id === activeLoanId) || processes[0];

  // Repair form state
  const [loanAmount, setLoanAmount] = useState('$150,000');
  const [repairing, setRepairing] = useState(false);
  const [repairSuccess, setRepairSuccess] = useState(false);

  const hasUnresolvedIssues = activeProcess?.issues?.some((i) => !i.resolved);
  const isPendingApproval = activeProcess?.overall_status === 'pending_approval';

  const handleRepairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProcess) return;
    setRepairing(true);
    try {
      await onRepairProcess(activeProcess.loan_request_id, {
        loan_amount_requested: loanAmount,
      });
      setRepairSuccess(true);
      setTimeout(() => setRepairSuccess(false), 3000);
    } finally {
      setRepairing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-900">
            Firestore Database: <span className="font-mono text-blue-600 font-normal">small-business-loan-states</span>
          </h2>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
          Collection: process_states
        </span>
      </div>

      {/* Main Content Layout: Document Selector + State Inspector */}
      <div className="flex-1 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100 overflow-hidden">
        {/* Left Column: Documents list */}
        <div className="w-full sm:w-56 bg-slate-50/50 p-3 overflow-y-auto shrink-0">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
            Documents ({processes.length})
          </p>
          <div className="space-y-1">
            {processes.map((proc) => {
              const isSelected = proc.loan_request_id === activeProcess?.loan_request_id;
              const hasIssues = proc.issues.some((i) => !i.resolved);

              return (
                <button
                  key={proc.loan_request_id}
                  onClick={() => onSelectProcess(proc.loan_request_id)}
                  type="button"
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white font-medium shadow-xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="truncate">{proc.loan_request_id}</span>
                  {hasIssues ? (
                    <AlertTriangle
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-amber-200' : 'text-amber-500'
                      }`}
                    />
                  ) : proc.overall_status === 'completed' ? (
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-emerald-200' : 'text-emerald-500'
                      }`}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {activeProcess && (
            <div className="mt-4 pt-3 border-t border-slate-200 px-1">
              <button
                type="button"
                onClick={() => onResetProcess(activeProcess.loan_request_id)}
                className="w-full text-left text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1.5 py-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset this document
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Document details & Repair Action */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {!activeProcess ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
              <FolderTree className="w-8 h-8 mb-2 opacity-50" />
              No process document selected or initialized yet.
            </div>
          ) : (
            <>
              {/* Repair Tool Banner if pending approval */}
              {isPendingApproval && hasUnresolvedIssues && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2.5">
                    <Wrench className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-amber-900">
                        Repair & Resume Needed (Pause Step Active)
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Workflow paused due to missing critical fields in DocumentExtractionAgent.
                        Fill in the missing data below to repair Firestore state and resume the pipeline.
                      </p>

                      <form onSubmit={handleRepairSubmit} className="mt-3 flex flex-wrap items-center gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-amber-900 mb-0.5">
                            loan_amount_requested:
                          </label>
                          <input
                            type="text"
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(e.target.value)}
                            placeholder="$150,000"
                            className="bg-white border border-amber-300 rounded px-2.5 py-1 text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div className="flex items-end gap-2 mt-3 sm:mt-0">
                          <button
                            type="submit"
                            disabled={repairing}
                            className="px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {repairing ? 'Saving to Firestore...' : '1. Save Repair in Firestore'}
                          </button>
                        </div>
                      </form>

                      {repairSuccess && (
                        <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Document repaired! You can now resume processing.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Resume Trigger button if repaired */}
              {activeProcess.overall_status === 'active' &&
                activeProcess.steps.DocumentExtractionAgent.status === 'completed' &&
                activeProcess.steps.UnderwritingAgent.status === 'not_started' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-emerald-900">
                        Document Repaired & Ready to Resume!
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        DocumentExtractionAgent data is valid. Resume pipeline from UnderwritingAgent.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onResumeWorkflow(activeProcess.loan_request_id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      2. Resume Workflow
                    </button>
                  </div>
                )}

              {/* JSON document state inspector */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-blue-600" />
                    Firestore Document: {activeProcess.loan_request_id}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Updated: {new Date(activeProcess.updated_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex-1 bg-slate-900 text-emerald-400 p-3.5 rounded-lg font-mono text-[11px] overflow-auto leading-relaxed border border-slate-800">
                  <pre>{JSON.stringify(activeProcess, null, 2)}</pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
