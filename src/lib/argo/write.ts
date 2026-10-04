import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WriteResult, WriterContext } from "@/lib/ai/writer";
import type { WrittenQuestion } from "@/lib/ai/schemas";
import { AUTO_THRESHOLD, classifyMatch, embedTexts, findNuggetCandidates, questionMatchText } from "@/lib/nuggets/match";
import { effectiveMastery, recall, strength } from "./model";

// Context gathering and persistence for questions ARGO writes for one student. Reads use
// the service client because they need answer keys and other students' bank metadata;
// nothing read here is returned to the browser except the finished, verified question.

export const WRITE_DIMS = ["system", "discipline", "competency", "topic", "nugget"] as const;
export type WriteDim = (typeof WRITE_DIMS)[number];

// Drafts per student per rolling 30 days, matching the monthly add-on price. Rejected drafts
// count too: they cost the same to write and verify.
export function monthlyWriteLimit() {
  const n = Number(process.env.ARGO_WRITE_MONTHLY_LIMIT ?? 15);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 15;
}

export async function writesThisMonth(sb: SupabaseClient, userId: string) {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { count } = await sb.from("argo_generations").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
  return count ?? 0;
}

export type Scope = {
  dim: WriteDim;
  refId: number;
  name: string;
  systemName: string | null;
  disciplineName: string | null;
  competencyName: string | null;
  topicName: string | null;
};

type QRow = { id: string; system_id: number; discipline_id: number | null; competency_id: number | null; topic_id: number | null };

function inScope(q: QRow, dim: WriteDim, refId: number, focusTopic: number | null) {
  if (dim === "system") return q.system_id === refId;
  if (dim === "discipline") return q.discipline_id === refId;
  if (dim === "competency") return q.competency_id === refId;
  return q.topic_id != null && q.topic_id === focusTopic;
}

export async function buildWriterContext(
  sb: SupabaseClient,
  userId: string,
  theta: number,
  exam: WriterContext["exam"],
  dim: WriteDim,
  refId: number,
): Promise<{ ctx: WriterContext; scope: Scope } | null> {
  let name: string | null = null;
  let systemId: number | null = null;
  let focusTopic: number | null = null;
  let nuggetCard: { title: string; body: string | null } | null = null;
  let candidates: number[] = [];

  if (dim === "system") {
    const { data } = await sb.from("systems").select("name").eq("id", refId).maybeSingle();
    name = data?.name ?? null;
    systemId = refId;
    const { data: t } = await sb.from("topics").select("id").eq("system_id", refId).limit(500);
    candidates = (t ?? []).map((r) => r.id);
  } else if (dim === "discipline" || dim === "competency") {
    const table = dim === "discipline" ? "disciplines" : "competencies";
    const { data } = await sb.from(table).select("name").eq("id", refId).maybeSingle();
    name = data?.name ?? null;
    const { data: qs } = await sb
      .from("questions")
      .select("topic_id")
      .eq(dim === "discipline" ? "discipline_id" : "competency_id", refId)
      .not("topic_id", "is", null)
      .is("owner_id", null)
      .limit(1000);
    candidates = [...new Set((qs ?? []).map((r) => r.topic_id as number))];
  } else if (dim === "topic") {
    const { data } = await sb.from("topics").select("name, system_id").eq("id", refId).maybeSingle();
    name = data?.name ?? null;
    systemId = data?.system_id ?? null;
    focusTopic = refId;
  } else {
    const { data } = await sb.from("nuggets").select("title, body, system_id").eq("id", refId).maybeSingle();
    name = data?.title ?? null;
    systemId = data?.system_id ?? null;
    if (data) nuggetCard = { title: data.title, body: data.body };
    const { data: links } = await sb.from("question_nuggets").select("questions!inner(topic_id)").eq("nugget_id", refId).limit(50);
    candidates = [
      ...new Set(
        ((links ?? []) as unknown as { questions: { topic_id: number | null } }[]).map((l) => l.questions.topic_id).filter((t): t is number => t != null),
      ),
    ];
  }
  if (!name) return null;

  // Focus the item on the student's weakest topic inside the target.
  if (focusTopic == null && candidates.length) {
    const { data: weak } = await sb
      .from("user_concepts")
      .select("ref_id")
      .eq("user_id", userId)
      .eq("dim", "topic")
      .in("ref_id", candidates.slice(0, 500))
      .order("delta", { ascending: true })
      .limit(1);
    focusTopic = weak?.[0]?.ref_id ?? candidates[Math.floor(Math.random() * candidates.length)];
  }

  const [topicRes, conceptRes, confusionRes] = await Promise.all([
    focusTopic != null ? sb.from("topics").select("name, system_id").eq("id", focusTopic).maybeSingle() : Promise.resolve({ data: null }),
    sb.from("user_concepts").select("delta, n, half_life, last_seen_at").eq("user_id", userId).eq("dim", dim).eq("ref_id", refId).maybeSingle(),
    sb.from("user_confusions").select("correct_concept, chosen_concept, n, last_question_id").eq("user_id", userId).order("n", { ascending: false }).limit(40),
  ]);
  const topic = topicRes.data as { name: string; system_id: number } | null;
  systemId = systemId ?? topic?.system_id ?? null;
  if (systemId == null) return null;

  const [systemRes, articleRes, scopedRes] = await Promise.all([
    sb.from("systems").select("name").eq("id", systemId).maybeSingle(),
    focusTopic != null ? sb.from("library_articles").select("title, body").eq("topic_id", focusTopic).maybeSingle() : Promise.resolve({ data: null }),
    focusTopic != null
      ? sb
          .from("questions")
          .select("id, lead_in, question_keys(key_concept), question_nuggets(nuggets(title, body))")
          .eq("topic_id", focusTopic)
          .or(`owner_id.is.null,owner_id.eq.${userId}`)
          .limit(30)
      : Promise.resolve({ data: [] }),
  ]);

  type Scoped = {
    lead_in: string;
    question_keys: { key_concept: string | null } | null;
    question_nuggets: { nuggets: { title: string; body: string | null } | null }[];
  };
  const scoped = (scopedRes.data ?? []) as unknown as Scoped[];
  const avoid = scoped.map((q) => q.question_keys?.key_concept || q.lead_in).filter(Boolean).slice(0, 25) as string[];
  const nuggetMap = new Map<string, { title: string; body: string | null }>();
  if (nuggetCard) nuggetMap.set(nuggetCard.title, nuggetCard);
  for (const q of scoped) for (const qn of q.question_nuggets ?? []) if (qn.nuggets) nuggetMap.set(qn.nuggets.title, qn.nuggets);

  // Confusions recorded on questions inside this target.
  const confusionRows = (confusionRes.data ?? []) as { correct_concept: string; chosen_concept: string; n: number; last_question_id: string | null }[];
  const lastIds = [...new Set(confusionRows.map((c) => c.last_question_id).filter(Boolean))] as string[];
  const { data: lastQs } = lastIds.length
    ? await sb.from("questions").select("id, system_id, discipline_id, competency_id, topic_id").in("id", lastIds)
    : { data: [] };
  const qById = new Map(((lastQs ?? []) as QRow[]).map((q) => [q.id, q]));
  const confusions = confusionRows
    .filter((c) => {
      const q = c.last_question_id ? qById.get(c.last_question_id) : undefined;
      return q && inScope(q, dim, refId, focusTopic);
    })
    .slice(0, 5)
    .map((c) => ({ correct: c.correct_concept, chosen: c.chosen_concept, n: c.n }));

  const concept = conceptRes.data as { delta: number; n: number; half_life: number; last_seen_at: string | null } | null;
  const mastery = concept && concept.n > 0 ? effectiveMastery(strength(theta, concept.delta), recall(concept.half_life, concept.last_seen_at)) : null;
  const difficulty = mastery == null ? 3 : mastery < 0.45 ? 3 : mastery < 0.7 ? 4 : 5;

  const article = articleRes.data as { title: string; body: string } | null;
  const scope: Scope = {
    dim,
    refId,
    name,
    systemName: systemRes.data?.name ?? null,
    disciplineName: dim === "discipline" ? name : null,
    competencyName: dim === "competency" ? name : null,
    topicName: topic?.name ?? null,
  };
  const ctx: WriterContext = {
    exam,
    concept: { dim, name, system: scope.systemName, discipline: scope.disciplineName, topic: scope.topicName },
    mastery,
    attempts: concept?.n ?? 0,
    confusions,
    reference: article ? [{ title: article.title, body: article.body.slice(0, 12_000) }] : [],
    nuggets: [...nuggetMap.values()].slice(0, 8),
    avoid,
    difficulty,
  };
  return { ctx, scope };
}

// Saves an accepted item as a private question owned by the student, then embeds it and
// links any Nugget it tests.
export async function saveWrittenQuestion(sb: SupabaseClient, userId: string, exam: WriterContext["exam"], q: WrittenQuestion, scope: Scope) {
  const payload = {
    exam,
    status: "published",
    stem: q.stem,
    lead_in: q.lead_in,
    media: [],
    system: scope.systemName,
    discipline: scope.disciplineName ?? q.discipline,
    competency: scope.competencyName ?? q.competency,
    category: null,
    topic: scope.topicName,
    difficulty: q.difficulty,
    is_free: false,
    is_daily_eligible: false,
    tags: ["argo"],
    options: q.options.map((o) => ({ label: o.label, body: o.text, concept: o.concept })),
    correct: q.correct,
    explanation: q.explanation,
    option_explanations: Object.fromEntries(q.option_explanations.map((e) => [e.label, e.text])),
    objective: q.objective,
    textbook: q.textbook,
    key_concept: q.key_concept,
    references: [],
    source: "argo",
  };
  const { data, error } = await sb.rpc("admin_upsert_question", { p: payload });
  if (error) throw new Error(error.message);
  const row = data as { id: string; code: string };
  const { error: ownErr } = await sb.rpc("admin_set_question_owner", { p_question: row.id, p_owner: userId });
  if (ownErr) {
    // Never leave an unowned generated question in the shared bank.
    await sb.from("questions").delete().eq("id", row.id);
    throw new Error(ownErr.message);
  }

  try {
    const match = { stem: q.stem, leadIn: q.lead_in, correctText: q.options.find((o) => o.label === q.correct)?.text ?? "", keyConcept: q.key_concept, objective: q.objective };
    const [vector] = await embedTexts(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, [questionMatchText(match)]);
    await sb.from("questions").update({ embedding: JSON.stringify(vector) }).eq("id", row.id);
    const found = await findNuggetCandidates(sb, vector, match, 5);
    if (classifyMatch(found) === "auto") {
      await sb.rpc("admin_link_nugget", {
        p_question: row.id,
        p_title: q.key_concept,
        p_body: q.objective,
        p_index_ids: found.filter((c) => c.score >= AUTO_THRESHOLD).map((c) => c.id),
        p_score: found[0].score,
        p_method: "ai",
      });
    }
  } catch {
    // Embedding and Nugget links are enrichments; the question is usable without them.
  }
  return row;
}

export async function logGeneration(
  sb: SupabaseClient,
  row: { userId: string; scope: Pick<Scope, "dim" | "refId" | "name">; status: "accepted" | "rejected" | "failed"; questionId?: string | null; result?: WriteResult | null; error?: string },
) {
  await sb.from("argo_generations").insert({
    user_id: row.userId,
    dim: row.scope.dim,
    ref_id: row.scope.refId,
    concept: row.scope.name,
    status: row.status,
    question_id: row.questionId ?? null,
    verdict: row.result ? { reasons: row.result.verdict.reasons, blind: row.result.verdict.blind, audit: row.result.verdict.audit } : { error: row.error ?? null },
    usage: row.result?.usage ?? {},
  });
}
