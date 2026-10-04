// Nugget detection: decides whether a question tests an ultra-high-yield concept by
// comparing it with the private Nugget index (HY source material, gte-small vectors).
//
// Score = cosine similarity of the question's "testing point" text against each index
// line, plus a lexical bonus when the correct answer's key terms appear in that line.
// Candidates above AUTO_THRESHOLD are linked automatically; the band below it is
// surfaced to admins for review. Thresholds were calibrated on the seed set.

import type { SupabaseClient } from "@supabase/supabase-js";

export const AUTO_THRESHOLD = 0.94;
export const REVIEW_THRESHOLD = 0.88;

export type NuggetCandidate = {
  id: number;
  body: string;
  section: string | null;
  source: string;
  similarity: number;
  score: number;
};

export type MatchableQuestion = {
  stem: string;
  leadIn: string;
  correctText: string;
  keyConcept?: string | null;
  objective?: string | null;
};

const STOP = new Set(
  "the a an of and or to in on for with without from by at is are was were be been being as that this these those which who whom whose most likely following patient patients".split(
    " ",
  ),
);

export function keyTerms(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP.has(w)),
    ),
  ];
}

// The testing point of a question: what it asks plus what the answer is.
export function questionMatchText(q: MatchableQuestion): string {
  const parts = [q.keyConcept, q.correctText, q.objective, q.leadIn].filter(Boolean);
  return parts.join(". ").slice(0, 1800);
}

async function embedBatch(supabaseUrl: string, bearer: string, input: string[]) {
  const res = await fetch(`${supabaseUrl}/functions/v1/embed`, {
    method: "POST",
    headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) return { error: `embed failed (${res.status}): ${await res.text()}`, status: res.status };
  return { embeddings: ((await res.json()) as { embeddings: number[][] }).embeddings };
}

// Edge Functions have a small CPU budget per request, so send a few texts at a time and
// fall back to one-by-one when a batch exceeds it (HTTP 546).
export async function embedTexts(
  supabaseUrl: string,
  bearer: string,
  texts: string[],
): Promise<number[][]> {
  const out: number[][] = [];
  const size = 4;
  for (let i = 0; i < texts.length; i += size) {
    const chunk = texts.slice(i, i + size);
    const res = await embedBatch(supabaseUrl, bearer, chunk);
    if (res.embeddings) {
      out.push(...res.embeddings);
      continue;
    }
    if (res.status !== 546) throw new Error(res.error);
    for (const text of chunk) {
      const single = await embedBatch(supabaseUrl, bearer, [text]);
      if (!single.embeddings) throw new Error(single.error);
      out.push(single.embeddings[0]);
    }
  }
  return out;
}

export async function findNuggetCandidates(
  sb: SupabaseClient,
  embedding: number[],
  q: MatchableQuestion,
  limit = 8,
): Promise<NuggetCandidate[]> {
  const { data, error } = await sb.rpc("match_nugget_index", {
    p_embedding: JSON.stringify(embedding),
    p_count: limit,
    p_min: 0.8,
  });
  if (error) throw error;
  const answerTerms = keyTerms(`${q.correctText} ${q.keyConcept ?? ""}`);
  return ((data ?? []) as Omit<NuggetCandidate, "score">[])
    .map((c) => {
      const body = c.body.toLowerCase();
      const hits = answerTerms.filter((t) => body.includes(t)).length;
      const lexical = answerTerms.length ? hits / answerTerms.length : 0;
      return { ...c, score: c.similarity + 0.06 * lexical };
    })
    .sort((a, b) => b.score - a.score);
}

export function classifyMatch(candidates: NuggetCandidate[]): "auto" | "review" | "none" {
  const top = candidates[0]?.score ?? 0;
  if (top >= AUTO_THRESHOLD) return "auto";
  if (top >= REVIEW_THRESHOLD) return "review";
  return "none";
}
