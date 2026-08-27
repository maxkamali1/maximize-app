import { monthlyPaymentForPrincipal } from "./mortgage";
import { estimateLandTransferTax } from "./landTransferTax";

export interface InvestorInputs {
  purchasePrice: number;
  downPayment: number;
  ratePct: number;
  amortizationYears: number;
  propertyTaxAnnual: number;
  condoFeesMonthly: number;
  insuranceMonthly: number;
  maintenanceMonthly: number;
  expectedRentMonthly: number;
  vacancyPct: number;
  isTorontoProperty?: boolean;
}

export function analyzeInvestment(input: InvestorInputs) {
  const mortgagePrincipal = Math.max(0, input.purchasePrice - input.downPayment);
  const monthlyMortgage = monthlyPaymentForPrincipal(
    mortgagePrincipal,
    input.ratePct,
    input.amortizationYears
  );

  const effectiveMonthlyRent = input.expectedRentMonthly * (1 - input.vacancyPct / 100);

  const monthlyOperatingExpenses =
    input.propertyTaxAnnual / 12 +
    input.condoFeesMonthly +
    input.insuranceMonthly +
    input.maintenanceMonthly;

  const monthlyCashFlow = effectiveMonthlyRent - monthlyOperatingExpenses - monthlyMortgage;
  const annualCashFlow = monthlyCashFlow * 12;

  const annualNOI = effectiveMonthlyRent * 12 - monthlyOperatingExpenses * 12;
  const capRate = input.purchasePrice > 0 ? (annualNOI / input.purchasePrice) * 100 : 0;

  const ltt = estimateLandTransferTax({
    price: input.purchasePrice,
    isTorontoProperty: input.isTorontoProperty ?? false,
    isFirstTimeBuyer: false,
  });
  const estimatedClosingCosts = ltt.total + 1800; // legal fees, title insurance — typical estimate
  const totalCashInvested = input.downPayment + estimatedClosingCosts;

  const cashOnCashPct =
    totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;

  return {
    monthlyMortgage,
    effectiveMonthlyRent,
    monthlyOperatingExpenses,
    monthlyCashFlow,
    annualCashFlow,
    capRate,
    estimatedClosingCosts,
    totalCashInvested,
    cashOnCashPct,
  };
}
