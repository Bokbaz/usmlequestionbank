// Other USMLE question banks, as their own websites described them on CHECKED. Every value here
// is quoted from the source URL; re-check all of them before changing any, and update CHECKED.
// Question counts are each company's advertised figures, not verified by us.

export const CHECKED = "11 October 2026";

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
};

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
    source: "https://medical.uworld.com/usmle/usmle-step-1/",
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
    source: "https://www.amboss.com/us/usmle/step1",
  },
  {
    key: "kaplan",
    name: "Kaplan",
    product: "Step 1 Qbank",
    exams: "Step 1",
    price: "From $199",
    access: "Varies; see Kaplan's site",
    questions: "3,200+ Step 1",
    tryFree: "Not checked",
    notes: "Listed with two full-length practice tests.",
    source: "https://www.kaptest.com/usmle/practice/usmle-step-1-qbank",
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
    source: "https://www.usmle-rx.com/pricing",
  },
];

export function competitor(key: string) {
  const c = COMPETITORS.find((x) => x.key === key);
  if (!c) throw new Error(`Unknown competitor ${key}`);
  return c;
}
