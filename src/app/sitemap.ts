import type { MetadataRoute } from "next";
import { LEGAL_UPDATED_ISO } from "@/lib/legal";
import { getLibraryCatalog, getPublicQuestions } from "@/lib/public/content";
import { GUIDES } from "@/lib/public/guides";
import { HUBS } from "@/lib/public/hubs";
import { SITE_URL } from "@/lib/utils";

export const revalidate = 3600;

// When the marketing pages' content last changed. Update it with real content changes only;
// search engines learn to ignore lastmod values that move without a reason.
const PAGES_UPDATED = "2026-10-11";

// Every canonical, indexable public URL, and nothing else: no sign-in pages, no private app
// routes, no locked Library chapters (noindex), no redirects.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => (path === "/" ? SITE_URL : `${SITE_URL}${path}`);
  // No fallbacks: if the database is unreachable, a failed refresh keeps the last good sitemap
  // instead of publishing one with the question and chapter URLs missing.
  const [questions, chapters] = await Promise.all([getPublicQuestions(), getLibraryCatalog()]);
  const latest = (dates: string[]) => dates.reduce((a, b) => (b > a ? b : a), PAGES_UPDATED);

  const pages: MetadataRoute.Sitemap = [
    "/",
    "/usmle-step-1-question-bank",
    "/usmle-step-2-ck-question-bank",
    "/pricing",
    "/features/argo",
    "/about",
    "/editorial-policy",
    "/guides",
  ].map((path) => ({ url: url(path), lastModified: PAGES_UPDATED }));

  const collections: MetadataRoute.Sitemap = [
    { url: url("/free-usmle-practice-questions"), lastModified: latest(questions.map((q) => q.updatedAt.slice(0, 10))) },
    { url: url("/free-usmle-step-1-questions"), lastModified: latest(questions.filter((q) => q.exam === "step1").map((q) => q.updatedAt.slice(0, 10))) },
    { url: url("/free-usmle-step-2-ck-questions"), lastModified: latest(questions.filter((q) => q.exam === "step2ck").map((q) => q.updatedAt.slice(0, 10))) },
    { url: url("/daily"), lastModified: latest(questions.filter((q) => q.daily).map((q) => q.daily!.day)) },
    { url: url("/library"), lastModified: latest(chapters.map((c) => c.updatedAt.slice(0, 10))) },
  ];

  return [
    ...pages,
    ...collections,
    ...HUBS.map((h) => ({ url: url(h.path), lastModified: PAGES_UPDATED })),
    ...GUIDES.map((g) => ({ url: url(g.path), lastModified: g.updated })),
    ...questions.map((q) => ({ url: url(q.path), lastModified: q.updatedAt })),
    ...chapters.filter((c) => c.free).map((c) => ({ url: url(`/library/${c.slug}`), lastModified: c.updatedAt })),
    ...["/terms", "/privacy", "/refunds"].map((path) => ({ url: url(path), lastModified: LEGAL_UPDATED_ISO })),
  ];
}
