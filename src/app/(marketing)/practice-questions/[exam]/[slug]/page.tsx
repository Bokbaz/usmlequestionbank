import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, Zap } from "lucide-react";
import { Breadcrumbs, Container, ContentPage } from "@/components/marketing/content";
import { QuestionView } from "@/components/practice/question-view";
import { questionTitle } from "@/components/practice/question-list";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { EXAMS, examBySlug } from "@/lib/exams";
import { getPublicQuestion, getPublicQuestions } from "@/lib/public/content";
import { questionDescription, questionHeading, quizSchema } from "@/lib/public/question-meta";
import { pageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, breadcrumbs, webPage } from "@/lib/seo/schema";

export const revalidate = 3600;

// One page per public question: free questions and past Daily Challenges. The URL is the
// question code plus its topic; the code alone identifies it, so old slugs redirect.
export async function generateStaticParams() {
  const questions = await getPublicQuestions();
  return questions.map((q) => ({ exam: EXAMS[q.exam].slug, slug: q.slug }));
}

async function load({ params }: PageProps<"/practice-questions/[exam]/[slug]">) {
  const { exam: examSlug, slug } = await params;
  const exam = examBySlug(examSlug);
  const code = slug.match(/^(aq-\d+)/i)?.[1];
  if (!exam || !code) return null;
  const q = await getPublicQuestion(exam.slug, code);
  return q ? { q, slug } : null;
}

export async function generateMetadata(props: PageProps<"/practice-questions/[exam]/[slug]">): Promise<Metadata> {
  const found = await load(props);
  if (!found) return {};
  const { q } = found;
  return pageMetadata({ title: questionHeading(q), description: questionDescription(q), path: q.path, type: "article", modifiedTime: q.updatedAt, ownImage: true });
}

const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function PracticeQuestionPage(props: PageProps<"/practice-questions/[exam]/[slug]">) {
  const found = await load(props);
  if (!found) notFound();
  const { q, slug } = found;
  if (slug !== q.slug) permanentRedirect(q.path);
  const exam = EXAMS[q.exam];
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Free USMLE questions", path: "/free-usmle-practice-questions" },
    { name: `Free ${exam.name} questions`, path: exam.freePath },
    { name: questionTitle(q), path: q.path },
  ];
  const url = absoluteUrl(q.path);
  const description = questionDescription(q);

  return (
    <ContentPage>
      <Container className="pb-24 pt-8 md:pt-12">
        <Breadcrumbs items={crumbs} />
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
          <article className="min-w-0">
            <p className="eyebrow flex flex-wrap items-center gap-x-2 gap-y-1 text-brand-strong">
              <span>{exam.long}</span>
              <span aria-hidden className="text-faint">·</span>
              <span>{q.system.short}</span>
              {q.exam === "step1" && q.discipline && (
                <>
                  <span aria-hidden className="text-faint">·</span>
                  <span>{q.discipline}</span>
                </>
              )}
              <span aria-hidden className="text-faint">·</span>
              <span className="readout normal-case tracking-normal">{q.code}</span>
            </p>
            <h1 className="display mt-5 max-w-[22ch] text-[clamp(32px,4vw,54px)] font-bold">{questionHeading(q)}</h1>
            {q.daily && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-[13px] font-bold text-on-ink">
                <Zap aria-hidden className="size-3.5 text-signal" /> Daily Challenge #{q.daily.number} · {fmtDay(q.daily.day)}
              </p>
            )}
            <div className="mt-8 rounded-[8px] border border-border bg-surface p-5 md:p-8">
              <QuestionView q={q} />
            </div>
          </article>

          <aside className="grid content-start gap-6 lg:sticky lg:top-24">
            <div className="rounded-[8px] bg-ink p-6 text-on-ink">
              <p className="eyebrow text-signal">In the full bank</p>
              <p className="display mt-3 text-[34px] font-bold leading-none">{q.bankCount}</p>
              <p className="mt-2 text-[15px] leading-snug text-on-ink-muted">
                {exam.name} {q.system.short.toLowerCase()} questions like this one, with ARGO choosing what you practice next.
              </p>
              <div className="mt-5 grid gap-2">
                <Button asChild variant="ink" size="lg" className="group w-full">
                  <Link href="/signup">
                    Start free <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild variant="ink-outline" size="lg" className="w-full">
                  <Link href={exam.bankPath}>The {exam.name} question bank</Link>
                </Button>
              </div>
              <p className="readout mt-4 text-[12.5px] text-on-ink-muted">$48 once · Step 1 + Step 2 CK</p>
            </div>

            {q.related.length > 0 && (
              <nav aria-label="More free questions" className="rounded-[8px] border border-border bg-surface p-5">
                <p className="text-[15px] font-bold">Next free questions</p>
                <ul className="mt-3 grid gap-2.5">
                  {q.related.map((r) => (
                    <li key={r.id}>
                      <Link href={r.path} className="group block">
                        <span className="block text-[14.5px] font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{questionTitle(r)}</span>
                        <span className="block text-[13px] text-faint">
                          {r.system.short} · {r.code}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={exam.freePath} className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-bold text-text underline decoration-brand-strong decoration-2 underline-offset-4">
                  All free {exam.name} questions <ArrowRight className="size-3.5" />
                </Link>
              </nav>
            )}

            {q.chapter && (
              <div className="rounded-[8px] border border-border bg-surface p-5">
                <p className="text-[15px] font-bold">Read the chapter</p>
                <Link href={`/library/${q.chapter.slug}`} className="mt-2 block text-[14.5px] font-semibold text-brand-strong underline underline-offset-4">
                  {q.chapter.title}
                </Link>
                <p className="mt-1 text-[13px] text-muted">{q.chapter.free ? "Free in the high-yield Library." : "Library chapter, part of Full access."}</p>
              </div>
            )}
          </aside>
        </div>
      </Container>

      <JsonLd
        graph={[
          breadcrumbs(crumbs),
          webPage({
            path: q.path,
            name: questionHeading(q),
            description,
            type: "ItemPage",
            dateModified: q.updatedAt,
            crumbs,
            extra: { mainEntity: { "@id": `${url}#quiz` } },
          }),
          quizSchema(q, url),
        ]}
      />
    </ContentPage>
  );
}
