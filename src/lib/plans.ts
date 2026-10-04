// Commercial configuration. Prices are placeholders the owner can change in one place;
// Stripe Checkout uses inline price data, so no Stripe dashboard setup is required.

export type PlanTier = "free" | "core" | "argo";

export const PLAN_RANK: Record<PlanTier, number> = { free: 0, core: 1, argo: 2 };

export const PLANS: Record<PlanTier, { name: string; tagline: string; features: string[] }> = {
  free: {
    name: "Free",
    tagline: "Play the Daily Challenge and sample the bank.",
    features: [
      "Daily Challenge and global leaderboard",
      "Free sample questions with full explanations",
      "Free Library chapters",
      "Basic performance stats",
    ],
  },
  core: {
    name: "QBank",
    tagline: "The full question bank, explanations and Library.",
    features: [
      "Every question, tutor and timed modes",
      "Explanations for every answer choice",
      "Complete high-yield Library",
      "Performance by system, discipline and task",
      "Notebook and flashcards",
    ],
  },
  argo: {
    name: "QBank + ARGO",
    tagline: "Everything, plus the engine that hunts your weaknesses.",
    features: [
      "Everything in QBank",
      "ARGO adaptive sessions built from your weaknesses",
      "Deep analytics: mastery map, error types, calibration, stamina",
      "Confusion-pair drills and spaced retesting",
      "AI-crafted practice questions when the bank runs out",
    ],
  },
};

export type PriceKey = "core_1m" | "core_3m" | "argo_1m" | "argo_3m";

export const PRICES: Record<
  PriceKey,
  { tier: Exclude<PlanTier, "free">; label: string; months: number; amountUsd: number; perMonthUsd: number; badge?: string }
> = {
  core_1m: { tier: "core", label: "1 month", months: 1, amountUsd: 39, perMonthUsd: 39 },
  core_3m: { tier: "core", label: "3 months", months: 3, amountUsd: 99, perMonthUsd: 33, badge: "Save 15%" },
  argo_1m: { tier: "argo", label: "1 month", months: 1, amountUsd: 69, perMonthUsd: 69 },
  argo_3m: { tier: "argo", label: "3 months", months: 3, amountUsd: 179, perMonthUsd: 59.67, badge: "Save 14%" },
};

export function planAllows(plan: PlanTier | null | undefined, min: PlanTier) {
  return PLAN_RANK[plan ?? "free"] >= PLAN_RANK[min];
}
