import type { ClientGoal, Contact, LeadEvent } from "./data/types";
import { GOAL_LABEL } from "./data/labels";
import { collectLeadDetails, detailsAsSentences } from "./lead-details";

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
// When set (Vercel env var), new leads go to Max's Zapier "Website Lead"
// workflow instead, WITH every detail they gave. That workflow creates the
// BoldTrail contact (details in the Notes), has the AI call them knowing
// what they asked for, and emails Max the call summary. The direct kvCORE
// push below is then skipped so nobody is created or called twice.
const LEAD_WEBHOOK_URL = process.env.ZAPIER_LEAD_WEBHOOK_URL;
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
  if (!isNewWebsiteLead(event, contact)) return;
  if (LEAD_WEBHOOK_URL) {
    await sendLeadToZapier(event, contact, goal);
    return;
  }
  if (!KVCORE_API_TOKEN) return;

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

async function sendLeadToZapier(
  event: LeadEvent,
  contact: Contact,
  goal?: ClientGoal
): Promise<void> {
  const { first, last } = splitName(contact.name);
  const details = collectLeadDetails(goal, [event]);
  const ctx = goal?.context ?? {};
  const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
  const payload = {
    first_name: first || "Website",
    last_name: last || "Lead",
    full_name: contact.name,
    email: contact.email ?? "",
    phone: digitsOnly(contact.phone ?? ""),
    preferred_contact: contact.preferredContactMethod ?? "",
    goal: goal?.goalType ?? "",
    goal_label: goal ? GOAL_LABEL[goal.goalType] : "",
    deal_type: dealType(goal) ?? "",
    source: `${SOURCE_LABEL} - ${goal?.goalType ?? contact.source}`,
    capture_method: contact.source === "website_chatbot" ? "Website chat assistant" : `Website ${goal?.goalType ?? ""} form`.trim(),
    budget_min: str(ctx.budgetMin),
    budget_max: str(ctx.budgetMax),
    area: str(ctx.preferredArea || ctx.targetArea || ctx.area),
    timeline: str(ctx.timeline),
    financing: details.find((d) => d.key === "financingStatus")?.value ?? "",
    property_address: str(ctx.address || event.eventMeta?.propertyAddress),
    notes: str(ctx.notes),
    details_text: detailsAsSentences(details),
    details: details.map((d) => ({ label: d.label, value: d.value })),
  };
  try {
    const res = await fetch(LEAD_WEBHOOK_URL as string, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`sendLeadToZapier: webhook returned ${res.status}`);
    }
  } catch (err) {
    console.error("sendLeadToZapier threw:", err);
  }
}
