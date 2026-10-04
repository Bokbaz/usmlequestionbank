import type { ReviewPayload } from "@/lib/daily/types";

export type Highlight = { start: number; end: number };

export type ItemState = {
  selected_option_id: string | null;
  first_option_id: string | null;
  changes: number;
  confidence: number | null;
  marked: boolean;
  struck: string[];
  highlights: Highlight[];
  time_ms: number;
  labs_opened: boolean;
  submitted: boolean;
  is_correct: boolean | null;
};

export type PlayerItem = {
  position: number;
  question_id: string;
  code: string;
  exam: "step1" | "step2ck" | "step3";
  stem: string;
  lead_in: string;
  media: { type: "image"; url: string; alt?: string }[];
  is_nugget: boolean;
  source: string;
  system: string;
  system_slug: string;
  discipline: string | null;
  competency: string | null;
  topic: string | null;
  options: { id: string; label: string; body: string }[];
  state: ItemState;
  review: ReviewPayload | null;
};

export type PlayerTest = {
  id: string;
  name: string | null;
  kind: "custom" | "argo" | "daily" | "review";
  mode: "tutor" | "timed" | "untimed";
  status: "active" | "suspended" | "completed";
  question_count: number;
  seconds_per_question: number;
  elapsed_seconds: number;
  current_position: number;
  correct_count: number | null;
};

export type PlayerData = { test: PlayerTest; items: PlayerItem[] };
