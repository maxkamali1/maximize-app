import { readStore, writeStore, newId } from "./store";
import type {
  Contact,
  ClientGoal,
  GoalType,
  Property,
  Comparison,
  ComparisonItem,
  LeadEvent,
  LeadEventType,
  ShowingRequest,
  PreferredContactMethod,
  ChecklistCategory,
  ChecklistItem,
  HomeProfile,
  MaintenanceReminder,
  Season,
  Referral,
  Message,
  InvestorAnalysis,
} from "./types";

// ---------- contacts & goals ----------

// Wipes every lead/contact/activity record while leaving the property
// listings alone. Meant for clearing out test data before real use — not
// exposed anywhere except the admin view, and gated behind a confirmation
// dialog in the UI.
export async function resetAllLeadsRepo(): Promise<void> {
  await writeStore((store) => {
    store.contacts = [];
    store.clientGoals = [];
    store.comparisons = [];
    store.leadEvents = [];
    store.showingRequests = [];
    store.checklistItems = [];
    store.homeProfiles = [];
    store.maintenanceReminders = [];
    store.referrals = [];
    store.messages = [];
    store.investorAnalyses = [];
  });
}

export async function createContact(input: {
  name: string;
  email: string;
  phone: string;
  source: string;
  preferredContactMethod: PreferredContactMethod;
  consentMarketing: boolean;
}): Promise<Contact> {
  const contact: Contact = {
    id: newId("contact"),
    createdAt: new Date().toISOString(),
    ...input,
  };
  await writeStore((store) => {
    store.contacts.push(contact);
  });
  return contact;
}

export async function createClientGoal(input: {
  contactId: string;
  goalType: GoalType;
  context: Record<string, string | number | boolean | undefined>;
}): Promise<ClientGoal> {
  const goal: ClientGoal = {
    id: newId("goal"),
    contactId: input.contactId,
    goalType: input.goalType,
    status: "active",
    context: input.context,
    startedAt: new Date().toISOString(),
  };
  await writeStore((store) => {
    store.clientGoals.push(goal);
  });
  return goal;
}

export async function getContact(contactId: string): Promise<Contact | undefined> {
  const store = await readStore();
  return store.contacts.find((c) => c.id === contactId);
}

export async function getActiveGoal(contactId: string): Promise<ClientGoal | undefined> {
  const store = await readStore();
  return store.clientGoals
    .filter((g) => g.contactId === contactId && g.status === "active")
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0];
}

export async function listContactsWithGoals() {
  const store = await readStore();
  return store.contacts
    .map((contact) => ({
      contact,
      goals: store.clientGoals.filter((g) => g.contactId === contact.id),
      events: store.leadEvents.filter((e) => e.contactId === contact.id),
      showings: store.showingRequests.filter((s) => s.contactId === contact.id),
    }))
    .sort((a, b) => (a.contact.createdAt < b.contact.createdAt ? 1 : -1));
}

// ---------- lead events (the raw signal behind "who needs my attention") ----------

export async function logLeadEvent(input: {
  contactId: string;
  eventType: LeadEventType;
  eventMeta?: Record<string, string | number | boolean | undefined>;
}): Promise<LeadEvent> {
  const event: LeadEvent = {
    id: newId("event"),
    contactId: input.contactId,
    eventType: input.eventType,
    eventMeta: input.eventMeta ?? {},
    occurredAt: new Date().toISOString(),
    attendedTo: false,
  };
  await writeStore((store) => {
    store.leadEvents.push(event);
  });
  return event;
}

export async function markEventAttended(eventId: string): Promise<void> {
  await writeStore((store) => {
    const event = store.leadEvents.find((e) => e.id === eventId);
    if (event) event.attendedTo = true;
  });
}

// ---------- properties & comparisons ----------

export async function listProperties(): Promise<Property[]> {
  const store = await readStore();
  return store.properties;
}

export async function getComparisonForContact(contactId: string): Promise<Comparison | undefined> {
  const store = await readStore();
  return store.comparisons
    .filter((c) => c.contactId === contactId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
}

export async function saveComparison(input: {
  contactId: string;
  name: string;
  items: ComparisonItem[];
}): Promise<Comparison> {
  const existing = await getComparisonForContact(input.contactId);
  const comparison: Comparison = existing
    ? { ...existing, name: input.name, items: input.items }
    : {
        id: newId("cmp"),
        contactId: input.contactId,
        name: input.name,
        items: input.items,
        createdAt: new Date().toISOString(),
      };

  await writeStore((store) => {
    const idx = store.comparisons.findIndex((c) => c.id === comparison.id);
    if (idx >= 0) store.comparisons[idx] = comparison;
    else store.comparisons.push(comparison);
  });

  return comparison;
}

export async function getShowingsForContact(contactId: string): Promise<ShowingRequest[]> {
  const store = await readStore();
  return store.showingRequests
    .filter((s) => s.contactId === contactId)
    .sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
}

// ---------- showings ----------

export async function requestShowing(input: {
  contactId: string;
  propertyAddress: string;
  preferredWindow: string;
  notes?: string;
}): Promise<ShowingRequest> {
  const showing: ShowingRequest = {
    id: newId("showing"),
    contactId: input.contactId,
    propertyAddress: input.propertyAddress,
    preferredWindow: input.preferredWindow,
    notes: input.notes,
    status: "requested",
    requestedAt: new Date().toISOString(),
  };
  await writeStore((store) => {
    store.showingRequests.push(showing);
  });
  await logLeadEvent({
    contactId: input.contactId,
    eventType: "requested_showing",
    eventMeta: { propertyAddress: input.propertyAddress },
  });
  return showing;
}

// ---------- seller checklist ----------

const SELLER_CHECKLIST_TEMPLATE: { category: ChecklistCategory; label: string }[] = [
  { category: "prep", label: "Declutter and depersonalize each room" },
  { category: "prep", label: "Deep clean, including carpets and windows" },
  { category: "prep", label: "Gather property documents (survey, warranties, permits)" },
  { category: "repair", label: "Fix any visible deferred maintenance (leaks, cracks, trim)" },
  { category: "repair", label: "Touch up paint in high-traffic areas" },
  { category: "repair", label: "Service major systems (furnace, AC) for a clean inspection" },
  { category: "staging", label: "Arrange furniture to maximize flow and light" },
  { category: "staging", label: "Book professional photography" },
  { category: "staging", label: "Add curb appeal — lawn, entryway, exterior touch-ups" },
];

export async function seedSellerChecklist(contactId: string): Promise<void> {
  const items: ChecklistItem[] = SELLER_CHECKLIST_TEMPLATE.map((t) => ({
    id: newId("chk"),
    contactId,
    category: t.category,
    label: t.label,
    isComplete: false,
  }));
  await writeStore((store) => {
    store.checklistItems.push(...items);
  });
}

export async function getChecklistForContact(contactId: string): Promise<ChecklistItem[]> {
  const store = await readStore();
  return store.checklistItems.filter((i) => i.contactId === contactId);
}

export async function toggleChecklistItemRepo(itemId: string): Promise<void> {
  await writeStore((store) => {
    const item = store.checklistItems.find((i) => i.id === itemId);
    if (item) item.isComplete = !item.isComplete;
  });
}

// ---------- home profile (seller + homeowner) ----------

export async function createHomeProfile(input: {
  contactId: string;
  address: string;
  purchaseDate?: string;
  mortgageRenewalDate?: string;
}): Promise<HomeProfile> {
  const profile: HomeProfile = {
    id: newId("home"),
    contactId: input.contactId,
    address: input.address,
    purchaseDate: input.purchaseDate || undefined,
    mortgageRenewalDate: input.mortgageRenewalDate || undefined,
  };
  await writeStore((store) => {
    store.homeProfiles.push(profile);
  });
  return profile;
}

export async function getHomeProfile(contactId: string): Promise<HomeProfile | undefined> {
  const store = await readStore();
  return store.homeProfiles.find((h) => h.contactId === contactId);
}

// ---------- homeowner maintenance reminders ----------

const MAINTENANCE_TEMPLATE: { season: Season; label: string }[] = [
  { season: "Fall", label: "Clean gutters and downspouts" },
  { season: "Fall", label: "Service the furnace before heating season" },
  { season: "Winter", label: "Test smoke and CO detectors" },
  { season: "Winter", label: "Watch for ice damming on the roofline" },
  { season: "Spring", label: "Inspect the roof after winter" },
  { season: "Spring", label: "Service the air conditioner" },
  { season: "Anytime", label: "Review your home insurance coverage annually" },
  { season: "Anytime", label: "Check the water heater and sump pump" },
];

export async function seedMaintenanceReminders(contactId: string): Promise<void> {
  const items: MaintenanceReminder[] = MAINTENANCE_TEMPLATE.map((t) => ({
    id: newId("maint"),
    contactId,
    season: t.season,
    label: t.label,
    isComplete: false,
  }));
  await writeStore((store) => {
    store.maintenanceReminders.push(...items);
  });
}

export async function getMaintenanceForContact(contactId: string): Promise<MaintenanceReminder[]> {
  const store = await readStore();
  return store.maintenanceReminders.filter((m) => m.contactId === contactId);
}

export async function toggleMaintenanceItemRepo(itemId: string): Promise<void> {
  await writeStore((store) => {
    const item = store.maintenanceReminders.find((m) => m.id === itemId);
    if (item) item.isComplete = !item.isComplete;
  });
}

// ---------- referrals ----------

export async function createReferral(input: {
  contactId: string;
  referredName: string;
  referredContact: string;
  notes?: string;
}): Promise<Referral> {
  const referral: Referral = {
    id: newId("ref"),
    contactId: input.contactId,
    referredName: input.referredName,
    referredContact: input.referredContact,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };
  await writeStore((store) => {
    store.referrals.push(referral);
  });
  await logLeadEvent({
    contactId: input.contactId,
    eventType: "submitted_referral",
    eventMeta: { referredName: input.referredName },
  });
  return referral;
}

// ---------- messages ("Ask Max") ----------

export async function sendMessage(input: { contactId: string; body: string }): Promise<Message> {
  const message: Message = {
    id: newId("msg"),
    contactId: input.contactId,
    body: input.body,
    sentAt: new Date().toISOString(),
  };
  await writeStore((store) => {
    store.messages.push(message);
  });
  await logLeadEvent({
    contactId: input.contactId,
    eventType: "sent_message",
    eventMeta: { preview: input.body.slice(0, 80) },
  });
  return message;
}

export async function getMessagesForContact(contactId: string): Promise<Message[]> {
  const store = await readStore();
  return store.messages
    .filter((m) => m.contactId === contactId)
    .sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1));
}

// ---------- valuation requests ----------

export async function requestValuation(contactId: string, source: GoalType): Promise<void> {
  await logLeadEvent({ contactId, eventType: "requested_valuation", eventMeta: { source } });
}

export async function hasRequestedValuation(contactId: string): Promise<boolean> {
  const store = await readStore();
  return store.leadEvents.some(
    (e) => e.contactId === contactId && e.eventType === "requested_valuation"
  );
}

// ---------- investor analyses ----------

const MAX_INVESTOR_ANALYSES = 3;

export async function saveInvestorAnalysis(
  input: Omit<InvestorAnalysis, "id" | "createdAt">
): Promise<InvestorAnalysis> {
  const analysis: InvestorAnalysis = {
    ...input,
    id: newId("inv"),
    createdAt: new Date().toISOString(),
  };
  await writeStore((store) => {
    store.investorAnalyses.push(analysis);
    const mine = store.investorAnalyses
      .filter((a) => a.contactId === input.contactId)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    if (mine.length > MAX_INVESTOR_ANALYSES) {
      const toDrop = mine.slice(0, mine.length - MAX_INVESTOR_ANALYSES).map((a) => a.id);
      store.investorAnalyses = store.investorAnalyses.filter((a) => !toDrop.includes(a.id));
    }
  });
  await logLeadEvent({
    contactId: input.contactId,
    eventType: "saved_investor_analysis",
    eventMeta: { label: input.label },
  });
  return analysis;
}

export async function getInvestorAnalyses(contactId: string): Promise<InvestorAnalysis[]> {
  const store = await readStore();
  return store.investorAnalyses
    .filter((a) => a.contactId === contactId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
