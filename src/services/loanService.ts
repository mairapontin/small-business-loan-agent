import {
  EligibilityRule,
  LoanApplicationData,
  LoanDecisionResult,
  OverallStatus,
  PricingResult,
  ProcessIssue,
  ProcessState,
  StepName,
  StepStatus,
  UnderwritingReport,
} from '../types';

export const ELIGIBILITY_RULES: EligibilityRule[] = [
  {
    id: 'rule_001',
    description: 'Approve if annual revenue exceeds $500K and business has 3+ years',
    conditions: {
      min_annual_revenue: 500000,
      min_years_in_business: 3,
      max_loan_to_revenue_ratio: 0.5,
    },
    action: 'ELIGIBLE',
  },
  {
    id: 'rule_002',
    description: 'Review if revenue is between $200K-$500K with 2+ years',
    conditions: {
      min_annual_revenue: 200000,
      max_annual_revenue: 500000,
      min_years_in_business: 2,
    },
    action: 'REVIEW',
  },
  {
    id: 'rule_003',
    description: 'Reject if business has less than 1 year of operations',
    conditions: {
      max_years_in_business: 1,
    },
    action: 'INELIGIBLE',
  },
  {
    id: 'rule_004',
    description: 'Reject if loan-to-revenue ratio exceeds 75%',
    conditions: {
      min_loan_to_revenue_ratio: 0.75,
    },
    action: 'INELIGIBLE',
  },
  {
    id: 'rule_005',
    description: 'Review if industry is in high-risk category',
    conditions: {
      high_risk_industries: ['Cannabis', 'Cryptocurrency', 'Gambling'],
    },
    action: 'REVIEW',
  },
];

export const MOCK_INTERNAL_RECORDS: Record<string, any> = {
  'SBL-2025-00142': {
    business_name: 'Cymbal Coffee Roasters LLC',
    business_type: 'LLC',
    ein: '00-1234567',
    owner_name: 'Jane Doe',
    owner_email: 'jane.doe@example.com',
    owner_phone: '(555) 010-0100',
    business_address: {
      street: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      zip_code: '62704',
    },
    industry: 'Food & Beverage',
    years_in_business: '6',
    annual_revenue: '$850,000',
    net_profit: '$120,000',
    number_of_employees: '12',
    existing_debt: 'None',
    existing_loans: [],
    credit_score: 720,
    account_standing: 'Good',
  },
  'SBL-2025-02142': {
    business_name: 'Cymbal Coffee Roasters LLC',
    business_type: 'LLC',
    ein: '00-1234567',
    owner_name: 'Jane Doe',
    owner_email: 'jane.doe@example.com',
    owner_phone: '(555) 010-0100',
    business_address: {
      street: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      zip_code: '62704',
    },
    industry: 'Food & Beverage',
    years_in_business: '6',
    annual_revenue: '$850,000',
    net_profit: '$120,000',
    number_of_employees: '12',
    existing_debt: 'None',
    existing_loans: [],
    credit_score: 720,
    account_standing: 'Good',
  },
  'SBL-2025-00391': {
    business_name: 'Cymbal Coffee Roasters LLC',
    business_type: 'LLC',
    ein: '00-1234567',
    owner_name: 'Jane Doe',
    owner_email: 'jane.doe@example.com',
    owner_phone: '(555) 010-0100',
    business_address: {
      street: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      zip_code: '62704',
    },
    industry: 'Food & Beverage',
    years_in_business: '6',
    annual_revenue: '$850,000',
    net_profit: '$120,000',
    number_of_employees: '12',
    existing_debt: 'None',
    existing_loans: [],
    credit_score: 720,
    account_standing: 'Good',
  },
};

export const SAMPLE_APPLICATIONS: Record<string, { label: string; type: 'complete' | 'incomplete'; data: LoanApplicationData }> = {
  'SBL-2025-02142': {
    label: 'Complete Application (Happy Path)',
    type: 'complete',
    data: {
      business_name: 'Cymbal Coffee Roasters LLC',
      business_type: 'LLC',
      ein: '00-1234567',
      industry: 'Food & Beverage',
      years_in_business: '6',
      number_of_employees: '12',
      business_address: {
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'IL',
        zip_code: '62704',
      },
      owner_name: 'Jane Doe',
      owner_email: 'jane.doe@example.com',
      owner_phone: '(555) 010-0100',
      annual_revenue: '$850,000',
      net_profit: '$120,000',
      existing_debt: 'None',
      loan_amount_requested: '$150,000',
      loan_purpose: 'Equipment',
      loan_term_months: '60',
      collateral_offered: 'Commercial espresso roaster and packaging inventory',
    },
  },
  'SBL-2025-00391': {
    label: 'Incomplete Application (Missing Loan Amount -> Repair & Resume)',
    type: 'incomplete',
    data: {
      business_name: 'Cymbal Coffee Roasters LLC',
      business_type: 'LLC',
      ein: '00-1234567',
      industry: 'Food & Beverage',
      years_in_business: '6',
      number_of_employees: '12',
      business_address: {
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'IL',
        zip_code: '62704',
      },
      owner_name: 'Jane Doe',
      owner_email: 'jane.doe@example.com',
      owner_phone: '(555) 010-0100',
      annual_revenue: '$850,000',
      net_profit: '$120,000',
      existing_debt: 'None',
      loan_amount_requested: '', // MISSING on purpose to trigger Pause & Repair!
      loan_purpose: 'Equipment',
      loan_term_months: '60',
      collateral_offered: 'Commercial espresso roaster and packaging inventory',
    },
  },
};

export function parseDollarAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0.0;
  if (typeof value === 'number') return value;
  const cleaned = value.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0.0 : parsed;
}

export function determineRiskTier(underwritingOutput: Partial<UnderwritingReport>): [string, number] {
  const eligibility = underwritingOutput?.eligibility_status || 'REVIEW';
  const riskFlags = underwritingOutput?.risk_flags || [];

  if (eligibility === 'ELIGIBLE' && riskFlags.length === 0) {
    return ['Tier 1 - Low Risk', 6.50];
  } else if (eligibility === 'ELIGIBLE') {
    return ['Tier 2 - Moderate Risk', 7.75];
  } else if (eligibility === 'REVIEW') {
    return ['Tier 3 - Elevated Risk', 9.25];
  } else {
    return ['Tier 4 - High Risk', 11.00];
  }
}

export function calculateLoanPricing(
  applicationData: LoanApplicationData,
  underwritingOutput: UnderwritingReport,
  loanRequestId: string
): PricingResult {
  const loanAmount = parseDollarAmount(applicationData.loan_amount_requested);
  const termMonthsStr = applicationData.loan_term_months || '60';
  const parsedTerm = parseInt(termMonthsStr.replace(/[^\d]/g, ''), 10);
  const termMonths = isNaN(parsedTerm) || parsedTerm <= 0 ? 60 : parsedTerm;

  if (loanAmount <= 0) {
    throw new Error('Invalid loan amount');
  }

  const [riskTier, annualRate] = determineRiskTier(underwritingOutput);
  const monthlyRate = annualRate / 100 / 12;
  let monthlyPayment = 0;
  if (monthlyRate > 0) {
    monthlyPayment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);
  } else {
    monthlyPayment = loanAmount / termMonths;
  }

  const totalInterest = monthlyPayment * termMonths - loanAmount;

  return {
    risk_tier: riskTier,
    interest_rate: `${annualRate.toFixed(2)}%`,
    monthly_payment: `$${monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    total_interest: `$${totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    rate_justification: `Rate of ${annualRate}% based on ${riskTier}. Loan amount $${loanAmount.toLocaleString('en-US')} over ${termMonths} months.`,
  };
}

export function evaluateUnderwriting(
  applicationData: LoanApplicationData,
  loanRequestId: string
): UnderwritingReport {
  const annualRevenue = parseDollarAmount(applicationData.annual_revenue);
  const loanRequested = parseDollarAmount(applicationData.loan_amount_requested);
  const yearsInBusiness = parseInt(applicationData.years_in_business?.replace(/[^\d]/g, '') || '0', 10);
  const loanToRevenue = annualRevenue > 0 ? loanRequested / annualRevenue : 1.0;
  const industry = applicationData.industry || 'Unknown';

  const riskFlags: string[] = [];
  let eligibilityStatus: 'ELIGIBLE' | 'REVIEW' | 'INELIGIBLE' = 'REVIEW';
  let matchedRule = 'rule_002';

  // Check Rule 004: Reject if loan-to-revenue ratio exceeds 75%
  if (loanToRevenue > 0.75) {
    riskFlags.push(`High loan-to-revenue ratio: ${(loanToRevenue * 100).toFixed(1)}%`);
    eligibilityStatus = 'INELIGIBLE';
    matchedRule = 'rule_004';
  }
  // Check Rule 003: Reject if business has less than 1 year of operations
  else if (yearsInBusiness < 1) {
    riskFlags.push('Business has operated for less than 1 year');
    eligibilityStatus = 'INELIGIBLE';
    matchedRule = 'rule_003';
  }
  // Check Rule 005: Review if high-risk industry
  else if (['Cannabis', 'Cryptocurrency', 'Gambling'].includes(industry)) {
    riskFlags.push(`High-risk industry sector: ${industry}`);
    eligibilityStatus = 'REVIEW';
    matchedRule = 'rule_005';
  }
  // Check Rule 001: Approve if revenue > $500K and years >= 3 and ratio <= 0.5
  else if (annualRevenue >= 500000 && yearsInBusiness >= 3 && loanToRevenue <= 0.5) {
    eligibilityStatus = 'ELIGIBLE';
    matchedRule = 'rule_001';
  }
  // Check Rule 002: Review if revenue $200k-$500k with 2+ years
  else if (annualRevenue >= 200000 && yearsInBusiness >= 2) {
    eligibilityStatus = 'REVIEW';
    matchedRule = 'rule_002';
  } else {
    eligibilityStatus = 'REVIEW';
    matchedRule = 'rule_002';
  }

  const internalRecord = MOCK_INTERNAL_RECORDS[loanRequestId] || Object.values(MOCK_INTERNAL_RECORDS)[0];

  return {
    eligibility_status: eligibilityStatus,
    matched_rule: matchedRule,
    risk_flags: riskFlags,
    internal_record_matched: !!internalRecord,
    credit_score: internalRecord?.credit_score || 700,
    verification_notes: `Matched internal profile for ${applicationData.business_name || 'Business'}. Credit standing: ${internalRecord?.account_standing || 'Good'}.`,
  };
}

export function finalizeLoanDecision(
  applicationData: LoanApplicationData,
  pricingData: PricingResult,
  loanRequestId: string
): LoanDecisionResult {
  const cleanId = loanRequestId.replace(/^SBL-/, '');
  const decisionLetterId = `DL-${cleanId}-001`;
  const approvedAmount = applicationData.loan_amount_requested || '$150,000';
  const approvedRate = pricingData.interest_rate || '6.50%';
  const approvedTerm = `${applicationData.loan_term_months || '60'} months`;

  return {
    decision: 'APPROVED',
    decision_letter_id: decisionLetterId,
    approved_amount: approvedAmount,
    approved_rate: approvedRate,
    approved_term: approvedTerm,
    conditions: [
      'Business insurance verification required within 30 days',
      'Collateral documentation to be submitted before disbursement',
    ],
    message: `Loan ${loanRequestId} has been approved. Decision letter ${decisionLetterId} has been generated. Approved for ${approvedAmount} at ${approvedRate} for ${approvedTerm}.`,
  };
}

export const ALL_STEPS: StepName[] = [
  'DocumentExtractionAgent',
  'UnderwritingAgent',
  'PricingAgent',
  'LoanDecisionAgent',
];

export class ProcessStateService {
  private static store: Map<string, ProcessState> = new Map();

  static getAll(): ProcessState[] {
    return Array.from(this.store.values());
  }

  static getProcessStatus(requestId: string): ProcessState | null {
    return this.store.get(requestId) || null;
  }

  static createProcess(requestId: string, sessionId: string = 'session-default'): ProcessState {
    const now = new Date().toISOString();
    const steps: Record<StepName, any> = {
      DocumentExtractionAgent: { status: 'not_started', completed_at: null, data: null },
      UnderwritingAgent: { status: 'not_started', completed_at: null, data: null },
      PricingAgent: { status: 'not_started', completed_at: null, data: null },
      LoanDecisionAgent: { status: 'not_started', completed_at: null, data: null },
    };

    const state: ProcessState = {
      loan_request_id: requestId,
      session_id: sessionId,
      current_step: 'DocumentExtractionAgent',
      overall_status: 'active',
      created_at: now,
      updated_at: now,
      steps,
      issues: [],
    };

    this.store.set(requestId, state);
    return state;
  }

  static updateStepStatus(
    requestId: string,
    stepName: StepName,
    status: StepStatus,
    data?: any,
    errorMessage?: string
  ): ProcessState {
    let state = this.store.get(requestId);
    if (!state) {
      state = this.createProcess(requestId);
    }

    const now = new Date().toISOString();
    state.updated_at = now;
    state.steps[stepName].status = status;

    if (status === 'completed' || status === 'approved') {
      state.steps[stepName].completed_at = now;
      const currentIndex = ALL_STEPS.indexOf(stepName);
      if (currentIndex < ALL_STEPS.length - 1) {
        state.current_step = ALL_STEPS[currentIndex + 1];
      } else {
        state.current_step = null;
        state.overall_status = 'completed';
      }
    }

    if (data !== undefined) {
      state.steps[stepName].data = data;
    }

    if (errorMessage) {
      state.steps[stepName].error_message = errorMessage;
    }

    this.store.set(requestId, state);
    return state;
  }

  static markStepForReview(
    requestId: string,
    stepName: StepName,
    issueDescription: string,
    missingFields: string[] = [],
    data?: any
  ): ProcessState {
    let state = this.store.get(requestId);
    if (!state) {
      state = this.createProcess(requestId);
    }

    const now = new Date().toISOString();
    const issue: ProcessIssue = {
      step: stepName,
      issue_type: 'requires_review',
      description: issueDescription,
      raised_at: now,
      resolved: false,
      missing_fields: missingFields,
    };

    state.steps[stepName].status = 'pending_approval';
    if (data !== undefined) {
      state.steps[stepName].data = data;
    }
    state.overall_status = 'pending_approval';
    state.current_step = stepName;
    state.issues.push(issue);
    state.updated_at = now;

    this.store.set(requestId, state);
    return state;
  }

  static repairStepData(
    requestId: string,
    stepName: StepName,
    updatedFields: Record<string, any>
  ): ProcessState {
    const state = this.store.get(requestId);
    if (!state) {
      throw new Error(`Process ${requestId} not found`);
    }

    const stepData = state.steps[stepName].data || {};
    const mergedData = { ...stepData, ...updatedFields };
    state.steps[stepName].data = mergedData;
    state.steps[stepName].status = 'completed';
    state.steps[stepName].completed_at = new Date().toISOString();

    // Mark issues for this step as resolved
    for (const issue of state.issues) {
      if (issue.step === stepName && !issue.resolved) {
        issue.resolved = true;
        issue.resolved_at = new Date().toISOString();
        issue.resolved_by = 'Operator (UI Repair)';
      }
    }

    // Advance to next step and set overall status active
    const currentIndex = ALL_STEPS.indexOf(stepName);
    if (currentIndex < ALL_STEPS.length - 1) {
      state.current_step = ALL_STEPS[currentIndex + 1];
    }
    state.overall_status = 'active';
    state.updated_at = new Date().toISOString();

    this.store.set(requestId, state);
    return state;
  }

  static canProceedToStep(requestId: string, stepName: StepName): boolean {
    const state = this.store.get(requestId);
    if (!state) return false;

    const stepIndex = ALL_STEPS.indexOf(stepName);
    if (stepIndex === -1) return false;

    for (let i = 0; i < stepIndex; i++) {
      const prevStep = state.steps[ALL_STEPS[i]];
      if (!['completed', 'approved'].includes(prevStep.status)) {
        return false;
      }
    }
    return true;
  }

  static determineHaltAction(
    toolName: string,
    overallStatus: OverallStatus | null,
    issues: ProcessIssue[]
  ): { error: string } | null {
    if (overallStatus === 'pending_approval') {
      let issueDesc = 'Unknown issue';
      for (const issue of issues) {
        if (!issue.resolved) {
          issueDesc = issue.description;
          break;
        }
      }
      return { error: `Cannot proceed to ${toolName}: Pending approval - ${issueDesc}` };
    }

    if (overallStatus === 'failed') {
      return { error: `Cannot proceed to ${toolName}: Process has failed` };
    }

    if (overallStatus === 'completed') {
      return { error: `Cannot proceed to ${toolName}: Process already completed` };
    }

    return null;
  }

  static findResumePoint(processState: ProcessState): { nextStep: StepName | null; completedStepsData: Record<string, any> } {
    const steps = processState.steps;
    const completedStepsData: Record<string, any> = {};
    let nextStep: StepName | null = null;

    for (const stepName of ALL_STEPS) {
      const stepData = steps[stepName];
      if (['completed', 'approved'].includes(stepData.status)) {
        if (stepData.data) {
          completedStepsData[stepName] = stepData.data;
        }
      } else if (nextStep === null) {
        nextStep = stepName;
      }
    }

    return { nextStep, completedStepsData };
  }

  static reset(requestId: string) {
    this.store.delete(requestId);
  }
}
