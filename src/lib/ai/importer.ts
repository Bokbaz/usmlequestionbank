import "server-only";
import { structured, type AiUsage } from "./client";
import { IMPORT_STRUCTURER_SYSTEM, classifierSystem } from "./prompts";
import { Classification, StructuredImport } from "./schemas";

// AI helpers for the admin importer. Structuring never changes content; classification
// only assigns taxonomy so the bank can be filtered and tracked by ARGO.

export async function structureQuestion(raw: string): Promise<{ data: StructuredImport; usage: AiUsage }> {
  return structured({
    system: IMPORT_STRUCTURER_SYSTEM,
    user: `<source>\n${raw}\n</source>`,
    schema: StructuredImport,
    effort: "low",
    timeoutMs: 90_000,
  });
}

export type TaxonomyText = {
  systems: { name: string; categories: string[] }[];
  disciplines: string[];
  competencies: { name: string; group: string }[];
};

export function renderTaxonomy(t: TaxonomyText) {
  return [
    "Systems and their outline categories:",
    ...t.systems.map((s) => `- ${s.name}: ${s.categories.length ? s.categories.join("; ") : "(no categories)"}`),
    "",
    "Disciplines:",
    ...t.disciplines.map((d) => `- ${d}`),
    "",
    "Competencies (physician tasks):",
    ...t.competencies.map((c) => `- ${c.name} (${c.group})`),
  ].join("\n");
}

export type ClassifyInput = { index: number; stem: string; leadIn: string; options: string[]; answer?: string | null; explanation?: string | null };

export async function classifyQuestions(taxonomy: string, topics: string[], items: ClassifyInput[]) {
  const body = items
    .map((q) => {
      const answer = q.answer ? `\nAnswer: ${q.answer}` : "";
      const why = q.explanation ? `\nExplanation (excerpt): ${q.explanation.slice(0, 600)}` : "";
      return `<question index="${q.index}">\n${q.stem}\n\n${q.leadIn}\n${q.options.join("\n")}${answer}${why}\n</question>`;
    })
    .join("\n\n");
  const existing = topics.length ? topics.join("; ") : "(none yet)";
  return structured({
    system: classifierSystem(taxonomy),
    user: `Existing topics: ${existing}\n\n${body}`,
    schema: Classification,
    effort: "low",
    timeoutMs: 120_000,
  });
}
