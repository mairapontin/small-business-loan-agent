
'''
@module Yataí Finance
@file services/portal-api/src/yatai_api/predictive/domain/credit_math.py
@custom file_visibility public
@custom id
@description Decimal-based credit indicators: depreciation, capex, DSCR, liquidity margin, XNPV, annual rate.
@custom status new
@version 01_01
@author Maira Pontin <maira.pontin@yataifinance.com>
@custom ai_author AI Qoder
@custom author_date 260905_022137
@custom reviewer
@custom ai_reviewer
@custom reviewer_date
@custom updated 260908_211306
@example
'''

from __future__ import annotations

from collections.abc import Iterable, Sequence
from datetime import date
from decimal import Decimal

D = Decimal


def economic_depreciation(
    new_value: Decimal, residual_value: Decimal, remaining_life_years: Decimal
) -> Decimal:
    if new_value < 0 or residual_value < 0:
        raise ValueError("values must be non-negative")
    if residual_value > new_value:
        raise ValueError("residual cannot exceed new value")
    if remaining_life_years <= 0:
        raise ValueError("remaining life must be positive")
    return (new_value - residual_value) / remaining_life_years


def replacement_capex(replacement_all_in_cost: Decimal, net_disposal_proceeds: Decimal) -> Decimal:
    if replacement_all_in_cost < 0 or net_disposal_proceeds < 0:
        raise ValueError("values must be non-negative")
    return max(D("0"), replacement_all_in_cost - net_disposal_proceeds)


def cash_available_for_debt_service(
    operating_cash_before_non_cash_charges: Decimal,
    cash_taxes: Decimal,
    working_capital_increase: Decimal,
    maintenance_capex_paid: Decimal,
    replacement_capex_due: Decimal,
) -> Decimal:
    """Depreciation is not subtracted because it is not a cash outflow.

    Maintenance and replacement capex enter when paid or due within the horizon.
    """
    for value in (cash_taxes, maintenance_capex_paid, replacement_capex_due):
        if value < 0:
            raise ValueError("cash outflows must be non-negative")
    return (
        operating_cash_before_non_cash_charges
        - cash_taxes
        - working_capital_increase
        - maintenance_capex_paid
        - replacement_capex_due
    )


def dscr(cash_available: Decimal, debt_service: Decimal) -> Decimal:
    if debt_service <= 0:
        raise ValueError("debt service must be positive")
    return cash_available / debt_service


def margin_liquidity_shortfall(
    projected_margin_call: Decimal,
    eligible_cash: Decimal,
    committed_margin_lines: Decimal,
) -> Decimal:
    if min(projected_margin_call, eligible_cash, committed_margin_lines) < 0:
        raise ValueError("values must be non-negative")
    return max(D("0"), projected_margin_call - eligible_cash - committed_margin_lines)


def normalized_overhead(
    total_overhead_proxy: Decimal, costs_already_classified: Iterable[Decimal]
) -> Decimal:
    if total_overhead_proxy < 0:
        raise ValueError("overhead must be non-negative")
    overlap = sum(costs_already_classified, D("0"))
    if overlap < 0:
        raise ValueError("classified costs must be non-negative")
    return max(D("0"), total_overhead_proxy - overlap)


def xnpv(rate: Decimal, cashflows: Sequence[tuple[date, Decimal]]) -> Decimal:
    """Net present value of dated cashflows using ACT/365.

    The time base is the earliest cashflow date, not a fixed epoch, so the
    result depends only on the gaps between dates and not on where the series
    sits on the calendar.
    """
    if rate <= D("-1"):
        raise ValueError("rate must exceed -100%")
    if not cashflows:
        raise ValueError("cashflows required")
    start = min(day for day, _ in cashflows)
    total = D("0")
    for day, amount in cashflows:
        years = D((day - start).days) / D("365")
        discount = (D("1") + rate) ** years
        total += amount / discount
    return total


def all_in_effective_annual_rate(cashflows: Sequence[tuple[date, Decimal]]) -> Decimal:
    """Annual rate that zeroes the XNPV of a cashflow series: the all-in cost.

    Solved by bisection because irregularly spaced dates leave the rate with
    no closed-form solution. Searches -99.99%..1000% and stops at a residual
    below 1e-7, falling back to the interval midpoint after 220 iterations.
    """
    amounts = [amount for _, amount in cashflows]
    if not any(amount > 0 for amount in amounts) or not any(amount < 0 for amount in amounts):
        raise ValueError("cashflows need positive and negative amounts")

    low, high = D("-0.9999"), D("10")
    f_low, f_high = xnpv(low, cashflows), xnpv(high, cashflows)
    if f_low == 0:
        return low
    if f_high == 0:
        return high
    if f_low * f_high > 0:
        raise ValueError("could not bracket rate")

    for _ in range(220):
        mid = (low + high) / D("2")
        f_mid = xnpv(mid, cashflows)
        if abs(f_mid) < D("0.0000001"):
            return mid
        if f_low * f_mid <= 0:
            high, f_high = mid, f_mid
        else:
            low, f_low = mid, f_mid
    return (low + high) / D("2")
