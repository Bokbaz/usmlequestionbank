// Imports an approved-question batch exported by the question authoring pipeline
// ("Approved Questions/approved_*.json": an array of APPROVED items with question_id,
// exam_target, system, category, condition, difficulty, physician_task, stem, lead_in,
// choices, correct_choice, explanations, tags, sources ...).
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
import { UpsertPayload, importChunk, recomposeTopics } from "../src/lib/import/pipeline";
import { resolveDiscipline, resolveExam, SYSTEMS, type DisciplineSlug } from "../src/lib/taxonomy";

const root = path.resolve(__dirname, "..");
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0 && !line.startsWith("#")) process.env[line.slice(0, i)] ??= line.slice(i + 1).trim();
}

type Approved = {
  question_id: string;
  exam_target: string;
  system: string;
  category: string;
  condition: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "ULTRAHARD";
  physician_task: string;
  educational_objective: string;
  core_concept: string;
  stem: string;
  lead_in: string;
  choices: { label: string; text: string }[];
  correct_choice: string;
  correct_explanation: string;
  distractor_explanations: Record<string, string>;
  tags: { kind: string; value: string }[];
  status: string;
};

type Placement = { condition?: string; system: string; topic: string; key_concept: string; category?: string | null; free?: boolean };

const DIFFICULTY: Record<Approved["difficulty"], number> = { EASY: 2, MEDIUM: 3, HARD: 4, ULTRAHARD: 5 };

// Discipline tags are free text ("cardiovascular physiology", "Biostatistics and epidemiology").
function discipline(q: Approved): DisciplineSlug | null {
  const values = q.tags.filter((t) => t.kind.toLowerCase().startsWith("discipline")).map((t) => t.value);
  for (const v of values) {
    const exact = resolveDiscipline(v);
    if (exact) return exact;
    const s = v.toLowerCase();
    if (s.includes("biostat") || s.includes("epidemiol")) return "biostatistics-epi";
    if (s.includes("pharmacol")) return "pharmacology";
    if (s.includes("physiolog")) return "physiology";
    if (s.includes("patholog")) return "pathology";
    if (s.includes("anatom") || s.includes("embryol")) return "anatomy";
    if (s.includes("genetic")) return "genetics";
    if (s.includes("microbio")) return "microbiology";
    if (s.includes("immunol")) return "immunology";
    if (s.includes("biochem") || s.includes("nutrition")) return "biochemistry";
    if (s.includes("histol")) return "histology";
    if (s.includes("behavioral") || s.includes("neuroscience")) return "behavioral-science";
    if (s.includes("ethic") || s.includes("social") || s.includes("palliative") || s.includes("quality") || s.includes("systems") || s.includes("economics")) return "ethics";
  }
  return null;
}

function competency(q: Approved, system: string): string {
  if (system === "biostatistics") return "evidence-based";
  if (system === "social-sciences") {
    const c = q.category.toLowerCase();
    if (c.includes("systems-based") || c.includes("patient safety")) return "systems-safety";
    if (c.includes("communication")) return "communication";
    if (c.includes("ethics")) return "professionalism";
  }
  switch (q.physician_task) {
    case "diagnosis":
      return "dx-diagnosis";
    case "communication":
      return "communication";
    case "learning":
      return "evidence-based";
    default:
      return "foundational-science";
  }
}

// Match the outline category text to one of the system's categories by shared words.
const STOP = new Set(["and", "the", "of", "on", "to", "in", "including", "disorders", "disease", "diseases", "system", "other", "related", "include", "issues"]);
const words = (s: string) => new Set(s.toLowerCase().replace(/&/g, " ").split(/[^a-z]+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/s$/, "")));
function category(text: string, candidates: string[]): string | null {
  const a = words(text);
  let best: { name: string; score: number; coverage: number } | null = null;
  for (const name of candidates) {
    const b = words(name);
    if (!b.size) continue;
    const shared = [...b].filter((w) => a.has(w)).length;
    const score = shared / (a.size + b.size - shared);
    if (shared && (!best || score > best.score)) best = { name, score, coverage: shared / b.size };
  }
  // Half of the candidate's words must appear in the outline text.
  return best && best.coverage >= 0.5 ? best.name : null;
}

async function main() {
  const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const dryRun = process.argv.includes("--dry-run");
  if (!file) throw new Error("Usage: import-approved.ts <approved.json> [--dry-run]");
  const items = (JSON.parse(fs.readFileSync(path.resolve(file), "utf8")) as Approved[]).filter((q) => q.status === "APPROVED");
  const placements = JSON.parse(fs.readFileSync(path.join(root, "content/approved/placements.json"), "utf8")) as Record<string, Placement>;

  const missing = items.filter((q) => !placements[q.question_id]);
  if (missing.length) {
    console.error(`${missing.length} questions have no placement in content/approved/placements.json:`);
    for (const q of missing) console.error(`  ${q.question_id}  ${q.system} | ${q.category} | ${q.condition}`);
    process.exit(1);
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: cats, error: cErr } = await sb.from("categories").select("name, systems(slug)");
  if (cErr) throw cErr;
  const catsBySystem = new Map<string, string[]>();
  for (const c of cats as unknown as { name: string; systems: { slug: string } }[]) {
    catsBySystem.set(c.systems.slug, [...(catsBySystem.get(c.systems.slug) ?? []), c.name]);
  }

  const payloads: { index: number; payload: UpsertPayload }[] = [];
  const problems: string[] = [];
  items.forEach((q, index) => {
    const pl = placements[q.question_id];
    if (!SYSTEMS.some((s) => s.slug === pl.system)) problems.push(`${q.question_id}: unknown system ${pl.system}`);
    const exam = resolveExam(q.exam_target.replace(/^STEP/i, "Step "));
    if (!exam) problems.push(`${q.question_id}: unknown exam ${q.exam_target}`);
    const optionExplanations = { ...q.distractor_explanations, [q.correct_choice]: `Correct. ${q.core_concept}` };
    const parsed = UpsertPayload.safeParse({
      exam,
      status: "published",
      stem: q.stem,
      lead_in: q.lead_in,
      media: [],
      system: pl.system,
      discipline: discipline(q),
      competency: competency(q, pl.system),
      category: pl.category !== undefined ? pl.category : category(q.category, catsBySystem.get(pl.system) ?? []),
      topic: pl.topic,
      difficulty: DIFFICULTY[q.difficulty] ?? 3,
      is_free: pl.free === true,
      is_daily_eligible: q.difficulty === "ULTRAHARD",
      tags: [q.condition.slice(0, 60)],
      options: q.choices.map((c) => ({ label: c.label, body: c.text, concept: null })),
      correct: q.correct_choice,
      explanation: q.correct_explanation,
      option_explanations: optionExplanations,
      objective: q.educational_objective,
      textbook: null,
      key_concept: pl.key_concept,
      references: [],
      source: "import",
      source_ref: q.question_id,
    });
    if (!parsed.success) problems.push(`${q.question_id}: ${parsed.error.issues[0].path.join(".")} ${parsed.error.issues[0].message}`);
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
      const key = `${payload.system} | ${items[index].category} -> ${payload.category ?? "(none)"}`;
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
      if (r.error) errors.push(`${items[r.index].question_id} ${r.code ?? ""}: ${r.error}`);
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
