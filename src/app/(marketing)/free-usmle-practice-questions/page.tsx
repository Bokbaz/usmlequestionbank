import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Actions, Container, ContentPage, CtaBand, PageHero, Section, SourceNote } from "@/components/marketing/content";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { QuestionRows, questionTitle } from "@/components/practice/question-list";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { EXAMS, EXAM_KEYS } from "@/lib/exams";
import { getBankStats, getDailyArchive, getPublicQuestions } from "@/lib/public/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbs, faqPage, itemList, webPage } from "@/lib/seo/schema";

export const revalidate = 3600;

const PATH = "/free-usmle-practice-questions";
const TITLE = "Free USMLE Practice Questions with Explanations";
const DESCRIPTION =
  "Free USMLE Step 1 and Step 2 CK practice questions with full explanations and no login. Clinician-reviewed and written to NBME item-writing standards.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH, ownImage: true });

export default async function FreeQuestionsPage() {
  const [stats, questions, archive] = await Promise.all([getBankStats(), getPublicQuestions(), getDailyArchive()]);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Free USMLE questions", path: PATH },
  ];
  const faq: FaqItem[] = [
    {
      q: "Are these USMLE questions really free?",
      a: `Yes. All ${questions.length} are free to answer, with the full explanation of every answer choice, and there's no trial clock. A new one is added every day when the previous Daily Challenge ends.`,
    },
    {
      q: "Do I need an account?",
      a: "No. Pick an answer and check it right on the page. A free account adds your stats, the Daily Challenge leaderboard and free Library chapters inside the app.",
    },
    {
      q: "Are these real USMLE questions?",
      a: "No. They're original practice questions written to the NBME Item-Writing Guide and approved by a clinician. Real exam questions are confidential. For the official samples, use the [free practice materials on usmle.org](https://www.usmle.org/exam-resources).",
    },
    {
      q: "How do the free questions compare with the paid bank?",
      a: `They're the same quality and format: the free set is part of the bank. Full access unlocks all ${stats.total.toLocaleString("en-US")} questions, ARGO and the full Library for $48 once. [See pricing](/pricing).`,
    },
    {
      q: "How should I use free questions?",
      a: "Answer first, then read every explanation, including the ones for the choices you didn't pick. Our guide on [how to review USMLE questions](/guides/how-to-review-usmle-questions) shows a method that works.",
    },
  ];

  return (
    <ContentPage>
      <PageHero
        crumbs={crumbs}
        eyebrow={`${questions.length} free questions · no login`}
        title="Free USMLE practice questions"
        lead={
          <p>
            {questions.length} free questions with full explanations: {stats.exams.step1.free} for Step 1 and {stats.exams.step2ck.free} for Step 2 CK,
            including every past Daily Challenge. Answer them right here. No account, no trial clock.
          </p>
        }
        actions={<Actions primary={{ href: EXAMS.step1.freePath, label: "Free Step 1 questions" }} secondary={{ href: EXAMS.step2ck.freePath, label: "Free Step 2 CK questions" }} />}
      />

      <Section eyebrow="Pick your exam" title="Two free sets, one per exam" intro={<p>Each set has questions from every organ system, written for what that exam tests.</p>}>
        <div className="grid gap-10 md:grid-cols-2">
          {EXAM_KEYS.map((key) => {
            const exam = EXAMS[key];
            const s = stats.exams[key];
            return (
              <div key={key} className="border-t-2 border-text pt-5">
                <h3 className="display text-[32px] font-bold">{exam.name}</h3>
                <p className="readout mt-2 text-[14px] text-brand-strong">
                  {s.free} free · {s.total.toLocaleString("en-US")} in the full bank
                </p>
                <p className="mt-4 text-[16px] leading-relaxed text-muted">
                  {key === "step1"
                    ? "Mechanisms, causes and pharmacology through full clinical vignettes."
                    : "Diagnosis, next steps and management, the decisions Step 2 CK scores."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="group">
                    <Link href={exam.freePath}>
                      Start {exam.name} <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                    <Link href={exam.bankPath}>About the {exam.name} bank</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {archive.length > 0 && (
        <Section
          id="daily-archive"
          tone="surface"
          eyebrow="Daily Challenge archive"
          title="Every past Daily Challenge"
          intro={
            <p>
              One hard Step 1 question a day. Once the day ends, it joins the free archive with its full explanation.{" "}
              <Link href="/daily" className="font-semibold text-text underline decoration-brand-strong decoration-2 underline-offset-4">
                Play today&apos;s
              </Link>
            </p>
          }
        >
          <QuestionRows questions={archive.slice(0, 30)} />
        </Section>
      )}

      <Section eyebrow="Index" title="All free questions" intro={<p>Grouped by exam. Each opens on its own page with the full explanation.</p>} split={false}>
        <div className="grid gap-12 lg:grid-cols-2">
          {EXAM_KEYS.map((key) => (
            <div key={key}>
              <h3 className="text-[19px] font-bold">
                <Link href={EXAMS[key].freePath} className="hover:underline hover:underline-offset-4">
                  {EXAMS[key].long}
                </Link>
              </h3>
              <ul className="mt-4 grid gap-x-6 gap-y-2 border-t-2 border-text pt-4 text-[15px] sm:grid-cols-2">
                {questions
                  .filter((q) => q.exam === key)
                  .map((q) => (
                    <li key={q.id}>
                      <Link href={q.path} className="text-muted hover:text-text hover:underline hover:underline-offset-4">
                        {questionTitle(q)}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <section className="border-t border-border bg-surface">
        <Container className="grid gap-12 py-20 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="display text-[clamp(32px,3.6vw,52px)] font-bold">About the free questions</h2>
            <SourceNote className="mt-6">
              Official sample questions are published by the USMLE program. Argonaut is not affiliated with the FSMB or NBME.
            </SourceNote>
          </div>
          <div className="lg:col-span-8">
            <Faq items={faq} />
          </div>
        </Container>
      </section>

      <CtaBand
        title="Liked those? There are more."
        body={`Full access unlocks all ${stats.total.toLocaleString("en-US")} questions, the Library and ARGO, for $48 once.`}
        primary={{ href: "/signup", label: "Start free" }}
        secondary={{ href: "/pricing", label: "See pricing" }}
      />

      <JsonLd
        graph={[
          breadcrumbs(crumbs),
          webPage({ path: PATH, name: `${TITLE} | Argonaut USMLE`, description: DESCRIPTION, type: "CollectionPage", crumbs }),
          itemList(PATH, "Free USMLE practice questions", questions.map((q) => ({ name: `${questionTitle(q)} (${EXAMS[q.exam].name})`, path: q.path }))),
          faqPage(PATH, faq),
        ]}
      />
    </ContentPage>
  );
}
