import "server-only";
import { AiError, NO_USAGE, addUsage, structured, type AiUsage } from "./client";
import { AUDITOR_SYSTEM, BLIND_SOLVER_SYSTEM, ITEM_WRITER_SYSTEM } from "./prompts";
import { BlindSolve, ItemAudit, WrittenQuestion } from "./schemas";

// ARGO question writing: write one item for a student's weak concept, shuffle its choices,
// then verify it twice in parallel (a blind solve and a keyed audit). Only items that pass
// both reach the student.

export type WriterContext = {
  exam: "step1" | "step2ck" | "step3";
  concept: { dim: string; name: string; system?: string | null; discipline?: string | null; topic?: string | null };
  mastery: number | null;
  attempts: number;
  confusions: { correct: string; chosen: string; n: number }[];
  reference: { title: string; body: string }[];
  nuggets: { title: string; body: string | null }[];
  avoid: string[];
  difficulty: number;
};

export type Verdict = {
  blind: BlindSolve | null;
  audit: ItemAudit | null;
  reasons: string[];
};

export type WriteResult =
  | { status: "accepted"; question: WrittenQuestion; verdict: Verdict; usage: AiUsage }
  | { status: "rejected"; question: WrittenQuestion | null; verdict: Verdict; usage: AiUsage };

const EXAM_LABEL = { step1: "USMLE Step 1", step2ck: "USMLE Step 2 CK", step3: "USMLE Step 3" } as const;
const LABELS = ["A", "B", "C", "D", "E"];

function writerPrompt(ctx: WriterContext) {
  const c = ctx.concept;
  const where = [c.system && `System: ${c.system}`, c.discipline && `Discipline: ${c.discipline}`, c.topic && `Topic: ${c.topic}`].filter(Boolean).join("\n");
  const level =
    ctx.mastery == null
      ? "No reliable estimate yet."
      : `Estimated mastery ${Math.round(ctx.mastery * 100)}% across ${ctx.attempts} answered items on this concept.`;
  const confusions = ctx.confusions.length
    ? ctx.confusions.map((x) => `- Chose "${x.chosen}" when the answer was "${x.correct}" (${x.n}x)`).join("\n")
    : "- None recorded.";
  const reference = ctx.reference.length
    ? ctx.reference.map((r) => `### ${r.title}\n${r.body}`).join("\n\n")
    : "No chapter available; rely on current standard references.";
  const nuggets = ctx.nuggets.length ? ctx.nuggets.map((n) => `- ${n.title}${n.body ? `: ${n.body}` : ""}`).join("\n") : "- None.";
  const avoid = ctx.avoid.length ? ctx.avoid.map((a) => `- ${a}`).join("\n") : "- None.";

  return `Write one ${EXAM_LABEL[ctx.exam]} question.

<target>
Concept (${c.dim}): ${c.name}
${where}
Target difficulty: ${ctx.difficulty} of 5
</target>

<student>
${level}
Wrong answers chosen on related items:
${confusions}
</student>

<reference>
${reference}
</reference>

<high_yield_points>
${nuggets}
</high_yield_points>

<existing_items_to_avoid>
${avoid}
</existing_items_to_avoid>`;
}

function renderItem(q: WrittenQuestion) {
  return `${q.stem}\n\n${q.lead_in}\n\n${q.options.map((o) => `${o.label}. ${o.text}`).join("\n")}`;
}

function auditPrompt(q: WrittenQuestion) {
  const why = q.option_explanations.map((e) => `${e.label}: ${e.text}`).join("\n");
  return `<item>
${renderItem(q)}
</item>

<key>${q.correct}</key>

<explanation>
${q.explanation}
</explanation>

<choice_explanations>
${why}
</choice_explanations>

<objective>${q.objective}</objective>

<study_note>
${q.textbook}
</study_note>`;
}

// Structural checks that the schema cannot express.
function shapeProblems(q: WrittenQuestion): string[] {
  const out: string[] = [];
  const labels = q.options.map((o) => o.label);
  if (q.options.length !== 5) out.push(`Expected 5 choices, got ${q.options.length}`);
  if (new Set(labels).size !== labels.length) out.push("Duplicate choice labels");
  if (!labels.includes(q.correct)) out.push("Keyed answer is not a choice");
  if (!q.lead_in.trim().endsWith("?")) out.push("Lead-in is not a question");
  if (q.stem.trim().length < 150) out.push("Vignette is too short");
  const explained = new Set(q.option_explanations.map((e) => e.label));
  const unexplained = labels.filter((l) => !explained.has(l));
  if (unexplained.length) out.push(`No explanation for ${unexplained.join(", ")}`);
  return out;
}

// Writers favor some answer positions; shuffle and relabel A to E.
function shuffle(q: WrittenQuestion): WrittenQuestion {
  const order = q.options.map((o, i) => ({ o, r: Math.random(), i })).sort((a, b) => a.r - b.r);
  const relabel = new Map(order.map((x, i) => [x.o.label, LABELS[i]]));
  return {
    ...q,
    options: order.map((x, i) => ({ ...x.o, label: LABELS[i] as WrittenQuestion["correct"] })),
    correct: relabel.get(q.correct) as WrittenQuestion["correct"],
    option_explanations: q.option_explanations
      .filter((e) => relabel.has(e.label))
      .map((e) => ({ ...e, label: relabel.get(e.label) as WrittenQuestion["correct"] }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    difficulty: Math.min(5, Math.max(1, Math.round(q.difficulty))),
  };
}

export async function writeVerifiedQuestion(ctx: WriterContext): Promise<WriteResult> {
  let usage = NO_USAGE;
  const written = await structured({ system: ITEM_WRITER_SYSTEM, user: writerPrompt(ctx), schema: WrittenQuestion, effort: "high", timeoutMs: 170_000 });
  usage = addUsage(usage, written.usage);

  const problems = shapeProblems(written.data);
  if (problems.length) return { status: "rejected", question: written.data, verdict: { blind: null, audit: null, reasons: problems }, usage };
  const q = shuffle(written.data);

  const [blind, audit] = await Promise.allSettled([
    structured({ system: BLIND_SOLVER_SYSTEM, user: renderItem(q), schema: BlindSolve, effort: "medium", timeoutMs: 100_000 }),
    structured({ system: AUDITOR_SYSTEM, user: auditPrompt(q), schema: ItemAudit, effort: "high", timeoutMs: 100_000 }),
  ]);
  if (blind.status === "rejected") throw blind.reason instanceof AiError ? blind.reason : new AiError("Verification failed", "upstream");
  if (audit.status === "rejected") throw audit.reason instanceof AiError ? audit.reason : new AiError("Verification failed", "upstream");
  usage = addUsage(addUsage(usage, blind.value.usage), audit.value.usage);

  const b = blind.value.data;
  const a = audit.value.data;
  const reasons: string[] = [];
  if (b.answer !== q.correct) reasons.push(`Blind solver chose ${b.answer}, key is ${q.correct}`);
  const alternatives = b.defensible_alternatives.filter((l) => l !== q.correct);
  if (alternatives.length) reasons.push(`Defensible alternatives: ${alternatives.join(", ")}`);
  if (!a.key_correct) reasons.push("Auditor disputes the key");
  reasons.push(...a.factual_errors.map((e) => `Factual: ${e}`));
  if (a.verdict !== "pass") reasons.push(...(a.item_flaws.length ? a.item_flaws.map((f) => `Flaw: ${f}`) : ["Auditor rejected the item"]));

  const verdict = { blind: b, audit: a, reasons };
  return reasons.length ? { status: "rejected", question: q, verdict, usage } : { status: "accepted", question: q, verdict, usage };
}
