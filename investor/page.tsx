import { InvestorAnalyzer } from "@/components/InvestorAnalyzer";

export default function InvestorPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-data text-xs tracking-wide uppercase text-ink-faint mb-2">
          Property analyzer
        </p>
        <h1 className="font-display text-3xl font-semibold mb-2">
          Run the numbers before you make an offer.
        </h1>
        <p className="text-ink-soft max-w-xl">
          Adjust anything below — cash flow, cap rate, and cash-on-cash return update
          instantly. Save it to compare against other opportunities.
        </p>
      </div>
      <InvestorAnalyzer />
    </div>
  );
}
