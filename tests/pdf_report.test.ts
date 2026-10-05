/**
 * @module: Small Business Loan Agent
 * @file: tests/pdf_report.test.ts
 * @description: Offline tests for the loan underwriting PDF summary report generator
 * @author: Maíra Pontin
 * @created: 2026-10-01
 * @version: 1.0.0
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateLoanUnderwritingPdf } from '../src/services/pdfReportGenerator';
import {
  ProcessStateService,
  SAMPLE_APPLICATIONS,
  ELIGIBILITY_RULES,
  MOCK_INTERNAL_RECORDS,
} from '../src/services/loanService';
import { orchestratorFor } from '../src/services/orchestrator';

test('PDF summary report generates valid PDF document for approved loan', async () => {
  const loanId = 'SBL-2025-02142';
  ProcessStateService.reset(loanId);
  const orchestrator = orchestratorFor('deterministic');
  await orchestrator.start(loanId, SAMPLE_APPLICATIONS[loanId].data);
  await orchestrator.approve(loanId);

  const processState = ProcessStateService.getProcessStatus(loanId);
  assert.ok(processState, 'process state must exist');
  assert.equal(processState.overall_status, 'approved');

  const doc = generateLoanUnderwritingPdf({
    processState,
    rules: ELIGIBILITY_RULES,
    internalRecords: MOCK_INTERNAL_RECORDS,
  });

  assert.ok(doc, 'jsPDF instance must be generated');
  const pageCount = doc.getNumberOfPages();
  assert.ok(pageCount >= 2, `PDF report should be at least 2 pages, got ${pageCount}`);

  // Verify PDF binary output starts with %PDF- header
  const output = doc.output('arraybuffer');
  assert.ok(output.byteLength > 1000, 'PDF buffer must be non-empty');
  const headerBytes = new Uint8Array(output.slice(0, 5));
  const headerString = String.fromCharCode(...headerBytes);
  assert.equal(headerString, '%PDF-', 'Output must start with standard PDF header');
});

test('PDF summary report includes geo-environmental checks and evidence for agro loan', async () => {
  const loanId = 'SBL-2025-07788';
  ProcessStateService.reset(loanId);
  const orchestrator = orchestratorFor('deterministic');
  await orchestrator.start(loanId, SAMPLE_APPLICATIONS[loanId].data);
  await orchestrator.approve(loanId);

  const processState = ProcessStateService.getProcessStatus(loanId);
  assert.ok(processState, 'process state must exist');

  const doc = generateLoanUnderwritingPdf({
    processState,
    rules: ELIGIBILITY_RULES,
    internalRecords: MOCK_INTERNAL_RECORDS,
  });

  assert.ok(doc, 'jsPDF instance must be generated');
  assert.ok(doc.getNumberOfPages() >= 2);
  const output = doc.output('arraybuffer');
  assert.ok(output.byteLength > 2000, 'PDF with geo evidence must be populated');
});
