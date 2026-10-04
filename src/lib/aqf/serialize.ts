// Writes questions back out as Argonaut Question Format, the same text the importer reads.
// Export, edit, re-import: questions update in place by ID.

export type ExportQuestion = {
  code: string;
  exam: "step1" | "step2ck" | "step3";
  status: "draft" | "published" | "retired";
  system: string;
  discipline?: string | null;
  competency?: string | null;
  category?: string | null;
  topic?: string | null;
  difficulty: number;
  tags: string[];
  isFree: boolean;
  isDaily: boolean;
  stem: string;
  leadIn: string;
  media: { type: "image"; url: string; alt?: string }[];
  options: { label: string; body: string; concept?: string | null }[];
  correct: string;
  keyConcept?: string | null;
  explanation?: string | null;
  optionExplanations: Record<string, string>;
  objective?: string | null;
  textbook?: string | null;
  references: string[];
  nuggets: { title: string; body?: string | null }[];
};

const EXAM = { step1: "Step 1", step2ck: "Step 2 CK", step3: "Step 3" } as const;

export function toAqf(q: ExportQuestion): string {
  const out: string[] = ["### QUESTION", `ID: ${q.code}`, `Exam: ${EXAM[q.exam]}`, `System: ${q.system}`];
  if (q.discipline) out.push(`Discipline: ${q.discipline}`);
  if (q.competency) out.push(`Competency: ${q.competency}`);
  if (q.category) out.push(`Category: ${q.category}`);
  if (q.topic) out.push(`Topic: ${q.topic}`);
  out.push(`Difficulty: ${q.difficulty}`);
  if (q.tags.length) out.push(`Tags: ${q.tags.join(", ")}`);
  if (q.isFree) out.push("Free: yes");
  if (q.isDaily) out.push("Daily: yes");
  // Retired questions export as drafts so a round trip never republishes them.
  if (q.status !== "published") out.push("Status: draft");
  for (const m of q.media) out.push(`Image: ${m.url}${m.alt ? ` ${m.alt}` : ""}`);

  out.push("", "Stem:", q.stem.trim(), "", `Lead-in: ${q.leadIn.trim()}`, "");
  for (const o of q.options) out.push(`${o.label}. ${o.body.replace(/\s*\n\s*/g, " ").trim()}`);
  out.push("", `Answer: ${q.correct}`);
  if (q.keyConcept) out.push(`Key concept: ${q.keyConcept}`);
  const concepts = q.options.filter((o) => o.concept);
  if (concepts.length) {
    out.push("", "Concepts:");
    for (const o of concepts) out.push(`${o.label} = ${o.concept}`);
  }
  if (q.explanation) out.push("", "Explanation:", q.explanation.trim());
  const explained = q.options.filter((o) => q.optionExplanations[o.label]);
  if (explained.length) {
    out.push("", "Option explanations:");
    for (const o of explained) out.push(`${o.label}. ${q.optionExplanations[o.label].trim()}`);
  }
  if (q.objective) out.push("", `Objective: ${q.objective.replace(/\s*\n\s*/g, " ").trim()}`);
  if (q.textbook) out.push("", "Textbook:", q.textbook.trim());
  if (q.references.length) {
    out.push("", "References:");
    for (const r of q.references) out.push(`- ${r}`);
  }
  if (q.nuggets.length) {
    out.push("", "Nuggets:");
    for (const n of q.nuggets) out.push(`- ${n.title}${n.body ? ` :: ${n.body.replace(/\s*\n\s*/g, " ").trim()}` : ""}`);
  }
  out.push("### END");
  return out.join("\n");
}
