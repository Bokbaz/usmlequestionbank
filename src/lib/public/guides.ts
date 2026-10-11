// Guides and comparisons, in one list for the guides index, the sitemap and llms.txt. Dates are
// when the content last changed meaningfully: update them only when you change the page.

export type Guide = {
  path: string;
  title: string;
  h1: string;
  description: string;
  summary: string;
  published: string;
  updated: string;
};

export const GUIDES: Guide[] = [
  {
    path: "/guides/best-usmle-question-bank",
    title: "Best USMLE Question Bank 2026: 5 Qbanks Ranked on 6 Metrics",
    h1: "The best USMLE question bank in 2026, ranked on six metrics",
    description:
      "UWorld, AMBOSS, Kaplan, USMLE-Rx and Argonaut ranked on accuracy, price, question count, free resources, adaptive practice and updates, with dated sources.",
    summary: "Five Qbanks compared on accuracy, price, size, free resources, adaptivity and freshness.",
    published: "2026-10-11",
    updated: "2026-10-11",
  },
  {
    path: "/guides/usmle-exam-interface",
    title: "2026 USMLE Exam Format: 30-Minute Blocks Explained",
    h1: "The 2026 USMLE exam format, explained",
    description:
      "Since May 2026, Step 1 and Step 2 CK use new software with 30-minute blocks of up to 20 questions. What changed, what didn't, and how to practice for it.",
    summary: "Blocks, timing and the new test software for Step 1 and Step 2 CK.",
    published: "2026-10-11",
    updated: "2026-10-11",
  },
  {
    path: "/guides/usmle-step-1-study-plan",
    title: "USMLE Step 1 Study Plan: A Dedicated-Period Schedule",
    h1: "A USMLE Step 1 study plan you can adjust",
    description:
      "Build a Step 1 dedicated-period schedule: how many questions a day, when to take self-assessments, and how to split review. Includes a free plan calculator.",
    summary: "Phases, daily question targets and self-assessment timing, with a calculator.",
    published: "2026-10-11",
    updated: "2026-10-11",
  },
  {
    path: "/guides/usmle-step-2-ck-study-plan",
    title: "USMLE Step 2 CK Study Plan: Clerkships to Test Day",
    h1: "A USMLE Step 2 CK study plan, from clerkships to test day",
    description:
      "Plan Step 2 CK around clerkships and a dedicated period: daily question targets, shelf exams as checkpoints and self-assessment timing. Free plan calculator.",
    summary: "Using clerkships, shelf exams and a dedicated period, with a calculator.",
    published: "2026-10-11",
    updated: "2026-10-11",
  },
  {
    path: "/guides/how-to-review-usmle-questions",
    title: "How to Review USMLE Qbank Questions (With an Error Log)",
    h1: "How to review USMLE questions so the mistakes stop repeating",
    description:
      "A step-by-step method for reviewing USMLE Qbank questions: classify every miss, write the takeaway, keep an error log and retest on a schedule. Free template.",
    summary: "A review method, nine error types and a free error-log template.",
    published: "2026-10-11",
    updated: "2026-10-11",
  },
  {
    path: "/guides/usmle-question-bank-comparison",
    title: "USMLE Question Banks Compared (2026): Price, Size and Access",
    h1: "USMLE question banks compared",
    description:
      "UWorld, AMBOSS, Kaplan, USMLE-Rx and Argonaut compared on price, access length, advertised question counts and free trials, with dated sources.",
    summary: "Price, access length, size and free trials of five USMLE question banks.",
    published: "2026-10-11",
    updated: "2026-10-11",
  },
  {
    path: "/compare/uworld",
    title: "Argonaut vs UWorld for USMLE: Price, Features & Access",
    h1: "Argonaut vs UWorld for USMLE preparation",
    description:
      "A dated, Argonaut-written comparison of Argonaut and UWorld for USMLE Step 1 and Step 2 CK: price, access terms, question counts and how questions are written.",
    summary: "Price, access and features side by side, written by Argonaut.",
    published: "2026-10-11",
    updated: "2026-10-11",
  },
  {
    path: "/compare/uworld-alternatives",
    title: "UWorld Alternatives 2026: 4 Cheaper USMLE Qbanks Compared",
    h1: "The best UWorld alternatives for USMLE in 2026",
    description:
      "Need a UWorld alternative for Step 1 or Step 2 CK? Argonaut, USMLE-Rx, AMBOSS and Kaplan compared on price, access, size, free trials and adaptive practice.",
    summary: "Four cheaper Qbanks compared with UWorld, and when to stay.",
    published: "2026-10-11",
    updated: "2026-10-11",
  },
  {
    path: "/compare/amboss-alternatives",
    title: "AMBOSS Alternatives 2026: USMLE Qbanks With No Membership",
    h1: "The best AMBOSS alternatives for USMLE in 2026",
    description:
      "Need an AMBOSS alternative for Step 1 or Step 2 CK? Argonaut, UWorld, USMLE-Rx and Kaplan compared on price, renewals, size, free trials and adaptivity.",
    summary: "Qbanks without a yearly membership, compared with AMBOSS.",
    published: "2026-10-11",
    updated: "2026-10-11",
  },
  {
    path: "/compare/kaplan-alternatives",
    title: "Kaplan Qbank Alternatives 2026: USMLE Step 1 and Step 2 CK",
    h1: "The best Kaplan Qbank alternatives for USMLE in 2026",
    description:
      "Need a Kaplan Qbank alternative for USMLE? Argonaut, UWorld, USMLE-Rx and AMBOSS compared on price, both-exam coverage, size, free trials and adaptivity.",
    summary: "Covering both exams for less than Kaplan's two Qbanks.",
    published: "2026-10-11",
    updated: "2026-10-11",
  },
  {
    path: "/compare/usmle-rx-alternatives",
    title: "USMLE-Rx Alternatives 2026: Qbanks With No Yearly Renewal",
    h1: "The best USMLE-Rx alternatives in 2026",
    description:
      "Need a USMLE-Rx alternative? Argonaut, UWorld, AMBOSS and Kaplan compared with Qmax on price, access length, size, free trials and adaptive practice.",
    summary: "Alternatives to Qmax's 12-month subscription, compared.",
    published: "2026-10-11",
    updated: "2026-10-11",
  },
];

export function guide(path: string) {
  const g = GUIDES.find((x) => x.path === path);
  if (!g) throw new Error(`Unknown guide ${path}`);
  return g;
}
