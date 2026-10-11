import { Actions, Container, ContentPage, CtaBand, LinkRows, PageHero, Section, SourceNote } from "@/components/marketing/content";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { QuestionsBySystem, questionTitle } from "@/components/practice/question-list";
import { JsonLd } from "@/components/seo/json-ld";
import { EXAMS, type ExamKey } from "@/lib/exams";
import { getBankStats, getPublicQuestions } from "@/lib/public/content";
import { hubsFor } from "@/lib/public/hubs";
import { breadcrumbs, faqPage, itemList, webPage } from "@/lib/seo/schema";

export const FREE_COPY: Record<ExamKey, { title: string; h1: string; description: string; angle: string }> = {
  step1: {
    title: "Free USMLE Step 1 Practice Questions",
    h1: "Free USMLE Step 1 practice questions",
    description:
      "Try original Step 1 questions with full explanations and clinician review, free and with no login. Browse by organ system and see exactly what's free.",
    angle: "Step 1 asks why: the mechanism behind a finding, the cause of a disease, how a drug works. Every question here is a full clinical vignette with one best answer.",
  },
  step2ck: {
    title: "Free USMLE Step 2 CK Practice Questions",
    h1: "Free USMLE Step 2 CK practice questions",
    description:
      "Try original Step 2 CK questions on diagnosis and management, with full explanations and clinician review. Free, no login. Browse by organ system.",
    angle: "Step 2 CK asks what you'd do: the likeliest diagnosis, the next best step, the right drug. These questions are written for those decisions.",
  },
};

export async function FreeCollection({ exam: key }: { exam: ExamKey }) {
  const exam = EXAMS[key];
  const copy = FREE_COPY[key];
  const [stats, all] = await Promise.all([getBankStats(), getPublicQuestions()]);
  const questions = all.filter((q) => q.exam === key);
  const s = stats.exams[key];
  const systems = new Set(questions.map((q) => q.system.slug)).size;
  const dailies = questions.filter((q) => q.daily).length;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Free USMLE questions", path: "/free-usmle-practice-questions" },
    { name: `Free ${exam.name} questions`, path: exam.freePath },
  ];
  const faq: FaqItem[] = [
    {
      q: `How many free ${exam.name} questions are there?`,
      a: `${questions.length}, from ${systems} organ systems${dailies ? `, including ${dailies} past Daily Challenges` : ""}. Each has the full explanation of every answer choice. The full ${exam.name} bank has ${s.total.toLocaleString("en-US")}.`,
    },
    {
      q: "Do I need an account to answer them?",
      a: "No. Choose an answer, check it, and read the explanation on the page. A free account adds stats, the Daily Challenge leaderboard and free Library chapters.",
    },
    {
      q: `Are these real ${exam.name} questions?`,
      a: `No. They're original questions written to the NBME Item-Writing Guide and approved by a clinician. The USMLE program publishes its own [official ${exam.name} sample questions](${exam.official.samples}).`,
    },
    {
      q: "What do I get with Full access?",
      a: `All ${s.total.toLocaleString("en-US")} ${exam.name} questions plus the ${key === "step1" ? "Step 2 CK" : "Step 1"} bank, tutor and timed blocks, the full Library and ARGO, for $48 once. [See the ${exam.name} question bank](${exam.bankPath}).`,
    },
  ];

  return (
    <ContentPage>
      <PageHero
        crumbs={crumbs}
        eyebrow={`${exam.long} · ${questions.length} free questions`}
        title={copy.h1}
        lead={
          <>
            <p>
              {questions.length} {exam.name} questions, free to answer with full explanations and no account: questions from {systems} organ systems
              {dailies ? `, plus every past Daily Challenge` : ""}.
            </p>
            <p className="mt-3">{copy.angle}</p>
          </>
        }
        actions={
          questions[0] ? <Actions primary={{ href: questions[0].path, label: "Start with question 1" }} secondary={{ href: exam.bankPath, label: `The full ${exam.name} bank` }} /> : undefined
        }
        note={`Free questions are part of the ${s.total.toLocaleString("en-US")}-question ${exam.name} bank, in the same format.`}
      />

      <Section eyebrow="By organ system" title={`Free ${exam.name} questions`} intro={<p>Pick a system, or work down the list. Each question opens on its own page.</p>}>
        <QuestionsBySystem questions={questions} />
      </Section>

      <Section tone="surface" eyebrow="Go deeper" title={`Practice ${exam.name} by subject`}>
        <LinkRows
          items={[
            ...hubsFor(key).map((h) => ({ href: h.path, title: h.h1.replace(/^USMLE /, ""), body: `${h.outline.share} of the exam on the official outline` })),
            { href: exam.bankPath, title: `The full ${exam.name} question bank`, body: `${s.total.toLocaleString("en-US")} questions, tutor and timed modes, ARGO` },
            { href: "/library", title: "The high-yield Library", body: `${stats.freeChapters} free chapters to read before or after a block` },
          ]}
        />
      </Section>

      <section className="border-t border-border bg-bg">
        <Container className="grid gap-12 py-20 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="display text-[clamp(32px,3.6vw,52px)] font-bold">Free {exam.name} questions, explained.</h2>
            <SourceNote className="mt-6">
              Looking for the official samples?{" "}
              <a href={exam.official.samples} target="_blank" rel="noreferrer">
                USMLE {exam.name} sample test questions
              </a>
              .
            </SourceNote>
          </div>
          <div className="lg:col-span-8">
            <Faq items={faq} />
          </div>
        </Container>
      </section>

      <CtaBand
        title={`${s.total.toLocaleString("en-US")} more where these came from.`}
        body={`Full access unlocks every ${exam.name} question, plus the ${key === "step1" ? "Step 2 CK" : "Step 1"} bank, for $48 once.`}
        primary={{ href: "/signup", label: "Start free" }}
        secondary={{ href: exam.bankPath, label: `About the ${exam.name} bank` }}
      />

      <JsonLd
        graph={[
          breadcrumbs(crumbs),
          webPage({ path: exam.freePath, name: `${copy.title} | Argonaut USMLE`, description: copy.description, type: "CollectionPage", crumbs }),
          itemList(exam.freePath, copy.h1, questions.map((q) => ({ name: questionTitle(q), path: q.path }))),
          faqPage(exam.freePath, faq),
        ]}
      />
    </ContentPage>
  );
}
