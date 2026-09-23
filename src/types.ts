export interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface LoanApplicationData {
  business_name: string;
  business_type: string;
  ein: string;
  industry: string;
  years_in_business: string;
  number_of_employees: string;
  business_address?: BusinessAddress;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  annual_revenue: string;
  net_profit: string;
  existing_debt: string;
  loan_amount_requested: string;
  loan_purpose: 'Equipment' | 'Expansion' | 'Working Capital' | 'Real Estate' | 'Refinance' | 'Other' | '';
  loan_term_months: string;
  collateral_offered: string;
  property?: RuralProperty;
}

// --- Rural property / geo-environmental verification -----------------------

export interface RuralProperty {
  property_id: string; // CAR id, e.g. 'CAR-MT-2201'
  name: string;
  municipality: string;
  state: string; // UF
  crop: string; // e.g. 'Soja'
  declared_area_ha: number; // area declared by the producer
  car_polygon_ref: string; // reference to the georeferenced CAR polygon
}

export type GeoCheckStatus = 'PASS' | 'REVIEW' | 'BLOCK';

export interface GeoEvidence {
  source: string; // e.g. 'CAR', 'DETER/INPE', 'IBAMA-embargo'
  source_version: string;
  available_time: string; // ISO — when the org could legitimately know it
  detail: string;
}

export interface GeoCheck {
  id: string;
  label: string;
  status: GeoCheckStatus;
  finding: string; // human-readable finding
  reason_code: string;
  evidence: GeoEvidence;
}

export interface GeoVerificationReport {
  property_id: string;
  decision_time: string; // point-in-time cut for the snapshot
  overall_status: 'CLEARED' | 'REVIEW' | 'BLOCKED';
  checks: GeoCheck[];
  risk_flags: string[];
  blocking_findings: string[];
  notes: string;
  repair_evidence?: GeoRepairEvidence; // set when operator evidence cleared a blocking finding
}

// Evidence an operator can attach during repair to resolve a blocked check.
export interface GeoRepairEvidence {
  survey_confirmed_area_ha?: number; // re-surveyed area that resolves an area mismatch
  deforestation_exclusion_ref?: string; // technical report proving alert is outside polygon
  embargo_lift_ref?: string; // reference showing embargo no longer applies
  legal_reserve_correction_pct?: number; // regularized legal reserve percentage
  reviewer?: string;
}

export interface UnderwritingReport {
  eligibility_status: 'ELIGIBLE' | 'REVIEW' | 'INELIGIBLE';
  matched_rule?: string;
  risk_flags: string[];
  internal_record_matched?: boolean;
  credit_score?: number;
  verification_notes?: string;
}

export interface PricingResult {
  risk_tier: string;
  interest_rate: string;
  monthly_payment: string;
  total_interest: string;
  rate_justification: string;
}

export interface LoanDecisionResult {
  decision: 'APPROVED' | 'REJECTED';
  decision_letter_id: string;
  approved_amount: string;
  approved_rate: string;
  approved_term: string;
  conditions: string[];
  message: string;
}

export type StepName =
  | 'DocumentExtractionAgent'
  | 'GeoVerificationAgent'
  | 'UnderwritingAgent'
  | 'PricingAgent'
  | 'LoanDecisionAgent';

export type StepStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'error';

export type OverallStatus =
  | 'created'
  | 'in_progress'
  | 'blocked'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed';

export interface StepState {
  status: StepStatus;
  completed_at: string | null;
  data: any | null;
  human_review_notes?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  error_message?: string | null;
}

export interface ProcessIssue {
  step: StepName;
  issue_type: string;
  description: string;
  raised_at: string;
  resolved: boolean;
  resolved_at?: string | null;
  resolved_by?: string | null;
  missing_fields?: string[];
}

export interface ProcessState {
  loan_request_id: string;
  session_id: string;
  current_step: StepName | null;
  overall_status: OverallStatus;
  created_at: string;
  updated_at: string;
  steps: Record<StepName, StepState>;
  issues: ProcessIssue[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  requiresApproval?: boolean;
  loanRequestId?: string;
  orchestrator?: OrchestratorId;
}

export type ToolCallStatus = 'running' | 'success' | 'error' | 'halted';

export interface ToolCall {
  tool: string;
  status: ToolCallStatus;
  details?: any;
}

// Who drives the loop: fixed rule order, a simulated ADK agent with hardcoded
// rationales, or a real ADK root agent powered by Gemini tool-calling.
// All three run the same deterministic risk code.
export type OrchestratorId = 'deterministic' | 'adk-sim' | 'adk';

export interface EligibilityRule {
  id: string;
  description: string;
  conditions: {
    min_annual_revenue?: number;
    max_annual_revenue?: number;
    min_years_in_business?: number;
    max_years_in_business?: number;
    max_loan_to_revenue_ratio?: number;
    min_loan_to_revenue_ratio?: number;
    high_risk_industries?: string[];
  };
  action: 'ELIGIBLE' | 'REVIEW' | 'INELIGIBLE';
}
