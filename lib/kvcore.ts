import type { ClientGoal, Contact, LeadEvent } from "./data/types";

// Sends brand-new website leads into Max's kvCORE / BoldTrail CRM, so they
// show up alongside every other lead (and trigger his kvCORE automations,
// like the AI follow-up call and the morning leads email).
//
// Like the email notification, this is deliberately fail-soft: if the
// KVCORE_API_TOKEN env var isn't set, or kvCORE is down / rejects the
// request, we log it and move on. The lead is always saved on the website
// first, so a CRM hiccup never costs Max a lead.
//
// The token lives ONLY in Vercel's environment variables (this repo is
// public). Create it in BoldTrail: LeadEngine → Lead Dropbox → My API Tokens.

const KVCORE_API_TOKEN = process.env.KVCORE_API_TOKEN;
const KVCORE_CONTACT_URL = "https://api.kvcore.com/v2/public/contact";

// The "source" kvCORE shows for these leads. Max's AI-call automation keys
// off this, so keep it as "Website ..." (never "Manual" or "Facebook").
const SOURCE_LABEL = "Website";

// Only push a contact once — when it is first created — not on every later
// action they take (saving a comparison, sending a message, etc.).
export function isNewWebsiteLead(event: LeadEvent, contact: Contact): boolean {
  if (event.eventType === "onboarded") return true;
  if (
    contact.source === "website_chatbot" &&
    (event.eventType === "chatbot_lead" || event.eventType === "requested_valuation")
  ) {
    return true;
  }
  return false;
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function dealType(goal?: ClientGoal): string | undefined {
  switch (goal?.goalType) {
    case "buying":
    case "investing":
      return "buyer";
    case "selling":
    case "homeowner":
      return "seller";
    default:
      return undefined;
  }
}

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function sendLeadToKvcore(
  event: LeadEvent,
  contact: Contact,
  goal?: ClientGoal
): Promise<void> {
  if (!KVCORE_API_TOKEN) return;
  if (!isNewWebsiteLead(event, contact)) return;

  const { first, last } = splitName(contact.name);
  const phone = digitsOnly(contact.phone ?? "");
  const type = dealType(goal);

  const body: Record<string, string> = {
    first_name: first || "Website",
    last_name: last || "Lead",
    source: `${SOURCE_LABEL} - ${goal?.goalType ?? contact.source}`,
  };
  if (contact.email) body.email = contact.email;
  if (phone) body.cell_phone_1 = phone;
  if (type) body.deal_type = type;

  try {
    const res = await fetch(KVCORE_CONTACT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KVCORE_API_TOKEN}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      // Never let a slow CRM hold up the visitor's redirect for long.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`sendLeadToKvcore: kvCORE returned ${res.status}: ${text.slice(0, 300)}`);
    }
  } catch (err) {
    console.error("sendLeadToKvcore threw:", err);
  }
}
