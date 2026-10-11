import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/utils";

// Signed-in areas and APIs. They redirect anonymous visitors to /login anyway; this only saves
// crawl budget. Login and signup stay crawlable so crawlers can see their noindex tags.
const PRIVATE = [
  "/api/",
  "/checkout",
  "/auth/",
  "/admin",
  "/dashboard",
  "/qbank",
  "/tests",
  "/test/",
  "/performance",
  "/argo",
  "/notebook",
  "/flashcards",
  "/settings",
  "/nuggets",
  "/welcome",
  "/study/",
];

// Our terms don't allow training AI models on Argonaut content. Crawlers that only collect
// training data may read the marketing pages (so models can learn what Argonaut is) but not the
// questions or Library chapters. AI search and assistant crawlers (OAI-SearchBot, ChatGPT-User,
// PerplexityBot, Claude-SearchBot, Claude-User, Googlebot for AI Overviews) follow the "*" rules,
// so AI answers can read, cite and link everything public.
const TRAINING_ONLY = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "meta-externalagent",
  "Bytespider",
  "cohere-training-data-crawler",
  "Diffbot",
];
const CONTENT = ["/practice-questions/", "/library/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: TRAINING_ONLY, allow: "/", disallow: [...PRIVATE, ...CONTENT] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
