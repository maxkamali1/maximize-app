import { Fragment } from "react";
import { redirect } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { listContactsWithGoals } from "@/lib/data/repo";
import { markContactAttended, resetAllLeads, adminLogoutAction } from "@/lib/actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import type { LeadEventType } from "@/lib/data/types";
import { EVENT_LABEL } from "@/lib/data/labels";
import { collectLeadDetails, type LeadDetail } from "@/lib/lead-details";

function DetailList({ details }: { details: LeadDetail[] }) {
  if (details.length === 0) {
    return <p className="text-xs text-ink-faint mt-2">No extra details provided.</p>;
  }
  return (
    <dl className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
      {details.map((d) => (
        <div key={d.key} className={d.value.length > 60 ? "sm:col-span-2" : undefined}>
          <dt className="inline font-medium text-ink">{d.label}: </dt>
          <dd className="inline text-ink-soft whitespace-pre-line">{d.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export const dynamic = "force-dynamic";

const URGENT: LeadEventType[] = ["requested_showing", "requested_valuation"];
const DAY_MS = 24 * 60 * 60 * 1000;

function isRecent(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < DAY_MS;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const rows = await listContactsWithGoals();

  // One card per person who has anything new, newest activity on top —
  // so a lead that came in a minute ago is always the first thing you see.
  const attention = rows
    .map(({ contact, events, goals }) => {
      const open = events
        .filter((e) => !e.attendedTo)
        .sort((x, y) => (x.occurredAt < y.occurredAt ? 1 : -1));
      if (open.length === 0) return null;
      // Each kind of action once, with when it last happened.
      const actions: { type: LeadEventType; at: string; address?: string }[] = [];
      for (const e of open) {
        if (actions.some((x) => x.type === e.eventType)) continue;
        actions.push({
          type: e.eventType,
          at: e.occurredAt,
          address: e.eventMeta?.propertyAddress as string | undefined,
        });
      }
      return {
        contact,
        latest: open[0].occurredAt,
        urgent: open.some((e) => URGENT.includes(e.eventType)),
        actions,
        details: collectLeadDetails(goals[0], events),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((x, y) => (x.latest < y.latest ? 1 : -1));
  return (
    <div className="flex flex-col flex-1">
      <BrandHeader eyebrow="Admin — internal only" />
      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-10 flex flex-col gap-12">
        <section>
          <div className="flex items-start justify-between gap-4 mb-2">
            <p className="font-data text-xs tracking-wide uppercase text-ink-faint">Today</p>
            <form action={adminLogoutAction}>
              <button
                type="submit"
                className="font-data text-xs uppercase tracking-wide text-ink-faint hover:text-accent transition-colors underline decoration-dotted"
              >
                Log out
              </button>
            </form>
          </div>
          <h1 className="font-display text-3xl font-semibold mb-6">
            Who needs your attention today?
          </h1>

          {attention.length === 0 ? (
            <p className="text-ink-soft rounded-xl border border-line bg-surface p-6">
              Nothing waiting on you right now.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {attention.map(({ contact, latest, urgent, actions, details }) => {
                const isNew = isRecent(latest);
                return (
                <div
                  key={contact.id}
                  className={`rounded-xl border p-5 flex items-start justify-between gap-4 flex-wrap ${
                    urgent ? "border-warn bg-warn/10" : "border-line bg-surface"
                  }`}
                >
                  <div className="flex-1 min-w-[240px]">
                    <p className="font-display text-lg font-semibold flex items-center gap-2">
                      {contact.name}
                      {isNew && (
                        <span className="font-data text-[0.65rem] uppercase tracking-wide rounded-full bg-accent text-accent-ink px-2 py-0.5">
                          New
                        </span>
                      )}
                    </p>
                    <p className="font-data text-xs text-ink-faint mt-1">
                      {timeAgo(latest)} &middot; {contact.email} &middot; {contact.phone}
                    </p>
                    <ul className="mt-2 text-sm text-ink-soft list-disc pl-5">
                      {actions.map((a) => (
                        <li key={a.type}>
                          {EVENT_LABEL[a.type]}
                          {a.address ? ` — ${a.address}` : ""}
                          <span className="text-ink-faint"> &middot; {timeAgo(a.at)}</span>
                        </li>
                      ))}
                    </ul>
                    <DetailList details={details} />
                  </div>
                  <form action={markContactAttended.bind(null, contact.id)}>
                    <button
                      type="submit"
                      className="rounded-full border border-line-strong px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent transition-colors"
                    >
                      Mark contacted
                    </button>
                  </form>
                </div>
                );
              })}
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
                {rows.map(({ contact, goals, events }) => (
                  <Fragment key={contact.id}>
                    <tr className="border-t border-line">
                      <td className="px-4 pt-3 font-medium">{contact.name}</td>
                      <td className="px-4 pt-3 capitalize">{goals[0]?.goalType ?? "—"}</td>
                      <td className="px-4 pt-3 text-ink-soft">{contact.source}</td>
                      <td className="px-4 pt-3 text-ink-soft">
                        {contact.email}
                        {contact.phone ? <><br />{contact.phone}</> : null}
                      </td>
                      <td className="px-4 pt-3 font-data text-ink-faint">{timeAgo(contact.createdAt)}</td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="px-4 pb-4">
                        <DetailList details={collectLeadDetails(goals[0], events)} />
                      </td>
                    </tr>
                  </Fragment>
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
