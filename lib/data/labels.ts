import type { GoalType, LeadEventType } from "./types";

// Shared between the admin view and the email notifier so the wording of
// "what happened" only lives in one place.
export const EVENT_LABEL: Record<LeadEventType, string> = {
  requested_showing: "Requested a showing",
  requested_valuation: "Requested a home valuation",
  sent_message: "Sent a message",
  submitted_referral: "Sent a referral your way",
  saved_comparison: "Saved a property comparison",
  saved_investor_analysis: "Saved an investment analysis",
  used_calculator: "Used the affordability calculator",
  onboarded: "New lead — just onboarded",
};

// Which persona a lead came in as — used to tell two same-moment emails
// apart (e.g. a buyer and a seller both just onboarded) at a glance.
export const GOAL_LABEL: Record<GoalType, string> = {
  buying: "Buyer",
  selling: "Seller",
  homeowner: "Homeowner",
  investing: "Investor",
  exploring: "Just Exploring",
};

// Friendly names for the free-form fields captured on a goal's context (set
// at onboarding — budget, timeline, etc.) and on an event's own eventMeta
// (set when that specific thing happens — a showing's preferred window, a
// referral's contact info). The email notifier walks both objects and uses
// this to label whatever it finds, so a new intake field picked up here
// automatically shows up in Max's inbox without another code change.
export const FIELD_LABEL: Record<string, string> = {
  budgetMin: "Budget (min)",
  budgetMax: "Budget (max)",
  timeline: "Timeline",
  preferredArea: "Preferred area",
  financingStatus: "Financing status",
  reasonForSelling: "Reason for selling",
  purchaseDate: "Purchase date",
  mortgageRenewalDate: "Mortgage renewal",
  targetArea: "Target investment area",
  preferredWindow: "Preferred showing window",
  notes: "Notes",
  preview: "Message",
  referredName: "Referred",
  referredContact: "Referred contact info",
  propertyCount: "Properties compared",
  label: "Analysis label",
};
