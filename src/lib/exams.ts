// The two exams the bank covers, with their public URLs and the official exam format.
// Official figures are from usmle.org, checked 11 October 2026. Update OFFICIAL_CHECKED when
// you re-check them, and keep every page that quotes them reading from here.

export type ExamKey = "step1" | "step2ck";

export const OFFICIAL_CHECKED = "11 October 2026";

export const USMLE_SOURCES = {
  format: "https://www.usmle.org/test-delivery-software-updates-step-2-ck-and-step-1-coming-may-2026",
  step1Outline: "https://www.usmle.org/exam-resources/step-1-materials/step-1-content-outline-and-specifications",
  step2Outline: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-content-outline-specifications",
  step1Samples: "https://www.usmle.org/exam-resources/step-1-materials/step-1-sample-test-questions",
  step2Samples: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-sample-test-questions",
} as const;

export type ExamInfo = {
  key: ExamKey;
  /** URL segment for practice question pages. */
  slug: string;
  name: string;
  long: string;
  bankPath: string;
  freePath: string;
  official: {
    since: string;
    sinceIso: string;
    items: number;
    blocks: number;
    itemsPerBlock: string;
    minutesPerBlock: number;
    dayHours: number;
    previous: string;
    outline: string;
    samples: string;
  };
};

export const EXAMS: Record<ExamKey, ExamInfo> = {
  step1: {
    key: "step1",
    slug: "step-1",
    name: "Step 1",
    long: "USMLE Step 1",
    bankPath: "/usmle-step-1-question-bank",
    freePath: "/free-usmle-step-1-questions",
    official: {
      since: "14 May 2026",
      sinceIso: "2026-05-14",
      items: 280,
      blocks: 14,
      itemsPerBlock: "20",
      minutesPerBlock: 30,
      dayHours: 8,
      previous: "seven 60-minute blocks of 40 questions",
      outline: USMLE_SOURCES.step1Outline,
      samples: USMLE_SOURCES.step1Samples,
    },
  },
  step2ck: {
    key: "step2ck",
    slug: "step-2-ck",
    name: "Step 2 CK",
    long: "USMLE Step 2 CK",
    bankPath: "/usmle-step-2-ck-question-bank",
    freePath: "/free-usmle-step-2-ck-questions",
    official: {
      since: "7 May 2026",
      sinceIso: "2026-05-07",
      items: 316,
      blocks: 16,
      itemsPerBlock: "18 to 20",
      minutesPerBlock: 30,
      dayHours: 9,
      previous: "eight 60-minute blocks of 38 to 40 questions",
      outline: USMLE_SOURCES.step2Outline,
      samples: USMLE_SOURCES.step2Samples,
    },
  },
};

export const EXAM_KEYS: ExamKey[] = ["step1", "step2ck"];

export function examBySlug(slug: string): ExamInfo | null {
  return Object.values(EXAMS).find((e) => e.slug === slug) ?? null;
}

// Argonaut's timed mode: 90 seconds per question, 20-question blocks by default (30 minutes).
export const TIMED_SECONDS_PER_QUESTION = 90;
export const DEFAULT_BLOCK = 20;
