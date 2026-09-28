/**
 * @module: Small Business Loan Agent
 * @file: src/services/monitor.ts
 * @description: Structured monitoring and logging for Gemini API calls
 * @author: Maíra Pontin
 * @created: 2026-09-24
 * @updated: 260924_012808
 * @version: 1.0.0
 * @reviewer:
 * @ai_reviewer:
 * @reviewer_date:
 */

interface GeminiCallRecord {
  timestamp: string;
  method: string;
  latencyMs: number;
  success: boolean;
  error?: string;
  loanRequestId?: string;
}

const MAX_RECORDS = 500;
const records: GeminiCallRecord[] = [];

let totalCalls = 0;
let totalFailures = 0;
let totalLatencyMs = 0;

export function recordGeminiCall(
  method: string,
  latencyMs: number,
  success: boolean,
  error?: string,
  loanRequestId?: string
): void {
  totalCalls++;
  totalLatencyMs += latencyMs;
  if (!success) totalFailures++;

  const record: GeminiCallRecord = {
    timestamp: new Date().toISOString(),
    method,
    latencyMs,
    success,
    error,
    loanRequestId,
  };

  records.push(record);
  if (records.length > MAX_RECORDS) {
    records.shift();
  }

  const level = success ? 'INFO' : 'ERROR';
  const errMsg = error ? ` error="${error}"` : '';
  const loan = loanRequestId ? ` loan=${loanRequestId}` : '';
  console.log(
    `[${level}] gemini.${method} ${latencyMs}ms success=${success}${errMsg}${loan}`
  );
}

export function getMonitorStats(): {
  totalCalls: number;
  totalFailures: number;
  failureRate: string;
  avgLatencyMs: string;
  recentCalls: number;
} {
  return {
    totalCalls,
    totalFailures,
    failureRate: totalCalls > 0
      ? ((totalFailures / totalCalls) * 100).toFixed(1) + '%'
      : '0%',
    avgLatencyMs: totalCalls > 0
      ? (totalLatencyMs / totalCalls).toFixed(0)
      : '0',
    recentCalls: records.length,
  };
}

export function getRecentRecords(limit = 20): GeminiCallRecord[] {
  return records.slice(-limit).reverse();
}
