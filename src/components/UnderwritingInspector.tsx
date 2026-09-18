import React from 'react';
import { EligibilityRule } from '../types';
import { ShieldCheck, Database, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface UnderwritingInspectorProps {
  rules: EligibilityRule[];
  internalRecords: Record<string, any>;
}

export const UnderwritingInspector: React.FC<UnderwritingInspectorProps> = ({
  rules,
  internalRecords,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-900">
            Underwriting Knowledge Base & Rules Engine
          </h2>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          eligibility_rules.json ({rules.length} rules)
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Rules section */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Business Lending Decision Rules
          </h3>
          <div className="space-y-2.5">
            {rules.map((rule) => {
              const isEligible = rule.action === 'ELIGIBLE';
              const isReview = rule.action === 'REVIEW';
              const isIneligible = rule.action === 'INELIGIBLE';

              return (
                <div
                  key={rule.id}
                  className="p-3.5 rounded-lg border border-slate-200/90 bg-white hover:border-slate-300 transition-colors text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 font-semibold">{rule.id}</span>
                      <span className="text-slate-800 font-medium">{rule.description}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        isEligible
                          ? 'bg-emerald-100 text-emerald-800'
                          : isReview
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {rule.action}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                    Conditions: {JSON.stringify(rule.conditions)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cymbal Bank Internal Records */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              Cymbal Bank Internal Business Profiles (Mock DB)
            </h3>
          </div>
          <div className="space-y-3">
            {Object.entries(internalRecords).map(([id, rec]) => (
              <div
                key={id}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-semibold text-blue-600">{id}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-medium">
                    Credit Score: {rec.credit_score} (Standing: {rec.account_standing})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400">Business:</span> {rec.business_name} ({rec.business_type})
                  </div>
                  <div>
                    <span className="text-slate-400">Owner:</span> {rec.owner_name}
                  </div>
                  <div>
                    <span className="text-slate-400">EIN:</span> {rec.ein}
                  </div>
                  <div>
                    <span className="text-slate-400">Industry:</span> {rec.industry} ({rec.years_in_business} yrs)
                  </div>
                  <div>
                    <span className="text-slate-400">Annual Revenue:</span> {rec.annual_revenue}
                  </div>
                  <div>
                    <span className="text-slate-400">Net Profit:</span> {rec.net_profit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
