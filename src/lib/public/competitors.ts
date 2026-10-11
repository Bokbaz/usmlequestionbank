// Other USMLE question banks, as their own websites described them on CHECKED. Every value here
// is quoted from the source URLs; re-check all of them before changing any, and update CHECKED.
// Question counts are each company's advertised figures, not verified by us.

export const CHECKED = "11 October 2026";
export const CHECKED_ISO = "2026-10-11";

export type Source = { label: string; url: string };

export type Competitor = {
  key: string;
  name: string;
  product: string;
  exams: string;
  price: string;
  access: string;
  questions: string;
  tryFree: string;
  notes: string;
  source: string;
  // The six metrics of /guides/best-usmle-question-bank, one short factual line each.
  metrics: {
    /** How the company describes the way its questions match the exam. */
    accuracy: string;
    /** What it costs to cover Step 1 and Step 2 CK. */
    price: string;
    questions: string;
    free: string;
    adaptive: string;
    updates: string;
  };
  /** One line: who this bank suits best. */
  bestFor: string;
  pros: string[];
  cons: string[];
  /** Why students look elsewhere: facts from the company's own pages, not opinions. */
  leaveReasons: string[];
  sources: Source[];
};

const UWORLD_S1 = "https://medical.uworld.com/usmle/usmle-step-1/";
const AMBOSS_S1 = "https://www.amboss.com/us/usmle/step1";
const AMBOSS_ADAPTIVE = "https://support.amboss.com/hc/en-us/articles/45511273700369";
const KAPLAN_S1 = "https://www.kaptest.com/usmle/practice/usmle-step-1-qbank";
const KAPLAN_S2 = "https://www.kaptest.com/usmle-step-2ck/practice/usmle-step-2ck-qbank";
const KAPLAN_TRIAL = "https://www.kaptest.com/usmle/free/step-1-qbank-trial";
const RX_PRICING = "https://usmle-rx.com/pricing/";

export const COMPETITORS: Competitor[] = [
  {
    key: "uworld",
    name: "UWorld",
    product: "Step 1 QBank (Step 2 CK sold separately)",
    exams: "One exam per purchase",
    price: "$349 for 30 days to $749 for 730 days; $579 for 360 days",
    access: "30 to 730 days; can't be paused once activated",
    questions: "3,600+ Step 1; 4,250+ Step 2 CK and shelf",
    tryFree: "No trial account; a demo with a few sample questions",
    notes: "Plans of 90 days or longer include one to three self-assessments. QBank Plus ($448 to $848) adds medical videos.",
    source: UWORLD_S1,
    metrics: {
      accuracy: "Written by licensed authors; described as “at or above exam-level difficulty” and aligned to the content outline",
      price: "$349 to $749 per exam; $1,158 for a year of both",
      questions: "3,600+ Step 1 and 4,250+ Step 2 CK and shelf (two purchases)",
      free: "No trial account; a demo with a few sample questions",
      adaptive: "Custom tests by subject and system, quizzes from your weak areas, an adaptive study planner",
      updates: "Says its QBank is “continuously updated”; no date of the latest additions shown",
    },
    bestFor: "Students who want the largest single-exam bank and can pay for each exam separately.",
    pros: [
      "The largest advertised banks for Step 1 and Step 2 CK.",
      "Self-assessments included with 90-day and longer plans.",
      "Familiar to most students and tutors.",
    ],
    cons: [
      "$349 to $749 per exam, and Step 2 CK is a second purchase.",
      "Access runs on a clock and can't be paused once activated.",
      "No trial account, only a short demo.",
    ],
    leaveReasons: [
      "Price: each exam is sold separately, from $349 for 30 days to $749 for 730 days. A year of Step 1 and Step 2 CK lists at $1,158.",
      "The clock: access starts on activation and can't be paused, so a delayed exam date can mean paying again.",
      "No proper trial: UWorld's FAQ says it doesn't offer guest or trial accounts, only a demo with a few sample questions.",
    ],
    sources: [{ label: "UWorld Step 1 page, pricing and FAQ", url: UWORLD_S1 }, { label: "UWorld Step 2 CK page and pricing", url: "https://medical.uworld.com/usmle/usmle-step-2-ck/" }],
  },
  {
    key: "amboss",
    name: "AMBOSS",
    product: "Qbank with membership",
    exams: "Qbank access includes Step 1, Step 2 CK, shelf and Step 3 questions",
    price: "Step 1: $298 (1-month Qbank) or $378 (6-month Qbank), each with a 1-year membership that renews at $149 a year",
    access: "1 to 12 months of Qbank, depending on the package",
    questions: "2,840+ Step 1; 3,460+ Step 2",
    tryFree: "5-day free trial",
    notes: "Includes the AMBOSS library, study plans and a score predictor. 30-day money-back guarantee on direct purchases.",
    source: AMBOSS_S1,
    metrics: {
      accuracy: "Clinical vignettes in “the same format” as the licensing exams; questions linked to its medical library",
      price: "$298 to $378 for a Step 1 package, plus a $149 yearly membership renewal",
      questions: "2,840+ Step 1 and 3,460+ Step 2",
      free: "5-day free trial",
      adaptive: "Optional adaptive sessions: picks unanswered questions within your filters and resurfaces old misses",
      updates: "No date of the latest question additions shown on the pages we checked",
    },
    bestFor: "Students who want a Qbank tied to a full medical reference library.",
    pros: [
      "Questions link straight into the AMBOSS medical library.",
      "Optional adaptive sessions that resurface old misses.",
      "One Qbank covers Step 1, Step 2 CK, shelf and Step 3.",
    ],
    cons: [
      "Qbank access is time-limited (1 to 12 months), with a membership that renews at $149 a year.",
      "Only a 5-day free trial.",
      "Fewer Step 1 questions advertised than UWorld or Kaplan.",
    ],
    leaveReasons: [
      "Ongoing cost: Step 1 packages are $298 or $378 and come with a membership that renews at $149 a year.",
      "Time limits: Qbank access lasts 1 to 12 months depending on the package.",
      "A short trial: 5 days is not long to judge a bank you'll use for months.",
    ],
    sources: [
      { label: "AMBOSS Step 1 page and pricing", url: AMBOSS_S1 },
      { label: "AMBOSS help center: adaptive question sessions", url: AMBOSS_ADAPTIVE },
      { label: "AMBOSS Step 2 CK page", url: "https://www.amboss.com/us/usmle/step2" },
    ],
  },
  {
    key: "kaplan",
    name: "Kaplan",
    product: "Step 1 Qbank (Step 2 CK Qbank sold separately)",
    exams: "One exam per purchase",
    price: "Step 1 from $199; Step 2 CK from $159",
    access: "Varies by plan; see Kaplan's site",
    questions: "3,200+ Step 1; 3,100+ Step 2 CK",
    tryFree: "7-day free trial",
    notes: "Two full-length practice tests with each Qbank, progress reports and an AI tutor.",
    source: KAPLAN_S1,
    metrics: {
      accuracy: "“Exam-like questions” in an interface that replicates the exam, with step-by-step strategies",
      price: "From $199 (Step 1) plus from $159 (Step 2 CK)",
      questions: "3,200+ Step 1 and 3,100+ Step 2 CK (two purchases)",
      free: "7-day free trial",
      adaptive: "Build-your-own quizzes, progress reports and an AI tutor that explains answers",
      updates: "No date of the latest question additions shown on the pages we checked",
    },
    bestFor: "Students who want practice tests bundled with a Qbank and Kaplan's lecture notes.",
    pros: [
      "Two full-length practice tests with each Qbank.",
      "A 7-day free trial, the longest of the paid banks here.",
      "Questions link to Kaplan's Lecture Notes books.",
    ],
    cons: [
      "Step 1 and Step 2 CK are separate purchases.",
      "No adaptive question selection described: you build your own quizzes.",
      "Access length and pricing vary by plan, so the real cost takes some digging.",
    ],
    leaveReasons: [
      "Two purchases: the Step 1 Qbank starts at $199 and the Step 2 CK Qbank at $159.",
      "You steer it yourself: Kaplan describes build-your-own quizzes and progress reports, not sessions chosen for you.",
      "Fixed access periods that vary by plan.",
    ],
    sources: [
      { label: "Kaplan Step 1 Qbank", url: KAPLAN_S1 },
      { label: "Kaplan Step 2 CK Qbank", url: KAPLAN_S2 },
      { label: "Kaplan Step 1 Qbank free trial", url: KAPLAN_TRIAL },
    ],
  },
  {
    key: "usmle-rx",
    name: "USMLE-Rx",
    product: "Qmax (Step 1 and Step 2 CK)",
    exams: "Step 1 and Step 2 CK",
    price: "$299 for 12 months",
    access: "1 to 36 months offered",
    questions: "5,000+ across Step 1 and Step 2 CK",
    tryFree: "5-day free trial of the Rx360+ bundle",
    notes: "Includes three Step 1 and Step 2 CK self-assessments.",
    source: RX_PRICING,
    metrics: {
      accuracy: "Questions that “match the difficulty” of the exam, with step-by-step explanations",
      price: "$299 for 12 months of both exams ($399 for the Rx360+ bundle)",
      questions: "5,000+ across Step 1 and Step 2 CK",
      free: "5-day free trial of Rx360+",
      adaptive: "Spaced-repetition flashcards (Study Stream); no adaptive question selection described",
      updates: "No update cadence stated on its pricing page",
    },
    bestFor: "Students who want both exams in one subscription, with First Aid-linked flashcards.",
    pros: [
      "Step 1 and Step 2 CK in one purchase.",
      "5,000+ questions and three self-assessments.",
      "Spaced-repetition flashcards in the Rx360+ bundle.",
    ],
    cons: [
      "Access is time-limited: $299 buys 12 months.",
      "No adaptive question selection described.",
      "Only a 5-day free trial.",
    ],
    leaveReasons: [
      "Renewals: $299 buys 12 months of Qmax; study for longer and you pay again.",
      "Adaptivity sits in the flashcards: the Qbank itself is described without adaptive question selection.",
      "A 5-day trial is short for judging a year's subscription.",
    ],
    sources: [{ label: "USMLE-Rx pricing and FAQ", url: RX_PRICING }],
  },
];

export function competitor(key: string) {
  const c = COMPETITORS.find((x) => x.key === key);
  if (!c) throw new Error(`Unknown competitor ${key}`);
  return c;
}

// The official, free practice material every student should use whatever bank they buy.
export const USMLE_SAMPLE_QUESTIONS: Source = {
  label: "USMLE sample test questions (usmle.org)",
  url: "https://www.usmle.org/exam-resources/step-1-materials",
};

// The standard Argonaut's questions are written to.
export const NBME_ITEM_WRITING_GUIDE: Source = {
  label: "NBME Item-Writing Guide (nbme.org)",
  url: "https://www.nbme.org/educators/item-writing-guide",
};

export const USMLE_CONTENT_OUTLINE: Source = {
  label: "Official USMLE content outline",
  url: "https://www.usmle.org/prepare-your-exam",
};
