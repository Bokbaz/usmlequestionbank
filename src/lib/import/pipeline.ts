import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as z from "zod";
import { composeArticle } from "@/lib/library/compose";
import { AUTO_THRESHOLD, REVIEW_THRESHOLD, classifyMatch, embedTexts, findNuggetCandidates, questionMatchText } from "@/lib/nuggets/match";

// Server half of the admin importer. The browser parses and previews the file, then sends
// questions here in small chunks: upsert, embed, detect Nuggets. When every chunk is in,
// the Library chapters for the touched topics are recomposed.

const Label = z.string().regex(/^[A-J]$/);

export const UpsertPayload = z.object({
  code: z.string().trim().max(40).optional(),
  exam: z.enum(["step1", "step2ck", "step3"]),
  status: z.enum(["draft", "published"]),
  stem: z.string().min(1).max(20_000),
  lead_in: z.string().min(1).max(2_000),
  media: z.array(z.object({ type: z.literal("image"), url: z.string().min(1).max(2_000), alt: z.string().max(300).optional() })).max(10),
  system: z.string().min(1).max(80),
  discipline: z.string().max(80).nullable(),
  competency: z.string().max(120).nullable(),
  category: z.string().max(160).nullable(),
  topic: z.string().max(120).nullable(),
  difficulty: z.number().int().min(1).max(5),
  is_free: z.boolean(),
  is_daily_eligible: z.boolean(),
  tags: z.array(z.string().max(60)).max(30),
  options: z
    .array(z.object({ label: Label, body: z.string().min(1).max(2_000), concept: z.string().max(200).nullable() }))
    .min(3)
    .max(10),
  correct: Label,
  explanation: z.string().max(30_000),
  option_explanations: z.record(z.string(), z.string().max(8_000)),
  objective: z.string().max(2_000).nullable(),
  textbook: z.string().max(30_000).nullable(),
  key_concept: z.string().max(300).nullable(),
  references: z.array(z.string().max(500)).max(40),
  nuggets: z.array(z.object({ title: z.string().min(1).max(200), body: z.string().max(4_000).optional() })).max(10).optional(),
  batch_id: z.string().uuid().nullable().optional(),
  source: z.enum(["import", "admin"]).optional(),
});
export type UpsertPayload = z.infer<typeof UpsertPayload>;

export type ItemResult = {
  index: number;
  code: string | null;
  id?: string;
  created?: boolean;
  topicId?: number | null;
  error?: string;
  nugget?: "curated" | "auto" | "review" | "none";
  score?: number;
};

export async function importChunk(
  sb: SupabaseClient,
  items: { index: number; payload: UpsertPayload }[],
  batchId: string,
): Promise<ItemResult[]> {
  const results: ItemResult[] = [];
  const saved: { result: ItemResult; payload: UpsertPayload }[] = [];

  for (const { index, payload } of items) {
    const { data, error } = await sb.rpc("admin_upsert_question", { p: { ...payload, batch_id: batchId, source: payload.source ?? "import" } });
    if (error) {
      results.push({ index, code: payload.code ?? null, error: error.message });
      continue;
    }
    const row = data as { id: string; code: string; created: boolean; topic_id: number | null };
    const result: ItemResult = { index, code: row.code, id: row.id, created: row.created, topicId: row.topic_id };
    results.push(result);
    saved.push({ result, payload });
  }
  if (!saved.length) return results;

  // Embeddings of each question's testing point drive Nugget detection.
  const matchInputs = saved.map(({ payload }) => ({
    stem: payload.stem,
    leadIn: payload.lead_in,
    correctText: payload.options.find((o) => o.label === payload.correct)?.body ?? "",
    keyConcept: payload.key_concept,
    objective: payload.objective,
  }));
  let vectors: number[][] = [];
  try {
    vectors = await embedTexts(process.env.NEXT_PUBLIC_SUPABASE_URL!, embedBearer(), matchInputs.map(questionMatchText));
  } catch (e) {
    for (const s of saved) s.result.error = `Saved, but embedding failed: ${e instanceof Error ? e.message : e}`;
    return results;
  }

  for (let i = 0; i < saved.length; i++) {
    const { result, payload } = saved[i];
    await sb.from("questions").update({ embedding: JSON.stringify(vectors[i]) }).eq("id", result.id!);
    if (payload.nuggets?.length) {
      result.nugget = "curated";
      continue;
    }
    try {
      const candidates = await findNuggetCandidates(sb, vectors[i], matchInputs[i], 5);
      const verdict = classifyMatch(candidates);
      result.nugget = verdict;
      result.score = candidates[0]?.score;
      const title = cardTitle(payload);
      if (verdict === "auto") {
        const ids = candidates.filter((c) => c.score >= AUTO_THRESHOLD).map((c) => c.id);
        await sb.rpc("admin_link_nugget", {
          p_question: result.id,
          p_title: title,
          p_body: payload.objective,
          p_index_ids: ids,
          p_score: candidates[0].score,
          p_method: "auto",
        });
      } else if (verdict === "review") {
        await sb.from("nugget_reviews").upsert(
          {
            question_id: result.id,
            index_ids: candidates.filter((c) => c.score >= REVIEW_THRESHOLD).slice(0, 3).map((c) => c.id),
            score: candidates[0].score,
            title,
            body: payload.objective,
            status: "open",
          },
          { onConflict: "question_id" },
        );
      }
    } catch (e) {
      result.error = `Saved, but Nugget check failed: ${e instanceof Error ? e.message : e}`;
    }
  }
  return results;
}

// Public Nugget cards are written from the question's own key concept, never from the
// licensed source text the index was built from.
function cardTitle(p: UpsertPayload) {
  const correct = p.options.find((o) => o.label === p.correct);
  const raw = p.key_concept || correct?.concept || correct?.body || p.topic || "High-yield concept";
  return raw.replace(/\.$/, "").slice(0, 160);
}

// The embed Edge Function only needs a valid project JWT at the gateway.
function embedBearer() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return key;
}

type TopicQuestion = {
  id: string;
  is_free: boolean;
  topic_id: number;
  question_keys: { educational_objective: string | null; textbook: string | null; key_concept: string | null } | null;
};

// Rebuild one Library chapter per topic from every published bank question on it.
export async function recomposeTopics(sb: SupabaseClient, topicIds: number[]) {
  let articles = 0;
  for (let i = 0; i < topicIds.length; i += 40) {
    const ids = topicIds.slice(i, i + 40);
    const [{ data: topics, error: tErr }, { data: questions, error: qErr }] = await Promise.all([
      sb.from("topics").select("id, name, system_id").in("id", ids),
      sb
        .from("questions")
        .select("id, is_free, topic_id, question_keys(educational_objective, textbook, key_concept)")
        .in("topic_id", ids)
        .is("owner_id", null)
        .eq("status", "published")
        .order("code"),
    ]);
    if (tErr) throw tErr;
    if (qErr) throw qErr;
    for (const topic of topics ?? []) {
      const qs = ((questions ?? []) as unknown as TopicQuestion[]).filter((q) => q.topic_id === topic.id);
      if (!qs.length) {
        // Every question on the topic was retired or moved to draft: hide its chapter.
        await sb.from("library_articles").update({ status: "draft" }).eq("topic_id", topic.id);
        continue;
      }
      const article = composeArticle(
        topic.name,
        qs.map((q) => ({
          questionId: q.id,
          isFree: q.is_free,
          objective: q.question_keys?.educational_objective,
          textbook: q.question_keys?.textbook,
          keyConcept: q.question_keys?.key_concept,
        })),
      );
      const { data: row, error } = await sb
        .from("library_articles")
        .upsert(
          {
            slug: article.slug,
            system_id: topic.system_id,
            topic_id: topic.id,
            title: article.title,
            summary: article.summary,
            body: article.body,
            is_free: article.isFree,
            reading_minutes: article.readingMinutes,
            generated_by: "auto",
            status: "published",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "topic_id" },
        )
        .select("id")
        .single();
      if (error) throw error;
      const links = qs.map((q) => ({ article_id: row.id, question_id: q.id }));
      const { error: lErr } = await sb.from("article_questions").upsert(links, { onConflict: "article_id,question_id" });
      if (lErr) throw lErr;
      articles++;
    }
  }
  return articles;
}
