// ARGO model math, mirrored from the Postgres engine (supabase/migrations/*engine*.sql).
//
// Knowledge strength  s = sigmoid(theta_user + delta_concept)     (P(correct) on an average item, no guessing)
// Memory              r = 2^(-days_since_seen / half_life)         (spaced-repetition forgetting curve)
// Effective mastery   m = s * (0.6 + 0.4 r)                        (knowledge fades toward 60% of strength)
// Evidence            e = n / (n + 2)                              (how much to trust m)

export const sigmoid = (x: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))));

export function strength(theta: number, delta: number) {
  return sigmoid(theta + delta);
}

export function recall(halfLifeDays: number, lastSeenAt: string | null, now = Date.now()) {
  if (!lastSeenAt) return 1;
  const days = (now - new Date(lastSeenAt).getTime()) / 86_400_000;
  return Math.pow(2, -Math.max(0, days) / Math.max(0.25, halfLifeDays));
}

export function effectiveMastery(s: number, r: number) {
  return s * (0.6 + 0.4 * r);
}

export function evidence(n: number) {
  return n / (n + 2);
}

// Probability of answering an item correctly, five-option guessing floor included.
export function predictedCorrect(theta: number, deltaAvg: number, difficulty: number) {
  return 0.2 + 0.8 * sigmoid(theta + deltaAvg - difficulty);
}

export type ErrorType =
  | "gap"
  | "misconception"
  | "second_guess"
  | "rushed"
  | "trap"
  | "retention"
  | "time_sink"
  | "omitted"
  | "lucky_guess";

export const ERROR_META: Record<ErrorType, { label: string; short: string; advice: string }> = {
  gap: {
    label: "Knowledge gap",
    short: "Didn't know it",
    advice: "Read the Library chapter, then drill fresh questions on the concept.",
  },
  misconception: {
    label: "Misconception",
    short: "Sure, but wrong",
    advice: "You answered confidently and were wrong: unlearn the belief. Compare the two concepts side by side.",
  },
  second_guess: {
    label: "Second-guessing",
    short: "Changed away from correct",
    advice: "Your first instinct was right. Change an answer only when you find a specific clue you missed.",
  },
  rushed: {
    label: "Rushed",
    short: "Too fast on a known topic",
    advice: "You know this material but moved too fast. Read the last sentence of the stem twice.",
  },
  trap: {
    label: "Distractor trap",
    short: "Chose the classic wrong answer",
    advice: "This distractor catches many students. Learn the one finding that separates it from the answer.",
  },
  retention: {
    label: "Forgetting",
    short: "Knew it, then lost it",
    advice: "You answered this concept correctly before. Spaced retests will lock it in.",
  },
  time_sink: {
    label: "Ran long",
    short: "Spent too long and still missed",
    advice: "When a question passes two minutes, mark it, make your best choice and move on.",
  },
  omitted: {
    label: "Omitted",
    short: "Left blank",
    advice: "Never leave a question blank on test day; there is no penalty for guessing.",
  },
  lucky_guess: {
    label: "Lucky guess",
    short: "Right, but guessed",
    advice: "Correct answers you guessed are treated as weak spots until you get them right with confidence.",
  },
};

// Step 1 blueprint emphasis by system slug (relative weights from the USMLE outline).
export const SYSTEM_WEIGHT: Record<string, number> = {
  "general-principles": 14,
  "human-development": 2,
  immune: 4,
  "blood-lymph": 5,
  "behavioral-health": 5,
  nervous: 7,
  skin: 3,
  musculoskeletal: 5,
  cardiovascular: 9,
  respiratory: 6.5,
  gastrointestinal: 8,
  renal: 6.5,
  pregnancy: 4,
  "female-reproductive": 5,
  "male-reproductive": 2,
  endocrine: 7,
  multisystem: 10,
  biostatistics: 5,
  "social-sciences": 7,
};
