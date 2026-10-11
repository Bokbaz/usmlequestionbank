import type { FaqItem } from "@/components/marketing/faq";
import type { ArgonautFacts } from "@/lib/public/argonaut-facts";

// "<Competitor> alternatives" pages. Facts about other banks come from competitors.ts (dated,
// sourced); this file only holds each page's answer-first summary and FAQ.

export type AlternativesPageKey = "uworld" | "amboss" | "kaplan" | "usmle-rx";

export type AlternativesContent = {
  key: AlternativesPageKey;
  path: string;
  /** Other alternatives after Argonaut, most relevant first. */
  order: string[];
  summary: (a: ArgonautFacts) => string;
  /** Who should stay with the competitor: keeps the page fair. */
  stay: string;
  faq: (a: ArgonautFacts) => FaqItem[];
};

const free = (a: ArgonautFacts) =>
  `Argonaut has ${a.free} free questions with full explanations and ${a.freeChapters} free Library chapters, with no account and no time limit. The USMLE program also publishes free [sample test questions](https://www.usmle.org/exam-resources/step-1-materials) on usmle.org.`;

export const ALTERNATIVES: Record<AlternativesPageKey, AlternativesContent> = {
  uworld: {
    key: "uworld",
    path: "/compare/uworld-alternatives",
    order: ["usmle-rx", "amboss", "kaplan"],
    summary: (a) =>
      `The best UWorld alternative for most students is Argonaut: ${a.price} once covers Step 1 and Step 2 CK with no expiry, against $349 to $749 per exam for UWorld. Every question is written to the NBME Item-Writing Guide and approved by a clinician, and ARGO builds each session around your weak spots. USMLE-Rx (5,000+ questions, $299 a year), AMBOSS and Kaplan are the other main options.`,
    stay: "Stay with UWorld if you want the largest single-exam bank and the cost isn't a concern. Many students keep UWorld and add Argonaut as a second bank.",
    faq: (a) => [
      {
        q: "What is the best alternative to UWorld?",
        a: `For most students, Argonaut. ${a.price} once covers Step 1 and Step 2 CK with no expiry, every question is written to the NBME Item-Writing Guide and approved by a clinician, and ARGO builds each session around your weakest topics. For both exams in one subscription, USMLE-Rx Qmax has 5,000+ questions for $299 a year.`,
      },
      {
        q: "Is there a cheaper alternative to UWorld?",
        a: `Yes, lower-cost starting options are available. Argonaut is the cheapest at ${a.price} once for both exams. USMLE-Rx Qmax is $299 for 12 months of both. UWorld lists $349 to $749 per exam, or $1,158 for a year of Step 1 and Step 2 CK.`,
      },
      { q: "Is there a free alternative to UWorld?", a: `Partly. ${free(a)} Neither replaces a full bank, but both cost nothing to start.` },
      {
        q: "Is UWorld still worth it in 2026?",
        a: "If you can afford it, UWorld is still the largest bank and comes with self-assessments on longer plans. Whether it's worth $349 to $749 per exam depends on your budget; a cheaper bank you finish thoroughly beats an expensive one you don't.",
      },
      {
        q: "Can I use UWorld and Argonaut together?",
        a: `Yes. A common pattern is one main bank plus a second for fresh questions. At ${a.price} once, Argonaut is an easy second bank, and ARGO points your extra practice at the topics you keep missing. See [Argonaut vs UWorld](/compare/uworld).`,
      },
    ],
  },
  amboss: {
    key: "amboss",
    path: "/compare/amboss-alternatives",
    order: ["uworld", "usmle-rx", "kaplan"],
    summary: (a) =>
      `The best AMBOSS alternative for most students is Argonaut: ${a.price} once for Step 1 and Step 2 CK, with no membership to renew and no expiry. AMBOSS Step 1 packages cost $298 or $378 and renew at $149 a year. Argonaut's questions are written to the NBME Item-Writing Guide and approved by a clinician, and ARGO combines weak-topic practice, confusion drills and spaced retests. UWorld, USMLE-Rx and Kaplan are the other main options.`,
    stay: "Stay with AMBOSS if you use its medical library every day on the wards: no Qbank here replaces that library.",
    faq: (a) => [
      {
        q: "What is the best alternative to AMBOSS?",
        a: `For most students, Argonaut: ${a.price} once for Step 1 and Step 2 CK, no membership and no expiry, with ARGO building each session from your answer history. If you want the biggest bank, UWorld has the most questions but sells each exam separately.`,
      },
      {
        q: "Is there a cheaper alternative to AMBOSS?",
        a: `Yes. Argonaut is ${a.price} once for both exams. AMBOSS lists its Step 1 packages at $298 (1-month Qbank) or $378 (6-month Qbank), each with a membership that renews at $149 a year.`,
      },
      { q: "Is there a free alternative to AMBOSS?", a: `Partly. ${free(a)} AMBOSS itself offers a 5-day free trial.` },
      {
        q: "Does Argonaut have a medical library like AMBOSS?",
        a: `Argonaut has a high-yield Library of chapters tied to its questions, ${a.freeChapters} of them free to read. It's built for USMLE review, not as a full clinical reference like the AMBOSS library.`,
      },
      {
        q: "Is AMBOSS adaptive?",
        a: "AMBOSS offers optional adaptive sessions: within the filters you set, it picks questions you haven't answered and resurfaces older misses. Argonaut's ARGO picks the topics itself, from 16 data points per answer, and mixes weak-spot questions, confusion drills, spaced retests and coverage scouts. [See how ARGO works](/features/argo).",
      },
    ],
  },
  kaplan: {
    key: "kaplan",
    path: "/compare/kaplan-alternatives",
    order: ["uworld", "usmle-rx", "amboss"],
    summary: (a) =>
      `The best Kaplan Qbank alternative for most students is Argonaut: ${a.price} once covers Step 1 and Step 2 CK with no expiry, where Kaplan sells each exam separately, from $199 for Step 1 and $159 for Step 2 CK. Argonaut's questions are written to the NBME Item-Writing Guide and approved by a clinician, and ARGO chooses your next session for you instead of leaving you to build quizzes. UWorld, USMLE-Rx and AMBOSS are the other main options.`,
    stay: "Stay with Kaplan if you want full-length practice tests bundled with your Qbank, or you already use Kaplan's Lecture Notes.",
    faq: (a) => [
      {
        q: "What is the best alternative to the Kaplan Qbank?",
        a: `For most students, Argonaut: ${a.price} once for Step 1 and Step 2 CK, with no expiry and ARGO adaptive sessions. UWorld is the largest bank if budget isn't a concern; USMLE-Rx covers both exams for $299 a year.`,
      },
      {
        q: "Is there a cheaper alternative to Kaplan for USMLE?",
        a: `Yes. Argonaut is ${a.price} once for both exams. Kaplan lists its Step 1 Qbank from $199 and its Step 2 CK Qbank from $159, sold separately.`,
      },
      { q: "Is there a free alternative to the Kaplan Qbank?", a: `Partly. ${free(a)} Kaplan itself offers a 7-day free trial.` },
      {
        q: "Is Kaplan good for Step 1?",
        a: "Kaplan advertises 3,200+ Step 1 questions, two full-length practice tests and progress reports. It's a solid bank; the trade-offs are a separate purchase for Step 2 CK and quizzes you build yourself rather than sessions chosen for you.",
      },
      {
        q: "Does Argonaut include practice tests like Kaplan?",
        a: "No. Argonaut has timed 20-question blocks in the 2026 exam format but no full-length self-assessments. Pair it with the NBME's official self-assessments, which most students use to check their readiness.",
      },
    ],
  },
  "usmle-rx": {
    key: "usmle-rx",
    path: "/compare/usmle-rx-alternatives",
    order: ["uworld", "amboss", "kaplan"],
    summary: (a) =>
      `The best USMLE-Rx alternative for most students is Argonaut: ${a.price} once for Step 1 and Step 2 CK with no expiry, where USMLE-Rx Qmax costs $299 for 12 months. Argonaut's questions are written to the NBME Item-Writing Guide and approved by a clinician, and ARGO adapts the questions themselves to your weak spots, not just your flashcards. UWorld, AMBOSS and Kaplan are the other main options.`,
    stay: "Stay with USMLE-Rx if you want both exams in one subscription, or you rely on its First Aid-linked flashcards.",
    faq: (a) => [
      {
        q: "What is the best alternative to USMLE-Rx?",
        a: `For most students, Argonaut: ${a.price} once for Step 1 and Step 2 CK, no renewal and no expiry, with ARGO building each question session around your weak spots. UWorld is the largest bank if cost isn't a concern.`,
      },
      {
        q: "Is there a cheaper alternative to USMLE-Rx?",
        a: `Yes. Argonaut is ${a.price} once. USMLE-Rx lists Qmax at $299 for 12 months of Step 1 and Step 2 CK, and the Rx360+ bundle at $399.`,
      },
      { q: "Is there a free alternative to USMLE-Rx?", a: `Partly. ${free(a)} USMLE-Rx itself offers a 5-day free trial of Rx360+.` },
      {
        q: "Does USMLE-Rx have more questions than Argonaut?",
        a: `Yes. USMLE-Rx advertises 5,000+ Qmax questions across both exams; Argonaut has ${a.s1} Step 1 and ${a.s2} Step 2 CK questions today, with new batches added regularly.`,
      },
      {
        q: "Is USMLE-Rx adaptive?",
        a: "Its Flash Facts use spaced repetition (Study Stream), but its pricing page doesn't describe adaptive question selection in Qmax. Argonaut's ARGO chooses which questions you see next from 16 data points per answer. [See how ARGO works](/features/argo).",
      },
    ],
  },
};
