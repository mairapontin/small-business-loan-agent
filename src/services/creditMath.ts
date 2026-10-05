/**
 * @module: Small Business Loan Agent
 * @file: src/services/creditMath.ts
 * @description: Core credit mathematical functions ported from predictive/domain/credit_math.py (CADS, DSCR, Capex, Liquidity Margin)
 * @author: Maíra Pontin
 * @created: 2026-10-02
 * @version: 1.0.0
 */

/**
 * Economic depreciation per year.
 * depreciation = (newValue - residualValue) / remainingLifeYears
 */
export function economicDepreciation(
  newValue: number,
  residualValue: number,
  remainingLifeYears: number
): number {
  if (newValue < 0 || residualValue < 0) {
    throw new Error('values must be non-negative');
  }
  if (residualValue > newValue) {
    throw new Error('residual cannot exceed new value');
  }
  if (remainingLifeYears <= 0) {
    throw new Error('remaining life must be positive');
  }
  return (newValue - residualValue) / remainingLifeYears;
}

/**
 * Replacement capital expenditure.
 * max(0, replacementAllInCost - netDisposalProceeds)
 */
export function replacementCapex(
  replacementAllInCost: number,
  netDisposalProceeds: number
): number {
  if (replacementAllInCost < 0 || netDisposalProceeds < 0) {
    throw new Error('values must be non-negative');
  }
  return Math.max(0, replacementAllInCost - netDisposalProceeds);
}

/**
 * Cash Available for Debt Service (CADS).
 * Depreciation is not subtracted because it is not a cash outflow.
 * Maintenance and replacement capex enter when paid or due within the horizon.
 */
export function cashAvailableForDebtService(
  operatingCashBeforeNonCashCharges: number,
  cashTaxes: number,
  workingCapitalIncrease: number,
  maintenanceCapexPaid: number,
  replacementCapexDue: number
): number {
  if (cashTaxes < 0 || maintenanceCapexPaid < 0 || replacementCapexDue < 0) {
    throw new Error('cash outflows must be non-negative');
  }
  return (
    operatingCashBeforeNonCashCharges -
    cashTaxes -
    workingCapitalIncrease -
    maintenanceCapexPaid -
    replacementCapexDue
  );
}

/**
 * Debt Service Coverage Ratio (DSCR).
 * cashAvailable / debtService
 */
export function dscr(cashAvailable: number, debtService: number): number {
  if (debtService <= 0) {
    throw new Error('debt service must be positive');
  }
  return Number((cashAvailable / debtService).toFixed(2));
}

/**
 * Margin liquidity shortfall for derivative / hedging facilities.
 * max(0, projectedMarginCall - eligibleCash - committedMarginLines)
 */
export function marginLiquidityShortfall(
  projectedMarginCall: number,
  eligibleCash: number,
  committedMarginLines: number
): number {
  if (
    Math.min(projectedMarginCall, eligibleCash, committedMarginLines) < 0
  ) {
    throw new Error('values must be non-negative');
  }
  return Math.max(
    0,
    projectedMarginCall - eligibleCash - committedMarginLines
  );
}

/**
 * Normalized overhead proxy removing overlapping classified costs.
 */
export function normalizedOverhead(
  totalOverheadProxy: number,
  costsAlreadyClassified: number[]
): number {
  if (totalOverheadProxy < 0) {
    throw new Error('overhead must be non-negative');
  }
  const overlap = costsAlreadyClassified.reduce((a, b) => a + b, 0);
  if (overlap < 0) {
    throw new Error('classified costs must be non-negative');
  }
  return Math.max(0, totalOverheadProxy - overlap);
}
