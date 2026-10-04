// Commercial configuration, in one place. Stripe Checkout uses inline price data, so no
// Stripe dashboard setup is needed beyond the API key and webhook.
//
// Two products:
//   Full access           $48 once     every question, the Library and ARGO analytics; never expires
//   ARGO question writing $4.99/month  add-on for full-access students: new questions written
//                                      for their weakest concepts

export type PlanTier = "free" | "core" | "argo";

// "core" (bank without ARGO) is no longer sold; it stays for accounts granted it manually.
export const PLAN_RANK: Record<PlanTier, number> = { free: 0, core: 1, argo: 2 };

export const PLAN_NAME: Record<PlanTier, string> = { free: "Free", core: "QBank", argo: "Full access" };

export const OFFERS = {
  access: {
    name: "Full access",
    amountUsd: 48,
    mode: "payment",
    tagline: "Everything, paid once. No subscription, no expiry date.",
    features: [
      "Every question, in tutor or timed mode",
      "Every answer choice explained",
      "The full high-yield Library",
      "ARGO sessions built around your weak spots",
      "Full analytics: mastery map, error types, timing, retention",
      "Nuggets, flashcards and a notebook",
    ],
  },
  writer: {
    name: "ARGO question writing",
    amountUsd: 4.99,
    mode: "subscription",
    tagline: "New questions written for the topics you keep missing.",
    features: [
      "Fresh questions once you've used up a weak spot",
      "Built around the wrong answers you keep picking",
      "Every one checked before you see it",
      "Cancel anytime",
    ],
  },
} as const;

export type OfferKey = keyof typeof OFFERS;

export const FREE_FEATURES = [
  "The Daily Challenge and leaderboard",
  "Sample questions with full explanations",
  "Free Library chapters",
  "Basic stats",
];

export function planAllows(plan: PlanTier | null | undefined, min: PlanTier) {
  return PLAN_RANK[plan ?? "free"] >= PLAN_RANK[min];
}

export function formatUsd(n: number) {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}
