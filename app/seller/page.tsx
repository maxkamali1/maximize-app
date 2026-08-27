import { ToggleCheckbox } from "@/components/ToggleCheckbox";
import { ConfirmationBanner } from "@/components/ConfirmationBanner";
import { getCurrentContactId, toggleChecklist, requestValuationAction } from "@/lib/actions";
import {
  getActiveGoal,
  getHomeProfile,
  getChecklistForContact,
  hasRequestedValuation,
} from "@/lib/data/repo";
import type { ChecklistCategory, ChecklistItem } from "@/lib/data/types";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<ChecklistCategory, string> = {
  prep: "Prep",
  repair: "Repair",
  staging: "Staging",
};

export default async function SellerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string }>;
}) {
  const { requested } = await searchParams;
  const contactId = (await getCurrentContactId())!;
  const [goal, homeProfile, checklist, valuationRequested] = await Promise.all([
    getActiveGoal(contactId),
    getHomeProfile(contactId),
    getChecklistForContact(contactId),
    hasRequestedValuation(contactId),
  ]);

  const context = goal?.context ?? {};
  const done = checklist.filter((i) => i.isComplete).length;
  const pct = checklist.length ? Math.round((done / checklist.length) * 100) : 0;

  const byCategory = checklist.reduce<Record<ChecklistCategory, ChecklistItem[]>>(
    (acc, item) => {
      acc[item.category].push(item);
      return acc;
    },
    { prep: [], repair: [], staging: [] }
  );

  return (
    <div className="flex flex-col gap-10">
      {requested && (
        <ConfirmationBanner>
          Valuation requested — Max will put together your numbers and follow up.
        </ConfirmationBanner>
      )}

      <div>
        <p className="font-data text-xs tracking-wide uppercase text-ink-faint mb-2">
          {homeProfile?.address ?? "Your listing"}
        </p>
        <h1 className="font-display text-3xl font-semibold mb-2">
          Here&rsquo;s where your sale stands.
        </h1>
        <p className="text-ink-soft max-w-xl">
          {context.reasonForSelling ? `Reason: ${context.reasonForSelling}. ` : ""}
          {context.timeline ? `Timeline: ${context.timeline}.` : ""}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-display text-lg font-semibold">Home valuation</p>
            {valuationRequested && (
              <span className="font-data text-[0.6rem] uppercase tracking-wide bg-accent text-accent-ink rounded-full px-2 py-0.5 font-semibold">
                Requested
              </span>
            )}
          </div>
          <p className="text-sm text-ink-soft mb-4">
            Max will prepare a real comparative market analysis — not an automated
            guess — and walk you through it.
          </p>
          {!valuationRequested && (
            <form action={requestValuationAction}>
              <input type="hidden" name="from" value="selling" />
              <button
                type="submit"
                className="rounded-full bg-ink text-paper px-5 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                Request a valuation
              </button>
            </form>
          )}
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="font-display text-lg font-semibold mb-1">Market activity</p>
          <p className="text-sm text-ink-soft">
            Once your prep is underway, Max will share comparable listings and recent
            nearby sales here — this isn&rsquo;t an automated feed, it&rsquo;s his read on
            the market for your home specifically.
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-2xl font-semibold">Getting listing-ready</h2>
          <p className="font-data text-sm text-ink-faint">
            {done}/{checklist.length} done &middot; {pct}%
          </p>
        </div>
        <div className="h-1.5 rounded-full bg-line overflow-hidden mb-6">
          <div
            className="h-full bg-accent transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {(Object.keys(byCategory) as ChecklistCategory[]).map((cat) => (
            <div key={cat} className="rounded-xl border border-line bg-surface p-5">
              <p className="font-data text-[0.65rem] uppercase tracking-wide text-ink-faint mb-3">
                {CATEGORY_LABEL[cat]}
              </p>
              <div className="flex flex-col gap-2.5">
                {byCategory[cat].map((item) => (
                  <ToggleCheckbox
                    key={item.id}
                    checked={item.isComplete}
                    label={item.label}
                    action={toggleChecklist.bind(null, item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
