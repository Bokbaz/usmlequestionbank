import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { Breadcrumbs, Container, ContentPage } from "@/components/marketing/content";
import { QuestionRows } from "@/components/practice/question-list";
import { Button } from "@/components/ui/button";
import { NuggetGlyph } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { getChapter, getLibraryCatalog, type Chapter } from "@/lib/public/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { EDITORIAL_TEAM, ORG_ID, absoluteUrl, breadcrumbs, webPage } from "@/lib/seo/schema";

export const revalidate = 3600;

// Free chapters are prerendered and indexable. Locked chapters render on demand as a title,
// summary and links, marked noindex: hundreds of near-empty pages would only dilute the site.
export async function generateStaticParams() {
  const catalog = await getLibraryCatalog();
  return catalog.filter((c) => c.free).map((c) => ({ slug: c.slug }));
}

function describe(c: Chapter) {
  const base = c.summary ?? `High-yield USMLE review of ${c.title.toLowerCase()}.`;
  const lead = `${c.title}: `;
  const room = 156 - lead.length;
  return lead + (base.length > room ? `${base.slice(0, room - 1).replace(/\s+\S*$/, "")}…` : base);
}

export async function generateMetadata({ params }: PageProps<"/library/[slug]">): Promise<Metadata> {
  const c = await getChapter((await params).slug);
  if (!c) return {};
  return pageMetadata({
    title: `${c.title}: USMLE High-Yield Review`,
    description: describe(c),
    path: `/library/${c.slug}`,
    type: "article",
    modifiedTime: c.updatedAt,
    noindex: !c.free,
    ownImage: true,
  });
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function ChapterPage({ params }: PageProps<"/library/[slug]">) {
  const c = await getChapter((await params).slug);
  if (!c) notFound();
  const path = `/library/${c.slug}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Library", path: "/library" },
    { name: c.title, path },
  ];
  const exams = c.exams.map((e) => (e === "step1" ? "Step 1" : "Step 2 CK")).join(" and ");

  return (
    <ContentPage>
      <Container className="pb-24 pt-8 md:pt-12">
        <Breadcrumbs items={crumbs} />
        <div className="mt-10 grid gap-12 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-16">
          <article className="min-w-0">
            <p className="eyebrow flex flex-wrap items-center gap-x-2 gap-y-1 text-brand-strong">
              <Link href={`/library#${c.system.slug}`} className="hover:underline hover:underline-offset-4">
                {c.system.short}
              </Link>
              <span aria-hidden className="text-faint">·</span>
              <span>{c.minutes} min read</span>
              {exams && (
                <>
                  <span aria-hidden className="text-faint">·</span>
                  <span>{exams}</span>
                </>
              )}
              {c.nugget && (
                <span className="ml-1 inline-flex items-center gap-1 text-gold-ink">
                  <NuggetGlyph className="size-3" /> Nuggets
                </span>
              )}
            </p>
            <h1 className="display mt-5 max-w-[20ch] text-[clamp(36px,4.6vw,64px)] font-bold">{c.title}</h1>
            {c.summary && <p className="mt-6 max-w-[64ch] font-serif text-[20px] leading-[1.55] text-text">{c.summary}</p>}

            {c.body ? (
              <Markdown serif className="mt-8">
                {c.body}
              </Markdown>
            ) : (
              <div className="mt-10 max-w-[68ch] rounded-[8px] bg-ink p-7 text-on-ink">
                <p className="flex items-center gap-2 text-[17px] font-bold">
                  <Lock className="size-4" aria-hidden /> This chapter is part of Full access
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-on-ink-muted">
                  Full access, a single $48 payment, unlocks every Library chapter and the {c.questions} questions linked to this one, for Step 1 and Step
                  2 CK.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild variant="ink" size="lg">
                    <Link href="/pricing">See Full access</Link>
                  </Button>
                  <Button asChild variant="ink-outline" size="lg">
                    <Link href="/library">Free chapters</Link>
                  </Button>
                </div>
              </div>
            )}

            <p className="mt-10 max-w-[68ch] border-t border-border pt-5 text-[13.5px] leading-relaxed text-muted">
              <span className="font-semibold text-text">Argonaut editorial team.</span> Built from the educational objectives of {c.questions}{" "}
              {c.questions === 1 ? "question" : "questions"} on this topic, each reviewed and approved by a clinician. Updated{" "}
              <time dateTime={c.updatedAt}>{fmtDate(c.updatedAt)}</time>.{" "}
              <Link href="/editorial-policy" className="font-semibold text-text underline underline-offset-2">
                Editorial policy
              </Link>
            </p>

            {c.practice.length > 0 && (
              <section className="mt-12">
                <h2 className="text-[22px] font-bold">Practice this topic, free</h2>
                <p className="mt-1 text-[15px] text-muted">Questions on {c.title.toLowerCase()} with full explanations, no account needed.</p>
                <QuestionRows questions={c.practice} showExam className="mt-4" />
              </section>
            )}
          </article>

          <aside className="grid content-start gap-6 xl:sticky xl:top-24">
            <div className="rounded-[8px] border border-border bg-surface p-5">
              <p className="text-[15px] font-bold">Test yourself</p>
              <p className="mt-1 text-[14px] leading-snug text-muted">
                {c.questions} {c.questions === 1 ? "question tests" : "questions test"} this chapter. With an account, one click turns them into a practice block.
              </p>
              <Button asChild size="lg" className="group mt-4 w-full">
                <Link href="/signup">
                  Start free <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>

            {c.nuggets.length > 0 && (
              <div className="rounded-[8px] bg-gold-soft p-5">
                <p className="eyebrow flex items-center gap-1.5 text-gold-ink">
                  <NuggetGlyph className="size-3.5" /> Nuggets in this chapter
                </p>
                <ul className="mt-3 grid gap-3">
                  {c.nuggets.map((n) => (
                    <li key={n.title} className="text-[14px] font-semibold leading-snug">
                      {n.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {c.related.length > 0 && (
              <nav aria-label={`More ${c.system.short} chapters`} className="rounded-[8px] border border-border bg-surface p-5">
                <p className="text-[15px] font-bold">More in {c.system.short}</p>
                <ul className="mt-2 grid">
                  {c.related.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/library/${r.slug}`} className="flex items-center justify-between gap-2 py-1.5 text-[14px] text-muted hover:text-text">
                        <span className="truncate">{r.title}</span>
                        {r.free ? <span className="shrink-0 text-[11.5px] font-bold text-brand-strong">Free</span> : <Lock className="size-3.5 shrink-0" aria-label="Full access" />}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={`/library#${c.system.slug}`} className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-bold text-text underline decoration-brand-strong decoration-2 underline-offset-4">
                  All {c.system.short} chapters <ArrowRight className="size-3.5" />
                </Link>
              </nav>
            )}
          </aside>
        </div>
      </Container>

      <JsonLd
        graph={[
          breadcrumbs(crumbs),
          webPage({ path, name: `${c.title}: USMLE High-Yield Review`, description: describe(c), crumbs, dateModified: c.updatedAt }),
          ...(c.body
            ? [
                {
                  "@type": "Article",
                  "@id": `${absoluteUrl(path)}#article`,
                  headline: `${c.title}: USMLE high-yield review`,
                  description: describe(c),
                  inLanguage: "en-US",
                  isAccessibleForFree: true,
                  ...(c.createdAt ? { datePublished: c.createdAt } : {}),
                  dateModified: c.updatedAt,
                  author: EDITORIAL_TEAM,
                  publisher: { "@id": ORG_ID },
                  mainEntityOfPage: { "@id": `${absoluteUrl(path)}#webpage` },
                  about: { "@type": "Thing", name: c.title },
                  educationalLevel: exams ? `USMLE ${exams}` : "USMLE",
                  learningResourceType: "Review notes",
                },
              ]
            : []),
        ]}
      />
    </ContentPage>
  );
}
