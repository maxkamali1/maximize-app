"use client";

import { useEffect, useMemo, useState } from "react";
import { monthlyPaymentForPrincipal, principalForMonthlyPayment } from "@/lib/calculators/mortgage";
import { estimateLandTransferTax } from "@/lib/calculators/landTransferTax";
import { logCalculatorUse } from "@/lib/actions";

const currency = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

export function AffordabilityCalculator({
  defaults,
}: {
  defaults?: { budgetMax?: string; preferredArea?: string };
}) {
  const [income, setIncome] = useState(120_000);
  const [monthlyDebts, setMonthlyDebts] = useState(400);
  const [downPayment, setDownPayment] = useState(
    Number(defaults?.budgetMax || 800_000) * 0.15
  );
  const [rate, setRate] = useState(5.25);
  const [amortization, setAmortization] = useState(25);
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState(4_200);
  const [condoFees, setCondoFees] = useState(0);
  const [isToronto, setIsToronto] = useState(
    (defaults?.preferredArea ?? "").toLowerCase().includes("toronto")
  );
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(true);

  useEffect(() => {
    logCalculatorUse("affordability").catch(() => {});
  }, []);

  const result = useMemo(() => {
    const monthlyIncome = income / 12;
    const heatEstimate = 150;

    const maxHousingGDS = monthlyIncome * 0.32;
    const maxHousingTDS = monthlyIncome * 0.4 - monthlyDebts;

    const nonMortgageMonthlyCost = propertyTaxAnnual / 12 + heatEstimate + condoFees * 0.5;

    const maxMortgagePaymentGDS = Math.max(0, maxHousingGDS - nonMortgageMonthlyCost);
    const maxMortgagePaymentTDS = Math.max(0, maxHousingTDS - nonMortgageMonthlyCost);
    const maxMortgagePayment = Math.min(maxMortgagePaymentGDS, maxMortgagePaymentTDS);

    const maxMortgagePrincipal = principalForMonthlyPayment(
      maxMortgagePayment,
      rate,
      amortization
    );
    const maxPurchasePrice = Math.max(0, maxMortgagePrincipal + downPayment);

    const actualMortgage = Math.max(0, maxPurchasePrice - downPayment);
    const actualMonthlyPI = monthlyPaymentForPrincipal(actualMortgage, rate, amortization);

    const ltt = estimateLandTransferTax({
      price: maxPurchasePrice,
      isTorontoProperty: isToronto,
      isFirstTimeBuyer,
    });

    const estimatedLegalAndTitle = 2200;
    const totalClosingCosts = ltt.total + estimatedLegalAndTitle;

    return {
      maxPurchasePrice,
      actualMortgage,
      actualMonthlyPI,
      nonMortgageMonthlyCost,
      totalMonthlyCarrying: actualMonthlyPI + nonMortgageMonthlyCost,
      ltt,
      totalClosingCosts,
      limitedByGDS: maxMortgagePaymentGDS <= maxMortgagePaymentTDS,
    };
  }, [income, monthlyDebts, downPayment, rate, amortization, propertyTaxAnnual, condoFees, isToronto, isFirstTimeBuyer]);

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="flex flex-col gap-4">
        <NumberField label="Gross household income (annual)" value={income} onChange={setIncome} step={1000} prefix="$" />
        <NumberField label="Other monthly debts (car, loans, cards)" value={monthlyDebts} onChange={setMonthlyDebts} step={50} prefix="$" />
        <NumberField label="Down payment available" value={downPayment} onChange={setDownPayment} step={1000} prefix="$" />
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Interest rate (%)" value={rate} onChange={setRate} step={0.05} />
          <NumberField label="Amortization (years)" value={amortization} onChange={setAmortization} step={1} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Est. property tax (annual)" value={propertyTaxAnnual} onChange={setPropertyTaxAnnual} step={100} prefix="$" />
          <NumberField label="Condo fees (monthly)" value={condoFees} onChange={setCondoFees} step={25} prefix="$" />
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <Toggle label="Property is in Toronto (adds municipal land transfer tax)" checked={isToronto} onChange={setIsToronto} />
          <Toggle label="First-time home buyer (land transfer tax rebate applies)" checked={isFirstTimeBuyer} onChange={setIsFirstTimeBuyer} />
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-5">
        <div>
          <p className="font-data text-[0.65rem] uppercase tracking-wide text-ink-faint mb-1">
            Estimated comfortable purchase price
          </p>
          <p className="font-display text-4xl font-semibold text-ink">
            {currency(result.maxPurchasePrice)}
          </p>
          <p className="text-xs text-ink-faint mt-1">
            Based on the {result.limitedByGDS ? "32% housing" : "40% total debt"} guideline —
            whichever is more conservative.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-ink-soft">Mortgage payment</dt>
          <dd className="text-right font-data tabular-nums">{currency(result.actualMonthlyPI)}/mo</dd>
          <dt className="text-ink-soft">Taxes, heat &amp; fees</dt>
          <dd className="text-right font-data tabular-nums">{currency(result.nonMortgageMonthlyCost)}/mo</dd>
          <dt className="text-ink font-medium border-t border-line pt-2 mt-1">Total monthly carrying cost</dt>
          <dd className="text-right font-data tabular-nums font-medium border-t border-line pt-2 mt-1">
            {currency(result.totalMonthlyCarrying)}/mo
          </dd>
        </dl>

        <div className="border-t border-line pt-4">
          <p className="font-data text-[0.65rem] uppercase tracking-wide text-ink-faint mb-2">
            Estimated closing costs
          </p>
          <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
            <dt className="text-ink-soft">Ontario land transfer tax</dt>
            <dd className="text-right font-data tabular-nums">{currency(result.ltt.ontarioTax)}</dd>
            {isToronto && (
              <>
                <dt className="text-ink-soft">Toronto municipal LTT</dt>
                <dd className="text-right font-data tabular-nums">{currency(result.ltt.torontoTax)}</dd>
              </>
            )}
            <dt className="text-ink-soft">Legal fees &amp; title insurance (typical)</dt>
            <dd className="text-right font-data tabular-nums">~{currency(2200)}</dd>
            <dt className="text-ink font-medium border-t border-line pt-2 mt-1">
              Total to budget at closing
            </dt>
            <dd className="text-right font-data tabular-nums font-medium border-t border-line pt-2 mt-1">
              ~{currency(result.totalClosingCosts)}
            </dd>
          </dl>
        </div>

        <p className="text-xs text-ink-faint leading-relaxed border-t border-line pt-4">
          This is a planning estimate, not a mortgage pre-approval or a tax quote. Land
          transfer tax rates, rebates, and lender qualification rules change — confirm
          current numbers with Max, your lender, and your lawyer before relying on this.
        </p>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  prefix,
}: {
  label: string;
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-ink-soft cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-line-strong text-accent focus:ring-accent"
      />
      {label}
    </label>
  );
}
