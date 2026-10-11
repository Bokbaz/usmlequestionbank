import Link from "next/link";
import { Prose, Section, SourceNote } from "@/components/marketing/content";
import { GuideShell, guideMetadata } from "@/components/marketing/guide-shell";
import type { FaqItem } from "@/components/marketing/faq";
import { StudyPlanCalculator } from "@/components/marketing/study-plan-calculator";
import { EXAMS, OFFICIAL_CHECKED } from "@/lib/exams";
import { getBankStats } from "@/lib/public/content";

const PATH = "/guides/usmle-step-1-study-plan";
export const metadata = guideMetadata(PATH);
export const revalidate = 3600;

const FAQ: FaqItem[] = [
  {
    q: "How long should I study for Step 1?",
    a: "Most students study alongside their preclinical courses, then take a dedicated period, often 4 to 8 weeks. The right length depends on your baseline: a first self-assessment tells you how far you have to go.",
  },
  {
    q: "How many questions a day should I do for Step 1?",
    a: "Common targets in a dedicated period run from about 40 to 120 new questions a day, in 20-question timed blocks. Review takes as long as answering or longer, so pick a number you can review properly. Rushed review wastes the questions.",
  },
  {
    q: "When should I take a self-assessment?",
    a: "At the start, to get a baseline; every week or two during dedicated, to re-rank your weak areas; and about a week before the exam. The NBME sells official self-assessments, and the USMLE website has free sample questions.",
  },
  {
    q: "Step 1 is pass/fail. How hard should I study?",
    a: "Hard enough to pass with room to spare. The material also underpins Step 2 CK, which is scored, so understanding it now pays off twice.",
  },
  {
    q: "How do I know I'm ready?",
    a: "When your self-assessment results are consistently where you need them, your weak systems keep shrinking, and timed 20-question blocks feel routine. If results stall, change what you're doing before adding more hours.",
  },
];

export default async function Step1PlanGuide() {
  const stats = await getBankStats().catch(() => null);
  const bank = stats?.exams.step1.total ?? 1000;
  return (
    <GuideShell
      path={PATH}
      summary={
        <p>
          <strong className="font-semibold text-text">In short:</strong> study by system during your preclinical courses, then take a dedicated period,
          often 4 to 8 weeks. Start with a baseline self-assessment, do timed 20-question blocks every study day with thorough review, aim your time at your
          weakest systems, re-test every week or two, and taper at the end.
        </p>
      }
      faq={FAQ}
      cta={{
        title: "Put the plan into practice.",
        body: "Start with the free Step 1 questions. Full access adds every question and ARGO, which picks your weakest topics for you.",
        primary: { href: EXAMS.step1.freePath, label: "Free Step 1 questions" },
        secondary: { href: EXAMS.step1.bankPath, label: "Step 1 bank" },
      }}
    >
      <Section eyebrow="Calculator" title="Size your Step 1 plan" intro={<p>Move the sliders. The plan updates as you go.</p>} split={false}>
        <StudyPlanCalculator examName="Step 1" bankSize={bank} defaults={{ weeks: 6, days: 6, perDay: 80 }} />
      </Section>

      <Section tone="surface" eyebrow="The phases" title="Three phases of a dedicated period">
        <ol className="grid gap-0">
          {[
            [
              "Foundation",
              "Take a baseline self-assessment. Use the result to rank systems from weakest to strongest. Review your weakest systems in tutor mode, where you see each explanation straight away.",
            ],
            [
              "Build",
              "Switch to mixed, timed 20-question blocks, 30 minutes each, like the real exam. Review every question, including the ones you got right by guessing, and keep an error log. Re-test every week or two and re-rank.",
            ],
            [
              "Sharpen",
              "Take a final self-assessment about a week out. Sit at least one long practice day to build stamina. Ease off in the last two days and rest the day before.",
            ],
          ].map(([t, d], i) => (
            <li key={t} className="grid grid-cols-[48px_1fr] gap-2 border-t border-border py-5 first:border-t-2 first:border-text">
              <span className="readout pt-1 text-[14px] text-brand-strong">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-[19px] font-bold">{t}</h3>
                <p className="mt-1.5 max-w-[64ch] text-[15.5px] leading-relaxed text-muted">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Priorities" title="Where to spend the hours">
        <Prose>
          <p>
            The official Step 1 content outline puts pathology at 45–55% of items and physiology at 30–40%, and says 60–70% of questions test applied
            foundational science. In practice that means mechanisms: why a finding appears, what causes a disease, how a drug works and what it does wrong.
          </p>
          <p>
            By system, the largest shares are reproductive and endocrine (12–16%), respiratory and renal (11–15%) and behavioral health and nervous system
            (10–14%). Biostatistics and epidemiology is only 4–6%, but its points are some of the most learnable on the exam.
          </p>
          <p>
            Practice by subject: <Link href="/usmle-step-1-cardiology-questions">cardiology</Link>,{" "}
            <Link href="/usmle-step-1-neurology-questions">neurology</Link>, <Link href="/usmle-step-1-gastrointestinal-questions">GI</Link>,{" "}
            <Link href="/usmle-step-1-renal-questions">renal</Link> and <Link href="/usmle-step-1-biostatistics-questions">biostatistics</Link>.
          </p>
        </Prose>
        <SourceNote className="mt-6">
          Shares from the{" "}
          <a href={EXAMS.step1.official.outline} target="_blank" rel="noreferrer">
            USMLE Step 1 content outline
          </a>
          , checked {OFFICIAL_CHECKED}. Items can count toward more than one discipline, so discipline shares add up to more than 100%.
        </SourceNote>
      </Section>

      <Section tone="surface" eyebrow="Daily routine" title="A study day that works">
        <Prose>
          <ul>
            <li>
              <strong>Morning:</strong> one or two timed 20-question blocks, then review them while they&apos;re fresh.
            </li>
            <li>
              <strong>Midday:</strong> targeted review of the topics you missed, from your notes or a short chapter, then a block on your weakest system.
            </li>
            <li>
              <strong>Evening:</strong> spaced review (flashcards or retesting old misses), and update your error log.
            </li>
          </ul>
          <p>
            Read why each wrong answer is wrong, not only why the right one is right. Our guide on{" "}
            <Link href="/guides/how-to-review-usmle-questions">reviewing USMLE questions</Link> shows a method and a free error-log template.
          </p>
        </Prose>
      </Section>

      <Section eyebrow="With Argonaut" title="How the plan maps onto Argonaut">
        <Prose>
          <p>
            Use tutor mode for the foundation phase and timed 20-question blocks for the build phase. ARGO sessions do the &quot;aim at your weakest
            systems&quot; step for you: each session mixes new questions on your weakest topics, drills on concepts you confuse, and retests of earlier misses.
            The <Link href="/library">Library</Link> gives you a short chapter for each topic.
          </p>
          <p>
            Argonaut has {bank.toLocaleString("en-US")} Step 1 questions. Many students use a second bank too; at $48 once, Argonaut is built to be affordable
            either way. See <Link href="/features/argo">how ARGO works</Link>.
          </p>
        </Prose>
      </Section>
    </GuideShell>
  );
}
