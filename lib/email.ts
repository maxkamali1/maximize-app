import { Resend } from "resend";
import type { ClientGoal, Contact, LeadEvent } from "./data/types";
import { EVENT_LABEL, FIELD_LABEL, GOAL_LABEL } from "./data/labels";

// Notifications are a nice-to-have layered on top of the core app, not a
// requirement for it to function — so this is deliberately fail-soft.
// Locally (no RESEND_API_KEY set) it silently does nothing, same as the
// database falls back to a local file with no external accounts needed.
// In production, if the email fails to send for any reason (bad key,
// Resend having an outage, etc.), we log it and move on rather than ever
// breaking the actual lead-saving action a real visitor is waiting on.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_TO = process.env.NOTIFY_EMAIL || "maxkamali1@gmail.com";
// Resend's shared sandbox sender — works with zero setup, no domain to
// verify. Swap for a verified "you@yourdomain.com" address later if you
// connect your own domain in Resend.
const NOTIFY_FROM = "MAXimize Alerts <onboarding@resend.dev>";

let resend: Resend | undefined;
function getClient(): Resend | undefined {
  if (!RESEND_API_KEY) return undefined;
  if (!resend) resend = new Resend(RESEND_API_KEY);
  return resend;
}

// Everything interpolated below is text a visitor typed into a public form —
// escape it so a stray "<" or "&" in someone's notes can't distort the email
// (or, worst case, inject markup into it).
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Fields already surfaced elsewhere in the email (the opening line, or the
// goal-prefix) shouldn't also show up again in the detail list below.
const EXCLUDED_DETAIL_KEYS = new Set(["address", "propertyAddress", "goal", "source"]);

// Every intake field a lead has filled in — budget, timeline, financing,
// a showing's preferred window, a referral's contact info, whatever's
// there — rendered as a plain-language list, so the email itself is the
// full picture rather than just a ping to go check /admin.
function formatDetailLines(event: LeadEvent, goal?: ClientGoal): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  const ctx = goal?.context;
  // Budget reads better as one line than two.
  if (ctx?.budgetMin || ctx?.budgetMax) {
    const min = ctx.budgetMin ? `$${ctx.budgetMin}` : "no min set";
    const max = ctx.budgetMax ? `$${ctx.budgetMax}` : "no max set";
    lines.push(`<li><strong>Budget:</strong> ${escapeHtml(String(min))} – ${escapeHtml(String(max))}</li>`);
    seen.add("budgetMin");
    seen.add("budgetMax");
  }

  const addEntries = (obj: Record<string, string | number | boolean | undefined> | undefined) => {
    if (!obj) return;
    for (const [key, value] of Object.entries(obj)) {
      if (EXCLUDED_DETAIL_KEYS.has(key) || seen.has(key)) continue;
      if (value === undefined || value === null || value === "") continue;
      seen.add(key);
      const fieldLabel = FIELD_LABEL[key] ?? key;
      lines.push(`<li><strong>${escapeHtml(fieldLabel)}:</strong> ${escapeHtml(String(value))}</li>`);
    }
  };

  addEntries(ctx);
  addEntries(event.eventMeta);

  return lines;
}

export async function notifyMaxOfLeadEvent(
  event: LeadEvent,
  contact: Contact,
  goal?: ClientGoal
): Promise<void> {
  const client = getClient();
  if (!client) return; // no key configured — silently skip, don't break the app

  const label = EVENT_LABEL[event.eventType];
  const goalLabel = goal ? GOAL_LABEL[goal.goalType] : undefined;

  // A property address is on the event itself for a showing request, but
  // for a seller who just onboarded it lives on their goal's context
  // instead (that's where "my home's address" gets captured) — check both
  // so the email doesn't come up empty on the one detail that matters most.
  const address =
    (event.eventMeta?.propertyAddress as string | undefined) ||
    (goal?.context?.address as string | undefined);
  const detail = address ? ` — ${escapeHtml(address)}` : "";
  const detailLines = formatDetailLines(event, goal);

  // EVENT_LABEL's onboarding entry ("New lead — just onboarded") reads fine
  // standing alone on the admin page, but doubles up awkwardly once it's
  // dropped into "just {label}." here — so onboarding gets its own opening
  // line instead of reusing the generic sentence shape.
  const actionSentence =
    event.eventType === "onboarded"
      ? `New lead: <strong>${escapeHtml(contact.name)}</strong> just signed up${detail}.`
      : `<strong>${escapeHtml(contact.name)}</strong> just ${label.toLowerCase()}${detail}.`;

  // The goal prefix is what lets two leads that land in your inbox
  // back-to-back (a buyer and a seller, say) be told apart at a glance
  // without opening either one.
  const subject = `${goalLabel ? `[${goalLabel}] ` : ""}${label}: ${contact.name}`;

  try {
    // The Resend SDK does NOT throw for API-level failures (a bad key, a
    // blocked/unverified sender, etc.) — it resolves normally with an
    // `error` field instead. A try/catch alone misses that entirely, so
    // it has to be checked explicitly.
    const { error } = await client.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      subject,
      html: `
        <p>${goalLabel ? `<strong>${escapeHtml(goalLabel)} lead.</strong> ` : ""}${actionSentence}</p>
        <p style="color:#666;font-size:13px;">
          ${escapeHtml(contact.email)}${contact.phone ? ` &middot; ${escapeHtml(contact.phone)}` : ""}${contact.preferredContactMethod ? ` &middot; prefers ${escapeHtml(contact.preferredContactMethod)}` : ""}${contact.consentMarketing ? " &middot; OK to market" : ""}
        </p>
        ${detailLines.length > 0 ? `<ul style="font-size:14px;line-height:1.6;padding-left:20px;margin:12px 0;">${detailLines.join("")}</ul>` : ""}
        <p style="color:#999;font-size:12px;">
          Open your admin view to see the full picture and mark it handled.
        </p>
      `,
    });
    if (error) {
      console.error("notifyMaxOfLeadEvent: Resend returned an error:", error);
    }
  } catch (err) {
    // Covers genuine network-level failures (timeout, DNS, etc.), on top
    // of the API-level check above. Either way, a notification problem
    // never blocks the lead itself from being saved — worst case, Max
    // just doesn't get an email for this one and still sees it in /admin.
    console.error("notifyMaxOfLeadEvent threw:", err);
  }
}
