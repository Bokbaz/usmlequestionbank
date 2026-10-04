export type DailyOption = { id: string; label: string; body: string };

export type DailyResult = {
  is_correct: boolean;
  selected_option_id: string | null;
  time_ms: number;
  score: number;
  timed_out: boolean;
  rank: number;
  players: number;
  pct_correct: number | null;
};

export type ReviewPayload = {
  correct_option_id: string;
  correct_label: string;
  explanation: string;
  option_explanations: Record<string, string>;
  educational_objective: string | null;
  key_concept: string | null;
  references: string[];
  nuggets: { id: number; slug: string; title: string; body: string | null }[];
  peer: { n: number; pct_correct: number | null; option_pct: Record<string, number>; avg_time_s: number | null } | null;
  article: { slug: string; title: string } | null;
};

export type DailyState = {
  day: string;
  number: number;
  available: boolean;
  time_limit_s: number;
  system: string | null;
  discipline: string | null;
  difficulty: number;
  state: "none" | "started" | "done";
  payload: null | {
    stem: string;
    lead_in: string;
    media: { type: "image"; url: string; alt?: string }[];
    options: DailyOption[];
    started_at?: string;
    elapsed_ms?: number;
    result?: DailyResult;
    review?: ReviewPayload;
  };
  players: number;
  pct_correct: number | null;
  next_reset: string;
};

export type LeaderRow = {
  rank: number;
  username: string;
  display_name: string | null;
  country: string | null;
  score: number;
  time_ms: number;
  is_correct: boolean;
  streak: number;
  is_me: boolean | null;
};
