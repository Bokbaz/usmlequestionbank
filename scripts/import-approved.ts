// Imports an approved-question batch exported by the ARGO authoring pipeline, in any of its
// formats (.json, .jsonl, .csv or .txt; see src/lib/import/argo-format.ts). The admin
// importer at /admin/import reads the same files with the same mapping; this script is for
// batches placed by hand.
//
// Placement (organ system, Library topic, key concept, free sample) comes from
// content/approved/placements.json, keyed by question_id, because the pipeline's systems
// are combined ("respiratory_renal") and its topics are whole outline lines. Questions
// without a placement stop the run and are listed so they can be added first.
//
// Runs the same pipeline as the admin importer: upsert, embeddings, Nugget detection,
// then Library chapters for every touched topic. Idempotent: questions match on
// source_ref = question_id, so a re-import updates in place and keeps their codes.
// The pipeline's `sources` are licensed study notes and are never imported.
//
//   npx tsx --conditions=react-server scripts/import-approved.ts "Approved Questions/approved_....json"
//   ... --dry-run    # validate and print the mapping summary without writing
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { toUpsertPayload } from "../src/lib/aqf/parse";
import { argoCompetency, argoToQuestion, detectArgo, matchOutlineCategory, parseArgo } from "../src/lib/import/argo-format";
import { UpsertPayload, importChunk, recomposeTopics } from "../src/lib/import/pipeline";
import { SYSTEMS } from "../src/lib/taxonomy";

const root = path.resolve(__dirname, "..");
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0 && !line.startsWith("#")) process.env[line.slice(0, i)] ??= line.slice(i + 1).trim();
}

type Placement = { condition?: string; system: string; topic: string; key_concept: string; category?: string | null; free?: boolean };

async function main() {
  const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const dryRun = process.argv.includes("--dry-run");
  if (!file) throw new Error("Usage: import-approved.ts <approved export> [--dry-run]");
  const text = fs.readFileSync(path.resolve(file), "utf8");
  const format = detectArgo(path.basename(file), text);
  if (!format) throw new Error("Not an ARGO export (.json, .jsonl, .csv or .txt)");
  const parsed = parseArgo(format, text);
  if (parsed.fileErrors.length) {
    console.error(parsed.fileErrors.join("\n"));
    process.exit(1);
  }
  const placements = JSON.parse(fs.readFileSync(path.join(root, "content/approved/placements.json"), "utf8")) as Record<string, Placement>;
  // Questions that repeat one already in the bank (same exam and testing point) are listed
  // in skipped.json with what they duplicate, and are never imported.
  const skipped = JSON.parse(fs.readFileSync(path.join(root, "content/approved/skipped.json"), "utf8")) as Record<string, { duplicate_of: string }>;
  const items = parsed.items.filter((q) => !skipped[q.questionId]);
  const left = parsed.notApproved + parsed.items.length - items.length;
  if (left) console.log(`Skipping ${left} (not approved or listed in skipped.json)`);

  const missing = items.filter((q) => !placements[q.questionId]);
  if (missing.length) {
    console.error(`${missing.length} questions have no placement in content/approved/placements.json:`);
    for (const q of missing) console.error(`  ${q.questionId}  ${q.system} | ${q.category ?? ""} | ${q.condition ?? ""}`);
    process.exit(1);
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const [{ data: cats, error: cErr }, { data: topicRows, error: tErr }] = await Promise.all([
    sb.from("categories").select("name, systems(slug)"),
    sb.from("topics").select("name, categories(name)"),
  ]);
  if (cErr) throw cErr;
  if (tErr) throw tErr;
  // The .txt and .csv exports have no outline category: use the topic's own.
  const topicCategory = new Map((topicRows as unknown as { name: string; categories: { name: string } | null }[]).map((t) => [t.name, t.categories?.name ?? null]));
  const catsBySystem = new Map<string, string[]>();
  for (const c of cats as unknown as { name: string; systems: { slug: string } }[]) {
    catsBySystem.set(c.systems.slug, [...(catsBySystem.get(c.systems.slug) ?? []), c.name]);
  }

  const payloads: { index: number; payload: UpsertPayload }[] = [];
  const problems: string[] = [];
  items.forEach((item, index) => {
    const pl = placements[item.questionId];
    if (!SYSTEMS.some((s) => s.slug === pl.system)) problems.push(`${item.questionId}: unknown system ${pl.system}`);
    const category =
      pl.category !== undefined
        ? pl.category
        : item.category
          ? matchOutlineCategory(item.category, catsBySystem.get(pl.system) ?? [])
          : (topicCategory.get(pl.topic) ?? null);
    const q = argoToQuestion(item, index);
    const parsed = UpsertPayload.safeParse({
      ...toUpsertPayload({
        ...q,
        system: pl.system,
        category: category ?? undefined,
        topic: pl.topic,
        keyConcept: pl.key_concept,
        competency: argoCompetency(item.physicianTask, pl.system, item.category),
        isFree: pl.free === true,
      }),
      status: "published",
    });
    if (!parsed.success) problems.push(`${item.questionId}: ${parsed.error.issues[0].path.join(".")} ${parsed.error.issues[0].message}`);
    else payloads.push({ index, payload: parsed.data });
  });
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }

  const count = (f: (p: UpsertPayload) => string | null | undefined) =>
    Object.entries(payloads.reduce<Record<string, number>>((m, { payload }) => ((m[f(payload) ?? "(none)"] = (m[f(payload) ?? "(none)"] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
  console.log(`${payloads.length} approved questions from ${path.basename(file)}`);
  console.log("Systems:", count((p) => p.system));
  console.log("Disciplines:", count((p) => p.discipline));
  console.log(`Categories matched: ${payloads.filter((p) => p.payload.category).length}/${payloads.length}`);
  if (process.argv.includes("--verbose")) {
    const pairs = new Map<string, number>();
    for (const { index, payload } of payloads) {
      const key = `${payload.system} | ${items[index].category ?? ""} -> ${payload.category ?? "(none)"}`;
      pairs.set(key, (pairs.get(key) ?? 0) + 1);
    }
    for (const [k, n] of [...pairs].sort()) console.log(`  ${n}x ${k}`);
  }
  console.log(`Topics: ${new Set(payloads.map((p) => p.payload.topic)).size}, free: ${payloads.filter((p) => p.payload.is_free).length}, daily pool: ${payloads.filter((p) => p.payload.is_daily_eligible).length}`);
  if (dryRun) return;

  const { data: batch, error: bErr } = await sb
    .from("import_batches")
    .insert({ file_name: path.basename(file), n_questions: payloads.length })
    .select("id")
    .single();
  if (bErr) throw bErr;

  let created = 0;
  let updated = 0;
  const errors: string[] = [];
  const nuggets: Record<string, number> = {};
  const topicIds = new Set<number>();
  for (let i = 0; i < payloads.length; i += 20) {
    const results = await importChunk(sb, payloads.slice(i, i + 20), batch.id);
    for (const r of results) {
      if (r.id) (r.created ? created++ : updated++);
      if (r.topicId) topicIds.add(r.topicId);
      if (r.error) errors.push(`${items[r.index].questionId} ${r.code ?? ""}: ${r.error}`);
      if (r.nugget) nuggets[r.nugget] = (nuggets[r.nugget] ?? 0) + 1;
    }
    process.stdout.write(`\r${Math.min(i + 20, payloads.length)}/${payloads.length}`);
  }
  console.log();
  const articles = await recomposeTopics(sb, [...topicIds]);
  await sb
    .from("import_batches")
    .update({ n_created: created, n_updated: updated, n_errors: errors.length, report: { nuggets, articles, errors: errors.slice(0, 50) } })
    .eq("id", batch.id);
  console.log(`Created ${created}, updated ${updated}, errors ${errors.length}. Nuggets: ${JSON.stringify(nuggets)}. Library chapters: ${articles}.`);
  if (errors.length) console.error(errors.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
