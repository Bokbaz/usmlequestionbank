// Seeds the question bank from content/seed/*.aqf.txt using the same RPCs as the
// in-app importer. Idempotent: questions upsert by ID, articles upsert by topic slug.
//
//   npx tsx scripts/seed.ts            # import + embeddings + nuggets + library
//   npx tsx scripts/seed.ts --calibrate  # also print auto-matcher scores per question
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (legacy JWT) in .env.local.

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { parseAqf, toUpsertPayload, type AqfQuestion } from "../src/lib/aqf/parse";
import { composeArticle, slugify } from "../src/lib/library/compose";
import { embedTexts, findNuggetCandidates, questionMatchText } from "../src/lib/nuggets/match";

const root = path.resolve(__dirname, "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });
const calibrate = process.argv.includes("--calibrate");

async function main() {
  const dir = path.join(root, "content/seed");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".aqf.txt")).sort();
  const questions: AqfQuestion[] = [];
  for (const f of files) {
    const { questions: qs, fileErrors } = parseAqf(fs.readFileSync(path.join(dir, f), "utf8"));
    if (fileErrors.length) throw new Error(`${f}: ${fileErrors.join("; ")}`);
    const bad = qs.filter((q) => q.errors.length);
    if (bad.length) throw new Error(`${f}: ${bad.map((q) => `${q.code}: ${q.errors.join(", ")}`).join(" | ")}`);
    questions.push(...qs);
  }
  console.log(`Parsed ${questions.length} questions from ${files.length} files`);

  // 1. Upsert questions --------------------------------------------------------------
  const ids = new Map<string, string>();
  for (const q of questions) {
    const { data, error } = await sb.rpc("admin_upsert_question", { p: toUpsertPayload(q, { source: "seed" }) });
    if (error) throw new Error(`${q.code}: ${error.message}`);
    ids.set(q.code!, (data as { id: string }).id);
  }
  console.log(`Upserted ${ids.size} questions`);

  // 2. Question embeddings -----------------------------------------------------------
  const matchInputs = questions.map((q) => ({
    stem: q.stem,
    leadIn: q.leadIn,
    correctText: q.options.find((o) => o.label === q.correct)?.body ?? "",
    keyConcept: q.keyConcept,
    objective: q.objective,
  }));
  const vectors = await embedTexts(url, serviceKey, matchInputs.map(questionMatchText));
  for (let i = 0; i < questions.length; i++) {
    const { error } = await sb
      .from("questions")
      .update({ embedding: JSON.stringify(vectors[i]) })
      .eq("id", ids.get(questions[i].code!)!);
    if (error) throw error;
  }
  console.log("Stored question embeddings");

  // 3. Provenance for curated Nuggets: link each card to the HY index lines it reflects.
  const nuggetQs = questions.filter((q) => q.nuggets.length);
  const nuggetTexts = nuggetQs.flatMap((q) => q.nuggets.map((n) => `${n.title}. ${n.body ?? ""}`));
  const nuggetVecs = await embedTexts(url, serviceKey, nuggetTexts);
  let k = 0;
  for (const q of nuggetQs) {
    for (const n of q.nuggets) {
      const vec = nuggetVecs[k++];
      const { data, error } = await sb.rpc("match_nugget_index", { p_embedding: JSON.stringify(vec), p_count: 3, p_min: 0.84 });
      if (error) throw error;
      const indexIds = ((data ?? []) as { id: number }[]).map((r) => r.id);
      const { error: upErr } = await sb.from("nuggets").update({ index_ids: indexIds }).eq("slug", slugify(n.title));
      if (upErr) throw upErr;
    }
  }
  console.log(`Linked ${nuggetTexts.length} curated Nuggets to their source index lines`);

  if (calibrate) {
    console.log("\nAuto-matcher calibration (top score | curated nugget?):");
    for (let i = 0; i < questions.length; i++) {
      const c = await findNuggetCandidates(sb, vectors[i], matchInputs[i], 3);
      const top = c[0];
      console.log(
        `${questions[i].code} ${top ? top.score.toFixed(3) : "-----"} ${questions[i].nuggets.length ? "NUGGET" : "      "} ${top ? `[${top.source}] ${top.body.slice(0, 90)}` : ""}`,
      );
    }
  }

  // 4. Library articles (one per topic) -------------------------------------------------
  const { data: topics, error: tErr } = await sb.from("topics").select("id, slug, name, system_id");
  if (tErr) throw tErr;
  const byTopic = new Map<string, AqfQuestion[]>();
  for (const q of questions) {
    if (!q.topic) continue;
    const key = slugify(q.topic);
    byTopic.set(key, [...(byTopic.get(key) ?? []), q]);
  }
  for (const [slug, qs] of byTopic) {
    const topic = topics!.find((t) => t.slug === slug);
    if (!topic) throw new Error(`Topic ${slug} missing`);
    const article = composeArticle(
      topic.name,
      qs.map((q) => ({
        questionId: ids.get(q.code!)!,
        isFree: q.isFree,
        objective: q.objective,
        textbook: q.textbook,
        keyConcept: q.keyConcept,
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
          generated_by: "seed",
          status: "published",
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error) throw error;
    const links = qs.map((q) => ({ article_id: row.id, question_id: ids.get(q.code!)! }));
    const { error: lErr } = await sb.from("article_questions").upsert(links, { onConflict: "article_id,question_id" });
    if (lErr) throw lErr;
  }
  console.log(`Composed ${byTopic.size} Library articles`);

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
