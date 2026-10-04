// Builds a Library (textbook) article for a topic from the explanations of the questions
// that test it. Each question carries a "Textbook" segment written for reuse; the article
// stitches the segments together, removing duplicated paragraphs and tables so that a
// topic with many questions still reads as one concise chapter.

export type ArticleSource = {
  questionId: string;
  isFree: boolean;
  objective?: string | null;
  textbook?: string | null;
  keyConcept?: string | null;
};

export type ComposedArticle = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  isFree: boolean;
  readingMinutes: number;
};

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function blocks(markdown: string): string[] {
  return markdown
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
}

const fingerprint = (b: string) => b.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 160);

export function composeArticle(topic: string, sources: ArticleSource[]): ComposedArticle {
  const seen = new Set<string>();
  const sections: string[] = [];
  for (const s of sources) {
    if (!s.textbook) continue;
    const kept = blocks(s.textbook).filter((b) => {
      const f = fingerprint(b);
      if (seen.has(f)) return false;
      seen.add(f);
      return true;
    });
    if (kept.length) sections.push(kept.join("\n\n"));
  }

  const objectives = [...new Set(sources.map((s) => s.objective).filter(Boolean) as string[])];
  let body = sections.join("\n\n");
  if (objectives.length > 1) {
    body += `\n\n## Key takeaways\n\n${objectives.map((o) => `- ${o}`).join("\n")}`;
  }
  if (!body) body = objectives.map((o) => `- ${o}`).join("\n") || "Content coming soon.";

  const words = body.split(/\s+/).length;
  return {
    title: topic,
    slug: slugify(topic),
    summary: objectives[0] ?? sources.find((s) => s.keyConcept)?.keyConcept ?? topic,
    body,
    isFree: sources.some((s) => s.isFree),
    readingMinutes: Math.max(1, Math.round(words / 200)),
  };
}
