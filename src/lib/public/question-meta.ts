import { EXAMS } from "@/lib/exams";
import type { PublicQuestion, QuestionSummary } from "./content";

// Titles and descriptions for public question pages, shared by the page, its metadata and its
// social card.

export function questionHeading(q: QuestionSummary) {
  return `${q.topic ?? q.system.short}: ${EXAMS[q.exam].name} practice question`;
}

export function questionDescription(q: QuestionSummary) {
  const exam = EXAMS[q.exam];
  const about = (q.topic ?? q.system.short).toLowerCase();
  const base = `Free ${exam.long} practice question on ${about}, with every answer choice explained. `;
  const room = 158 - base.length;
  const teaser = q.teaser.length > room ? `${q.teaser.slice(0, Math.max(0, room - 1)).replace(/\s+\S*$/, "")}…` : q.teaser;
  return `${base}${teaser}`.trim();
}

// Practice-problem markup (schema.org Quiz). Google no longer shows a rich result for it; it
// still tells search engines and AI assistants exactly what the page holds.
export function quizSchema(q: PublicQuestion, url: string) {
  const correct = q.options.find((o) => o.label === q.correctLabel)!;
  return {
    "@type": "Quiz",
    "@id": `${url}#quiz`,
    name: questionHeading(q),
    url,
    inLanguage: "en-US",
    isAccessibleForFree: true,
    educationalLevel: EXAMS[q.exam].long,
    learningResourceType: "Practice question",
    about: [{ "@type": "Thing", name: q.topic ?? q.system.short }, { "@type": "Thing", name: q.system.name }],
    ...(q.keyConcept ? { assesses: q.keyConcept } : {}),
    dateModified: q.updatedAt,
    hasPart: {
      "@type": "Question",
      eduQuestionType: "Multiple choice",
      text: `${q.stem.replace(/\s+/g, " ").trim()} ${q.leadIn}`,
      suggestedAnswer: q.options
        .filter((o) => o.label !== q.correctLabel)
        .map((o) => ({ "@type": "Answer", position: o.label.charCodeAt(0) - 64, text: o.body, ...(q.optionExplanations[o.label] ? { comment: { "@type": "Comment", text: q.optionExplanations[o.label] } } : {}) })),
      acceptedAnswer: {
        "@type": "Answer",
        position: correct.label.charCodeAt(0) - 64,
        text: correct.body,
        answerExplanation: { "@type": "Comment", text: q.explanation },
      },
    },
  };
}
