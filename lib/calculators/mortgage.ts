// Standard mortgage math. Nothing exotic — these formulas don't change with
// market conditions, unlike stress-test rates, which we deliberately keep
// out of this file (see AffordabilityCalculator's disclaimer).

export function monthlyPaymentForPrincipal(
  principal: number,
  annualRatePct: number,
  amortizationYears: number
): number {
  const r = annualRatePct / 100 / 12;
  const n = amortizationYears * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function principalForMonthlyPayment(
  monthlyPayment: number,
  annualRatePct: number,
  amortizationYears: number
): number {
  const r = annualRatePct / 100 / 12;
  const n = amortizationYears * 12;
  if (monthlyPayment <= 0) return 0;
  if (r === 0) return monthlyPayment * n;
  return (monthlyPayment * (1 - Math.pow(1 + r, -n))) / r;
}
