// Approved-question exports from the ARGO authoring pipeline. It writes the same batch in
// four formats, and every one is mapped to the importer's question shape the same way, so
// a question looks identical on the site whichever file it arrived in:
//
//   .json   array of items
//   .jsonl  one item per line
//   .csv    one row per item: choices in columns A to J, distractor_explanations and tags
//           as JSON text
//   .txt    readable blocks: "Question ID:", vignette, lead-in, choices, "Correct Answer:",
//           explanation, "Why each other option is incorrect:", objective, core concept and
//           tags, separated by a row of "="
//
// The .txt and .csv exports carry exam, system, difficulty, physician task and condition
// only as tags. Real fields win over tags when both are present.
//
// The pipeline's `sources` are licensed study notes and are never read. Its systems are
// combined ("respiratory_renal") and its topics are whole outline lines, so the site's
// organ system, Library topic and category are decided on the server from the bank's
// closest questions (placeArgo in lib/import/pipeline.ts) and applied with applyPlacement.

import { validateAqf, type AqfQuestion } from "@/lib/aqf/parse";
import { resolveDiscipline, resolveExam, type CompetencySlug, type DisciplineSlug, type ExamKey } from "@/lib/taxonomy";

export type ArgoFormat = "json" | "jsonl" | "csv" | "txt";

export type ArgoItem = {
  questionId: string;
  exam: string;
  // Pipeline system, often combined: "respiratory_renal", "blood_immune".
  system: string;
  // Outline category (JSON exports only).
  category?: string;
  condition?: string;
  difficulty: string;
  physicianTask?: string;
  stem: string;
  leadIn: string;
  choices: { label: string; text: string }[];
  correct: string;
  explanation: string;
  distractors: Record<string, string>;
  objective?: string;
  coreConcept?: string;
  tags: { kind: string; value: string }[];
  status?: string;
};

export type ArgoParseResult = { format: ArgoFormat; items: ArgoItem[]; fileErrors: string[]; notApproved: number };

// Where the server put a question, shown in the review before anything is saved.
export type ArgoPlacement = {
  index: number;
  // The question is already in the bank: its content is updated, its placement kept.
  existing?: {
    code: string;
    system: string;
    topic: string | null;
    category: string | null;
    discipline: string | null;
    competency: string | null;
    keyConcept: string | null;
    isFree: boolean;
    isDaily: boolean;
  };
  // New question: placed next to its closest questions in the bank.
  suggested?: { system: string; topic: string; category: string | null; basis: "neighbor" | "topic-name" | "condition"; neighbor?: Similar };
  // Same exam and the same testing point as a question already in the bank, or as an
  // earlier question in the same file (inFile is that question's index).
  duplicate?: Similar & { recorded?: boolean; inFile?: number };
  // The embedded testing point of a new question, for duplicate checks within the file.
  vector?: number[];
  error?: string;
};
export type Similar = { code: string; similarity: number; leadIn: string; answer: string };

// Site systems each pipeline system maps to. Unknown labels fall back to the site's own
// system resolver.
export const ARGO_SYSTEMS: Record<string, string[]> = {
  respiratory_renal: ["respiratory", "renal"],
  reproductive_endocrine: ["female-reproductive", "male-reproductive", "endocrine", "pregnancy"],
  renal_reproductive: ["renal", "female-reproductive", "male-reproductive"],
  behavioral_neuro: ["behavioral-health", "nervous"],
  blood_immune: ["blood-lymph", "immune"],
  musculoskeletal_skin: ["musculoskeletal", "skin"],
  behavioral: ["behavioral-health"],
  neuro: ["nervous"],
  social: ["social-sciences"],
  human_development: ["human-development"],
};
// Pipeline systems whose questions were spread across many site systems when placed by
// hand (multisystem items often went to General Principles), so they may go anywhere.
export const ARGO_OPEN_SYSTEMS = new Set(["multisystem", "social"]);

export const ARGO_DIFFICULTY: Record<string, number> = { EASY: 2, MEDIUM: 3, HARD: 4, ULTRAHARD: 5 };

// Calibrated on the 1,361 hand-placed pipeline questions (2026-10-10). The nearest bank
// question in the chosen system shares the hand-picked topic 88% of the time at 0.88 or
// above. Two questions on the same exam count as duplicates at 0.96, or at 0.93 when their
// conditions share most words; that caught 83% of the 157 duplicates in skipped.json.
export const TOPIC_REUSE = 0.88;
const DUPLICATE = 0.96;
const DUPLICATE_SAME_CONDITION = 0.93;

const CONDITION_STOP = new Set(["and", "the", "of", "with", "in", "to", "due", "from", "for", "or", "on", "by", "as", "at", "acute", "chronic"]);
export const conditionWords = (s: string | null | undefined) =>
  new Set(
    (s ?? "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !CONDITION_STOP.has(w))
      .map((w) => w.replace(/s$/, "")),
  );

export function isDuplicatePair(similarity: number, conditionA: string | null | undefined, conditionB: string | null | undefined) {
  if (similarity >= DUPLICATE) return true;
  if (similarity < DUPLICATE_SAME_CONDITION) return false;
  const a = conditionWords(conditionA);
  const b = conditionWords(conditionB);
  const shared = [...a].filter((w) => b.has(w)).length;
  return shared / (a.size + b.size - shared || 1) >= 0.4;
}

// ---------------------------------------------------------------- detection and parsing

export function detectArgo(fileName: string | null, text: string): ArgoFormat | null {
  const ext = fileName?.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  const head = text.replace(/^﻿/, "").trimStart();
  if (ext === "jsonl" || ext === "ndjson") return "jsonl";
  if (ext === "json") return "json";
  if (ext === "csv") return /^"?question_id"?\s*,/.test(head) ? "csv" : null;
  if (
    /^\s*Question ID:/m.test(head) &&
    /^\s*Correct Answer:/m.test(head) &&
    (/^\s*Core Concept:/im.test(head) || TXT_OTHERS_ANYWHERE.test(head)) &&
    !/^\s*#{2,}\s*(?:QUESTION|Q)\b/im.test(head)
  )
    return "txt";
  if (head.startsWith("[")) return "json";
  if (head.startsWith("{")) return "jsonl";
  if (/^"?question_id"?\s*,/.test(head)) return "csv";
  return null;
}

export function parseArgo(format: ArgoFormat, text: string): ArgoParseResult {
  const fileErrors: string[] = [];
  text = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  let records: ArgoItem[] = [];
  try {
    if (format === "txt") records = parseTxt(text, fileErrors);
    else if (format === "csv") records = parseCsvRecords(text).map(fromRecord);
    else records = jsonRecords(format, text, fileErrors).map(fromRecord);
  } catch (e) {
    fileErrors.push(e instanceof Error ? e.message : String(e));
  }
  const items = records.filter((r) => !r.status || r.status.toUpperCase() === "APPROVED");
  if (!items.length && !fileErrors.length) fileErrors.push("No approved questions found in this file.");
  return { format, items, fileErrors, notApproved: records.length - items.length };
}

function jsonRecords(format: ArgoFormat, text: string, fileErrors: string[]): Record<string, unknown>[] {
  if (format === "json") {
    try {
      const data = JSON.parse(text) as unknown;
      if (Array.isArray(data)) return data;
      const list = Object.values(data as Record<string, unknown>).find(Array.isArray);
      if (list) return list;
      return [data as Record<string, unknown>];
    } catch {
      // Some exports are JSON Lines saved as .json.
    }
  }
  const out: Record<string, unknown>[] = [];
  text.split("\n").forEach((line, i) => {
    if (!line.trim()) return;
    try {
      out.push(JSON.parse(line));
    } catch {
      fileErrors.push(`Line ${i + 1} is not valid JSON`);
    }
  });
  return out;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());
const normKind = (k: string) => k.toLowerCase().replace(/[_/]+/g, " ").replace(/\s+/g, " ").trim();

function parseJsonField<T>(v: unknown, fallback: T): T {
  if (typeof v !== "string") return (v as T) ?? fallback;
  if (!v.trim()) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

function toTags(v: unknown): ArgoItem["tags"] {
  const list = parseJsonField<unknown[]>(v, []);
  if (!Array.isArray(list)) return [];
  return list
    .map((t) => (t && typeof t === "object" ? { kind: str((t as { kind?: unknown }).kind), value: str((t as { value?: unknown }).value) } : null))
    .filter((t): t is { kind: string; value: string } => Boolean(t?.kind && t.value));
}

// The pipeline appends the item's own EXAM, SYSTEM, DIFFICULTY, PHYSICIAN_TASK and CONDITION
// as the last tags; earlier tags of the same kind are descriptive.
export function tagValue(tags: ArgoItem["tags"], kind: string): string | undefined {
  const k = normKind(kind);
  for (let i = tags.length - 1; i >= 0; i--) if (normKind(tags[i].kind) === k) return tags[i].value;
  return undefined;
}

function fromRecord(r: Record<string, unknown>): ArgoItem {
  const tags = toTags(r.tags);
  const distractors = parseJsonField<Record<string, unknown>>(r.distractor_explanations, {});
  const choices: ArgoItem["choices"] = Array.isArray(r.choices)
    ? (r.choices as { label?: unknown; text?: unknown }[]).map((c) => ({ label: str(c.label).toUpperCase(), text: str(c.text) }))
    : "ABCDEFGHIJ"
        .split("")
        .filter((l) => str(r[l]))
        .map((l) => ({ label: l, text: str(r[l]) }));
  return {
    questionId: str(r.question_id),
    exam: str(r.exam_target) || tagValue(tags, "exam") || "",
    system: str(r.system) || tagValue(tags, "system") || "",
    category: str(r.category) || undefined,
    condition: str(r.condition) || tagValue(tags, "condition"),
    difficulty: str(r.difficulty) || tagValue(tags, "difficulty") || "",
    physicianTask: str(r.physician_task) || tagValue(tags, "physician task"),
    stem: str(r.stem),
    leadIn: str(r.lead_in),
    choices,
    correct: str(r.correct_choice).toUpperCase(),
    explanation: str(r.correct_explanation),
    distractors: Object.fromEntries(
      Object.entries(distractors && typeof distractors === "object" ? distractors : {}).map(([k, v]) => [k.trim().toUpperCase(), str(v)]),
    ),
    objective: str(r.educational_objective) || undefined,
    coreConcept: str(r.core_concept) || tagValue(tags, "core concept"),
    tags,
    status: str(r.status) || undefined,
  };
}

// RFC 4180: quoted fields may hold commas, doubled quotes and line breaks.
export function parseCsvRecords(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  if (!header) return [];
  const keys = header.map((h) => h.trim());
  return body.filter((r) => r.some((f) => f.trim())).map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ""])));
}

const TXT_OPTION = /^\s*([A-J])[.)]\s+(.*\S)\s*$/;
const TXT_OTHERS = /^\s*why (?:each|the|all) other (?:options?|choices?|answers?) (?:is|are) (?:incorrect|wrong)\s*:?\s*$/i;
const TXT_OTHERS_ANYWHERE = /^\s*why (?:each|the|all) other (?:options?|choices?|answers?) (?:is|are) (?:incorrect|wrong)\s*:?\s*$/im;
const TXT_FIELD = /^\s*(Educational Objective|Core Concept|Tags|Sources)\s*:\s*(.*)$/i;

function parseTxt(text: string, fileErrors: string[]): ArgoItem[] {
  const items: ArgoItem[] = [];
  for (const block of text.split(/^\s*={8,}\s*$/m)) {
    if (!/^\s*Question ID:/m.test(block)) continue;
    const item = parseTxtBlock(block);
    if (typeof item === "string") fileErrors.push(item);
    else items.push(item);
  }
  return items;
}

function parseTxtBlock(block: string): ArgoItem | string {
  const lines = block.split("\n");
  const idAt = lines.findIndex((l) => /^\s*Question ID:/.test(l));
  const questionId = lines[idAt].replace(/^\s*Question ID:\s*/, "").trim();
  const answerAt = lines.findIndex((l, i) => i > idAt && /^\s*Correct Answer:/i.test(l));
  if (answerAt < 0) return `Question ${questionId || "(no ID)"}: no "Correct Answer:" line`;

  // Vignette, lead-in, then the final run of choice lines.
  const body = lines.slice(idAt + 1, answerAt);
  let end = body.length;
  while (end > 0 && !body[end - 1].trim()) end--;
  let start = end;
  while (start > 0 && TXT_OPTION.test(body[start - 1])) start--;
  const choices = body.slice(start, end).map((l) => {
    const m = l.match(TXT_OPTION)!;
    return { label: m[1], text: m[2].trim() };
  });
  const paragraphs = body
    .slice(0, start)
    .join("\n")
    .trim()
    .split(/\n[ \t]*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const leadIn = paragraphs.length > 1 ? paragraphs.pop()! : "";
  const stem = paragraphs.join("\n\n");

  const correct = lines[answerAt].match(/Correct Answer:\s*\(?([A-J])\b/i)?.[1]?.toUpperCase() ?? "";
  const explanation: string[] = [];
  const distractors: Record<string, string> = {};
  const fields: Record<string, string[]> = {};
  let section: "explanation" | "others" | "field" = "explanation";
  let currentOption: string | null = null;
  let currentField: string | null = null;
  for (const line of lines.slice(answerAt + 1)) {
    const field = line.match(TXT_FIELD);
    if (field) {
      currentField = field[1].toLowerCase();
      if (currentField === "sources") break;
      fields[currentField] = [field[2]];
      section = "field";
      continue;
    }
    if (section === "explanation" && TXT_OTHERS.test(line)) {
      section = "others";
      continue;
    }
    if (section === "explanation") explanation.push(line);
    else if (section === "others") {
      const opt = line.match(TXT_OPTION);
      if (opt) {
        currentOption = opt[1];
        distractors[currentOption] = opt[2].trim();
      } else if (currentOption && line.trim()) distractors[currentOption] += `\n\n${line.trim()}`;
    } else if (currentField && line.trim()) fields[currentField].push(line.trim());
  }

  const tags = (fields.tags ?? [])
    .join(" ")
    .split(/;\s*(?=[A-Za-z][A-Za-z_ /-]{0,40}:\s)/)
    .map((part) => {
      const i = part.indexOf(":");
      return i > 0 ? { kind: part.slice(0, i).trim(), value: part.slice(i + 1).trim() } : null;
    })
    .filter((t): t is { kind: string; value: string } => Boolean(t?.kind && t.value));

  return {
    questionId,
    exam: tagValue(tags, "exam") ?? "",
    system: tagValue(tags, "system") ?? "",
    condition: tagValue(tags, "condition"),
    difficulty: tagValue(tags, "difficulty") ?? "",
    physicianTask: tagValue(tags, "physician task"),
    stem,
    leadIn,
    choices,
    correct,
    explanation: explanation.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    distractors,
    objective: fields["educational objective"]?.join(" ").trim() || undefined,
    coreConcept: fields["core concept"]?.join(" ").trim() || tagValue(tags, "core concept"),
    tags,
  };
}

// ---------------------------------------------------------------- mapping to the site

export function argoExam(value: string): ExamKey | undefined {
  return resolveExam(value.replace(/^STEP/i, "Step "));
}

// Discipline tags are free text ("cardiovascular physiology", "Biostatistics and epidemiology").
export function argoDiscipline(tags: ArgoItem["tags"]): DisciplineSlug | null {
  const values = tags.filter((t) => t.kind.toLowerCase().startsWith("discipline")).map((t) => t.value);
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

export function argoCompetency(physicianTask: string | undefined, system: string, category?: string | null): CompetencySlug {
  if (system === "biostatistics") return "evidence-based";
  if (system === "social-sciences" && category) {
    const c = category.toLowerCase();
    if (c.includes("systems-based") || c.includes("patient safety")) return "systems-safety";
    if (c.includes("communication")) return "communication";
    if (c.includes("ethics")) return "professionalism";
  }
  switch (physicianTask) {
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

// The single fact tested: the pipeline's "core testing point" tag, else its core concept.
export function argoKeyConcept(item: ArgoItem): string | undefined {
  const raw = (tagValue(item.tags, "core testing point") ?? item.coreConcept ?? "").trim().replace(/\.$/, "");
  if (!raw) return undefined;
  const text = raw.length > 300 ? raw.slice(0, raw.lastIndexOf(" ", 297)) + "…" : raw;
  return text[0].toUpperCase() + text.slice(1);
}

// The Library topic a brand-new condition gets when no existing topic fits.
export function conditionTopic(condition: string | undefined): string | null {
  const c = condition?.trim().replace(/\.$/, "");
  if (!c) return null;
  const t = c.length > 120 ? c.slice(0, c.lastIndexOf(" ", 120)) : c;
  return t[0].toUpperCase() + t.slice(1);
}

// Match an outline category line to one of a system's categories by shared words.
const STOP = new Set(["and", "the", "of", "on", "to", "in", "including", "disorders", "disease", "diseases", "system", "other", "related", "include", "issues"]);
const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/&/g, " ")
      .split(/[^a-z]+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
      .map((w) => w.replace(/s$/, "")),
  );
export function matchOutlineCategory(text: string | undefined, candidates: string[]): string | null {
  if (!text) return null;
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

// The text embedded to find a question's closest neighbours and Nuggets (questionMatchText).
export function argoMatchInput(q: AqfQuestion) {
  return {
    stem: q.stem,
    leadIn: q.leadIn,
    correctText: q.options.find((o) => o.label === q.correct)?.body ?? "",
    keyConcept: q.keyConcept,
    objective: q.objective,
  };
}

// Some exports end the vignette with their own wording of the question, so students would
// read the question twice. The lead-in is the question: drop the copy. Speech in quotes
// ("asks, “Is this serious?”") is part of the vignette and stays.
export function stripRepeatedQuestion(stem: string): { stem: string; removed?: string } {
  const s = stem.trimEnd();
  if (!s.endsWith("?")) return { stem };
  let cut = -1;
  for (const m of s.slice(0, -1).matchAll(/[.!?]["”’)]?\s+|\n/g)) cut = m.index + m[0].length;
  const last = s.slice(cut < 0 ? 0 : cut);
  if (cut < 0 || /["“”]/.test(last)) return { stem };
  return { stem: s.slice(0, cut).trimEnd(), removed: last.trim() };
}

// Maps an item to the importer's question shape. Placement fields stay empty until
// applyPlacement fills them, so the question is validated only once placed.
export function argoToQuestion(item: ArgoItem, index: number): AqfQuestion {
  const difficulty = item.difficulty.toUpperCase();
  const vignette = stripRepeatedQuestion(item.stem);
  const optionExplanations: Record<string, string> = {};
  for (const c of item.choices) {
    if (c.label === item.correct) optionExplanations[c.label] = item.coreConcept ? `Correct. ${item.coreConcept}` : "Correct.";
    else if (item.distractors[c.label]) optionExplanations[c.label] = item.distractors[c.label];
  }
  return {
    index,
    sourceRef: item.questionId || undefined,
    exam: argoExam(item.exam) ?? "step1",
    discipline: argoDiscipline(item.tags) ?? undefined,
    difficulty: ARGO_DIFFICULTY[difficulty] ?? 3,
    tags: item.condition ? [item.condition.slice(0, 60)] : [],
    isFree: false,
    isDaily: difficulty === "ULTRAHARD",
    status: "published",
    stem: vignette.stem,
    leadIn: item.leadIn,
    media: [],
    options: item.choices.map((c) => ({ label: c.label, body: c.text })),
    correct: item.correct || undefined,
    keyConcept: argoKeyConcept(item),
    explanation: item.explanation,
    optionExplanations,
    objective: item.objective,
    references: [],
    nuggets: [],
    errors: [],
    warnings: [],
    // Difficulty comes from the file, so AI classification leaves it alone.
    meta: ["difficulty"],
    argo: {
      system: item.system,
      category: item.category,
      condition: item.condition,
      physicianTask: item.physicianTask,
      examLabel: item.exam,
      removedQuestion: vignette.removed,
    },
  };
}

// Questions already in the bank keep their placement and curation (system, topic,
// category, key concept, discipline, task, free and Daily flags); only the content from
// the file changes. New questions take the server's suggestion.
export function applyPlacement(q: AqfQuestion, p: ArgoPlacement): AqfQuestion {
  const next: AqfQuestion = { ...q, placement: p, errors: [], warnings: [] };
  if (p.existing) {
    const e = p.existing;
    Object.assign(next, {
      code: e.code,
      system: e.system,
      topic: e.topic ?? undefined,
      category: e.category ?? undefined,
      discipline: e.discipline ?? undefined,
      competency: e.competency ?? undefined,
      keyConcept: e.keyConcept ?? q.keyConcept,
      isFree: e.isFree,
      isDaily: e.isDaily,
    });
  } else if (p.suggested) {
    const s = p.suggested;
    Object.assign(next, {
      system: s.system,
      topic: s.topic,
      category: s.category ?? undefined,
      competency: argoCompetency(q.argo?.physicianTask, s.system, q.argo?.category ?? s.category),
    });
  }
  return validateArgo(next);
}

// Re-run after an admin changes a question's system or topic in the review.
export function validateArgo(q: AqfQuestion): AqfQuestion {
  const next = validateAqf({ ...q, errors: [], warnings: [], systemGuessed: false });
  const p = q.placement;
  if (!p) next.errors.unshift("Not placed yet");
  else if (p.error) next.errors.unshift(`Could not be placed: ${p.error}`);
  if (!q.argo?.examLabel || !argoExam(q.argo.examLabel)) next.warnings.push(`Unknown exam "${q.argo?.examLabel ?? ""}", using Step 1`);
  if (!q.sourceRef) next.errors.push("Missing question_id");
  if (q.argo?.sameIdAs != null) next.errors.push(`Same question_id as question #${q.argo.sameIdAs}`);
  if (q.argo?.removedQuestion) next.warnings.push(`Repeated question removed from the end of the vignette: "${q.argo.removedQuestion}"`);
  next.warnings = [...new Set(next.warnings)].filter((w) => !w.startsWith("System not given"));
  return next;
}
