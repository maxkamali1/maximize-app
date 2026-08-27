// Shared data types for the MAXimize prototype.
// Field names deliberately mirror the schema in the Product Blueprint (section 13)
// so this local JSON-file store can be swapped for real Postgres/Prisma later
// without renaming anything downstream.

export type GoalType = "buying" | "selling" | "homeowner" | "investing" | "exploring";

export type PreferredContactMethod = "email" | "phone" | "text";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string; // e.g. "buyer_onboarding", "seller_onboarding"
  preferredContactMethod: PreferredContactMethod;
  consentMarketing: boolean;
  createdAt: string;
}

export interface ClientGoal {
  id: string;
  contactId: string;
  goalType: GoalType;
  status: "active" | "paused" | "completed";
  // Free-form context captured during onboarding, kept loose on purpose
  // for a prototype — a real build would normalize these per goal type.
  context: Record<string, string | number | boolean | undefined>;
  startedAt: string;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  lotSize?: string;
  taxesAnnual?: number;
  condoFeesMonthly?: number;
  basement?: string;
  parking?: string;
  notes?: string;
}

export interface ComparisonItem {
  propertyId: string;
  pros: string;
  cons: string;
  realtorRecommendation?: string;
}

export interface Comparison {
  id: string;
  contactId: string;
  name: string;
  items: ComparisonItem[];
  createdAt: string;
}

export type LeadEventType =
  | "onboarded"
  | "used_calculator"
  | "saved_comparison"
  | "requested_showing"
  | "sent_message"
  | "requested_valuation"
  | "submitted_referral"
  | "saved_investor_analysis";

export interface LeadEvent {
  id: string;
  contactId: string;
  eventType: LeadEventType;
  eventMeta: Record<string, string | number | boolean | undefined>;
  occurredAt: string;
  attendedTo: boolean;
}

export interface ShowingRequest {
  id: string;
  contactId: string;
  propertyAddress: string;
  preferredWindow: string;
  notes?: string;
  status: "requested" | "scheduled" | "completed";
  requestedAt: string;
}

// ---------- Seller ----------

export type ChecklistCategory = "prep" | "repair" | "staging";

export interface ChecklistItem {
  id: string;
  contactId: string;
  category: ChecklistCategory;
  label: string;
  isComplete: boolean;
}

// ---------- Seller & Homeowner share "the home you own/owned" ----------

export interface HomeProfile {
  id: string;
  contactId: string;
  address: string;
  purchaseDate?: string; // ISO date, optional — a seller may not have supplied it
  mortgageRenewalDate?: string; // ISO date
}

// ---------- Homeowner ----------

export type Season = "Spring" | "Summer" | "Fall" | "Winter" | "Anytime";

export interface MaintenanceReminder {
  id: string;
  contactId: string;
  label: string;
  season: Season;
  isComplete: boolean;
}

export interface Referral {
  id: string;
  contactId: string; // the referrer
  referredName: string;
  referredContact: string;
  notes?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  contactId: string;
  body: string;
  sentAt: string;
}

// ---------- Investor ----------

export interface InvestorAnalysis {
  id: string;
  contactId: string;
  label: string;
  purchasePrice: number;
  downPayment: number;
  ratePct: number;
  amortizationYears: number;
  propertyTaxAnnual: number;
  condoFeesMonthly: number;
  insuranceMonthly: number;
  maintenanceMonthly: number;
  expectedRentMonthly: number;
  vacancyPct: number;
  createdAt: string;
}

export interface DataStore {
  contacts: Contact[];
  clientGoals: ClientGoal[];
  properties: Property[];
  comparisons: Comparison[];
  leadEvents: LeadEvent[];
  showingRequests: ShowingRequest[];
  checklistItems: ChecklistItem[];
  homeProfiles: HomeProfile[];
  maintenanceReminders: MaintenanceReminder[];
  referrals: Referral[];
  messages: Message[];
  investorAnalyses: InvestorAnalysis[];
}

export const emptyStore: DataStore = {
  contacts: [],
  clientGoals: [],
  properties: [],
  comparisons: [],
  leadEvents: [],
  showingRequests: [],
  checklistItems: [],
  homeProfiles: [],
  maintenanceReminders: [],
  referrals: [],
  messages: [],
  investorAnalyses: [],
};
