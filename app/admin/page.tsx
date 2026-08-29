import { BrandHeader } from "@/components/BrandHeader";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { listContactsWithGoals } from "@/lib/data/repo";
import { markAttended, resetAllLeads } from "@/lib/actions";
import type { LeadEventType } from "@/lib/data/types";
import { EVENT_LABEL } from "@/lib/data/labels";

// This reads the live contacts/events store on every request. Without this,
// Next.js has no signal that the page depends on runtime data (no cookies,
// no searchParams) and will happily freeze it as static HTML from build
// time — which silently shows an empty admin view forever. Caught this by
// actually clicking through the app before calling it done, not by reading
// the code.
export const dynamic = "force-dynamic";

const PRIORITY: Record<LeadEventType, number> = {
  requested_showing: 0,
  requested_valuation: 0,
  sent_message: 1,
  submitted_referral: 2,
  saved_comparison: 2,
  saved_investor_analysis: 3,
  used_calculator: 3,
  onboarded: 4,
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default async function AdminPage() {
  const rows = await listContactsWithGoals();

  const attention = rows
    .flatMap(({ contact, events }) =>
      events
        .filter((e) => !e.attendedTo)
        .map((event) => ({ contact, event }))
    )
    .sort((a, b) => {
      const p = PRIORITY[a.event.eventType] - PRIORITY[b.event.eventType];
      if (p !== 0) return p;
      return a.event.occurredAt < b.event.occurredAt ? 1 : -1;
    });

  return (
    <div className="flex flex-col flex-1">
      <BrandHeader eyebrow="Admin — internal only" />
      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-10 flex flex-col gap-12">
        <section>
          <p className="font-data text-xs tracking-wide uppercase text-ink-faint mb-2">
            Today
          </p>
          <h1 className="font-display text-3xl font-semibold mb-6">
            Who needs your attention today?
          </h1>

          {attention.length === 0 ? (
            <p className="text-ink-soft rounded-xl border border-line bg-surface p-6">
              Nothing waiting on you right now.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {attention.map(({ contact, event }) => (
                <div
                  key={event.id}
                  className={`rounded-xl border p-5 flex items-center justify-between gap-4 flex-wrap ${
                    event.eventType === "requested_showing" ||
                    event.eventType === "requested_valuation"
                      ? "border-warn bg-warn/10"
                      : "border-line bg-surface"
                  }`}
                >
                  <div>
                    <p className="font-display text-lg font-semibold">{contact.name}</p>
                    <p className="text-sm text-ink-soft">
                      {EVENT_LABEL[event.eventType]}
                      {event.eventMeta?.propertyAddress
                        ? ` — ${event.eventMeta.propertyAddress}`
                        : ""}
                    </p>
                    <p className="font-data text-xs text-ink-faint mt-1">
                      {timeAgo(event.occurredAt)} &middot; {contact.email} &middot; {contact.phone}
                    </p>
                  </div>
                  <form action={markAttended.bind(null, event.id)}>
                    <button
                      type="submit"
                      className="rounded-full border border-line-strong px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent transition-colors"
                    >
                      Mark contacted
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-semibold">All contacts</h2>
            {rows.length > 0 && (
              <form action={resetAllLeads}>
                <ConfirmSubmitButton
                  confirmText={`This permanently deletes all ${rows.length} contact(s) and their activity — showings, messages, checklists, everything. Property listings are kept. This can't be undone. Continue?`}
                  className="font-data text-xs uppercase tracking-wide text-ink-faint hover:text-warn transition-colors underline decoration-dotted"
                >
                  Clear test data
                </ConfirmSubmitButton>
              </form>
            )}
          </div>
          <div className="rounded-xl border border-line bg-surface overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left font-data text-[0.65rem] uppercase tracking-wide text-ink-faint border-b border-line-strong">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Goal</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ contact, goals }) => (
                  <tr key={contact.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium">{contact.name}</td>
                    <td className="px-4 py-3 capitalize">{goals[0]?.goalType ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{contact.source}</td>
                    <td className="px-4 py-3 text-ink-soft">{contact.email}</td>
                    <td className="px-4 py-3 font-data text-ink-faint">{timeAgo(contact.createdAt)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink-faint">
                      No contacts yet — try the buyer flow from the homepage.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
