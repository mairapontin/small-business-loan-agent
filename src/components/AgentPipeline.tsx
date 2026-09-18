import React, { useState } from 'react';
import { ProcessState, StepName, StepStatus } from '../types';
import {
  FileText,
  ShieldCheck,
  Calculator,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

interface AgentPipelineProps {
  processState: ProcessState | null;
  onSelectStep?: (step: StepName) => void;
}

const AGENTS: Array<{
  id: StepName;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}> = [
  {
    id: 'DocumentExtractionAgent',
    title: 'Document Extraction',
    subtitle: 'Extracts loan application details & validates critical fields',
    icon: FileText,
  },
  {
    id: 'UnderwritingAgent',
    title: 'Underwriting Agent',
    subtitle: 'Checks rules & verifies against Cymbal Bank internal records',
    icon: ShieldCheck,
  },
  {
    id: 'PricingAgent',
    title: 'Pricing Agent',
    subtitle: 'Determines risk tier, interest rates & amortization terms',
    icon: Calculator,
  },
  {
    id: 'LoanDecisionAgent',
    title: 'Loan Decision Agent',
    subtitle: 'Finalizes decision letter upon Human-in-the-Loop approval',
    icon: Award,
  },
];

export const AgentPipeline: React.FC<AgentPipelineProps> = ({ processState }) => {
  const [expandedStep, setExpandedStep] = useState<StepName | null>(null);

  const getStatusBadge = (status?: StepStatus) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Running
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Pending Approval / Review
          </span>
        );
      case 'rejected':
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Error / Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
            Multi-Agent Orchestration Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sequential 4-agent workflow with HITL approval & state persistence
          </p>
        </div>
        {processState && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">
              Ref: <strong className="text-slate-800">{processState.loan_request_id}</strong>
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-medium uppercase ${
                processState.overall_status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : processState.overall_status === 'pending_approval'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {processState.overall_status.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {AGENTS.map((agent, index) => {
          const stepState = processState?.steps[agent.id];
          const isCurrent = processState?.current_step === agent.id;
          const isExpanded = expandedStep === agent.id;
          const hasData = stepState && stepState.data;
          const Icon = agent.icon;

          return (
            <div
              key={agent.id}
              className={`transition-colors ${
                isCurrent ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'
              }`}
            >
              <div
                className="px-5 py-3.5 flex items-center justify-between cursor-pointer gap-4"
                onClick={() => setExpandedStep(isExpanded ? null : agent.id)}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      stepState?.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : stepState?.status === 'pending_approval'
                        ? 'bg-amber-100 text-amber-700'
                        : isCurrent
                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400/30'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">
                        0{index + 1}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-800 truncate">
                        {agent.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {agent.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {getStatusBadge(stepState?.status)}
                  {hasData && (
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-600 p-1"
                      aria-label="Toggle agent details"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible output viewer */}
              {isExpanded && hasData && (
                <div className="px-5 pb-4 pt-1 bg-slate-50/70 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      Output Schema Data ({agent.id}_output)
                    </span>
                    {stepState.completed_at && (
                      <span className="text-[11px] text-slate-400">
                        {new Date(stepState.completed_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <pre className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 font-mono text-[11px] overflow-x-auto max-h-52 leading-relaxed">
                    {JSON.stringify(stepState.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
