"use client";

import { useMemo, useState } from "react";
import { submitComparison } from "@/lib/actions";
import { monthlyPaymentForPrincipal } from "@/lib/calculators/mortgage";
import type { Comparison, Property } from "@/lib/data/types";

const currency = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

const MAX_COMPARE = 4;

// Standard assumptions used only to estimate a comparable monthly carrying
// cost across properties here — the buyer's real numbers live on the
// affordability calculator. Kept obvious so it doesn't look authoritative.
const ASSUMED_DOWN_PCT = 0.2;
const ASSUMED_RATE = 5.25;
const ASSUMED_AMORTIZATION = 25;

export function CompareForm({
  properties,
  existing,
}: {
  properties: Property[];
  existing?: Comparison;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(existing?.items.map((i) => i.propertyId) ?? [])
  );
  const [notes, setNotes] = useState<Record<string, { pros: string; cons: string }>>(() => {
    const map: Record<string, { pros: string; cons: string }> = {};
    for (const item of existing?.items ?? []) {
      map[item.propertyId] = { pros: item.pros, cons: item.cons };
    }
    return map;
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_COMPARE) next.add(id);
      return next;
    });
  };

  const carrying = useMemo(() => {
    const map = new Map<string, number>();
    for (const property of properties) {
      const downPayment = property.price * ASSUMED_DOWN_PCT;
      const mortgage = property.price - downPayment;
      const pi = monthlyPaymentForPrincipal(mortgage, ASSUMED_RATE, ASSUMED_AMORTIZATION);
      const monthly = pi + (property.taxesAnnual ?? 0) / 12 + (property.condoFeesMonthly ?? 0);
      map.set(property.id, monthly);
    }
    return map;
  }, [properties]);

  const selectedProperties = properties.filter((p) => selected.has(p.id));
  const bestValue = selectedProperties.length
    ? Math.min(...selectedProperties.map((p) => carrying.get(p.id) ?? Infinity))
    : undefined;

  return (
    <form action={submitComparison} className="flex flex-col gap-8">
      <input type="hidden" name="name" value="My comparison" />

      <div className="grid gap-4">
        {properties.map((property) => {
          const isSelected = selected.has(property.id);
          const monthly = carrying.get(property.id) ?? 0;
          return (
            <div
              key={property.id}
              className={`rounded-xl border p-5 transition-colors ${
                isSelected ? "border-accent bg-accent-soft/20" : "border-line bg-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="propertyId"
                    value={property.id}
                    checked={isSelected}
                    onChange={() => toggle(property.id)}
                    disabled={!isSelected && selected.size >= MAX_COMPARE}
                    className="mt-1.5 rounded border-line-strong text-accent focus:ring-accent"
                  />
                  <div>
                    <p className="font-display text-lg font-semibold">{property.address}</p>
                    <p className="text-sm text-ink-faint">{property.city}</p>
                  </div>
                </label>
                <div className="text-right">
                  <p className="font-display text-xl font-semibold">{currency(property.price)}</p>
                  {monthly === bestValue && isSelected && (
                    <span className="font-data text-[0.65rem] uppercase tracking-wide text-good">
                      Lowest carrying cost
                    </span>
                  )}
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-y-1.5 text-sm text-ink-soft">
                <Stat label="Beds" value={property.beds} />
                <Stat label="Baths" value={property.baths} />
                <Stat label="Sqft" value={property.sqft.toLocaleString()} />
                <Stat label="Est. carrying/mo" value={currency(monthly)} />
                {property.taxesAnnual && <Stat label="Taxes/yr" value={currency(property.taxesAnnual)} />}
                {property.condoFeesMonthly !== undefined && property.condoFeesMonthly > 0 && (
                  <Stat label="Condo fees/mo" value={currency(property.condoFeesMonthly)} />
                )}
                {property.basement && <Stat label="Basement" value={property.basement} />}
                {property.parking && <Stat label="Parking" value={property.parking} />}
              </dl>

              {property.notes && <p className="mt-3 text-sm text-ink-faint italic">{property.notes}</p>}

              {isSelected && (
                <div className="mt-4 grid sm:grid-cols-2 gap-3 border-t border-line pt-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-good uppercase tracking-wide font-data">
                      What you like
                    </span>
                    <textarea
                      name={`pros_${property.id}`}
                      defaultValue={notes[property.id]?.pros ?? ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [property.id]: { pros: e.target.value, cons: prev[property.id]?.cons ?? "" },
                        }))
                      }
                      rows={2}
                      className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Big backyard, updated kitchen..."
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-warn uppercase tracking-wide font-data">
                      What gives you pause
                    </span>
                    <textarea
                      name={`cons_${property.id}`}
                      defaultValue={notes[property.id]?.cons ?? ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [property.id]: { pros: prev[property.id]?.pros ?? "", cons: e.target.value },
                        }))
                      }
                      rows={2}
                      className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Busy street, no garage..."
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-faint">
          {selected.size} of {MAX_COMPARE} selected
        </p>
        <button
          type="submit"
          disabled={selected.size === 0}
          className="rounded-full bg-ink text-paper px-6 py-3 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          Save comparison
        </button>
      </div>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-ink-faint text-xs">{label}</dt>
      <dd className="font-data tabular-nums">{value}</dd>
    </div>
  );
}
