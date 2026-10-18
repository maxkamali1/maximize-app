import type { ClientGoal, LeadEvent } from "./data/types";
import { FIELD_LABEL } from "./data/labels";

// One plain-language list of everything a lead told us — budget, area,
// timeline, financing, notes, chat summary — built from their goal's
// intake answers plus any extra details on their events. Shared by the
// admin page, the CRM/AI-call hand-off, and anywhere else that needs
// "what did this person actually ask for?".

export interface LeadDetail {
  key: string;
  label: string;
  value: string;
}

type Bag = Record<string, string | number | boolean | undefined> | undefined;

// Form dropdowns store short codes; show what the lead actually picked.
const VALUE_LABEL: Record<string, string> = {
  pre_approved: "Pre-approved",
  in_progress: "Talking to a lender now",
  not_yet: "Haven't started yet",
  not_sure: "Not sure",
};

const SKIP_KEYS = new Set(["goal", "source", "calculator"]);

function money(raw: unknown): string {
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return String(raw);
  return `$${n.toLocaleString("en-CA")}`;
}

export function collectLeadDetails(goal?: ClientGoal, events: LeadEvent[] = []): LeadDetail[] {
  const out: LeadDetail[] = [];
  const seen = new Set<string>();

  const ctx = goal?.context;
  if (ctx?.budgetMin || ctx?.budgetMax) {
    const min = ctx.budgetMin ? money(ctx.budgetMin) : "no min";
    const max = ctx.budgetMax ? money(ctx.budgetMax) : "no max";
    out.push({ key: "budget", label: "Budget", value: `${min} – ${max}` });
    seen.add("budgetMin");
    seen.add("budgetMax");
    seen.add("budget");
  }

  const add = (bag: Bag) => {
    if (!bag) return;
    for (const [key, raw] of Object.entries(bag)) {
      if (SKIP_KEYS.has(key) || seen.has(key)) continue;
      if (raw === undefined || raw === null || raw === "" || raw === false) continue;
      seen.add(key);
      const label =
        key === "address" ? "Property address" : FIELD_LABEL[key] ?? key;
      out.push({ key, label, value: raw === true ? "Yes" : VALUE_LABEL[String(raw)] ?? String(raw) });
    }
  };

  add(ctx);
  for (const event of events) add(event.eventMeta);

  return out;
}

// "Budget: $600,000 – $850,000. Preferred area: Vaughan. ..." — for the
// CRM note and for the AI caller's script.
export function detailsAsSentences(details: LeadDetail[]): string {
  return details
    .map((d) => `${d.label}: ${d.value.trim().replace(/[.!?]+$/, "")}.`)
    .join(" ");
}
