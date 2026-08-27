import Link from "next/link";
import { AffordabilityCalculator } from "@/components/AffordabilityCalculator";
import { ConfirmationBanner } from "@/components/ConfirmationBanner";
import { getCurrentContactId } from "@/lib/actions";
import {
  getContact,
  getActiveGoal,
  getComparisonForContact,
  getShowingsForContact,
} from "@/lib/data/repo";

export const dynamic = "force-dynamic";

export default async function BuyerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ showingRequested?: string }>;
}) {
  const { showingRequested } = await searchParams;
  const contactId = (await getCurrentContactId())!;
  const [contact, goal, comparison, showings] = await Promise.all([
    getContact(contactId),
    getActiveGoal(contactId),
    getComparisonForContact(contactId),
    getShowingsForContact(contactId),
  ]);

  const context = goal?.context ?? {};
  const latestShowing = showings[0];

  return (
    <div className="flex flex-col gap-10">
      {showingRequested && (
        <ConfirmationBanner>
          Showing request sent — Max will follow up to confirm a time.
        </ConfirmationBanner>
      )}

      <div>
        <p className="font-data text-xs tracking-wide uppercase text-ink-faint mb-2">
          Welcome back
        </p>
        <h1 className="font-display text-3xl font-semibold mb-2">
          {contact?.name?.split(" ")[0] ?? "Hi"}, here&rsquo;s where things stand.
        </h1>
        <p className="text-ink-soft max-w-xl">
          {context.preferredArea ? `Looking in ${context.preferredArea}. ` : ""}
          {context.timeline ? `Timeline: ${context.timeline}. ` : ""}
          Start with the affordability picture below, then compare real homes side by
          side.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/buyer/compare"
          className="rounded-xl border border-line bg-surface p-5 hover:border-accent transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <p className="font-display text-lg font-semibold">Compare homes</p>
            {comparison && <StatusBadge>Saved</StatusBadge>}
          </div>
          <p className="text-sm text-ink-soft">
            {comparison
              ? `You have a saved comparison with ${comparison.items.length} home${comparison.items.length === 1 ? "" : "s"}. →`
              : "Line up to four homes side by side with your notes and Max's take. →"}
          </p>
        </Link>
        <Link
          href="/buyer/showing"
          className="rounded-xl border border-line bg-surface p-5 hover:border-accent transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <p className="font-display text-lg font-semibold">Request a showing</p>
            {latestShowing && <StatusBadge>{latestShowing.status}</StatusBadge>}
          </div>
          <p className="text-sm text-ink-soft">
            {latestShowing
              ? `Last requested: ${latestShowing.propertyAddress}. Send another? →`
              : "Found something worth seeing in person? Tell Max when works. →"}
          </p>
        </Link>
      </div>

      <div>
        <h2 className="font-display text-2xl font-semibold mb-1">
          What can you comfortably afford?
        </h2>
        <p className="text-ink-soft mb-6 max-w-xl">
          Adjust the numbers to match your situation — this updates instantly.
        </p>
        <AffordabilityCalculator
          defaults={{
            budgetMax: String(context.budgetMax ?? ""),
            preferredArea: String(context.preferredArea ?? ""),
          }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-data text-[0.6rem] uppercase tracking-wide bg-accent text-accent-ink rounded-full px-2 py-0.5 font-semibold">
      {children}
    </span>
  );
}
