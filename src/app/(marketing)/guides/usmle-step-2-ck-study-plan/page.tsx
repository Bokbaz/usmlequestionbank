import Link from "next/link";
import { Prose, Section, SourceNote } from "@/components/marketing/content";
import { GuideShell, guideMetadata } from "@/components/marketing/guide-shell";
import type { FaqItem } from "@/components/marketing/faq";
import { StudyPlanCalculator } from "@/components/marketing/study-plan-calculator";
import { EXAMS, OFFICIAL_CHECKED } from "@/lib/exams";
import { getBankStats } from "@/lib/public/content";

const PATH = "/guides/usmle-step-2-ck-study-plan";
export const metadata = guideMetadata(PATH);
export const revalidate = 3600;

const FAQ: FaqItem[] = [
  {
    q: "When should I take Step 2 CK?",
    a: "Most students take it after their core clerkships, when clinical knowledge is freshest, often with a short dedicated period of about 4 to 6 weeks. Check your school's and your target programs' timelines before you book.",
  },
  {
    q: "How many questions a day should I do for Step 2 CK?",
    a: "During clerkships, a steady 10 to 40 a day on the current rotation keeps you moving. In a dedicated period, common targets run from about 40 to 120 a day in timed 20-question blocks, with full review.",
  },
  {
    q: "How do shelf exams help with Step 2 CK?",
    a: "Each clerkship's shelf exam covers part of the same ground, so studying for shelves is studying for Step 2 CK. Use shelf results as checkpoints to find the specialties to revisit in dedicated.",
  },
  {
    q: "How is Step 2 CK different from Step 1?",
    a: "Step 2 CK is scored and tests clinical decisions: the likeliest diagnosis, the next best step, the right drug, what to screen for. Step 1 is pass/fail and tests mostly mechanisms.",
  },
  {
    q: "When should I take a self-assessment?",
    a: "At the start of dedicated for a baseline, every week or two to re-rank your weak areas, and about a week before the exam. The NBME sells official self-assessments, and the USMLE website has free sample questions.",
  },
];

export default async function Step2PlanGuide() {
  const stats = await getBankStats().catch(() => null);
  const bank = stats?.exams.step2ck.total ?? 700;
  return (
    <GuideShell
      path={PATH}
      summary={
        <p>
          <strong className="font-semibold text-text">In short:</strong> do questions on each rotation during your clerkships and treat shelf exams as
          checkpoints. Then take a dedicated period, often 4 to 6 weeks, of mixed timed 20-question blocks with full review, regular self-assessments and focused
          work on your weakest areas.
        </p>
      }
      faq={FAQ}
      cta={{
        title: "Start on the clinical decisions.",
        body: "Try the free Step 2 CK questions. Full access adds every question, plus the Step 1 bank and ARGO, for $48 once.",
        primary: { href: EXAMS.step2ck.freePath, label: "Free Step 2 CK questions" },
        secondary: { href: EXAMS.step2ck.bankPath, label: "Step 2 CK bank" },
      }}
    >
      <Section eyebrow="Calculator" title="Size your dedicated period" intro={<p>Move the sliders. The plan updates as you go.</p>} split={false}>
        <StudyPlanCalculator examName="Step 2 CK" bankSize={bank} defaults={{ weeks: 5, days: 6, perDay: 80 }} />
      </Section>

      <Section tone="surface" eyebrow="The stages" title="From clerkships to test day">
        <ol className="grid gap-0">
          {[
            ["During clerkships", "Do questions on the specialty you're rotating through, in tutor mode so you learn as you go. Write down what you see on the wards that shows up in questions, and the other way round."],
            ["Shelf exams", "Treat each shelf as a checkpoint. A weak shelf result tells you which specialty to revisit before dedicated."],
            ["Dedicated", "Mixed, timed 20-question blocks every study day, with full review and an error log. Re-test every week or two and spend extra time on your three weakest areas."],
            ["Final week", "A last self-assessment about a week out, lighter blocks after it, and rest the day before."],
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
            Medicine is the largest clinical science on the official outline, at 55–65% of items, followed by pediatrics (17–27%), obstetrics and gynecology
            (10–20%), psychiatry (10–15%) and surgery (5–15%). Social sciences, including ethics, professionalism and patient safety, add 10–15%.
          </p>
          <p>
            By task, diagnosis (16–20%), laboratory and diagnostic studies (13–17%) and mixed management (12–16%) lead. Practice choosing the next step, not
            just naming the disease.
          </p>
          <p>
            Practice by subject: <Link href="/usmle-step-2-ck-internal-medicine-questions">internal medicine</Link>,{" "}
            <Link href="/usmle-step-2-ck-obgyn-questions">OB/GYN</Link> and <Link href="/usmle-step-2-ck-psychiatry-questions">psychiatry</Link>.
          </p>
        </Prose>
        <SourceNote className="mt-6">
          Shares from the{" "}
          <a href={EXAMS.step2ck.official.outline} target="_blank" rel="noreferrer">
            USMLE Step 2 CK content outline
          </a>
          , checked {OFFICIAL_CHECKED}. Items can count toward more than one clinical science.
        </SourceNote>
      </Section>

      <Section tone="surface" eyebrow="With Argonaut" title="How the plan maps onto Argonaut">
        <Prose>
          <p>
            Filter blocks by system during clerkships, then switch to mixed timed blocks for dedicated. ARGO sessions aim each block at the topics costing you
            the most points and retest your earlier misses on a schedule.
          </p>
          <p>
            Argonaut has {bank.toLocaleString("en-US")} Step 2 CK questions, and the same $48 also unlocks the Step 1 bank if you want to refresh the basics.
            Review method: <Link href="/guides/how-to-review-usmle-questions">how to review USMLE questions</Link>.
          </p>
        </Prose>
      </Section>
    </GuideShell>
  );
}
