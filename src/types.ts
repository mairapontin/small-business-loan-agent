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
  specialized_reports?: SpecializedReports;
  methodology?: MethodologyInfo;
}

export interface MethodologyInfo {
  id: OrchestratorId;
  name: string;
  badge: string;
  description: string;
  isDegraded?: boolean;
  degradationReason?: string;
  aiModel?: string;
  activeFeatures: string[];
}

// --- Specialized Multi-Agent Intelligence Reports -------------------------

export interface ScrBacenData {
  total_exposure_brl: number;
  credit_limit_used_pct: number;
  overdue_operations_count: number;
  historical_delay_max_days: number;
  sfn_institutions_count: number;
  standing: 'REGULAR' | 'WATCHLIST' | 'RESTRICTED';
  last_consulted_month: string;
}

export interface OpenFinanceData {
  connected_accounts_count: number;
  verified_average_monthly_inflow_brl: number;
  revenue_reconciliation_pct: number;
  cash_burn_rate_monthly_brl: number;
  bank_standing: 'EXCELLENT' | 'STABLE' | 'IRREGULAR';
}

export interface ProductionAgroData {
  crop: string; // e.g. 'Soja'
  crop_year: string; // e.g. '2025/2026'
  planted_area_ha: number;
  historical_yield_sc_ha: number[];
  average_yield_sc_ha: number;
  regional_benchmark_conab_sc_ha: number;
  yield_vs_benchmark_pct: number;
}

export interface CommodityPricesData {
  cepea_esalq_spot_brl: number; // R$ / saca
  cbot_future_usd_bushel: number; // USD / bushel
  basis_regional_usd_bushel: number; // Basis Paranaguá / Rondonópolis
  effective_parity_brl_sc: number;
  quotation_date: string;
}

export interface DataCollectionSnapshot {
  loan_request_id: string;
  scr: ScrBacenData;
  open_finance: OpenFinanceData;
  production: ProductionAgroData;
  commodities: CommodityPricesData;
  event_time: string;
  available_time: string;
}

export interface ComplianceReport {
  loan_request_id: string;
  overall_status: 'CLEARED' | 'REVIEW' | 'BLOCKED';
  internal_policies_cleared: boolean;
  regulatory_cleared: boolean;
  socioenvironmental_cleared: boolean;
  car_status: 'REGULAR' | 'MISMATCH' | 'IRREGULAR';
  deforestation_alerts: number;
  ibama_embargoes: number;
  legal_reserve_compliance_pct: number;
  restrictive_lists: {
    pep: 'CLEARED' | 'FLAGGED';
    slave_labor_blacklist: 'CLEARED' | 'FLAGGED';
    ofac_sanctions: 'CLEARED' | 'FLAGGED';
  };
  blocking_findings: string[];
  risk_flags: string[];
  audit_notes: string;
}

export interface AgroRiskReport {
  loan_request_id: string;
  overall_risk_level: 'LOW' | 'MODERATE' | 'HIGH';
  climate: {
    water_balance_index: number; // 0 to 1 scale
    water_balance_status: 'FAVORABLE' | 'MODERATE_DEFICIT' | 'SEVERE_DROUGHT';
    accumulated_rainfall_mm: number;
    historical_average_rainfall_mm: number;
    ndvi_vegetative_vigor_index: number;
    ndvi_anomaly_pct: number;
  };
  seasonality: {
    planting_window_status: 'OPTIMAL' | 'ACCEPTABLE' | 'LATE';
    expected_yield_loss_pct: number;
    stressed_yield_sc_ha: number;
    harvest_schedule: string;
  };
  price_and_hedge: {
    hedged_production_pct: number;
    unhedged_exposure_pct: number;
    break_even_price_brl_sc: number;
    margin_safety_pct: number;
    hedge_instrument: string;
  };
  risk_mitigation_covenants: string[];
}

export interface FinancialAnalysisReport {
  loan_request_id: string;
  cash_flow_viability: 'HEALTHY' | 'ADEQUATE' | 'TIGHT' | 'DISTRESSED';
  cads_brl: number; // Cash Available for Debt Service
  dscr_safra: number; // DSCR principal safra
  dscr_entressafra: number; // DSCR ciclo completo
  liquidity_ratio: number; // Current liquidity
  leverage_ratio: number; // Total Debt / Revenue
  margin_liquidity_shortfall_brl: number; // Potential derivative margin call risk
  break_even_yield_sc_ha: number;
  debt_service_brl: number;
  replacement_capex_brl: number;
  financial_notes: string;
}

export interface OpinionReport {
  loan_request_id: string;
  decision_letter_id: string;
  recommendation: 'FAVORABLE' | 'FAVORABLE_WITH_CONDITIONS' | 'UNFAVORABLE';
  executive_summary: string;
  recommended_amount: string;
  recommended_rate: string;
  recommended_term: string;
  risk_tier: string;
  covenants_and_safeguards: string[];
  pending_policy_items: string[];
  hitl_operator_signoff: {
    required: boolean;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    operator?: string;
    timestamp?: string;
  };
  dossier_timestamp: string;
}

export interface SpecializedReports {
  data_collection: DataCollectionSnapshot;
  compliance: ComplianceReport;
  agro_risk: AgroRiskReport;
  financial_analysis: FinancialAnalysisReport;
  opinion: OpinionReport;
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
  methodology?: MethodologyInfo;
  degraded?: boolean;
  degradationReason?: string;
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
