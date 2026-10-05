import React, { useState } from 'react';
import { EligibilityRule, ProcessState, StepName, StepStatus } from '../types';
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
  Globe,
  UserCheck,
  Check,
  X,
  FileDown,
} from 'lucide-react';
import { downloadLoanUnderwritingPdf } from '../services/pdfReportGenerator';

interface AgentPipelineProps {
  processState: ProcessState | null;
  rules?: EligibilityRule[];
  internalRecords?: Record<string, any>;
  onSelectStep?: (step: StepName) => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDownloadPdf?: () => void;
}

const AGENTS: Array<{
  id: StepName;
  stepNumber: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}> = [
  {
    id: 'DocumentExtractionAgent',
    stepNumber: '01',
    title: 'Extração & Coleta de Dados',
    subtitle: 'Extrai formulário e coleta dados do SCR Bacen, Open Finance, safra e commodities',
    icon: FileText,
  },
  {
    id: 'GeoVerificationAgent',
    stepNumber: '02',
    title: 'Geo-Verificação & Compliance',
    subtitle: 'Audita polígonos CAR, desmatamento DETER, embargos IBAMA e políticas regulatórias',
    icon: Globe,
  },
  {
    id: 'UnderwritingAgent',
    stepNumber: '03',
    title: 'Risco Agro, Financeiro & Underwriting',
    subtitle: 'Modelagem de CADS, DSCR safra/entressafra, clima NDVI e regras de elegibilidade',
    icon: ShieldCheck,
  },
  {
    id: 'PricingAgent',
    stepNumber: '04',
    title: 'Precificação & Estruturação de Taxa',
    subtitle: 'Determina rating de risco, taxa APR e condições de amortização',
    icon: Calculator,
  },
  {
    id: 'LoanDecisionAgent',
    stepNumber: '05',
    title: 'Agente de Parecer & Deliberação HITL',
    subtitle: 'Consolida parecer executivo, covenants contratuais e dossiê técnico final',
    icon: Award,
  },
];

export const AgentPipeline: React.FC<AgentPipelineProps> = ({
  processState,
  rules,
  internalRecords,
  onApprove,
  onReject,
  onDownloadPdf,
}) => {
  const [expandedStep, setExpandedStep] = useState<StepName | null>(null);

  const handleDownloadPdf = () => {
    if (!processState) return;
    if (onDownloadPdf) {
      onDownloadPdf();
    } else {
      downloadLoanUnderwritingPdf({
        processState,
        rules,
        internalRecords,
      });
    }
  };

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

  // Determine HITL status between Pricing (03) and Loan Decision (04)
  const pricingStatus = processState?.steps.PricingAgent?.status;
  const decisionStatus = processState?.steps.LoanDecisionAgent?.status;
  const isPendingHumanApproval =
    pricingStatus === 'completed' &&
    (decisionStatus === 'not_started' || decisionStatus === 'pending_approval');
  const isHumanApproved =
    decisionStatus === 'completed' || decisionStatus === 'approved' || decisionStatus === 'in_progress';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
            Multi-Agent Orchestration Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sequential 5-agent workflow with geo-environmental gate, HITL approval & state persistence
          </p>
        </div>
        {processState && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors"
              title="Generate and download complete PDF summary report of underwriting decision, processed rules, and supporting evidence"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Download PDF Report</span>
            </button>
            <span className="text-xs text-slate-500 font-mono">
              Ref: <strong className="text-slate-800">{processState.loan_request_id}</strong>
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-medium uppercase ${
                processState.overall_status === 'completed' || processState.overall_status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : processState.overall_status === 'rejected'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : processState.overall_status === 'blocked'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : processState.overall_status === 'pending_approval'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : processState.overall_status === 'failed'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : processState.overall_status === 'created'
                  ? 'bg-slate-50 text-slate-600 border border-slate-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {processState.overall_status.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {AGENTS.map((agent) => {
          const stepState = processState?.steps[agent.id];
          const isCurrent = processState?.current_step === agent.id;
          const isExpanded = expandedStep === agent.id;
          const hasData = stepState && stepState.data;
          const Icon = agent.icon;

          return (
            <React.Fragment key={agent.id}>
              <div
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
                          {agent.stepNumber}
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
                      <div className="flex items-center gap-2">
                        {agent.id === 'LoanDecisionAgent' && (
                          <button
                            type="button"
                            onClick={handleDownloadPdf}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                            title="Download complete PDF summary report"
                          >
                            <FileDown className="w-3 h-3" />
                            PDF Report
                          </button>
                        )}
                        {stepState.completed_at && (
                          <span className="text-[11px] text-slate-400">
                            {new Date(stepState.completed_at).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <pre className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 font-mono text-[11px] overflow-x-auto max-h-52 leading-relaxed">
                      {JSON.stringify(stepState.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Human-in-the-Loop Review Step after 04 Pricing Agent */}
              {agent.id === 'PricingAgent' && (
                <div
                  className={`px-5 py-3 transition-colors border-l-4 ${
                    isPendingHumanApproval
                      ? 'bg-amber-50/70 border-l-amber-500'
                      : isHumanApproved
                      ? 'bg-emerald-50/30 border-l-emerald-500'
                      : 'bg-slate-50/60 border-l-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isPendingHumanApproval
                            ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400/40 animate-pulse'
                            : isHumanApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700">
                            HITL
                          </span>
                          <h3 className="text-sm font-semibold text-slate-800">
                            Human-in-the-Loop Gate
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Loan officer reviews pricing terms & grants approval before decision finalization
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {isHumanApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Approved by Operator
                        </span>
                      ) : isPendingHumanApproval ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Awaiting Approval
                          </span>
                          {onApprove && onReject && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={onApprove}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={onReject}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Waiting on Step 04
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Decision Finalization Banner after Step 05 Loan Decision */}
              {agent.id === 'LoanDecisionAgent' &&
                (stepState?.status === 'completed' ||
                  stepState?.status === 'approved' ||
                  processState?.overall_status === 'approved' ||
                  processState?.overall_status === 'completed') && (
                  <div className="px-5 py-3.5 bg-emerald-50/70 border-l-4 border-l-emerald-600 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-900">
                            DECISION RECORD
                          </span>
                          <h3 className="text-sm font-semibold text-emerald-950 truncate">
                            Official Loan Underwriting Decision Letter Generated
                          </h3>
                        </div>
                        <p className="text-xs text-emerald-800/80 mt-0.5 truncate">
                          {stepState?.data?.message ||
                            'Approved with structured covenants and formal conditions precedent.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors shrink-0"
                    >
                      <FileDown className="w-4 h-4" />
                      Download Official Decision PDF
                    </button>
                  </div>
                )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
