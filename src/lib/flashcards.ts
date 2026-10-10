import "server-only";
import * as z from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AiError, aiEnabled, structured } from "@/lib/ai/client";

// A flashcard is built from the question the student just answered. With Claude available it
// turns the question's core concept into a short recall prompt; otherwise the card is the
// question itself without its choices (vignette and lead-in on the front, the answer and the
// educational objective on the back), which always reads as a real question.

export type CardMaterial = {
  stem: string;
  leadIn: string;
  answer: string;
  objective: string | null;
  keyConcept: string | null;
  topic: string | null;
};

export type Card = { front: string; back: string; source: "ai" | "question" };

export async function loadCardMaterial(service: SupabaseClient, questionId: string): Promise<CardMaterial | null> {
  const [{ data: q }, { data: k }] = await Promise.all([
    service.from("questions").select("stem, lead_in, topics(name)").eq("id", questionId).maybeSingle(),
    service.from("question_keys").select("correct_option_id, educational_objective, key_concept").eq("question_id", questionId).maybeSingle(),
  ]);
  if (!q || !k) return null;
  const { data: o } = await service.from("question_options").select("body").eq("id", k.correct_option_id).maybeSingle();
  if (!o) return null;
  const topic = (q.topics as { name: string } | { name: string }[] | null) ?? null;
  return {
    stem: q.stem,
    leadIn: q.lead_in,
    answer: o.body,
    objective: k.educational_objective,
    keyConcept: k.key_concept,
    topic: Array.isArray(topic) ? (topic[0]?.name ?? null) : (topic?.name ?? null),
  };
}

export function questionCard(m: CardMaterial): Card {
  return {
    front: `${m.stem.trim()}\n\n**${m.leadIn.trim()}**`,
    back: [`**${m.answer.trim()}**`, m.objective?.trim()].filter(Boolean).join("\n\n"),
    source: "question",
  };
}

const CARD_SYSTEM = `You turn one USMLE question that a medical student has just answered into a single flashcard for spaced repetition. The student will see the front weeks later with no other context.

Front: one self-contained question that can be answered from memory in a few seconds and tests the question's core concept, not incidental details of the case. When the concept hinges on recognizing a presentation, put the two or three discriminating findings in the question. Never mention "this patient", "the vignette" or "the question above", and never give the answer away on the front.

Back: the answer in a few words in bold, then one or two sentences on why, drawn from the educational objective. Plain Markdown, no headings, no lists. Keep every fact consistent with the material you are given; do not add facts it does not support.`;

const CardSchema = z.object({
  front: z.string().describe("The recall question, one or two sentences"),
  back: z.string().describe("Bold short answer, then one or two sentences of explanation"),
});

export async function buildCard(m: CardMaterial): Promise<Card> {
  if (!aiEnabled()) return questionCard(m);
  try {
    const { data } = await structured({
      system: CARD_SYSTEM,
      user: [
        m.topic && `Topic: ${m.topic}`,
        m.keyConcept && `Key concept: ${m.keyConcept}`,
        `Vignette:\n${m.stem}`,
        `Question: ${m.leadIn}`,
        `Correct answer: ${m.answer}`,
        m.objective && `Educational objective: ${m.objective}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      schema: CardSchema,
      effort: "low",
      maxTokens: 4000,
      timeoutMs: 40_000,
    });
    const front = data.front.trim();
    const back = data.back.trim();
    if (!front || !back) return questionCard(m);
    return { front, back, source: "ai" };
  } catch (e) {
    // A card is never worth failing the save over: fall back to the question itself.
    if (!(e instanceof AiError)) throw e;
    return questionCard(m);
  }
}
