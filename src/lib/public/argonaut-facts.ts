import type { BankStats } from "@/lib/public/content";
import { OFFERS, formatUsd } from "@/lib/plans";

// Argonaut's side of the comparison and alternatives pages, from live bank stats, so every page
// states the same numbers. Keep these as plain facts the reader can check on the site.

export type ArgonautFacts = {
  s1: string;
  s2: string;
  total: string;
  free: string;
  freeChapters: string;
  latestCreated: string | null;
  createdLast30Days: string | null;
  price: string;
  metrics: {
    accuracy: string;
    price: string;
    questions: string;
    free: string;
    adaptive: string;
    updates: string;
  };
};

const n = (x: number) => x.toLocaleString("en-US");

export const longDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function argonautFacts(stats: BankStats | null): ArgonautFacts {
  const price = formatUsd(OFFERS.access.amountUsd);
  const s1 = stats ? n(stats.exams.step1.total) : "1,000+";
  const s2 = stats ? n(stats.exams.step2ck.total) : "700+";
  const free = stats ? n(stats.publicQuestions) : "70+";
  const freeChapters = stats ? n(stats.freeChapters) : "several";
  // Older cached stats may predate these fields.
  const latestCreated = stats?.latestCreated ? longDate(stats.latestCreated) : null;
  const createdLast30Days = stats ? n(stats.createdLast30Days) : null;
  return {
    s1,
    s2,
    total: stats ? n(stats.total) : "1,700+",
    free,
    freeChapters,
    latestCreated,
    createdLast30Days,
    price,
    metrics: {
      accuracy: "Every question written to the NBME Item-Writing Guide, mapped to the official USMLE content outline and approved by a clinician (MD or DO)",
      price: `${price} once for Step 1 and Step 2 CK, with no expiry`,
      questions: `${s1} Step 1 and ${s2} Step 2 CK, in one purchase`,
      free: `${free} free questions with full explanations and ${freeChapters} free Library chapters, no account and no time limit, plus a daily challenge`,
      adaptive: "ARGO logs 16 data points per answer and builds each session itself: weak spots, confusion drills, spaced retests and coverage scouts",
      updates: latestCreated
        ? `Newest published-bank record created ${latestCreated}${createdLast30Days !== null ? `; ${createdLast30Days} created in the last 30 days` : ""}. Creation is not a publication or review date`
        : "New questions added in batches; built for the 2026 exam format",
    },
  };
}
