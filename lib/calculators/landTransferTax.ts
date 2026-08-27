// Ontario Land Transfer Tax + Toronto Municipal Land Transfer Tax.
//
// IMPORTANT: these bracket rates and rebate caps are widely-published
// long-standing figures, but tax brackets and rebate rules do change, and
// this file is not a source of truth. Every place this is used in the UI
// carries a visible "confirm before relying on this" disclaimer per the
// Blueprint's compliance section — treat this as a starting estimate for a
// conversation with Max/a real estate lawyer, not a quote.

interface Bracket {
  upTo: number; // inclusive upper bound of this bracket, Infinity for the last one
  rate: number; // marginal rate applied to the portion of price within this bracket
}

const ONTARIO_BRACKETS: Bracket[] = [
  { upTo: 55_000, rate: 0.005 },
  { upTo: 250_000, rate: 0.01 },
  { upTo: 400_000, rate: 0.015 },
  { upTo: 2_000_000, rate: 0.02 },
  { upTo: Infinity, rate: 0.025 },
];

// Toronto's municipal LTT mirrors the provincial brackets up to $2M, then
// adds its own higher brackets for higher-value single family residences.
const TORONTO_BRACKETS: Bracket[] = [
  { upTo: 55_000, rate: 0.005 },
  { upTo: 250_000, rate: 0.01 },
  { upTo: 400_000, rate: 0.015 },
  { upTo: 2_000_000, rate: 0.02 },
  { upTo: 3_000_000, rate: 0.025 },
  { upTo: 4_000_000, rate: 0.035 },
  { upTo: 5_000_000, rate: 0.045 },
  { upTo: 10_000_000, rate: 0.055 },
  { upTo: 20_000_000, rate: 0.065 },
  { upTo: Infinity, rate: 0.075 },
];

const ONTARIO_FIRST_TIME_REBATE_MAX = 4_000;
const TORONTO_FIRST_TIME_REBATE_MAX = 4_475;

function taxFromBrackets(price: number, brackets: Bracket[]): number {
  let tax = 0;
  let lowerBound = 0;
  for (const bracket of brackets) {
    if (price <= lowerBound) break;
    const portion = Math.min(price, bracket.upTo) - lowerBound;
    tax += portion * bracket.rate;
    lowerBound = bracket.upTo;
  }
  return Math.round(tax);
}

export function estimateLandTransferTax(input: {
  price: number;
  isTorontoProperty: boolean;
  isFirstTimeBuyer: boolean;
}) {
  const ontarioTaxRaw = taxFromBrackets(input.price, ONTARIO_BRACKETS);
  const ontarioRebate = input.isFirstTimeBuyer
    ? Math.min(ontarioTaxRaw, ONTARIO_FIRST_TIME_REBATE_MAX)
    : 0;
  const ontarioTax = ontarioTaxRaw - ontarioRebate;

  let torontoTaxRaw = 0;
  let torontoRebate = 0;
  if (input.isTorontoProperty) {
    torontoTaxRaw = taxFromBrackets(input.price, TORONTO_BRACKETS);
    torontoRebate = input.isFirstTimeBuyer
      ? Math.min(torontoTaxRaw, TORONTO_FIRST_TIME_REBATE_MAX)
      : 0;
  }
  const torontoTax = torontoTaxRaw - torontoRebate;

  return {
    ontarioTaxRaw,
    ontarioRebate,
    ontarioTax,
    torontoTaxRaw,
    torontoRebate,
    torontoTax,
    total: ontarioTax + torontoTax,
  };
}
