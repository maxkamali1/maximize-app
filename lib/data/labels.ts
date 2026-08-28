import type { LeadEventType } from "./types";

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
