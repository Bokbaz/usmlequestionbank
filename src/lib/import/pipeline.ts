import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as z from "zod";
import skippedJson from "../../../content/approved/skipped.json";
import {
  ARGO_OPEN_SYSTEMS,
  ARGO_SYSTEMS,
  TOPIC_REUSE,
  conditionTopic,
  conditionWords,
  isDuplicatePair,
  matchOutlineCategory,
  type ArgoPlacement,
  type Similar,
} from "@/lib/import/argo-format";
import { composeArticle } from "@/lib/library/compose";
import { AUTO_THRESHOLD, REVIEW_THRESHOLD, classifyMatch, embedTexts, findNuggetCandidates, questionMatchText } from "@/lib/nuggets/match";
import { SYSTEMS, resolveSystem } from "@/lib/taxonomy";

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
  // The authoring pipeline's question_id; re-imports match on it (scripts/import-approved.ts).
  source_ref: z.string().max(80).optional(),
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

// ---------------------------------------------------------------- ARGO export placement

export const ArgoPlaceItem = z.object({
  index: z.number().int(),
  sourceRef: z.string().min(1).max(80),
  exam: z.enum(["step1", "step2ck", "step3"]),
  // The pipeline's own system label, for example "respiratory_renal".
  system: z.string().max(80),
  category: z.string().max(500).nullable(),
  condition: z.string().max(500).nullable(),
  leadIn: z.string().max(2_000),
  correctText: z.string().max(2_000),
  keyConcept: z.string().max(300).nullable(),
  objective: z.string().max(2_000).nullable(),
});
export type ArgoPlaceItem = z.infer<typeof ArgoPlaceItem>;

type Neighbor = {
  code: string;
  exam: string;
  system: string;
  topic: string | null;
  category: string | null;
  condition: string | null;
  lead_in: string;
  answer: string | null;
  similarity: number;
};

// Questions dropped as duplicates when their batch was imported with scripts/import-approved.ts.
const recordedSkips = skippedJson as Record<string, { duplicate_of: string }>;

const similar = (n: Neighbor, similarity = n.similarity): Similar => ({ code: n.code, similarity, leadIn: n.lead_in, answer: n.answer ?? "" });

// Places questions from ARGO pipeline exports. Questions already in the bank (same
// question_id) keep everything the site decided for them. New ones are embedded the way the
// import will embed them and put next to their closest bank questions: organ system by a
// similarity-weighted vote among the systems the pipeline label allows, then the nearest
// question's topic, an existing topic named inside the condition, or a new topic named
// after the condition.
export async function placeArgo(sb: SupabaseClient, items: ArgoPlaceItem[]): Promise<ArgoPlacement[]> {
  const out = new Map<number, ArgoPlacement>(items.map((i) => [i.index, { index: i.index }]));

  type LiveRow = {
    code: string;
    source_ref: string;
    is_free: boolean;
    is_daily_eligible: boolean;
    lead_in: string;
    systems: { slug: string } | null;
    topics: { name: string } | null;
    categories: { name: string } | null;
    disciplines: { slug: string } | null;
    competencies: { slug: string } | null;
    question_keys: { key_concept: string | null } | null;
  };
  const refs = [...new Set(items.flatMap((i) => [i.sourceRef, recordedSkips[i.sourceRef]?.duplicate_of].filter(Boolean) as string[]))];
  const { data: live, error } = await sb
    .from("questions")
    .select(
      "code, source_ref, is_free, is_daily_eligible, lead_in, systems(slug), topics(name), categories(name), disciplines(slug), competencies(slug), question_keys(key_concept)",
    )
    .in("source_ref", refs);
  if (error) throw error;
  const byRef = new Map(((live ?? []) as unknown as LiveRow[]).map((r) => [r.source_ref, r]));

  const fresh: ArgoPlaceItem[] = [];
  for (const item of items) {
    const row = byRef.get(item.sourceRef);
    if (row) {
      out.get(item.index)!.existing = {
        code: row.code,
        system: row.systems?.slug ?? "",
        topic: row.topics?.name ?? null,
        category: row.categories?.name ?? null,
        discipline: row.disciplines?.slug ?? null,
        competency: row.competencies?.slug ?? null,
        keyConcept: row.question_keys?.key_concept ?? null,
        isFree: row.is_free,
        isDaily: row.is_daily_eligible,
      };
      continue;
    }
    const original = byRef.get(recordedSkips[item.sourceRef]?.duplicate_of ?? "");
    if (original) out.get(item.index)!.duplicate = { code: original.code, similarity: 1, leadIn: original.lead_in, answer: "", recorded: true };
    fresh.push(item);
  }
  if (!fresh.length) return [...out.values()];

  const [{ data: topicRows, error: tErr }, { data: categoryRows, error: cErr }] = await Promise.all([
    sb.from("topics").select("name, systems(slug), categories(name)"),
    sb.from("categories").select("name, systems(slug)"),
  ]);
  if (tErr) throw tErr;
  if (cErr) throw cErr;
  const topics = (topicRows ?? []) as unknown as { name: string; systems: { slug: string }; categories: { name: string } | null }[];
  const categories = (categoryRows ?? []) as unknown as { name: string; systems: { slug: string } }[];

  let vectors: number[][];
  try {
    vectors = await embedTexts(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      embedBearer(),
      fresh.map((i) => questionMatchText({ stem: "", leadIn: i.leadIn, correctText: i.correctText, keyConcept: i.keyConcept, objective: i.objective })),
    );
  } catch (e) {
    for (const i of fresh) out.get(i.index)!.error = `embedding failed: ${e instanceof Error ? e.message : e}`;
    return [...out.values()];
  }

  await Promise.all(
    fresh.map(async (item, n) => {
      const placement = out.get(item.index)!;
      const { data, error: mErr } = await sb.rpc("admin_match_questions", { p_embedding: JSON.stringify(vectors[n]), p_count: 10 });
      if (mErr) {
        placement.error = mErr.message;
        return;
      }
      const neighbors = (data ?? []) as Neighbor[];

      const label = item.system.toLowerCase();
      const resolved = resolveSystem(label.replace(/_/g, " "));
      const own = ARGO_SYSTEMS[label] ?? (resolved ? [resolved] : []);
      const allowed = ARGO_OPEN_SYSTEMS.has(label) || !own.length ? SYSTEMS.map((s) => s.slug as string) : own;
      const votes = new Map<string, number>();
      for (const nb of neighbors.filter((x) => allowed.includes(x.system)).slice(0, 5)) {
        votes.set(nb.system, (votes.get(nb.system) ?? 0) + nb.similarity ** 8);
      }
      const system = [...votes].sort((a, b) => b[1] - a[1])[0]?.[0] ?? own[0] ?? allowed[0];

      const nearest = neighbors.find((x) => x.system === system && x.topic);
      const conditionSet = conditionWords(item.condition);
      const named = topics
        .filter((t) => t.systems.slug === system)
        .map((t) => ({ t, words: conditionWords(t.name) }))
        .filter((x) => x.words.size && [...x.words].every((w) => conditionSet.has(w)))
        .sort((a, b) => b.words.size - a.words.size)[0]?.t;
      const outline = () =>
        matchOutlineCategory(
          item.category ?? undefined,
          categories.filter((c) => c.systems.slug === system).map((c) => c.name),
        );
      const newTopic = conditionTopic(item.condition ?? undefined);
      if (nearest && nearest.similarity >= TOPIC_REUSE) {
        placement.suggested = { system, topic: nearest.topic!, category: nearest.category ?? outline(), basis: "neighbor", neighbor: similar(nearest) };
      } else if (named) {
        placement.suggested = { system, topic: named.name, category: named.categories?.name ?? outline(), basis: "topic-name" };
      } else if (newTopic) {
        placement.suggested = { system, topic: newTopic, category: outline(), basis: "condition", neighbor: nearest ? similar(nearest) : undefined };
      } else if (nearest) {
        placement.suggested = { system, topic: nearest.topic!, category: nearest.category ?? outline(), basis: "neighbor", neighbor: similar(nearest) };
      } else {
        placement.error = "no condition and no similar question to take a topic from";
      }
      // Lets the importer find duplicates within the file too.
      placement.vector = vectors[n].map((v) => Math.round(v * 1e5) / 1e5);

      if (!placement.duplicate) {
        const twin = neighbors.find((x) => x.exam === item.exam && isDuplicatePair(x.similarity, item.condition, x.condition));
        if (twin) placement.duplicate = similar(twin);
      }
    }),
  );
  return [...out.values()];
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
