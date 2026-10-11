import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Actions, Container, ContentPage, CtaBand, FactSheet, LinkRows, PageHero, Section, SourceNote } from "@/components/marketing/content";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { QuestionView } from "@/components/practice/question-view";
import { JsonLd } from "@/components/seo/json-ld";
import { DEFAULT_BLOCK, EXAMS, OFFICIAL_CHECKED, TIMED_SECONDS_PER_QUESTION, USMLE_SOURCES, type ExamKey } from "@/lib/exams";
import { REFUND_DAYS, REFUND_MAX_ANSWERED } from "@/lib/legal";
import { getBankStats, getPublicQuestion, getPublicQuestions } from "@/lib/public/content";
import { hubsFor } from "@/lib/public/hubs";
import { PRODUCT_ID, breadcrumbs, faqPage, fullAccessProduct, webPage } from "@/lib/seo/schema";

// Copy that differs by exam. The two pages share a layout, not their words.
export const EXAM_COPY: Record<
  ExamKey,
  {
    title: string;
    description: string;
    h1: string;
    focusTitle: string;
    focus: string[];
    whoFor: string[];
    exampleSystem: string;
    faq: (n: { total: number; systems: number; topics: number; free: number; asOf: string }) => FaqItem[];
  }
> = {
  step1: {
    title: "USMLE Step 1 Question Bank",
    description:
      "Practice USMLE Step 1 with exam-style questions, every answer choice explained and clinician review. Try free Step 1 questions, then $48 once for both exams.",
    h1: "USMLE Step 1 question bank",
    focusTitle: "Built for what Step 1 tests",
    focus: [
      "Step 1 is pass/fail, but it still checks that you can apply basic science to a patient. Most questions ask why: the mechanism behind a finding, the cause of a disease, or how a drug works and what it does wrong.",
      "Pathology (45–55% of items) and physiology (30–40%) dominate the official content outline, and two thirds of questions test applied foundational science. Argonaut's Step 1 questions are written to that balance, as full clinical vignettes with one best answer.",
    ],
    whoFor: [
      "Students in their dedicated period who want exam-style reps on every system.",
      "Students who have finished a bigger bank and want fresh questions written to the same item-writing rules.",
      "International medical graduates who need a complete Step 1 bank without paying hundreds of dollars.",
    ],
    exampleSystem: "cardiovascular",
    faq: (n) => [
      {
        q: "How many questions are in Argonaut's Step 1 question bank?",
        a: `${n.total.toLocaleString("en-US")} as of ${n.asOf}, across ${n.systems} organ systems and ${n.topics} topics. We count only published bank questions; practice questions ARGO writes for one student aren't included.`,
      },
      {
        q: "Does Argonaut match the new 2026 Step 1 format?",
        a: `Yes. Since 14 May 2026, Step 1 has 14 blocks of 20 questions, 30 minutes each. Argonaut's timed mode gives ${TIMED_SECONDS_PER_QUESTION} seconds per question and starts at ${DEFAULT_BLOCK}-question blocks, so a block takes the same 30 minutes. You can also build longer custom blocks of up to 40 questions. [See the 2026 exam format](/guides/usmle-exam-interface).`,
      },
      {
        q: "Step 1 is pass/fail. Do I still need a question bank?",
        a: "You still have to clear the pass mark, and questions are how most students learn to apply basic science under time pressure. A bank also shows you which systems are weak before test day, and ARGO does that ranking for you.",
      },
      {
        q: "Can I try the Step 1 bank before paying?",
        a: `Yes. ${n.free} Step 1 questions are free to answer without an account, with full explanations: [free Step 1 questions](/free-usmle-step-1-questions). A free account adds the Daily Challenge leaderboard, free Library chapters and basic stats.`,
      },
      {
        q: "Does one purchase cover Step 2 CK too?",
        a: "Yes. $48 once unlocks the Step 1 and Step 2 CK banks, the full Library and ARGO, with no expiry date. [See pricing](/pricing).",
      },
      {
        q: "Who writes the questions?",
        a: "Each question is written to the NBME Item-Writing Guide and reviewed and approved by a clinician before it goes live. [Read our editorial policy](/editorial-policy).",
      },
      {
        q: "Can I use Argonaut alongside UWorld or AMBOSS?",
        a: "Yes. Plenty of students add a second bank for fresh questions once they've worked through their first, and Argonaut is priced so that's affordable. [How Argonaut compares with UWorld](/compare/uworld).",
      },
    ],
  },
  step2ck: {
    title: "USMLE Step 2 CK Question Bank",
    description:
      "Build Step 2 CK clinical reasoning with explained practice questions and clinician review. Try free Step 2 CK questions, then $48 once for both exams.",
    h1: "USMLE Step 2 CK question bank",
    focusTitle: "Built for clinical decisions",
    focus: [
      "Step 2 CK is scored, and it tests what you would do for the patient in front of you: the most likely diagnosis, the best next step, the test to order, the drug to start and what to screen for.",
      "Medicine is the largest clinical science on the official outline (55–65% of items), followed by pediatrics (17–27%), obstetrics and gynecology (10–20%), psychiatry (10–15%) and surgery (5–15%). Argonaut's Step 2 CK questions are written for those decisions, not adapted from Step 1.",
    ],
    whoFor: [
      "Third- and fourth-year students preparing for Step 2 CK alongside or after their clerkships.",
      "Students who want more clinical-decision practice on top of their main bank.",
      "International medical graduates preparing for Step 2 CK on a budget.",
    ],
    exampleSystem: "cardiovascular",
    faq: (n) => [
      {
        q: "How many questions are in Argonaut's Step 2 CK question bank?",
        a: `${n.total.toLocaleString("en-US")} as of ${n.asOf}, across ${n.systems} organ systems and ${n.topics} topics. We count only published bank questions; practice questions ARGO writes for one student aren't included.`,
      },
      {
        q: "Does Argonaut match the new 2026 Step 2 CK format?",
        a: `Since 7 May 2026, Step 2 CK has 16 blocks of 18 to 20 questions, 30 minutes each. Argonaut's timed mode gives ${TIMED_SECONDS_PER_QUESTION} seconds per question and starts at ${DEFAULT_BLOCK}-question blocks, so a block takes the same 30 minutes. [See the 2026 exam format](/guides/usmle-exam-interface).`,
      },
      {
        q: "How is Step 2 CK practice different from Step 1?",
        a: "Step 2 CK questions put you in charge of the patient: what to do next, which test to order, which treatment to start and when to refer. Our Step 2 CK questions are written for those decisions, with every answer choice explained.",
      },
      {
        q: "Can I try the Step 2 CK bank before paying?",
        a: `Yes. ${n.free} Step 2 CK questions are free to answer without an account, with full explanations: [free Step 2 CK questions](/free-usmle-step-2-ck-questions).`,
      },
      {
        q: "Does one purchase cover Step 1 too?",
        a: "Yes. $48 once unlocks the Step 1 and Step 2 CK banks, the full Library and ARGO, with no expiry date. [See pricing](/pricing).",
      },
      {
        q: "Who writes the questions?",
        a: "Each question is written to the NBME Item-Writing Guide and reviewed and approved by a clinician before it goes live. [Read our editorial policy](/editorial-policy).",
      },
      {
        q: "How does ARGO help with Step 2 CK?",
        a: "It tracks your accuracy, timing and confidence by system and topic, then builds each session around the topics costing you the most points, with spaced retests of questions you missed. [How ARGO works](/features/argo).",
      },
    ],
  },
};

const today = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export async function ExamPage({ exam: key }: { exam: ExamKey }) {
  const exam = EXAMS[key];
  const copy = EXAM_COPY[key];
  const [stats, publicQs] = await Promise.all([getBankStats(), getPublicQuestions()]);
  const s = stats.exams[key];
  const other = EXAMS[key === "step1" ? "step2ck" : "step1"];
  const free = publicQs.filter((q) => q.exam === key);
  const pick = free.find((q) => q.free && q.system.slug === copy.exampleSystem) ?? free.find((q) => q.free) ?? free[0];
  const example = pick ? await getPublicQuestion(exam.slug, pick.code) : null;
  const hubs = hubsFor(key);
  const max = Math.max(...s.systems.map((x) => x.n));
  const faq = copy.faq({ total: s.total, systems: s.systems.length, topics: s.topics, free: s.free, asOf: today() });
  const crumbs = [
    { name: "Home", path: "/" },
    { name: copy.h1, path: exam.bankPath },
  ];

  return (
    <ContentPage>
      <PageHero
        crumbs={crumbs}
        eyebrow={`${exam.long} · ${s.total.toLocaleString("en-US")} questions`}
        title={copy.h1}
        lead={
          <p>
            Argonaut&apos;s {exam.name} bank has {s.total.toLocaleString("en-US")} exam-style questions across {s.systems.length} organ systems, with every
            answer choice explained and every question approved by a clinician. Practice in tutor or timed mode, in 20-question blocks that match the
            2026 exam. Full access is $48 once and covers {other.name} too.
          </p>
        }
        actions={<Actions primary={{ href: exam.freePath, label: `Try ${s.free} free questions` }} secondary={{ href: "/signup", label: "Start free" }} />}
        note="No account needed for the free questions."
      />

      <Section eyebrow="At a glance" title={`The ${exam.name} bank in numbers`} intro={<p>Counts come straight from the live bank and update as questions are added.</p>}>
        <div className="grid gap-10 md:grid-cols-2">
          <FactSheet
            rows={[
              ["Questions", s.total.toLocaleString("en-US")],
              ["Organ systems", s.systems.length],
              ["Topics", s.topics],
              ["Format", "Single best answer"],
              ["Explanations", "Every answer choice"],
              ["Review", "Clinician-approved"],
            ]}
          />
          <FactSheet
            rows={[
              ["Modes", "Tutor and timed"],
              ["Timed pace", `${TIMED_SECONDS_PER_QUESTION} s per question`],
              ["Default block", `${DEFAULT_BLOCK} questions · 30 min`],
              ["Free to try", `${s.free} questions, no account`],
              ["Price", "$48 once, both exams"],
              ["Expires", "Never"],
            ]}
          />
        </div>
        <div className="mt-12">
          <h3 className="text-[17px] font-bold">Who it&apos;s for</h3>
          <ul className="mt-4 grid gap-3">
            {copy.whoFor.map((w) => (
              <li key={w} className="flex gap-3 text-[16px] leading-relaxed">
                <Check aria-hidden className="mt-1 size-4 shrink-0 text-brand-strong" strokeWidth={3} />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="surface" eyebrow="Coverage" title={copy.focusTitle} intro={copy.focus.map((p) => <p key={p} className="mt-3 first:mt-0">{p}</p>)}>
        <table className="w-full border-collapse text-left text-[15px]">
          <caption className="sr-only">{exam.name} questions by organ system</caption>
          <thead>
            <tr className="border-b-2 border-text text-[12.5px] uppercase tracking-[0.08em] text-muted">
              <th scope="col" className="py-2.5 pr-4 font-semibold">System</th>
              <th scope="col" className="w-[44%] py-2.5 pr-4 font-semibold"><span className="sr-only">Share</span></th>
              <th scope="col" className="py-2.5 text-right font-semibold">Questions</th>
            </tr>
          </thead>
          <tbody>
            {s.systems.map((sys) => {
              const hub = hubs.find((h) => h.filter.systems?.length === 1 && h.filter.systems[0] === sys.slug);
              return (
                <tr key={sys.slug} className="border-b border-border">
                  <th scope="row" className="py-2.5 pr-4 font-semibold">
                    {hub ? (
                      <Link href={hub.path} className="underline decoration-brand-strong decoration-2 underline-offset-4 hover:decoration-text">
                        {sys.short}
                      </Link>
                    ) : (
                      sys.short
                    )}
                  </th>
                  <td className="py-2.5 pr-4" aria-hidden>
                    <span className="block h-2 rounded-full bg-brand/80" style={{ width: `${Math.max(4, (100 * sys.n) / max)}%` }} />
                  </td>
                  <td className="readout py-2.5 text-right">{sys.n}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {key === "step1" && (
          <p className="mt-6 text-[15px] leading-relaxed text-muted">
            By discipline: {s.disciplines.slice(0, 8).map((d) => `${d.name} ${d.n}`).join(" · ")}. Questions can count toward more than one discipline on the
            real exam; here each has one primary discipline.
          </p>
        )}
        <SourceNote className="mt-6">
          Content shares from the{" "}
          <a href={exam.official.outline} target="_blank" rel="noreferrer">
            official USMLE {exam.name} content outline
          </a>
          , checked {OFFICIAL_CHECKED}.
        </SourceNote>
      </Section>

      {example && (
        <Section
          eyebrow="Try one now"
          title={`A real ${exam.name} question, explained`}
          intro={
            <>
              <p>
                This is one of the {s.free} free {exam.name} questions, exactly as it appears in the bank: {example.system.short.toLowerCase()}
                {example.topic ? `, ${example.topic.toLowerCase()}` : ""}.
              </p>
              <p className="mt-3">
                <Link href={example.path} className="font-semibold text-text underline decoration-brand-strong decoration-2 underline-offset-4">
                  Open it on its own page
                </Link>
              </p>
            </>
          }
        >
          <div className="rounded-[8px] border border-border bg-surface p-5 md:p-8">
            <QuestionView q={example} headingLevel={3} />
          </div>
        </Section>
      )}

      <Section tone="ink" eyebrow="How practice works" title="Test-day conditions, or learn as you go">
        <div className="grid gap-10 md:grid-cols-2">
          {[
            ["Tutor mode", "See the answer and the full explanation after each question. Best for learning a system for the first time."],
            ["Timed mode", `${TIMED_SECONDS_PER_QUESTION} seconds per question, explanations after the block. Default blocks are ${DEFAULT_BLOCK} questions in 30 minutes, like the real exam.`],
            ["Real exam tools", "Highlighter, strike-out, lab values, calculator, notes and marking, on a screen laid out like test day."],
            ["Your own blocks", "Filter by exam, system, discipline and topic, or by unused, incorrect and marked questions. Up to 40 per block."],
          ].map(([t, d]) => (
            <div key={t} className="border-t border-on-ink/20 pt-4">
              <h3 className="text-[19px] font-bold">{t}</h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-on-ink-muted">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow={`The ${exam.name} format`}
        title={`What the 2026 ${exam.name} looks like`}
        intro={
          <p>
            Since {exam.official.since}, {exam.name} uses new test software with shorter blocks. Content and scoring did not change.
          </p>
        }
      >
        <div className="grid gap-10 md:grid-cols-2">
          <FactSheet
            rows={[
              ["Questions", exam.official.items],
              ["Blocks", exam.official.blocks],
              ["Questions per block", exam.official.itemsPerBlock],
              ["Minutes per block", exam.official.minutesPerBlock],
              ["Exam day", `${exam.official.dayHours} hours`],
              ["Before", exam.official.previous],
            ]}
          />
          <div className="text-[16px] leading-relaxed text-muted">
            <p>
              <span className="font-semibold text-text">How Argonaut matches it:</span> timed mode runs at {TIMED_SECONDS_PER_QUESTION} seconds a question and
              defaults to {DEFAULT_BLOCK}-question blocks, so one Argonaut block is one exam block. Within a block you can move between questions and
              change answers; explanations appear when the block ends.
            </p>
            <Link href="/guides/usmle-exam-interface" className="mt-5 inline-flex items-center gap-2 font-bold text-text underline decoration-brand-strong decoration-2 underline-offset-[6px]">
              Read the full 2026 format guide <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
        <SourceNote className="mt-8">
          Source:{" "}
          <a href={USMLE_SOURCES.format} target="_blank" rel="noreferrer">
            USMLE test delivery software update
          </a>
          , checked {OFFICIAL_CHECKED}.
        </SourceNote>
      </Section>

      <Section tone="surface" eyebrow="ARGO" title="Practice that follows your weak spots" intro={<p>Optional, included in Full access, and easy to ignore if you prefer to build your own blocks.</p>}>
        <ol className="grid gap-0">
          {[
            ["Measure", "ARGO logs 16 data points on every answer: right or wrong, time, confidence, changed answers, the distractor that pulled you in, and how long since you last saw the topic."],
            ["Rank", `It works out which ${exam.name} topics cost you the most points, separating gaps from misconceptions, second-guessing and forgetting.`],
            ["Fix", "Each ARGO session mixes new questions on your weakest topics, drills on concepts you confuse, and spaced retests of questions you missed."],
          ].map(([t, d], i) => (
            <li key={t} className="grid grid-cols-[48px_1fr] gap-2 border-t border-border py-5 first:border-t-2 first:border-text">
              <span className="readout pt-1 text-[14px] text-brand-strong">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-[19px] font-bold">{t}</h3>
                <p className="mt-1.5 text-[15.5px] leading-relaxed text-muted">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href="/features/argo" className="mt-6 inline-flex items-center gap-2 font-bold text-text underline decoration-brand-strong decoration-2 underline-offset-[6px]">
          How ARGO chooses your next questions <ArrowRight className="size-4" />
        </Link>
      </Section>

      <Section
        eyebrow="Quality"
        title="Who writes the questions"
        intro={
          <p>
            Each question is written to the NBME Item-Writing Guide. A clinician reviews the facts, the keyed
            answer and every explanation, and approves it before it goes live.
          </p>
        }
      >
        <ul className="grid gap-3 text-[16px] leading-relaxed">
          {[
            "One best answer, a full clinical vignette, and no negatively worded or trick lead-ins.",
            "Answer choices of the same kind and length, so test-taking tricks don't work.",
            "Duplicates of an existing question are caught before import.",
            "Students can flag any question from the explanation, and every report is read.",
          ].map((x) => (
            <li key={x} className="flex gap-3">
              <Check aria-hidden className="mt-1 size-4 shrink-0 text-brand-strong" strokeWidth={3} />
              {x}
            </li>
          ))}
        </ul>
        <Link href="/editorial-policy" className="mt-6 inline-flex items-center gap-2 font-bold text-text underline decoration-brand-strong decoration-2 underline-offset-[6px]">
          Read the editorial policy <ArrowRight className="size-4" />
        </Link>
      </Section>

      <Section tone="panel" eyebrow="Free and paid" title="What's free, and what $48 adds">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="eyebrow text-brand-strong">Free</h3>
            <ul className="mt-4 grid gap-2.5 text-[15.5px]">
              {[`${s.free} ${exam.name} questions with full explanations, no account`, "The Daily Challenge, every day", "Free Library chapters", "Basic stats with a free account"].map((x) => (
                <li key={x} className="flex gap-2.5">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-strong" strokeWidth={3} />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="eyebrow text-brand-strong">Full access, $48 once</h3>
            <ul className="mt-4 grid gap-2.5 text-[15.5px]">
              {[
                `All ${s.total.toLocaleString("en-US")} ${exam.name} questions, plus the ${other.name} bank`,
                "The full high-yield Library",
                "ARGO sessions and full analytics",
                "Nuggets, flashcards and a notebook",
              ].map((x) => (
                <li key={x} className="flex gap-2.5">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-strong" strokeWidth={3} />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-10 max-w-[68ch] text-[15px] leading-relaxed text-muted">
          One payment, no renewal and no expiry date: &quot;lifetime&quot; means for as long as Argonaut runs the service, as our{" "}
          <Link href="/terms" className="font-semibold text-text underline underline-offset-2">
            terms
          </Link>{" "}
          define it. Full refund within {REFUND_DAYS} days if you&apos;ve answered fewer than {REFUND_MAX_ANSWERED} questions (
          <Link href="/refunds" className="font-semibold text-text underline underline-offset-2">
            refund policy
          </Link>
          ). The optional question-writing add-on is $4.99 a month.
        </p>
      </Section>

      <Section eyebrow="By subject" title={`Practice ${exam.name} by subject`} intro={<p>Each subject page lists the topics the bank covers, with free questions to try.</p>}>
        <LinkRows
          items={[
            ...hubs.map((h) => ({ href: h.path, title: h.h1.replace(/^USMLE /, ""), body: `Official outline: ${h.outline.line}, ${h.outline.share} of the exam` })),
            { href: exam.freePath, title: `All free ${exam.name} questions`, body: `${s.free} questions with full explanations, no account needed`, meta: "Free" },
          ]}
        />
      </Section>

      <section className="border-t border-border bg-surface">
        <Container className="grid gap-12 py-20 lg:grid-cols-12">
          <h2 className="display text-[clamp(32px,3.6vw,52px)] font-bold lg:col-span-4">{exam.name} questions, answered.</h2>
          <div className="lg:col-span-8">
            <Faq items={faq} />
          </div>
        </Container>
      </section>

      <CtaBand
        title={`Start your ${exam.name} prep today.`}
        body={`Answer the free ${exam.name} questions now. When you're ready, $48 once unlocks every question for ${exam.name} and ${other.name}.`}
        primary={{ href: exam.freePath, label: `Free ${exam.name} questions` }}
        secondary={{ href: "/pricing", label: "See pricing" }}
      />

      <JsonLd
        graph={[
          breadcrumbs(crumbs),
          webPage({ path: exam.bankPath, name: `${copy.title} | Argonaut USMLE`, description: copy.description, crumbs, extra: { about: { "@id": PRODUCT_ID } } }),
          fullAccessProduct(stats.total),
          faqPage(exam.bankPath, faq),
        ]}
      />
    </ContentPage>
  );
}
