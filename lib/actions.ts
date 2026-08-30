"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createContact,
  createClientGoal,
  logLeadEvent,
  requestShowing as requestShowingRepo,
  saveComparison as saveComparisonRepo,
  markEventAttended,
  getActiveGoal,
  seedSellerChecklist,
  createHomeProfile,
  seedMaintenanceReminders,
  toggleChecklistItemRepo,
  toggleMaintenanceItemRepo,
  createReferral as createReferralRepo,
  sendMessage as sendMessageRepo,
  requestValuation as requestValuationRepo,
  saveInvestorAnalysis as saveInvestorAnalysisRepo,
  resetAllLeadsRepo,
} from "./data/repo";
import type { ComparisonItem, GoalType, PreferredContactMethod } from "./data/types";
import { verifyAdminCode, startAdminSession, endAdminSession, isAdminAuthenticated } from "./admin-auth";

const CONTACT_COOKIE = "maximize_contact_id";

const DASHBOARD_PATH: Record<GoalType, string> = {
  buying: "/buyer",
  selling: "/seller",
  homeowner: "/homeowner",
  investing: "/investor",
  exploring: "/explore",
};

export async function getCurrentContactId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(CONTACT_COOKIE)?.value;
}

// Every persona layout calls this once. It answers two questions at the
// same time: "is anyone signed in" and "are they in the right place" — if
// someone with an active Buyer goal lands on /seller, they're bounced to
// /buyer rather than shown someone else's kind of dashboard.
export async function requireGoal(expected: GoalType): Promise<string> {
  const contactId = await getCurrentContactId();
  if (!contactId) redirect("/");
  const goal = await getActiveGoal(contactId);
  if (!goal) redirect("/");
  if (goal.goalType !== expected) redirect(DASHBOARD_PATH[goal.goalType]);
  return contactId;
}

async function setContactCookie(contactId: string) {
  const jar = await cookies();
  jar.set(CONTACT_COOKIE, contactId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

// Goal-based onboarding: creates the contact + their active goal in one step,
// then drops a cookie so the dashboard knows who's looking at it. No account
// or password yet on purpose — see Blueprint section 06 (V1 buyer scope).
export async function submitBuyerOnboarding(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const preferredContactMethod = (String(formData.get("preferredContactMethod") ?? "email") ||
    "email") as PreferredContactMethod;
  const consentMarketing = formData.get("consentMarketing") === "on";

  if (!name || !email) {
    throw new Error("Name and email are required.");
  }

  const contact = await createContact({
    name,
    email,
    phone,
    source: "buyer_onboarding",
    preferredContactMethod,
    consentMarketing,
  });

  await createClientGoal({
    contactId: contact.id,
    goalType: "buying" as GoalType,
    context: {
      budgetMin: String(formData.get("budgetMin") ?? ""),
      budgetMax: String(formData.get("budgetMax") ?? ""),
      timeline: String(formData.get("timeline") ?? ""),
      preferredArea: String(formData.get("preferredArea") ?? ""),
      financingStatus: String(formData.get("financingStatus") ?? ""),
    },
  });

  await logLeadEvent({ contactId: contact.id, eventType: "onboarded", eventMeta: { goal: "buying" } });
  await setContactCookie(contact.id);
  redirect("/buyer");
}

// Same shape as the buyer flow: one form, one contact, one active goal, then
// straight to a dashboard already carrying their context.
export async function submitSellerOnboarding(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const preferredContactMethod = (String(formData.get("preferredContactMethod") ?? "email") ||
    "email") as PreferredContactMethod;
  const consentMarketing = formData.get("consentMarketing") === "on";

  if (!name || !email || !address) {
    throw new Error("Name, email, and property address are required.");
  }

  const contact = await createContact({
    name,
    email,
    phone,
    source: "seller_onboarding",
    preferredContactMethod,
    consentMarketing,
  });

  await createClientGoal({
    contactId: contact.id,
    goalType: "selling",
    context: {
      address,
      reasonForSelling: String(formData.get("reasonForSelling") ?? ""),
      timeline: String(formData.get("timeline") ?? ""),
    },
  });

  await createHomeProfile({ contactId: contact.id, address });
  await seedSellerChecklist(contact.id);
  await logLeadEvent({ contactId: contact.id, eventType: "onboarded", eventMeta: { goal: "selling" } });
  await setContactCookie(contact.id);
  redirect("/seller");
}

export async function submitHomeownerOnboarding(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const purchaseDate = String(formData.get("purchaseDate") ?? "");
  const mortgageRenewalDate = String(formData.get("mortgageRenewalDate") ?? "");
  const preferredContactMethod = (String(formData.get("preferredContactMethod") ?? "email") ||
    "email") as PreferredContactMethod;
  const consentMarketing = formData.get("consentMarketing") === "on";

  if (!name || !email || !address) {
    throw new Error("Name, email, and address are required.");
  }

  const contact = await createContact({
    name,
    email,
    phone,
    source: "homeowner_onboarding",
    preferredContactMethod,
    consentMarketing,
  });

  await createClientGoal({
    contactId: contact.id,
    goalType: "homeowner",
    context: { address, purchaseDate, mortgageRenewalDate },
  });

  await createHomeProfile({ contactId: contact.id, address, purchaseDate, mortgageRenewalDate });
  await seedMaintenanceReminders(contact.id);
  await logLeadEvent({ contactId: contact.id, eventType: "onboarded", eventMeta: { goal: "homeowner" } });
  await setContactCookie(contact.id);
  redirect("/homeowner");
}

export async function submitInvestorOnboarding(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const preferredContactMethod = (String(formData.get("preferredContactMethod") ?? "email") ||
    "email") as PreferredContactMethod;
  const consentMarketing = formData.get("consentMarketing") === "on";

  if (!name || !email) {
    throw new Error("Name and email are required.");
  }

  const contact = await createContact({
    name,
    email,
    phone,
    source: "investor_onboarding",
    preferredContactMethod,
    consentMarketing,
  });

  await createClientGoal({
    contactId: contact.id,
    goalType: "investing",
    context: {
      targetArea: String(formData.get("targetArea") ?? ""),
      timeline: String(formData.get("timeline") ?? ""),
    },
  });

  await logLeadEvent({ contactId: contact.id, eventType: "onboarded", eventMeta: { goal: "investing" } });
  await setContactCookie(contact.id);
  redirect("/investor");
}

// Exploring is deliberately the lightest onboarding of the five — just
// enough to say hello and keep in touch, no goal-specific questions, no
// pressure to commit to a track yet (Blueprint's "no pressure" principle
// for undecided leads).
export async function submitExploringOnboarding(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const preferredContactMethod = (String(formData.get("preferredContactMethod") ?? "email") ||
    "email") as PreferredContactMethod;
  const consentMarketing = formData.get("consentMarketing") === "on";

  if (!name || !email) {
    throw new Error("Name and email are required.");
  }

  const contact = await createContact({
    name,
    email,
    phone,
    source: "exploring_onboarding",
    preferredContactMethod,
    consentMarketing,
  });

  await createClientGoal({
    contactId: contact.id,
    goalType: "exploring",
    context: {},
  });

  await logLeadEvent({ contactId: contact.id, eventType: "onboarded", eventMeta: { goal: "exploring" } });
  await setContactCookie(contact.id);
  redirect("/explore");
}

export async function logCalculatorUse(calculator: string) {
  const contactId = await getCurrentContactId();
  if (!contactId) return;
  await logLeadEvent({ contactId, eventType: "used_calculator", eventMeta: { calculator } });
}

export async function submitComparison(formData: FormData) {
  const contactId = await getCurrentContactId();
  if (!contactId) redirect("/");

  const propertyIds = formData.getAll("propertyId").map(String);
  const items: ComparisonItem[] = propertyIds.map((propertyId) => ({
    propertyId,
    pros: String(formData.get(`pros_${propertyId}`) ?? ""),
    cons: String(formData.get(`cons_${propertyId}`) ?? ""),
  }));

  await saveComparisonRepo({
    contactId: contactId as string,
    name: String(formData.get("name") ?? "My comparison"),
    items,
  });

  await logLeadEvent({
    contactId: contactId as string,
    eventType: "saved_comparison",
    eventMeta: { propertyCount: items.length },
  });

  redirect("/buyer/compare?saved=1");
}

export async function submitShowingRequest(formData: FormData) {
  const contactId = await getCurrentContactId();
  if (!contactId) redirect("/");

  await requestShowingRepo({
    contactId: contactId as string,
    propertyAddress: String(formData.get("propertyAddress") ?? ""),
    preferredWindow: String(formData.get("preferredWindow") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  redirect("/buyer?showingRequested=1");
}

export async function adminLoginAction(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const ok = await verifyAdminCode(code);
  if (!ok) redirect("/admin/login?error=1");
  await startAdminSession();
  redirect("/admin");
}

export async function adminLogoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}

export async function markAttended(eventId: string) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  await markEventAttended(eventId);
  redirect("/admin");
}

// Toggling a checklist/reminder item re-renders the page in place
// (revalidatePath) instead of redirecting — a checkbox click shouldn't feel
// like a page navigation.
export async function toggleChecklist(itemId: string) {
  await toggleChecklistItemRepo(itemId);
  revalidatePath("/seller");
}

export async function toggleMaintenance(itemId: string) {
  await toggleMaintenanceItemRepo(itemId);
  revalidatePath("/homeowner");
}

export async function requestValuationAction(formData: FormData) {
  const contactId = await getCurrentContactId();
  if (!contactId) redirect("/");
  const from = String(formData.get("from") ?? "seller") as GoalType;
  await requestValuationRepo(contactId, from);
  redirect(`${DASHBOARD_PATH[from]}?requested=1`);
}

// Used from more than one dashboard now (Homeowner, Exploring), so it reads
// a hidden "from" field the same way requestValuationAction does, instead
// of always sending the sender back to /homeowner.
export async function sendMessageAction(formData: FormData) {
  const contactId = await getCurrentContactId();
  if (!contactId) redirect("/");
  const from = String(formData.get("from") ?? "homeowner") as GoalType;
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(DASHBOARD_PATH[from]);
  await sendMessageRepo({ contactId, body });
  redirect(`${DASHBOARD_PATH[from]}?sent=1`);
}

export async function submitReferral(formData: FormData) {
  const contactId = await getCurrentContactId();
  if (!contactId) redirect("/");
  await createReferralRepo({
    contactId,
    referredName: String(formData.get("referredName") ?? ""),
    referredContact: String(formData.get("referredContact") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  redirect("/homeowner?referred=1");
}

export async function submitInvestorAnalysis(formData: FormData) {
  const contactId = await getCurrentContactId();
  if (!contactId) redirect("/");

  const num = (key: string) => Number(formData.get(key) ?? 0) || 0;

  await saveInvestorAnalysisRepo({
    contactId,
    label: String(formData.get("label") ?? "Untitled property"),
    purchasePrice: num("purchasePrice"),
    downPayment: num("downPayment"),
    ratePct: num("ratePct"),
    amortizationYears: num("amortizationYears"),
    propertyTaxAnnual: num("propertyTaxAnnual"),
    condoFeesMonthly: num("condoFeesMonthly"),
    insuranceMonthly: num("insuranceMonthly"),
    maintenanceMonthly: num("maintenanceMonthly"),
    expectedRentMonthly: num("expectedRentMonthly"),
    vacancyPct: num("vacancyPct"),
  });

  redirect("/investor/compare?saved=1");
}

// Deletes every contact/lead/activity record so a fresh Vercel deployment
// (or an owner who's done testing) can start clean. Property listings are
// untouched. The confirm() dialog protecting this lives in the client
// component that renders the button, not here — this action trusts its
// caller.
export async function resetAllLeads() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  await resetAllLeadsRepo();
  redirect("/admin");
}
