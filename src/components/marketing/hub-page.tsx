import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Actions, Container, ContentPage, CtaBand, LinkRows, PageHero, Section, SourceNote } from "@/components/marketing/content";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { QuestionRows, questionTitle } from "@/components/practice/question-list";
import { JsonLd } from "@/components/seo/json-ld";
import { EXAMS, OFFICIAL_CHECKED } from "@/lib/exams";
import { getHubData } from "@/lib/public/content";
import { HUBS, hubByKey, type Hub } from "@/lib/public/hubs";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbs, faqPage, itemList, webPage } from "@/lib/seo/schema";

export function hubMetadata(key: string): Metadata {
  const hub = hubByKey(key);
  return pageMetadata({ title: hub.title, description: hub.description, path: hub.path, ownImage: true });
}

function hubFaq(hub: Hub, total: number, free: number): FaqItem[] {
  const exam = EXAMS[hub.exam];
  const subject = hub.subject;
  return [
    {
      q: `How many ${exam.name} ${subject} questions does Argonaut have?`,
      a: `${total} in the bank today, each a full clinical vignette with every answer choice explained. ${free ? `${free} of them are free to try on this page.` : "Free questions from other systems are in the free set."}`,
    },
    {
      q: `How much of ${exam.name} is ${subject} content?`,
      a: `The official ${exam.name} content outline puts ${hub.outline.line} at ${hub.outline.share} of the exam. Shares are ranges because items can count toward more than one area. [Read the outline](${exam.official.outline}).`,
    },
    {
      q: `Are these ${subject} questions free?`,
      a: `The questions listed here are free, with full explanations and no account. The rest of the ${exam.name} bank comes with Full access: $48 once, which also covers ${hub.exam === "step1" ? "Step 2 CK" : "Step 1"}. [See pricing](/pricing).`,
    },
    {
      q: `What's the best way to practice ${subject} questions?`,
      a: `Do a mixed block first to find your weak topics, then drill them, and read every explanation, not only the ones you missed. Our guide on [reviewing USMLE questions](/guides/how-to-review-usmle-questions) shows how. In Full access, ARGO picks those topics for you.`,
    },
  ];
}

export async function HubPage({ hubKey }: { hubKey: string }) {
  const hub = hubByKey(hubKey);
  const exam = EXAMS[hub.exam];
  const data = await getHubData(hub.filter);
  const topics = data.topics.filter((t) => t.name.length <= 60);
  const shown = topics.slice(0, 40);
  const lead = hub.lead.replace("{n}", data.total.toLocaleString("en-US"));
  const faq = hubFaq(hub, data.total, data.questions.length);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: `${exam.long} question bank`, path: exam.bankPath },
    { name: hub.h1.replace(/^USMLE /, ""), path: hub.path },
  ];
  const siblings = HUBS.filter((h) => h.key !== hub.key && h.exam === hub.exam);

  return (
    <ContentPage>
      <PageHero
        crumbs={crumbs}
        eyebrow={`${exam.long} · ${hub.outline.share} of the exam`}
        title={hub.h1}
        lead={
          <p>
            {hub.outline.line} makes up {hub.outline.share} of {exam.name} on the official content outline. {lead}
          </p>
        }
        actions={
          data.questions[0] ? (
            <Actions primary={{ href: data.questions[0].path, label: `Try a free ${hub.subject} question` }} secondary={{ href: exam.bankPath, label: `The ${exam.name} bank` }} />
          ) : (
            <Actions primary={{ href: exam.freePath, label: `Free ${exam.name} questions` }} secondary={{ href: exam.bankPath, label: `The ${exam.name} bank` }} />
          )
        }
      />

      <Section
        eyebrow="Free to try"
        title={`Free ${exam.name} ${hub.subject} questions`}
        intro={<p>Full explanations, no account. Each opens on its own page.</p>}
      >
        {data.questions.length ? (
          <QuestionRows questions={data.questions} />
        ) : (
          <p className="text-[16px] text-muted">
            No free questions in this subject yet.{" "}
            <Link href={exam.freePath} className="font-semibold text-text underline underline-offset-4">
              Try the free {exam.name} set
            </Link>
            .
          </p>
        )}
      </Section>

      <Section tone="surface" eyebrow="What to expect" title={`What ${exam.name} asks in ${hub.subject} questions`} intro={<p>General guidance from the content outline and how questions on this subject are usually built.</p>}>
        <ul className="grid gap-3 text-[16px] leading-relaxed">
          {hub.asks.map((a) => (
            <li key={a} className="flex gap-3">
              <Check aria-hidden className="mt-1 size-4 shrink-0 text-brand-strong" strokeWidth={3} />
              {a}
            </li>
          ))}
        </ul>
        <SourceNote className="mt-6">
          Share from the{" "}
          <a href={exam.official.outline} target="_blank" rel="noreferrer">
            official USMLE {exam.name} content outline
          </a>
          , checked {OFFICIAL_CHECKED}.
        </SourceNote>
      </Section>

      <Section eyebrow="Coverage" title="Topics in the bank" intro={<p>{`${topics.length} topics, with the number of ${exam.name} questions on each. Topics with a chapter link to the Library.`}</p>}>
        <ul className="gap-x-8 text-[15px] sm:columns-2 [&>li]:break-inside-avoid [&>li]:border-b [&>li]:border-border [&>li]:py-2">
          {shown.map((t) => (
            <li key={t.name} className="flex items-baseline justify-between gap-3">
              {t.chapter ? (
                <Link href={`/library/${t.chapter.slug}`} className="font-semibold text-text hover:underline hover:underline-offset-4">
                  {t.name}
                  {t.chapter.free && <span className="ml-1.5 text-[11.5px] font-bold uppercase tracking-wide text-brand-strong">Free</span>}
                </Link>
              ) : (
                <span className="font-semibold">{t.name}</span>
              )}
              <span className="readout shrink-0 text-[13px] text-faint">{t.n}</span>
            </li>
          ))}
        </ul>
        {topics.length > shown.length && <p className="mt-4 text-[14.5px] text-muted">And {topics.length - shown.length} more topics with fewer questions.</p>}
      </Section>

      {(data.chapters.length > 0 || siblings.length > 0) && (
        <Section tone="surface" eyebrow="Keep going" title="Read, then practice">
          <LinkRows
            items={[
              ...data.chapters.slice(0, 6).map((c) => ({ href: `/library/${c.slug}`, title: c.title, body: c.summary ?? undefined, meta: "Free chapter" })),
              ...siblings.map((h) => ({ href: h.path, title: h.h1.replace(/^USMLE /, ""), body: `${h.outline.share} of ${exam.name}` })),
            ]}
          />
        </Section>
      )}

      <section className="border-t border-border bg-bg">
        <Container className="grid gap-12 py-20 lg:grid-cols-12">
          <h2 className="display text-[clamp(32px,3.6vw,52px)] font-bold lg:col-span-4">{hub.label} questions, answered.</h2>
          <div className="lg:col-span-8">
            <Faq items={faq} />
          </div>
        </Container>
      </section>

      <CtaBand
        title={`All ${data.total} ${hub.subject} questions, for $48.`}
        body={`Full access unlocks the whole ${exam.name} bank and the ${hub.exam === "step1" ? "Step 2 CK" : "Step 1"} bank, with ARGO drilling your weakest topics.`}
        primary={{ href: "/signup", label: "Start free" }}
        secondary={{ href: "/pricing", label: "See pricing" }}
      />

      <JsonLd
        graph={[
          breadcrumbs(crumbs),
          webPage({ path: hub.path, name: `${hub.title} | Argonaut USMLE`, description: hub.description, type: "CollectionPage", crumbs }),
          ...(data.questions.length ? [itemList(hub.path, `Free ${hub.h1.replace(/^USMLE /, "")}`, data.questions.map((q) => ({ name: questionTitle(q), path: q.path })))] : []),
          faqPage(hub.path, faq),
        ]}
      />
    </ContentPage>
  );
}
