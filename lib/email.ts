import { Resend } from "resend";
import type { Contact, LeadEvent } from "./data/types";
import { EVENT_LABEL } from "./data/labels";

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

export async function notifyMaxOfLeadEvent(event: LeadEvent, contact: Contact): Promise<void> {
  const client = getClient();
  if (!client) return; // no key configured — silently skip, don't break the app

  const label = EVENT_LABEL[event.eventType];
  const detail = event.eventMeta?.propertyAddress
    ? ` — ${event.eventMeta.propertyAddress}`
    : "";

  try {
    // The Resend SDK does NOT throw for API-level failures (a bad key, a
    // blocked/unverified sender, etc.) — it resolves normally with an
    // `error` field instead. A try/catch alone misses that entirely, so
    // it has to be checked explicitly.
    const { error } = await client.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      subject: `${label}: ${contact.name}`,
      html: `
        <p><strong>${contact.name}</strong> just ${label.toLowerCase()}${detail}.</p>
        <p style="color:#666;font-size:13px;">
          ${contact.email}${contact.phone ? ` &middot; ${contact.phone}` : ""}
        </p>
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
