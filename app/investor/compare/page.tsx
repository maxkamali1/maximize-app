import Link from "next/link";
import { ConfirmationBanner } from "@/components/ConfirmationBanner";
import { getCurrentContactId } from "@/lib/actions";
import { getInvestorAnalyses } from "@/lib/data/repo";
import { analyzeInvestment } from "@/lib/calculators/investor";

export const dynamic = "force-dynamic";

const currency = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const pct = (n: number) => `${n.toFixed(1)}%`;

export default async function InvestorComparePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const contactId = (await getCurrentContactId())!;
  const analyses = await getInvestorAnalyses(contactId);

  const rows = analyses.map((a) => ({ analysis: a, result: analyzeInvestment(a) }));
  const bestCashFlow = rows.length
    ? Math.max(...rows.map((r) => r.result.monthlyCashFlow))
    : undefined;

  return (
    <div className="flex flex-col gap-8">
      {saved && (
        <ConfirmationBanner>
          Analysis saved — up to your last 3 are kept here for comparison.
        </ConfirmationBanner>
      )}

      <div>
        <p className="font-data text-xs tracking-wide uppercase text-ink-faint mb-2">
          Up to 3 saved
        </p>
        <h1 className="font-display text-3xl font-semibold mb-2">Compare your opportunities</h1>
        <p className="text-ink-soft max-w-xl">
          Every analysis you save lives here — run another from the{" "}
          <Link href="/investor" className="text-accent underline">
            analyzer
          </Link>
          .
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-ink-soft rounded-xl border border-line bg-surface p-6">
          Nothing saved yet — run a property through the analyzer first.
        </p>
      ) : (
        <div className="grid gap-4">
          {rows.map(({ analysis, result }) => (
            <div
              key={analysis.id}
              className="rounded-xl border border-line bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <p className="font-display text-lg font-semibold">{analysis.label}</p>
                  <p className="text-sm text-ink-faint">{currency(analysis.purchasePrice)} purchase</p>
                </div>
                {result.monthlyCashFlow === bestCashFlow && (
                  <span className="font-data text-[0.6rem] uppercase tracking-wide bg-accent text-accent-ink rounded-full px-2 py-0.5 font-semibold">
                    Best cash flow
                  </span>
                )}
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 text-sm">
                <Stat label="Monthly cash flow" value={currency(result.monthlyCashFlow)} accent={result.monthlyCashFlow >= 0} />
                <Stat label="Cap rate" value={pct(result.capRate)} />
                <Stat label="Cash-on-cash" value={pct(result.cashOnCashPct)} />
                <Stat label="Total cash invested" value={currency(result.totalCashInvested)} />
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-ink-faint text-xs">{label}</dt>
      <dd className={`font-data tabular-nums ${accent === false ? "text-warn" : ""}`}>{value}</dd>
    </div>
  );
}
