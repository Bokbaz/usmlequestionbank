import * as z from "zod";
import { COMPETENCIES, DISCIPLINES, SYSTEMS } from "@/lib/taxonomy";

// Schemas for Claude's structured outputs. Objects are closed and constraint-free
// (structured outputs ignore min/max); counts and label rules are checked in code.

const LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;
const Label = z.enum(LABELS);

const SystemName = z.enum(SYSTEMS.map((s) => s.name) as [string, ...string[]]);
const DisciplineName = z.enum(DISCIPLINES.map((d) => d.name) as [string, ...string[]]);
const CompetencyName = z.enum(COMPETENCIES.map((c) => c.name) as [string, ...string[]]);

const Option = z.object({
  label: Label,
  text: z.string().describe("The answer choice exactly as the examinee sees it"),
  concept: z.string().describe("What this choice represents in 2 to 6 words (disease, drug, mechanism or finding)"),
});

const OptionExplanation = z.object({
  label: Label,
  text: z.string().describe("Why this choice is right, or why it is wrong and what finding would have made it right"),
});

// A complete single-best-answer item, as written by ARGO.
export const WrittenQuestion = z.object({
  stem: z.string().describe("Clinical vignette in paragraphs separated by blank lines; vitals and labs on their own lines"),
  lead_in: z.string().describe("One complete question ending with a question mark"),
  options: z.array(Option).describe("Exactly five choices labeled A to E"),
  correct: Label,
  key_concept: z.string().describe("The single fact this item tests, in under 12 words"),
  explanation: z.string().describe("Markdown. Why the answer is correct: the discriminating clues in the stem and the mechanism"),
  option_explanations: z.array(OptionExplanation).describe("One entry per choice, including the correct one"),
  objective: z.string().describe("Educational objective: one or two sentences a student should remember"),
  textbook: z.string().describe("Markdown study note of 120 to 250 words, reusable as a textbook section; may include one small table"),
  difficulty: z.number().int().describe("1 (easy) to 5 (hardest 10% of exam items)"),
  discipline: DisciplineName.describe("Main discipline the correct answer depends on"),
  competency: CompetencyName.describe("Physician task the lead-in asks for"),
});
export type WrittenQuestion = z.infer<typeof WrittenQuestion>;

// Blind solve by an independent examiner who never sees the key.
export const BlindSolve = z.object({
  answer: Label,
  confidence: z.enum(["low", "medium", "high"]),
  reasoning: z.string().describe("Two to four sentences: the clues used and why the runner-up is wrong"),
  defensible_alternatives: z.array(Label).describe("Other choices a well-prepared examinee could defend as best; empty if none"),
});
export type BlindSolve = z.infer<typeof BlindSolve>;

// Audit with the key and explanations visible.
export const ItemAudit = z.object({
  key_correct: z.boolean().describe("True only if the keyed answer is the single best answer under current US practice"),
  factual_errors: z.array(z.string()).describe("Each incorrect or outdated statement anywhere in the item or explanations; empty if none"),
  item_flaws: z.array(z.string()).describe("Cueing, implausible distractors, non-homogeneous choices, ambiguous lead-in, missing data; empty if none"),
  verdict: z.enum(["pass", "reject"]),
});
export type ItemAudit = z.infer<typeof ItemAudit>;

// Loosely formatted text from another source, restructured without changing content.
export const StructuredImport = z.object({
  stem: z.string(),
  lead_in: z.string(),
  options: z.array(z.object({ label: Label, text: z.string() })),
  correct: Label.nullable().describe("Null if the source does not state the answer"),
  explanation: z.string().nullable(),
  option_explanations: z.array(OptionExplanation),
  objective: z.string().nullable(),
  references: z.array(z.string()),
  missing: z.array(z.string()).describe("Fields the source text does not contain"),
});
export type StructuredImport = z.infer<typeof StructuredImport>;

// Taxonomy placement for one question; categories and topics come from the prompt lists.
export const Classification = z.object({
  items: z.array(
    z.object({
      index: z.number().int(),
      system: SystemName,
      discipline: DisciplineName,
      competency: CompetencyName,
      category: z.string().nullable().describe("An outline category name from the list for the chosen system, or null"),
      topic: z.string().describe("Library topic: reuse an existing topic name when one fits, else a short new one"),
      key_concept: z.string().describe("The single fact the item tests, in under 12 words"),
      difficulty: z.number().int().describe("1 to 5"),
    }),
  ),
});
export type Classification = z.infer<typeof Classification>;
