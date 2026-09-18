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

export type OverallStatus = 'active' | 'pending_approval' | 'completed' | 'failed';

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
  toolCalls?: {
    tool: string;
    status: 'running' | 'success' | 'error' | 'halted';
    details?: any;
  }[];
  requiresApproval?: boolean;
  loanRequestId?: string;
}

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
