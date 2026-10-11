import "server-only";
import { unstable_cache } from "next/cache";
import { EXAMS, type ExamKey } from "@/lib/exams";
import { slugify } from "@/lib/library/compose";
import { createAdminClient } from "@/lib/supabase/admin";

// Everything anonymous visitors and crawlers can read, fetched on the server with the service
// role and filtered here, in one file, so the rules are easy to review:
//   - bank questions only: published, and never a student's private ARGO-written question
//   - full question content only for free questions and past Daily Challenges
//   - full Library text only for free chapters; locked chapters expose title and summary
// Results are cached for an hour and shared by every public page.

const REVALIDATE = 3600;
const TAGS = ["public-content"];

// Pages rendered at the same time (a build prerenders hundreds; ISR can refresh several at once)
// share one in-flight fetch per dataset instead of each starting its own.
function shared<A extends unknown[], R>(fn: (...args: A) => Promise<R>, ttlMs = 60_000) {
  const memo = new Map<string, { at: number; promise: Promise<R> }>();
  return (...args: A): Promise<R> => {
    const key = JSON.stringify(args);
    const hit = memo.get(key);
    if (hit && Date.now() - hit.at < ttlMs) return hit.promise;
    const promise = fn(...args);
    memo.set(key, { at: Date.now(), promise });
    promise.catch(() => memo.delete(key));
    return promise;
  };
}

const cached = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string) =>
  shared(unstable_cache(fn, [key], { revalidate: REVALIDATE, tags: TAGS }));

type QueryResult = PromiseLike<{ data: unknown; error: { message: string; details?: string } | null }>;

// A few requests in flight per server process at most, so prerendering can't open hundreds of
// connections at once (they start timing out well before that on a slow network).
const MAX_IN_FLIGHT = 6;
let inFlight = 0;
const waiting: (() => void)[] = [];

async function limited<T>(task: () => PromiseLike<T>): Promise<T> {
  if (inFlight >= MAX_IN_FLIGHT) await new Promise<void>((resolve) => waiting.push(resolve));
  inFlight++;
  try {
    return await task();
  } finally {
    inFlight--;
    waiting.shift()?.();
  }
}

// Network blips come back as "fetch failed": retry those a few times. Real query errors fail
// straight away.
async function run(query: () => QueryResult) {
  for (let attempt = 0; ; attempt++) {
    const res = await limited(query);
    const transient = res.error && /fetch failed|network|timeout|ECONNRESET|ETIMEDOUT/i.test(res.error.message);
    if (!transient || attempt >= 4) return res;
    await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
  }
}

function queryError(error: { message: string; details?: string }) {
  const cause = error.details?.match(/(UND_ERR_[A-Z_]+|E[A-Z]{4,}|timeout[^\n]*)/)?.[0];
  return new Error(`Public content query failed: ${error.message}${cause ? ` (${cause})` : ""}`);
}

// PostgREST returns at most 1,000 rows per request: page through the rest.
async function all<T>(page: (from: number, to: number) => QueryResult): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await run(() => page(from, from + 999));
    if (error) throw queryError(error);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

async function one<T>(query: () => QueryResult): Promise<T | null> {
  const { data, error } = await run(query);
  if (error) throw queryError(error);
  return (data as T) ?? null;
}

// ---------------------------------------------------------------- taxonomy

export type SystemRef = { id: number; slug: string; name: string; short: string; sort: number };
type Named = { id: number; slug: string; name: string };

export type Taxonomy = {
  systems: SystemRef[];
  disciplines: Named[];
  competencies: Named[];
  categories: { id: number; name: string }[];
  topics: { id: number; name: string }[];
};

export const getTaxonomy = cached(async (): Promise<Taxonomy> => {
  const sb = createAdminClient();
  const [systems, disciplines, competencies, categories, topics] = await Promise.all([
    all<{ id: number; slug: string; name: string; short_name: string; sort: number }>((a, b) =>
      sb.from("systems").select("id, slug, name, short_name, sort").order("id").range(a, b),
    ),
    all<Named>((a, b) => sb.from("disciplines").select("id, slug, name").order("id").range(a, b)),
    all<Named>((a, b) => sb.from("competencies").select("id, slug, name").order("id").range(a, b)),
    all<{ id: number; name: string }>((a, b) => sb.from("categories").select("id, name").order("id").range(a, b)),
    all<{ id: number; name: string }>((a, b) => sb.from("topics").select("id, name").order("id").range(a, b)),
  ]);
  return {
    systems: systems.map((s) => ({ id: s.id, slug: s.slug, name: s.name, short: s.short_name, sort: s.sort })).sort((a, b) => a.sort - b.sort),
    disciplines,
    competencies,
    categories,
    topics,
  };
}, "public-taxonomy");

// ---------------------------------------------------------------- the bank

type BankRow = {
  id: string;
  code: string;
  exam: ExamKey;
  system_id: number;
  discipline_id: number | null;
  competency_id: number | null;
  category_id: number | null;
  topic_id: number | null;
  is_free: boolean;
  is_nugget: boolean;
  updated_at: string;
};

const getBankRows = cached(async (): Promise<BankRow[]> => {
  const sb = createAdminClient();
  const rows = await all<BankRow & { exam: string }>((a, b) =>
    sb
      .from("questions")
      .select("id, code, exam, system_id, discipline_id, competency_id, category_id, topic_id, is_free, is_nugget, updated_at")
      .eq("status", "published")
      .is("owner_id", null)
      .order("code")
      .range(a, b),
  );
  return rows.filter((r): r is BankRow => r.exam === "step1" || r.exam === "step2ck");
}, "public-bank-rows");

type PastDaily = { day: string; number: number; questionId: string };

// Daily Challenges whose UTC day is over. Today's question never appears here.
const getPastDailies = cached(async (): Promise<PastDaily[]> => {
  const sb = createAdminClient();
  const rows = await all<{ day: string; question_id: string }>((a, b) =>
    sb.from("daily_challenges").select("day, question_id").order("day").range(a, b),
  );
  if (!rows.length) return [];
  const today = new Date().toISOString().slice(0, 10);
  const first = Date.parse(rows[0].day);
  return rows
    .filter((r) => r.day < today)
    .map((r) => ({ day: r.day, questionId: r.question_id, number: Math.round((Date.parse(r.day) - first) / 86_400_000) + 1 }));
}, "public-past-dailies");

// ---------------------------------------------------------------- public questions

export type QuestionSummary = {
  id: string;
  code: string;
  exam: ExamKey;
  slug: string;
  path: string;
  system: SystemRef;
  discipline: string | null;
  competency: string | null;
  topic: string | null;
  category: string | null;
  topicId: number | null;
  teaser: string;
  updatedAt: string;
  free: boolean;
  daily: { day: string; number: number } | null;
};

export function questionPath(exam: ExamKey, slug: string) {
  return `/practice-questions/${EXAMS[exam].slug}/${slug}`;
}

// "A 62-year-old woman develops sudden shortness of breath ... arthroplasty." The first sentence
// of the vignette: describes the case without giving the answer away.
function teaserOf(stem: string) {
  const flat = stem.replace(/\s+/g, " ").trim();
  const end = flat.slice(40).search(/[.?!](\s|$)/);
  const sentence = end >= 0 ? flat.slice(0, 40 + end + 1) : flat;
  return sentence.length > 180 ? `${sentence.slice(0, 177).replace(/\s+\S*$/, "")}…` : sentence;
}

export const getPublicQuestions = cached(async (): Promise<QuestionSummary[]> => {
  const [rows, tax, dailies] = await Promise.all([getBankRows(), getTaxonomy(), getPastDailies()]);
  const dailyById = new Map(dailies.map((d) => [d.questionId, d]));
  const picked = rows.filter((r) => r.is_free || dailyById.has(r.id));
  const sb = createAdminClient();
  const stems = new Map<string, string>();
  for (let i = 0; i < picked.length; i += 150) {
    const ids = picked.slice(i, i + 150).map((r) => r.id);
    const data = await all<{ id: string; stem: string }>((a, b) => sb.from("questions").select("id, stem").in("id", ids).order("id").range(a, b));
    for (const d of data) stems.set(d.id, d.stem);
  }
  const name = <T extends { id: number; name: string }>(list: T[], id: number | null) => (id == null ? null : (list.find((x) => x.id === id)?.name ?? null));
  return picked
    .map((r): QuestionSummary => {
      const system = tax.systems.find((s) => s.id === r.system_id)!;
      const topic = name(tax.topics, r.topic_id);
      const slug = `${r.code.toLowerCase()}-${slugify(topic ?? system.short)}`.slice(0, 90).replace(/-+$/, "");
      const daily = dailyById.get(r.id);
      return {
        id: r.id,
        code: r.code,
        exam: r.exam,
        slug,
        path: questionPath(r.exam, slug),
        system,
        discipline: name(tax.disciplines, r.discipline_id),
        competency: name(tax.competencies, r.competency_id),
        topic,
        category: name(tax.categories, r.category_id),
        topicId: r.topic_id,
        teaser: teaserOf(stems.get(r.id) ?? ""),
        updatedAt: r.updated_at,
        free: r.is_free,
        daily: daily ? { day: daily.day, number: daily.number } : null,
      };
    })
    .sort((a, b) => (a.exam === b.exam ? a.system.sort - b.system.sort || a.code.localeCompare(b.code, "en", { numeric: true }) : a.exam === "step1" ? -1 : 1));
}, "public-questions");

export type PublicQuestion = QuestionSummary & {
  stem: string;
  leadIn: string;
  media: { url: string; alt?: string }[];
  options: { label: string; body: string }[];
  correctLabel: string;
  explanation: string;
  optionExplanations: Record<string, string>;
  objective: string | null;
  keyConcept: string | null;
  references: string[];
  peer: { n: number; pctCorrect: number } | null;
  chapter: { slug: string; title: string; free: boolean } | null;
  nuggets: { title: string; body: string | null }[];
  related: QuestionSummary[];
  /** Questions in the full bank for this exam and system. */
  bankCount: number;
};

export const getPublicQuestion = cached(async (examSlug: string, code: string): Promise<PublicQuestion | null> => {
  const [list, rows] = await Promise.all([getPublicQuestions(), getBankRows()]);
  const s = list.find((q) => q.code.toLowerCase() === code.toLowerCase() && EXAMS[q.exam].slug === examSlug);
  if (!s) return null;
  const sb = createAdminClient();
  const [q, options, key, stats, nuggetRows, chapter] = await Promise.all([
    one<{ stem: string; lead_in: string; media: { type?: string; url: string; alt?: string }[] }>(() => sb.from("questions").select("stem, lead_in, media").eq("id", s.id).single()),
    all<{ id: string; label: string; body: string }>((a, b) => sb.from("question_options").select("id, label, body").eq("question_id", s.id).order("label").range(a, b)),
    one<{
      correct_option_id: string;
      explanation: string;
      option_explanations: Record<string, string> | null;
      educational_objective: string | null;
      key_concept: string | null;
      references: string[] | null;
    }>(() => sb.from("question_keys").select("correct_option_id, explanation, option_explanations, educational_objective, key_concept, references").eq("question_id", s.id).single()),
    one<{ n_attempts: number; n_correct: number }>(() => sb.from("question_stats").select("n_attempts, n_correct").eq("question_id", s.id).maybeSingle()),
    all<{ nuggets: { title: string; body: string | null } | null }>((a, b) =>
      sb.from("question_nuggets").select("nuggets(title, body)").eq("question_id", s.id).order("nugget_id").range(a, b),
    ),
    s.topicId == null
      ? Promise.resolve(null)
      : one<{ slug: string; title: string; is_free: boolean }>(() =>
          sb.from("library_articles").select("slug, title, is_free").eq("topic_id", s.topicId).eq("status", "published").maybeSingle(),
        ),
  ]);
  if (!q || !key) return null;
  const correct = options.find((o) => o.id === key.correct_option_id);
  if (!correct) return null;
  const sameSystem = list.filter((x) => x.id !== s.id && x.exam === s.exam && x.system.id === s.system.id);
  const sameExam = list.filter((x) => x.id !== s.id && x.exam === s.exam && x.system.id !== s.system.id);
  return {
    ...s,
    stem: q.stem,
    leadIn: q.lead_in,
    media: (q.media ?? []).filter((m) => m.url).map((m) => ({ url: m.url, alt: m.alt })),
    options: options.map((o) => ({ label: o.label, body: o.body })),
    correctLabel: correct.label,
    explanation: key.explanation,
    optionExplanations: key.option_explanations ?? {},
    objective: key.educational_objective,
    keyConcept: key.key_concept,
    references: key.references ?? [],
    peer: stats && stats.n_attempts >= 20 ? { n: stats.n_attempts, pctCorrect: Math.round((100 * stats.n_correct) / stats.n_attempts) } : null,
    chapter: chapter ? { slug: chapter.slug, title: chapter.title, free: chapter.is_free } : null,
    nuggets: nuggetRows.map((n) => n.nuggets).filter((n): n is { title: string; body: string | null } => Boolean(n)),
    related: [...sameSystem, ...sameExam].slice(0, 4),
    bankCount: rows.filter((r) => r.exam === s.exam && r.system_id === s.system.id).length,
  };
}, "public-question");

// ---------------------------------------------------------------- Library

export type ChapterSummary = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  system: SystemRef;
  free: boolean;
  minutes: number;
  questions: number;
  nugget: boolean;
  exams: ExamKey[];
  topicId: number | null;
  updatedAt: string;
};

export const getLibraryCatalog = cached(async (): Promise<ChapterSummary[]> => {
  const sb = createAdminClient();
  const [articles, links, rows, tax] = await Promise.all([
    all<{ id: number; slug: string; title: string; summary: string | null; system_id: number; topic_id: number | null; is_free: boolean; reading_minutes: number; updated_at: string }>(
      (a, b) =>
        sb
          .from("library_articles")
          .select("id, slug, title, summary, system_id, topic_id, is_free, reading_minutes, updated_at")
          .eq("status", "published")
          .order("id")
          .range(a, b),
    ),
    all<{ article_id: number; question_id: string }>((a, b) =>
      sb.from("article_questions").select("article_id, question_id").order("article_id").order("question_id").range(a, b),
    ),
    getBankRows(),
    getTaxonomy(),
  ]);
  const bank = new Map(rows.map((r) => [r.id, r]));
  const linked = new Map<number, BankRow[]>();
  for (const l of links) {
    const r = bank.get(l.question_id);
    if (r) linked.set(l.article_id, [...(linked.get(l.article_id) ?? []), r]);
  }
  return articles
    .map((a): ChapterSummary => {
      const qs = linked.get(a.id) ?? [];
      return {
        id: a.id,
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        system: tax.systems.find((s) => s.id === a.system_id)!,
        free: a.is_free,
        minutes: a.reading_minutes,
        questions: qs.length,
        nugget: qs.some((q) => q.is_nugget),
        exams: (["step1", "step2ck"] as ExamKey[]).filter((e) => qs.some((q) => q.exam === e)),
        topicId: a.topic_id,
        updatedAt: a.updated_at,
      };
    })
    .sort((a, b) => a.system.sort - b.system.sort || a.title.localeCompare(b.title));
}, "public-library-catalog");

export type Chapter = ChapterSummary & {
  /** Null for locked chapters: their text is part of Full access. */
  body: string | null;
  createdAt: string | null;
  practice: QuestionSummary[];
  nuggets: { title: string; body: string | null }[];
  related: ChapterSummary[];
};

export const getChapter = cached(async (slug: string): Promise<Chapter | null> => {
  const catalog = await getLibraryCatalog();
  const meta = catalog.find((c) => c.slug === slug);
  if (!meta) return null;
  const sb = createAdminClient();
  const [article, links, publicQs] = await Promise.all([
    meta.free ? one<{ body: string; created_at: string }>(() => sb.from("library_articles").select("body, created_at").eq("id", meta.id).single()) : Promise.resolve(null),
    all<{ question_id: string }>((a, b) => sb.from("article_questions").select("question_id").eq("article_id", meta.id).order("question_id").range(a, b)),
    getPublicQuestions(),
  ]);
  const ids = links.map((l) => l.question_id);
  const linkedIds = new Set(ids);
  let nuggets: Chapter["nuggets"] = [];
  if (meta.free && ids.length) {
    const rows = await all<{ nugget_id: number; nuggets: { title: string; body: string | null } | null }>((a, b) =>
      sb.from("question_nuggets").select("nugget_id, nuggets(title, body)").in("question_id", ids.slice(0, 100)).order("nugget_id").range(a, b),
    );
    const seen = new Set<number>();
    nuggets = rows.filter((r) => r.nuggets && !seen.has(r.nugget_id) && seen.add(r.nugget_id)).map((r) => r.nuggets!);
  }
  const sameSystem = catalog.filter((c) => c.id !== meta.id && c.system.id === meta.system.id);
  return {
    ...meta,
    body: article?.body ?? null,
    createdAt: article?.created_at ?? null,
    practice: publicQs.filter((q) => linkedIds.has(q.id) || (meta.topicId != null && q.topicId === meta.topicId)),
    nuggets,
    related: [...sameSystem.filter((c) => c.free), ...sameSystem.filter((c) => !c.free)].slice(0, 8),
  };
}, "public-chapter");

// ---------------------------------------------------------------- stats

export type ExamStats = {
  total: number;
  /** Readable without an account: free questions plus past Daily Challenges. */
  free: number;
  topics: number;
  systems: (SystemRef & { n: number })[];
  disciplines: (Named & { n: number })[];
};

export type BankStats = {
  total: number;
  exams: Record<ExamKey, ExamStats>;
  chapters: number;
  freeChapters: number;
  publicQuestions: number;
  pastDailies: number;
};

export const getBankStats = cached(async (): Promise<BankStats> => {
  const [rows, tax, catalog, publicQs] = await Promise.all([getBankRows(), getTaxonomy(), getLibraryCatalog(), getPublicQuestions()]);
  const exam = (key: ExamKey): ExamStats => {
    const mine = rows.filter((r) => r.exam === key);
    return {
      total: mine.length,
      free: publicQs.filter((q) => q.exam === key).length,
      topics: new Set(mine.map((r) => r.topic_id).filter((t) => t != null)).size,
      systems: tax.systems.map((s) => ({ ...s, n: mine.filter((r) => r.system_id === s.id).length })).filter((s) => s.n > 0),
      disciplines: tax.disciplines
        .map((d) => ({ ...d, n: mine.filter((r) => r.discipline_id === d.id).length }))
        .filter((d) => d.n > 0)
        .sort((a, b) => b.n - a.n),
    };
  };
  return {
    total: rows.length,
    exams: { step1: exam("step1"), step2ck: exam("step2ck") },
    chapters: catalog.length,
    freeChapters: catalog.filter((c) => c.free).length,
    publicQuestions: publicQs.length,
    pastDailies: publicQs.filter((q) => q.daily).length,
  };
}, "public-bank-stats");

// ---------------------------------------------------------------- subject hubs

export type HubFilter = { exam: ExamKey; systems?: string[]; disciplines?: string[] };

export type HubData = {
  total: number;
  topics: { name: string; n: number; chapter: ChapterSummary | null }[];
  questions: QuestionSummary[];
  chapters: ChapterSummary[];
};

export const getHubData = cached(async (filter: HubFilter): Promise<HubData> => {
  const [rows, tax, catalog, publicQs] = await Promise.all([getBankRows(), getTaxonomy(), getLibraryCatalog(), getPublicQuestions()]);
  const sysIds = new Set(tax.systems.filter((s) => filter.systems?.includes(s.slug)).map((s) => s.id));
  const discIds = new Set(tax.disciplines.filter((d) => filter.disciplines?.includes(d.slug)).map((d) => d.id));
  const matches = (r: { exam: ExamKey; system_id: number; discipline_id: number | null }) =>
    r.exam === filter.exam && (sysIds.has(r.system_id) || (r.discipline_id != null && discIds.has(r.discipline_id)));
  const mine = rows.filter(matches);
  const counts = new Map<number, number>();
  for (const r of mine) if (r.topic_id != null) counts.set(r.topic_id, (counts.get(r.topic_id) ?? 0) + 1);
  const chapterByTopic = new Map(catalog.filter((c) => c.topicId != null).map((c) => [c.topicId!, c]));
  const topics = [...counts.entries()]
    .map(([id, n]) => ({ name: tax.topics.find((t) => t.id === id)?.name ?? "", n, chapter: chapterByTopic.get(id) ?? null }))
    .filter((t) => t.name)
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  const mineIds = new Set(mine.map((r) => r.id));
  const chapterIds = new Set(topics.map((t) => t.chapter?.id).filter(Boolean));
  return {
    total: mine.length,
    topics,
    questions: publicQs.filter((q) => mineIds.has(q.id)),
    chapters: catalog.filter((c) => chapterIds.has(c.id) && c.free),
  };
}, "public-hub");

// ---------------------------------------------------------------- Daily Challenge archive

export async function getDailyArchive() {
  return (await getPublicQuestions())
    .filter((q): q is QuestionSummary & { daily: NonNullable<QuestionSummary["daily"]> } => q.daily != null)
    .sort((a, b) => b.daily.day.localeCompare(a.daily.day));
}
