import { createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";

// Bot protection for the public sign-up forms.
//
// Spam bots crawl the web filling in any form they find, stuffing their own
// ad ("SCAM SERVICE 24/7 — https://...") into the name field so it lands in
// the site owner's inbox. Each check below catches a different kind of bot;
// a real visitor never trips any of them. When a submission is flagged we
// quietly drop it — no contact saved, no email to Max — and send the bot
// back to the home page, so it gets no hint about what gave it away.

const SECRET =
  process.env.FORM_SECRET || process.env.RESEND_API_KEY || "maximize-form-guard";

// Humans need at least a few seconds to read and fill in a form.
const MIN_FILL_MS = 2_500;
// A form left open longer than this is stale (or a replayed token).
const MAX_FORM_AGE_MS = 24 * 60 * 60 * 1000;

// Name of the hidden trap field. Real visitors never see it, so it stays
// empty; bots fill in every field they find.
export const HONEYPOT_FIELD = "company_website";
export const FORM_TOKEN_FIELD = "form_token";

// Throwaway-inbox services bots use. Not exhaustive — just the common ones.
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "merepost.com",
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "sharklasers.com",
  "grr.la",
  "10minutemail.com",
  "10minutemail.net",
  "temp-mail.org",
  "tempmail.com",
  "tempmail.net",
  "tempmailo.com",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.net",
  "getnada.com",
  "nada.email",
  "trashmail.com",
  "trashmail.de",
  "dispostable.com",
  "maildrop.cc",
  "mailnesia.com",
  "mintemail.com",
  "mohmal.com",
  "emailondeck.com",
  "fakeinbox.com",
  "spamgourmet.com",
  "moakt.com",
  "tmpmail.org",
  "tmpmail.net",
  "burnermail.io",
  "mail.tm",
  "inboxkitten.com",
  "linshiyouxiang.net",
]);

// Links or HTML anywhere a person would type their name, area, or notes.
const LINK_PATTERN = /(https?:\/\/|www\.|<\s*a\b|href\s*=|\[url)/i;
// Other giveaways seen in bot submissions.
const SPAM_WORDS = /(scam service|casino|crypto ?wallet|viagra|backlinks?|seo service|ххх)/i;

function sign(issuedAt: string): string {
  return createHmac("sha256", SECRET).update(`form:${issuedAt}`).digest("hex").slice(0, 32);
}

// Called when the form is shown. The token records when the page was opened,
// signed so a bot can't make up its own.
export function issueFormToken(): string {
  const issuedAt = String(Date.now());
  return `${issuedAt}.${sign(issuedAt)}`;
}

function tokenProblem(token: string): string | null {
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return "missing form token";
  const expected = Buffer.from(sign(issuedAt));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return "forged form token";
  }
  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < MIN_FILL_MS) return "submitted too fast";
  if (age > MAX_FORM_AGE_MS) return "form token expired";
  return null;
}

// Best-effort cap on how many sign-ups one visitor can send in a short
// window. (Lives in memory, so it resets when the server restarts — the other
// checks do the heavy lifting; this just blunts a burst like 10 forms in 15s.)
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 4;
const recentByIp = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  if (!ip) return false;
  const now = Date.now();
  const hits = (recentByIp.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  recentByIp.set(ip, hits);
  if (recentByIp.size > 5000) recentByIp.clear();
  return hits.length > RATE_MAX;
}

const FREE_TEXT_FIELDS = [
  "name",
  "notes",
  "preferredArea",
  "targetArea",
  "address",
  "reasonForSelling",
];

const NUMBER_FIELDS = ["budgetMin", "budgetMax"];

// Returns why the submission looks like a bot, or null if it looks human.
export async function detectSpam(formData: FormData): Promise<string | null> {
  if (String(formData.get(HONEYPOT_FIELD) ?? "").trim()) return "honeypot filled";

  const tokenIssue = tokenProblem(String(formData.get(FORM_TOKEN_FIELD) ?? ""));
  if (tokenIssue) return tokenIssue;

  for (const field of FREE_TEXT_FIELDS) {
    const value = String(formData.get(field) ?? "");
    if (LINK_PATTERN.test(value)) return `link in ${field}`;
    if (SPAM_WORDS.test(value)) return `spam words in ${field}`;
  }

  for (const field of NUMBER_FIELDS) {
    const value = String(formData.get(field) ?? "").trim();
    if (value && !/^\d[\d,.\s]*$/.test(value)) return `non-number in ${field}`;
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const domain = email.split("@")[1] ?? "";
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return "disposable email";
  if (/[~]/.test(email.split("@")[0] ?? "")) return "odd email";

  const phone = String(formData.get("phone") ?? "").trim();
  if (phone) {
    if (/[a-z]/i.test(phone)) return "letters in phone";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) return "invalid phone";
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "";
  if (rateLimited(ip)) return "too many submissions";

  return null;
}
