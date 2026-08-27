"use client";

import { useMemo, useState } from "react";
import { analyzeInvestment } from "@/lib/calculators/investor";
import { submitInvestorAnalysis } from "@/lib/actions";

const currency = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const pct = (n: number) => `${n.toFixed(1)}%`;

export function InvestorAnalyzer() {
  const [label, setLabel] = useState("123 Sample St");
  const [purchasePrice, setPurchasePrice] = useState(650_000);
  const [downPayment, setDownPayment] = useState(130_000);
  const [ratePct, setRatePct] = useState(5.25);
  const [amortizationYears, setAmortizationYears] = useState(30);
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState(4_500);
  const [condoFeesMonthly, setCondoFeesMonthly] = useState(0);
  const [insuranceMonthly, setInsuranceMonthly] = useState(120);
  const [maintenanceMonthly, setMaintenanceMonthly] = useState(200);
  const [expectedRentMonthly, setExpectedRentMonthly] = useState(3_200);
  const [vacancyPct, setVacancyPct] = useState(3);
  const [isToronto, setIsToronto] = useState(false);

  const result = useMemo(
    () =>
      analyzeInvestment({
        purchasePrice,
        downPayment,
        ratePct,
        amortizationYears,
        propertyTaxAnnual,
        condoFeesMonthly,
        insuranceMonthly,
        maintenanceMonthly,
        expectedRentMonthly,
        vacancyPct,
        isTorontoProperty: isToronto,
      }),
    [
      purchasePrice,
      downPayment,
      ratePct,
      amortizationYears,
      propertyTaxAnnual,
      condoFeesMonthly,
      insuranceMonthly,
      maintenanceMonthly,
      expectedRentMonthly,
      vacancyPct,
      isToronto,
    ]
  );

  const cashFlowPositive = result.monthlyCashFlow >= 0;

  return (
    <form action={submitInvestorAnalysis} className="grid lg:grid-cols-2 gap-8">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Property / label</span>
          <input
            name="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <NumberField label="Purchase price" name="purchasePrice" value={purchasePrice} onChange={setPurchasePrice} step={1000} prefix="$" />
        <NumberField label="Down payment" name="downPayment" value={downPayment} onChange={setDownPayment} step={1000} prefix="$" />
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Interest rate (%)" name="ratePct" value={ratePct} onChange={setRatePct} step={0.05} />
          <NumberField label="Amortization (yrs)" name="amortizationYears" value={amortizationYears} onChange={setAmortizationYears} step={1} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Property tax (annual)" name="propertyTaxAnnual" value={propertyTaxAnnual} onChange={setPropertyTaxAnnual} step={100} prefix="$" />
          <NumberField label="Condo fees (monthly)" name="condoFeesMonthly" value={condoFeesMonthly} onChange={setCondoFeesMonthly} step={25} prefix="$" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Insurance (monthly)" name="insuranceMonthly" value={insuranceMonthly} onChange={setInsuranceMonthly} step={10} prefix="$" />
          <NumberField label="Maintenance allowance (mo.)" name="maintenanceMonthly" value={maintenanceMonthly} onChange={setMaintenanceMonthly} step={25} prefix="$" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Expected rent (monthly)" name="expectedRentMonthly" value={expectedRentMonthly} onChange={setExpectedRentMonthly} step={50} prefix="$" />
          <NumberField label="Vacancy allowance (%)" name="vacancyPct" value={vacancyPct} onChange={setVacancyPct} step={0.5} />
        </div>
        <label className="flex items-center gap-2.5 text-sm text-ink-soft cursor-pointer">
          <input
            type="checkbox"
            checked={isToronto}
            onChange={(e) => setIsToronto(e.target.checked)}
            className="rounded border-line-strong text-accent focus:ring-accent"
          />
          Property is in Toronto (adds municipal land transfer tax)
        </label>
      </div>

      <div className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-5">
        <div>
          <p className="font-data text-[0.65rem] uppercase tracking-wide text-ink-faint mb-1">
            Monthly cash flow
          </p>
          <p
            className={`font-display text-4xl font-semibold ${
              cashFlowPositive ? "text-good" : "text-warn"
            }`}
          >
            {cashFlowPositive ? "+" : ""}
            {currency(result.monthlyCashFlow)}
            <span className="text-base font-body font-normal text-ink-faint">/mo</span>
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-ink-soft">Effective rent</dt>
          <dd className="text-right font-data tabular-nums">{currency(result.effectiveMonthlyRent)}</dd>
          <dt className="text-ink-soft">Mortgage payment</dt>
          <dd className="text-right font-data tabular-nums">{currency(result.monthlyMortgage)}</dd>
          <dt className="text-ink-soft">Operating expenses</dt>
          <dd className="text-right font-data tabular-nums">{currency(result.monthlyOperatingExpenses)}</dd>
        </dl>

        <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
          <div>
            <p className="font-data text-[0.6rem] uppercase tracking-wide text-ink-faint">Cap rate</p>
            <p className="font-display text-2xl font-semibold">{pct(result.capRate)}</p>
          </div>
          <div>
            <p className="font-data text-[0.6rem] uppercase tracking-wide text-ink-faint">
              Cash-on-cash
            </p>
            <p className="font-display text-2xl font-semibold">{pct(result.cashOnCashPct)}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-y-1.5 text-sm border-t border-line pt-4">
          <dt className="text-ink-soft">Est. closing costs</dt>
          <dd className="text-right font-data tabular-nums">{currency(result.estimatedClosingCosts)}</dd>
          <dt className="text-ink font-medium">Total cash invested</dt>
          <dd className="text-right font-data tabular-nums font-medium">
            {currency(result.totalCashInvested)}
          </dd>
        </dl>

        <button
          type="submit"
          className="rounded-full bg-ink text-paper px-5 py-2.5 text-sm font-medium hover:bg-accent transition-colors self-start"
        >
          Save this analysis
        </button>

        <p className="text-xs text-ink-faint leading-relaxed border-t border-line pt-4">
          A planning estimate only — actual financing, rent, and closing costs vary.
          Confirm numbers with Max, your lender, and your accountant before deciding.
        </p>
      </div>
    </form>
  );
}

function NumberField({
  label,
  name,
  value,
  onChange,
  step = 1,
  prefix,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  prefix?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm">
            {prefix}
          </span>
        )}
        <input
          type="number"
          name={name}
          value={value}
          step={step}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={`w-full rounded-lg border border-line-strong bg-paper py-2 text-sm font-data tabular-nums focus:outline-none focus:ring-2 focus:ring-accent ${
            prefix ? "pl-7 pr-3" : "px-3"
          }`}
        />
      </div>
    </label>
  );
}
