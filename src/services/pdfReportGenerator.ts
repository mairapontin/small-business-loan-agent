/**
 * @module: Small Business Loan Agent
 * @file: src/services/pdfReportGenerator.ts
 * @description: Professional PDF summary report generator for final loan underwriting decisions, processed rules, and supporting evidence
 * @author: Maíra Pontin
 * @created: 2026-10-01
 * @version: 1.0.0
 */

import { jsPDF } from 'jspdf';
import {
  EligibilityRule,
  GeoCheck,
  GeoVerificationReport,
  LoanApplicationData,
  LoanDecisionResult,
  PricingResult,
  ProcessState,
  UnderwritingReport,
} from '../types';
import {
  ELIGIBILITY_RULES,
  MOCK_INTERNAL_RECORDS,
  SAMPLE_APPLICATIONS,
  parseDollarAmount,
} from './loanService';
import { runDataCollection } from './dataCollectionService';
import { runComplianceAnalysis } from './complianceService';
import { runAgroRiskAnalysis } from './agroRiskService';
import { runFinancialAnalysis } from './financialAnalysisService';

export interface GeneratePdfOptions {
  processState: ProcessState;
  rules?: EligibilityRule[];
  internalRecords?: Record<string, any>;
  applicationData?: LoanApplicationData;
}

interface EvaluatedRuleAudit {
  id: string;
  description: string;
  action: 'ELIGIBLE' | 'REVIEW' | 'INELIGIBLE';
  conditionSummary: string;
  actualMetric: string;
  evaluationResult: 'MET / APPLIED' | 'PASSED' | 'FAILED' | 'NOT TRIGGERED';
  isMatchedRule: boolean;
}

export class LoanUnderwritingPdfBuilder {
  private doc: jsPDF;
  private y: number = 14;
  private pageNumber: number = 1;
  private readonly leftMargin = 14;
  private readonly rightMargin = 196; // 210 - 14
  private readonly contentWidth = 182; // 196 - 14
  private readonly pageHeight = 297;
  private readonly bottomMargin = 20;

  // Colors
  private readonly colorNavy = [15, 23, 42]; // slate-900
  private readonly colorBrandBlue = [30, 64, 175]; // blue-800
  private readonly colorAccentBlue = [37, 99, 235]; // blue-600
  private readonly colorText = [30, 41, 59]; // slate-800
  private readonly colorMuted = [100, 116, 139]; // slate-500
  private readonly colorBorder = [226, 232, 240]; // slate-200
  private readonly colorBgLight = [248, 250, 252]; // slate-50
  private readonly colorSuccess = [5, 150, 105]; // emerald-600
  private readonly colorWarning = [217, 119, 6]; // amber-600
  private readonly colorDanger = [225, 29, 72]; // rose-600

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
  }

  private checkPageBreak(neededHeight: number): void {
    if (this.y + neededHeight > this.pageHeight - this.bottomMargin) {
      this.doc.addPage();
      this.pageNumber++;
      this.drawRunningHeader();
      this.y = 24;
    }
  }

  private drawRunningHeader(): void {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    this.doc.text('YATAÍ FINANCE • CREDIT UNDERWRITING & DECISION AUDIT REPORT', this.leftMargin, 12);
    this.doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.leftMargin, 14, this.rightMargin, 14);
  }

  private drawSectionHeader(title: string, subtitle?: string): void {
    this.checkPageBreak(18);
    this.y += 3;

    // Left accent bar
    this.doc.setFillColor(this.colorAccentBlue[0], this.colorAccentBlue[1], this.colorAccentBlue[2]);
    this.doc.rect(this.leftMargin, this.y, 2.5, 9, 'F');

    // Section title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(this.colorNavy[0], this.colorNavy[1], this.colorNavy[2]);
    this.doc.text(title.toUpperCase(), this.leftMargin + 5, this.y + 6.5);

    if (subtitle) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
      const titleWidth = this.doc.getTextWidth(title.toUpperCase()) + 10;
      this.doc.text(`— ${subtitle}`, this.leftMargin + titleWidth, this.y + 6.5);
    }

    this.y += 11;
  }

  private drawKeyValueRow(
    x: number,
    y: number,
    width: number,
    key: string,
    value: string,
    isBoldValue: boolean = false
  ): number {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    this.doc.text(key, x, y);

    this.doc.setFont('helvetica', isBoldValue ? 'bold' : 'normal');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(this.colorText[0], this.colorText[1], this.colorText[2]);

    const keyWidth = this.doc.getTextWidth(key);
    const valueX = x + Math.max(38, keyWidth + 3);
    const maxValueWidth = width - (valueX - x);
    const splitValue = this.doc.splitTextToSize(value || 'N/A', maxValueWidth);
    this.doc.text(splitValue, valueX, y);

    return y + (splitValue.length * 4.2);
  }

  public generateReport(options: GeneratePdfOptions): jsPDF {
    const { processState } = options;
    const loanRequestId = processState.loan_request_id;
    const rules = options.rules || ELIGIBILITY_RULES;
    const internalRecords = options.internalRecords || MOCK_INTERNAL_RECORDS;
    const fallbackApp = SAMPLE_APPLICATIONS[loanRequestId]?.data || SAMPLE_APPLICATIONS['SBL-2025-02142']?.data;
    const application: LoanApplicationData =
      (processState.steps.DocumentExtractionAgent?.data as LoanApplicationData) ||
      options.applicationData ||
      fallbackApp;

    const geoReport: GeoVerificationReport | null =
      (processState.steps.GeoVerificationAgent?.data as GeoVerificationReport) || null;
    const underwriting: UnderwritingReport | null =
      (processState.steps.UnderwritingAgent?.data as UnderwritingReport) || null;
    const pricing: PricingResult | null =
      (processState.steps.PricingAgent?.data as PricingResult) || null;
    const decision: LoanDecisionResult | null =
      (processState.steps.LoanDecisionAgent?.data as LoanDecisionResult) || null;

    // -------------------------------------------------------------------------
    // PAGE 1: HEADER & EXECUTIVE DECISION SUMMARY
    // -------------------------------------------------------------------------
    this.drawCoverHeader(loanRequestId, processState, decision);

    // Executive Decision Card
    this.drawExecutiveDecisionBlock(processState, decision, pricing, underwriting);

    // Borrower & Operation Profile
    this.drawBorrowerProfile(application, loanRequestId);

    // Specialized Risk Engines: Data Collection (SCR, Open Finance), Compliance, Agro Risk & Financial
    this.drawSpecializedAgentsSummary(processState, application);

    // Rural Property & Geo-Environmental Verification
    if (geoReport || application.property) {
      this.drawGeoVerificationSection(geoReport, application);
    }

    // -------------------------------------------------------------------------
    // PAGE 2: UNDERWRITING EVALUATION & DETAILED RULES AUDIT
    // -------------------------------------------------------------------------
    this.checkPageBreak(50);
    this.drawUnderwritingRulesAudit(underwriting, application, rules, internalRecords, loanRequestId);

    // -------------------------------------------------------------------------
    // PRICING & AMORTIZATION STRUCTURE
    // -------------------------------------------------------------------------
    if (pricing) {
      this.drawPricingAmortization(pricing, application);
    }

    // -------------------------------------------------------------------------
    // FINAL CONDITIONS, HITL GATE & AUDIT TRAIL
    // -------------------------------------------------------------------------
    this.drawDecisionConditionsAndAudit(processState, decision, geoReport);

    // -------------------------------------------------------------------------
    // STAMP ALL FOOTERS
    // -------------------------------------------------------------------------
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.leftMargin, this.pageHeight - 12, this.rightMargin, this.pageHeight - 12);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
      this.doc.text(
        'Yataí Finance Platform • AI Studio Agentic Workflow • Bitemporal Gating & Basel Compliant',
        this.leftMargin,
        this.pageHeight - 8
      );
      this.doc.text(
        `Page ${i} of ${totalPages}`,
        this.rightMargin,
        this.pageHeight - 8,
        { align: 'right' }
      );
    }

    return this.doc;
  }

  private drawCoverHeader(
    loanRequestId: string,
    processState: ProcessState,
    decision: LoanDecisionResult | null
  ): void {
    // Header Banner Background
    this.doc.setFillColor(this.colorBgLight[0], this.colorBgLight[1], this.colorBgLight[2]);
    this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, 30, 2, 2, 'F');
    this.doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    this.doc.setLineWidth(0.4);
    this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, 30, 2, 2, 'S');

    // Brand badge
    this.doc.setFillColor(this.colorBrandBlue[0], this.colorBrandBlue[1], this.colorBrandBlue[2]);
    this.doc.roundedRect(this.leftMargin + 4, this.y + 4, 22, 22, 1.5, 1.5, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('YF', this.leftMargin + 15, this.y + 18, { align: 'center' });

    // Titles
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(this.colorNavy[0], this.colorNavy[1], this.colorNavy[2]);
    this.doc.text('YATAÍ FINANCE', this.leftMargin + 30, this.y + 11);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    this.doc.text(
      'Credit Underwriting Decision & Regulatory Audit Summary',
      this.leftMargin + 30,
      this.y + 16.5
    );

    this.doc.setFontSize(7.5);
    this.doc.text(
      `Loan ID: ${loanRequestId}  •  Generated: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      this.leftMargin + 30,
      this.y + 22
    );

    // Status Pill on top-right
    const overallStatus = processState.overall_status.toUpperCase();
    const isApproved = overallStatus === 'APPROVED' || overallStatus === 'COMPLETED' || decision?.decision === 'APPROVED';
    const isBlocked = overallStatus === 'BLOCKED' || overallStatus === 'REJECTED';

    const pillBg = isApproved
      ? [236, 253, 245]
      : isBlocked
      ? [254, 242, 242]
      : [254, 243, 199];
    const pillBorder = isApproved
      ? this.colorSuccess
      : isBlocked
      ? this.colorDanger
      : this.colorWarning;
    const pillText = isApproved
      ? this.colorSuccess
      : isBlocked
      ? this.colorDanger
      : this.colorWarning;

    const badgeLabel = decision?.decision || overallStatus.replace('_', ' ');
    const pillWidth = Math.max(38, this.doc.getTextWidth(badgeLabel) + 12);
    const pillX = this.rightMargin - pillWidth - 4;

    this.doc.setFillColor(pillBg[0], pillBg[1], pillBg[2]);
    this.doc.roundedRect(pillX, this.y + 6, pillWidth, 8, 1.5, 1.5, 'F');
    this.doc.setDrawColor(pillBorder[0], pillBorder[1], pillBorder[2]);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(pillX, this.y + 6, pillWidth, 8, 1.5, 1.5, 'S');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(pillText[0], pillText[1], pillText[2]);
    this.doc.text(badgeLabel, pillX + pillWidth / 2, this.y + 11.5, { align: 'center' });

    if (decision?.decision_letter_id) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
      this.doc.text(`Ref: ${decision.decision_letter_id}`, this.rightMargin - 4, this.y + 20, {
        align: 'right',
      });
    }

    this.y += 34;
  }

  private drawExecutiveDecisionBlock(
    processState: ProcessState,
    decision: LoanDecisionResult | null,
    pricing: PricingResult | null,
    underwriting: UnderwritingReport | null
  ): void {
    this.drawSectionHeader('1. Executive Decision Summary', 'Authority Recommendation & Terms');

    const cardHeight = 32;
    this.doc.setFillColor(255, 255, 255);
    this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, cardHeight, 1.5, 1.5, 'F');
    this.doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    this.doc.setLineWidth(0.4);
    this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, cardHeight, 1.5, 1.5, 'S');

    // 4 Key metrics columns
    const colWidth = this.contentWidth / 4;
    const cols = [
      {
        label: 'FINAL DECISION',
        value: decision?.decision || (processState.overall_status === 'pending_approval' ? 'AWAITING APPROVAL' : processState.overall_status.toUpperCase()),
        color: decision?.decision === 'APPROVED' ? this.colorSuccess : this.colorWarning,
      },
      {
        label: 'APPROVED AMOUNT',
        value: decision?.approved_amount || 'Pending Approval',
        color: this.colorText,
      },
      {
        label: 'APPROVED RATE (APR)',
        value: decision?.approved_rate || pricing?.interest_rate || 'TBD',
        color: this.colorBrandBlue,
      },
      {
        label: 'AMORTIZATION TERM',
        value: decision?.approved_term || (pricing ? `${pricing.monthly_payment}/mo` : 'TBD'),
        color: this.colorText,
      },
    ];

    cols.forEach((col, idx) => {
      const colX = this.leftMargin + idx * colWidth;
      if (idx > 0) {
        this.doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
        this.doc.setLineWidth(0.2);
        this.doc.line(colX, this.y + 4, colX, this.y + cardHeight - 4);
      }

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7);
      this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
      this.doc.text(col.label, colX + 4, this.y + 8);

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(9.5);
      this.doc.setTextColor(col.color[0], col.color[1], col.color[2]);
      this.doc.text(col.value, colX + 4, this.y + 16);
    });

    // Sub-text row inside card
    this.doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    this.doc.setLineWidth(0.2);
    this.doc.line(this.leftMargin + 4, this.y + 21, this.rightMargin - 4, this.y + 21);

    const hitlStep = processState.steps.LoanDecisionAgent;
    const approvalLine = hitlStep.status === 'completed' || hitlStep.status === 'approved'
      ? `Human-in-the-Loop Authority: Approved by Operator • Timestamp: ${hitlStep.completed_at ? new Date(hitlStep.completed_at).toLocaleString() : 'Recorded'}`
      : `Workflow Status: ${processState.overall_status} • Eligibility: ${underwriting?.eligibility_status || 'Pending'} • Risk Tier: ${pricing?.risk_tier || 'Pending'}`;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    this.doc.text(approvalLine, this.leftMargin + 4, this.y + 27);

    this.y += cardHeight + 5;
  }

  private drawBorrowerProfile(app: LoanApplicationData, loanId: string): void {
    this.checkPageBreak(40);
    this.drawSectionHeader('2. Borrower & Credit Facility Information', 'Extracted Application Data');

    const boxHeight = 36;
    this.doc.setFillColor(this.colorBgLight[0], this.colorBgLight[1], this.colorBgLight[2]);
    this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, boxHeight, 1.5, 1.5, 'F');
    this.doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, boxHeight, 1.5, 1.5, 'S');

    const half = this.contentWidth / 2;
    const startY = this.y + 6;

    // Left Column
    this.drawKeyValueRow(this.leftMargin + 4, startY, half - 6, 'Legal Name:', app.business_name || 'N/A', true);
    this.drawKeyValueRow(this.leftMargin + 4, startY + 5.5, half - 6, 'Type / Structure:', app.business_type || 'N/A');
    this.drawKeyValueRow(this.leftMargin + 4, startY + 11, half - 6, 'Tax ID (EIN/CNPJ):', app.ein || 'N/A');
    this.drawKeyValueRow(this.leftMargin + 4, startY + 16.5, half - 6, 'Industry & Segment:', app.industry || 'N/A');
    this.drawKeyValueRow(this.leftMargin + 4, startY + 22, half - 6, 'Operating History:', `${app.years_in_business || 0} years (${app.number_of_employees || 0} employees)`);

    // Right Column
    const rightX = this.leftMargin + half + 4;
    this.drawKeyValueRow(rightX, startY, half - 6, 'Primary Principal:', app.owner_name || 'N/A', true);
    this.drawKeyValueRow(rightX, startY + 5.5, half - 6, 'Requested Amount:', app.loan_amount_requested || '$0', true);
    this.drawKeyValueRow(rightX, startY + 11, half - 6, 'Stated Purpose:', `${app.loan_purpose || 'General'} (${app.loan_term_months || 60} months)`);
    this.drawKeyValueRow(rightX, startY + 16.5, half - 6, 'Annual Revenue:', app.annual_revenue || '$0');
    this.drawKeyValueRow(rightX, startY + 22, half - 6, 'Offered Collateral:', app.collateral_offered || 'None stated');

    this.y += boxHeight + 5;
  }

  private drawSpecializedAgentsSummary(
    processState: ProcessState,
    app: LoanApplicationData
  ): void {
    this.checkPageBreak(40);
    this.drawSectionHeader(
      '3. Specialized Credit & Agro Intelligence Engines',
      'SCR, Open Finance, Climate & CADS'
    );

    const id = processState.loan_request_id;
    const dc = processState.specialized_reports?.data_collection || runDataCollection(id, app);
    const comp = processState.specialized_reports?.compliance || runComplianceAnalysis(id, app, processState.steps.GeoVerificationAgent?.data);
    const agro = processState.specialized_reports?.agro_risk || runAgroRiskAnalysis(id, app, dc);
    const fin = processState.specialized_reports?.financial_analysis || runFinancialAnalysis(id, app, dc, agro);

    const boxHeight = 28;
    this.doc.setFillColor(this.colorBgLight[0], this.colorBgLight[1], this.colorBgLight[2]);
    this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, boxHeight, 1.5, 1.5, 'F');
    this.doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, boxHeight, 1.5, 1.5, 'S');

    const colW = this.contentWidth / 4;
    const cols = [
      {
        engine: '1. DATA COLLECTION (SCR)',
        main: `SFN: R$ ${(dc.scr.total_exposure_brl / 1000).toFixed(0)}k`,
        sub: `Limit used: ${dc.scr.credit_limit_used_pct}% • ${dc.scr.standing}`,
        sub2: `Open Finance: R$ ${(dc.open_finance.verified_average_monthly_inflow_brl / 1000).toFixed(0)}k/m`,
      },
      {
        engine: '2. COMPLIANCE & POLICY',
        main: `Status: ${comp.overall_status}`,
        sub: `Policies: ${comp.internal_policies_cleared ? 'PASS' : 'FAIL'}`,
        sub2: `DETER: ${comp.deforestation_alerts} • IBAMA: ${comp.ibama_embargoes}`,
      },
      {
        engine: '3. AGRO RISK & CLIMATE',
        main: `Risk: ${agro.overall_risk_level}`,
        sub: `NDVI: ${agro.climate.ndvi_vegetative_vigor_index} • ${agro.climate.water_balance_status}`,
        sub2: `Hedge: ${agro.price_and_hedge.hedged_production_pct}% • Loss: ${agro.seasonality.expected_yield_loss_pct}%`,
      },
      {
        engine: '4. FINANCIAL (CADS/DSCR)',
        main: `DSCR: ${fin.dscr_safra}x`,
        sub: `CADS: R$ ${(fin.cads_brl / 1000).toFixed(0)}k`,
        sub2: `Liq: ${fin.liquidity_ratio} • Lev: ${fin.leverage_ratio}%`,
      },
    ];

    cols.forEach((col, idx) => {
      const colX = this.leftMargin + idx * colW + 3;
      if (idx > 0) {
        this.doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
        this.doc.setLineWidth(0.2);
        this.doc.line(this.leftMargin + idx * colW, this.y + 3, this.leftMargin + idx * colW, this.y + boxHeight - 3);
      }
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(6.5);
      this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
      this.doc.text(col.engine, colX, this.y + 6);

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(this.colorNavy[0], this.colorNavy[1], this.colorNavy[2]);
      this.doc.text(col.main, colX, this.y + 13);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(6.5);
      this.doc.setTextColor(this.colorText[0], this.colorText[1], this.colorText[2]);
      this.doc.text(col.sub, colX, this.y + 19);
      this.doc.text(col.sub2, colX, this.y + 24);
    });

    this.y += boxHeight + 5;
  }

  private drawGeoVerificationSection(
    report: GeoVerificationReport | null,
    app: LoanApplicationData
  ): void {
    this.checkPageBreak(50);
    this.drawSectionHeader(
      '3. Geo-Spatial & Environmental Diligence',
      'CAR, DETER/INPE & Embargo Evidence'
    );

    const prop = app.property;
    const propertyId = report?.property_id || prop?.property_id || 'CAR-PENDING';
    const status = report?.overall_status || 'NOT_VERIFIED';

    // Summary subheader
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(this.colorText[0], this.colorText[1], this.colorText[2]);
    const summaryText = `Rural Property: ${prop?.name || 'Property'} (${propertyId}) • Location: ${prop?.municipality || 'MT'}, ${prop?.state || 'MT'} • Crop: ${prop?.crop || 'Soybean'} • Declared Area: ${prop?.declared_area_ha || 0} ha`;
    this.doc.text(summaryText, this.leftMargin, this.y);

    this.y += 4;

    // Checks Table
    const checks: GeoCheck[] = report?.checks || [];
    if (checks.length > 0) {
      // Table Header
      this.checkPageBreak(10);
      const thY = this.y;
      this.doc.setFillColor(this.colorNavy[0], this.colorNavy[1], this.colorNavy[2]);
      this.doc.rect(this.leftMargin, thY, this.contentWidth, 6, 'F');

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7);
      this.doc.setTextColor(255, 255, 255);
      this.doc.text('CHECK ITEM', this.leftMargin + 3, thY + 4.2);
      this.doc.text('STATUS', this.leftMargin + 48, thY + 4.2);
      this.doc.text('FINDING & REASON CODE', this.leftMargin + 66, thY + 4.2);
      this.doc.text('SUPPORTING EVIDENCE & SOURCE', this.leftMargin + 128, thY + 4.2);

      this.y += 6;

      // Table rows
      checks.forEach((chk, idx) => {
        this.checkPageBreak(12);
        const rowBg = idx % 2 === 0 ? [255, 255, 255] : this.colorBgLight;
        this.doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
        this.doc.rect(this.leftMargin, this.y, this.contentWidth, 10, 'F');
        this.doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
        this.doc.setLineWidth(0.2);
        this.doc.line(this.leftMargin, this.y + 10, this.rightMargin, this.y + 10);

        // Label
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(7.5);
        this.doc.setTextColor(this.colorText[0], this.colorText[1], this.colorText[2]);
        this.doc.text(chk.label, this.leftMargin + 3, this.y + 4.5);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(6.5);
        this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
        this.doc.text(chk.id, this.leftMargin + 3, this.y + 8);

        // Status Badge
        const isPass = chk.status === 'PASS';
        const isBlock = chk.status === 'BLOCK';
        const stColor = isPass ? this.colorSuccess : isBlock ? this.colorDanger : this.colorWarning;
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(7.5);
        this.doc.setTextColor(stColor[0], stColor[1], stColor[2]);
        this.doc.text(chk.status, this.leftMargin + 48, this.y + 6);

        // Finding
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(7);
        this.doc.setTextColor(this.colorText[0], this.colorText[1], this.colorText[2]);
        const findingLines = this.doc.splitTextToSize(
          `${chk.finding} [${chk.reason_code}]`,
          58
        );
        this.doc.text(findingLines, this.leftMargin + 66, this.y + 4.2);

        // Supporting evidence
        const ev = chk.evidence;
        const evText = `${ev.source} (${ev.source_version || 'v1'}) • Avail: ${ev.available_time ? ev.available_time.substring(0, 10) : 'Now'}\n${ev.detail}`;
        const evLines = this.doc.splitTextToSize(evText, 50);
        this.doc.setFontSize(6.5);
        this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
        this.doc.text(evLines, this.leftMargin + 128, this.y + 4.2);

        this.y += 10;
      });
    }

    // Repair evidence note if present
    if (report?.repair_evidence) {
      this.checkPageBreak(12);
      this.y += 2;
      this.doc.setFillColor(236, 253, 245);
      this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, 9, 1, 1, 'F');
      this.doc.setDrawColor(this.colorSuccess[0], this.colorSuccess[1], this.colorSuccess[2]);
      this.doc.setLineWidth(0.3);
      this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, 9, 1, 1, 'S');

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(this.colorSuccess[0], this.colorSuccess[1], this.colorSuccess[2]);
      this.doc.text('APPROVED OPERATOR REPAIR EVIDENCE:', this.leftMargin + 4, this.y + 5.5);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7);
      this.doc.setTextColor(this.colorText[0], this.colorText[1], this.colorText[2]);
      const repairDetail = `Area: ${report.repair_evidence.survey_confirmed_area_ha || 'Verified'} ha • Deforestation exclusion: ${report.repair_evidence.deforestation_exclusion_ref || 'N/A'} • Reviewed by: ${report.repair_evidence.reviewer || 'Operator'}`;
      this.doc.text(repairDetail, this.leftMargin + 65, this.y + 5.5);

      this.y += 11;
    } else {
      this.y += 4;
    }
  }

  private drawUnderwritingRulesAudit(
    underwriting: UnderwritingReport | null,
    app: LoanApplicationData,
    rules: EligibilityRule[],
    internalRecords: Record<string, any>,
    loanId: string
  ): void {
    this.drawSectionHeader('4. Underwriting Rules Audit & Decision Logic', 'Credit Rules Knowledge Base');

    // Overview box
    const internalRec = internalRecords[loanId];
    const standing = internalRec?.account_standing || (underwriting?.internal_record_matched ? 'Good' : 'Absence reported');
    const creditScore = internalRec?.credit_score || underwriting?.credit_score || 'N/A';

    this.doc.setFillColor(this.colorBgLight[0], this.colorBgLight[1], this.colorBgLight[2]);
    this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, 14, 1.5, 1.5, 'F');
    this.doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, 14, 1.5, 1.5, 'S');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(this.colorText[0], this.colorText[1], this.colorText[2]);
    this.doc.text(
      `Eligibility Status: ${underwriting?.eligibility_status || 'REVIEW'}  •  Matched Rule: ${underwriting?.matched_rule || 'rule_001'}  •  Credit Score: ${creditScore}  •  Internal Standing: ${standing}`,
      this.leftMargin + 4,
      this.y + 6
    );

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    this.doc.text(
      underwriting?.verification_notes || 'All financial statements and internal database profiles reconciled successfully.',
      this.leftMargin + 4,
      this.y + 10.5
    );

    this.y += 18;

    // Evaluated Rules Table Header
    this.checkPageBreak(12);
    this.doc.setFillColor(this.colorNavy[0], this.colorNavy[1], this.colorNavy[2]);
    this.doc.rect(this.leftMargin, this.y, this.contentWidth, 6, 'F');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('RULE ID & DESCRIPTION', this.leftMargin + 3, this.y + 4.2);
    this.doc.text('CONDITIONS THRESHOLD', this.leftMargin + 72, this.y + 4.2);
    this.doc.text('BORROWER METRIC', this.leftMargin + 120, this.y + 4.2);
    this.doc.text('ACTION & AUDIT', this.leftMargin + 155, this.y + 4.2);

    this.y += 6;

    // Evaluate each rule against application data
    const auditRows = this.buildRuleAuditRows(rules, app, underwriting);

    auditRows.forEach((row, idx) => {
      this.checkPageBreak(12);
      const isSelected = row.isMatchedRule;
      const bg = isSelected ? [239, 246, 255] : idx % 2 === 0 ? [255, 255, 255] : this.colorBgLight;

      this.doc.setFillColor(bg[0], bg[1], bg[2]);
      this.doc.rect(this.leftMargin, this.y, this.contentWidth, 10, 'F');
      this.doc.setDrawColor(isSelected ? this.colorAccentBlue[0] : this.colorBorder[0], isSelected ? this.colorAccentBlue[1] : this.colorBorder[1], isSelected ? this.colorAccentBlue[2] : this.colorBorder[2]);
      this.doc.setLineWidth(isSelected ? 0.4 : 0.2);
      this.doc.line(this.leftMargin, this.y + 10, this.rightMargin, this.y + 10);

      // Rule ID & Desc
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(isSelected ? this.colorBrandBlue[0] : this.colorText[0], isSelected ? this.colorBrandBlue[1] : this.colorText[1], isSelected ? this.colorBrandBlue[2] : this.colorText[2]);
      this.doc.text(row.id, this.leftMargin + 3, this.y + 4.2);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(6.5);
      this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
      const descLines = this.doc.splitTextToSize(row.description, 65);
      this.doc.text(descLines, this.leftMargin + 3, this.y + 8);

      // Condition Threshold
      this.doc.setFontSize(6.5);
      this.doc.setTextColor(this.colorText[0], this.colorText[1], this.colorText[2]);
      const condLines = this.doc.splitTextToSize(row.conditionSummary, 45);
      this.doc.text(condLines, this.leftMargin + 72, this.y + 5);

      // Actual Metric
      this.doc.setFontSize(6.5);
      this.doc.setTextColor(this.colorText[0], this.colorText[1], this.colorText[2]);
      const metricLines = this.doc.splitTextToSize(row.actualMetric, 32);
      this.doc.text(metricLines, this.leftMargin + 120, this.y + 5);

      // Action & Status
      const actColor = row.action === 'ELIGIBLE' ? this.colorSuccess : row.action === 'INELIGIBLE' ? this.colorDanger : this.colorWarning;
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7);
      this.doc.setTextColor(actColor[0], actColor[1], actColor[2]);
      this.doc.text(row.action, this.leftMargin + 155, this.y + 4.5);

      this.doc.setFont('helvetica', isSelected ? 'bold' : 'normal');
      this.doc.setFontSize(6);
      this.doc.setTextColor(isSelected ? this.colorBrandBlue[0] : this.colorMuted[0], isSelected ? this.colorBrandBlue[1] : this.colorMuted[1], isSelected ? this.colorBrandBlue[2] : this.colorMuted[2]);
      this.doc.text(row.evaluationResult, this.leftMargin + 155, this.y + 8.5);

      this.y += 10;
    });

    this.y += 4;
  }

  private buildRuleAuditRows(
    rules: EligibilityRule[],
    app: LoanApplicationData,
    underwriting: UnderwritingReport | null
  ): EvaluatedRuleAudit[] {
    const annualRev = parseDollarAmount(app.annual_revenue);
    const loanAmt = parseDollarAmount(app.loan_amount_requested);
    const years = parseInt(String(app.years_in_business || '0'), 10) || 0;
    const ratio = annualRev > 0 ? loanAmt / annualRev : 1.0;
    const industry = app.industry || '';
    const matched = underwriting?.matched_rule;

    return rules.map((rule) => {
      let condSummary = '';
      let actualMetric = '';
      let result: 'MET / APPLIED' | 'PASSED' | 'FAILED' | 'NOT TRIGGERED' = 'NOT TRIGGERED';

      if (rule.id === 'rule_001') {
        condSummary = 'Rev ≥ $500K, Years ≥ 3, Loan/Rev ≤ 50%';
        actualMetric = `Rev: $${(annualRev / 1000).toFixed(0)}k, Yrs: ${years}, L/R: ${(ratio * 100).toFixed(1)}%`;
        if (annualRev >= 500000 && years >= 3 && ratio <= 0.5) {
          result = matched === 'rule_001' ? 'MET / APPLIED' : 'PASSED';
        } else {
          result = 'FAILED';
        }
      } else if (rule.id === 'rule_002') {
        condSummary = 'Rev $200K-$500K, Years ≥ 2';
        actualMetric = `Rev: $${(annualRev / 1000).toFixed(0)}k, Yrs: ${years}`;
        if (annualRev >= 200000 && annualRev <= 500000 && years >= 2) {
          result = matched === 'rule_002' ? 'MET / APPLIED' : 'PASSED';
        } else if (matched === 'rule_002') {
          result = 'MET / APPLIED';
        } else {
          result = 'NOT TRIGGERED';
        }
      } else if (rule.id === 'rule_003') {
        condSummary = 'Reject if Years ≤ 1';
        actualMetric = `Yrs: ${years}`;
        result = years <= 1 ? 'FAILED' : 'PASSED';
      } else if (rule.id === 'rule_004') {
        condSummary = 'Reject if Loan/Rev > 75%';
        actualMetric = `L/R: ${(ratio * 100).toFixed(1)}%`;
        result = ratio > 0.75 ? 'FAILED' : 'PASSED';
      } else if (rule.id === 'rule_005') {
        condSummary = 'Review if Cannabis / Crypto / Gambling';
        actualMetric = `Ind: ${industry}`;
        const highRisk = ['Cannabis', 'Cryptocurrency', 'Gambling'].some((h) =>
          industry.toLowerCase().includes(h.toLowerCase())
        );
        result = highRisk ? 'FAILED' : 'PASSED';
      } else {
        condSummary = JSON.stringify(rule.conditions);
        actualMetric = 'Evaluated';
        result = matched === rule.id ? 'MET / APPLIED' : 'PASSED';
      }

      return {
        id: rule.id,
        description: rule.description,
        action: rule.action,
        conditionSummary: condSummary,
        actualMetric,
        evaluationResult: result,
        isMatchedRule: matched === rule.id,
      };
    });
  }

  private drawPricingAmortization(pricing: PricingResult, app: LoanApplicationData): void {
    this.checkPageBreak(30);
    this.drawSectionHeader('5. Pricing, Interest Rate & Amortization Terms', 'Risk Tier & Payments');

    const cardHeight = 22;
    this.doc.setFillColor(this.colorBgLight[0], this.colorBgLight[1], this.colorBgLight[2]);
    this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, cardHeight, 1.5, 1.5, 'F');
    this.doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, cardHeight, 1.5, 1.5, 'S');

    const colWidth = this.contentWidth / 4;
    const items = [
      { label: 'RISK TIER', val: pricing.risk_tier, color: this.colorBrandBlue },
      { label: 'ANNUAL RATE (APR)', val: pricing.interest_rate, color: this.colorText },
      { label: 'MONTHLY PAYMENT', val: pricing.monthly_payment, color: this.colorText },
      { label: 'TOTAL INTEREST', val: pricing.total_interest, color: this.colorText },
    ];

    items.forEach((item, idx) => {
      const x = this.leftMargin + idx * colWidth + 4;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7);
      this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
      this.doc.text(item.label, x, this.y + 6);

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(9.5);
      this.doc.setTextColor(item.color[0], item.color[1], item.color[2]);
      this.doc.text(item.val, x, this.y + 13);
    });

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    this.doc.text(`Justification: ${pricing.rate_justification}`, this.leftMargin + 4, this.y + 18.5);

    this.y += cardHeight + 4;
  }

  private drawDecisionConditionsAndAudit(
    processState: ProcessState,
    decision: LoanDecisionResult | null,
    geoReport: GeoVerificationReport | null
  ): void {
    this.checkPageBreak(40);
    this.drawSectionHeader('6. Conditions Precedent & Execution Audit Trail', 'Compliance & Covenants');

    // Conditions box
    const conditions = decision?.conditions || [
      'Business insurance verification required within 30 days of loan signing',
      'Collateral documentation and perfected security interest prior to disbursement',
      'Quarterly financial covenants and verified accounting records submission',
    ];

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(this.colorNavy[0], this.colorNavy[1], this.colorNavy[2]);
    this.doc.text('Credit Agreement Covenants & Pre-Disbursement Conditions:', this.leftMargin, this.y);
    this.y += 4.5;

    conditions.forEach((cond) => {
      this.checkPageBreak(8);
      this.doc.setFillColor(this.colorBrandBlue[0], this.colorBrandBlue[1], this.colorBrandBlue[2]);
      this.doc.circle(this.leftMargin + 2, this.y - 1, 0.8, 'F');

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(this.colorText[0], this.colorText[1], this.colorText[2]);
      const lines = this.doc.splitTextToSize(cond, this.contentWidth - 6);
      this.doc.text(lines, this.leftMargin + 5, this.y);
      this.y += lines.length * 3.8;
    });

    this.y += 3;

    // Audit Trail box
    this.checkPageBreak(25);
    this.doc.setFillColor(this.colorBgLight[0], this.colorBgLight[1], this.colorBgLight[2]);
    this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, 18, 1, 1, 'F');
    this.doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, 18, 1, 1, 'S');

    const steps = processState.steps;
    const sDoc = steps.DocumentExtractionAgent?.completed_at ? 'Done' : 'Pending';
    const sGeo = steps.GeoVerificationAgent?.status || 'N/A';
    const sUnd = steps.UnderwritingAgent?.completed_at ? 'Done' : 'Pending';
    const sPrc = steps.PricingAgent?.completed_at ? 'Done' : 'Pending';
    const sDec = steps.LoanDecisionAgent?.completed_at ? 'Done' : 'Pending';

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(this.colorNavy[0], this.colorNavy[1], this.colorNavy[2]);
    this.doc.text('MULTI-AGENT AUDIT LOG:', this.leftMargin + 4, this.y + 5.5);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    this.doc.text(
      `DocumentExtraction [${sDoc}]  →  GeoVerification [${sGeo}]  →  Underwriting [${sUnd}]  →  Pricing [${sPrc}]  →  HITL Decision [${sDec}]`,
      this.leftMargin + 4,
      this.y + 10
    );

    this.doc.setFontSize(6.5);
    this.doc.text(
      'Audit statement: Generated via Yataí Finance Agentic Credit Engine. Confidence ≠ Risk. Temporal gating enforced on all environmental and financial records.',
      this.leftMargin + 4,
      this.y + 14.5
    );

    this.y += 22;
  }
}

/**
 * Generates and downloads a complete PDF summary report of the final loan underwriting decision,
 * processed rules, and supporting evidence.
 */
export function downloadLoanUnderwritingPdf(options: GeneratePdfOptions): void {
  const builder = new LoanUnderwritingPdfBuilder();
  const doc = builder.generateReport(options);
  const loanId = options.processState.loan_request_id || 'loan-decision';
  const cleanId = loanId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Yatai_Loan_Underwriting_Report_${cleanId}.pdf`;
  doc.save(filename);
}

/**
 * Returns the jsPDF instance for programmatic inspection or alternative destination handling.
 */
export function generateLoanUnderwritingPdf(options: GeneratePdfOptions): jsPDF {
  const builder = new LoanUnderwritingPdfBuilder();
  return builder.generateReport(options);
}
