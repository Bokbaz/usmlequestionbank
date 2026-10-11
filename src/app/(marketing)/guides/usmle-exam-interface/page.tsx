import Link from "next/link";
import { FactSheet, Prose, Section, SourceNote } from "@/components/marketing/content";
import { GuideShell, guideMetadata } from "@/components/marketing/guide-shell";
import type { FaqItem } from "@/components/marketing/faq";
import { DEFAULT_BLOCK, EXAMS, EXAM_KEYS, OFFICIAL_CHECKED, TIMED_SECONDS_PER_QUESTION, USMLE_SOURCES } from "@/lib/exams";

const PATH = "/guides/usmle-exam-interface";
export const metadata = guideMetadata(PATH);

const FAQ: FaqItem[] = [
  {
    q: "When did the USMLE exam format change?",
    a: "Step 3 moved to the new test software on 10 March 2026, Step 2 CK on 7 May 2026 and Step 1 on 14 May 2026. Your test date decides which software you see.",
  },
  {
    q: "How many questions are in each Step 1 block now?",
    a: "20. Step 1 now has 14 blocks of 20 questions, 30 minutes each, for 280 questions in an 8-hour day.",
  },
  {
    q: "How many questions are in each Step 2 CK block now?",
    a: "18 to 20. Step 2 CK now has 16 blocks of 30 minutes, for 316 questions in a 9-hour day.",
  },
  {
    q: "Do I get more time per question?",
    a: "No. Blocks are half as long with half as many questions, so the average stays at 90 seconds per question, the same as before.",
  },
  {
    q: "Did the content or scoring change?",
    a: "No. The USMLE program says exam content, the total number of questions and the length of the exam day are unchanged.",
  },
  {
    q: "Can I go back to a previous block?",
    a: "No. As before, you can review questions only within the current block; once a block closes, you can't return to it.",
  },
];

export default function ExamInterfaceGuide() {
  const rows = EXAM_KEYS.map((k) => EXAMS[k]);
  return (
    <GuideShell
      path={PATH}
      summary={
        <p>
          <strong className="font-semibold text-text">In short:</strong> since 7 May 2026 (Step 2 CK) and 14 May 2026 (Step 1), the USMLE uses new test
          software with 30-minute blocks. Step 1 has 14 blocks of 20 questions; Step 2 CK has 16 blocks of 18 to 20. Content, scoring, total questions and the
          length of the exam day did not change.
        </p>
      }
      faq={FAQ}
      cta={{
        title: "Practice in 30-minute blocks.",
        body: "Argonaut's timed mode runs 20 questions in 30 minutes by default, the same block length as the real exam.",
        primary: { href: "/free-usmle-practice-questions", label: "Try free questions" },
        secondary: { href: "/usmle-step-1-question-bank", label: "Step 1 bank" },
      }}
    >
      <Section eyebrow="Before and after" title="What changed, exam by exam">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-[15px]">
            <caption className="sr-only">USMLE Step 1 and Step 2 CK format before and after the 2026 software change</caption>
            <thead>
              <tr className="border-b-2 border-text text-[12.5px] uppercase tracking-[0.08em] text-muted">
                <th scope="col" className="py-3 pr-4 font-semibold">Exam</th>
                <th scope="col" className="py-3 pr-4 font-semibold">From</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Blocks</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Questions per block</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Minutes per block</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Total questions</th>
                <th scope="col" className="py-3 font-semibold">Exam day</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.key} className="border-b border-border">
                  <th scope="row" className="py-3 pr-4 font-bold">{e.name}</th>
                  <td className="py-3 pr-4">{e.official.since}</td>
                  <td className="py-3 pr-4">{e.official.blocks}</td>
                  <td className="py-3 pr-4">{e.official.itemsPerBlock}</td>
                  <td className="py-3 pr-4">{e.official.minutesPerBlock}</td>
                  <td className="py-3 pr-4">{e.official.items}</td>
                  <td className="py-3">{e.official.dayHours} hours</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 max-w-[68ch] text-[16px] leading-relaxed text-muted">
          Before the change, Step 1 had {EXAMS.step1.official.previous} and Step 2 CK had {EXAMS.step2ck.official.previous}. Step 3 moved to the new software
          first, on 10 March 2026.
        </p>
        <SourceNote className="mt-6">
          Source:{" "}
          <a href={USMLE_SOURCES.format} target="_blank" rel="noreferrer">
            USMLE, &quot;Test delivery software updates: Step 2 CK and Step 1 coming May 2026&quot;
          </a>
          , checked {OFFICIAL_CHECKED}.
        </SourceNote>
      </Section>

      <Section tone="surface" eyebrow="The software" title="What else is new on screen">
        <Prose>
          <p>The USMLE program lists these changes to the test software itself:</p>
          <ul>
            <li>An updated design with improved keyboard navigation.</li>
            <li>A new settings menu.</li>
            <li>The ability to adjust the contrast of each image.</li>
          </ul>
          <p>
            Some things are the same as before: you can review questions only within the current block, and you can&apos;t return to a block once it closes.
            The exam&apos;s content outline and scoring are unchanged. The USMLE website has a tutorial for each exam; work through it before test day.
          </p>
        </Prose>
      </Section>

      <Section eyebrow="Our advice" title="What it means for how you practice">
        <div className="grid gap-8 md:grid-cols-2">
          {[
            ["Practice in 20-question blocks", "Set timed blocks to 20 questions and 30 minutes. That's the unit you'll sit on test day, and it trains the rhythm of starting and finishing a block."],
            ["The pace hasn't changed", "Thirty minutes for 20 questions is 90 seconds a question, exactly as before. If you were on pace for 40 in an hour, you're on pace now."],
            ["Expect more transitions", "Twice as many blocks means twice as many starts. Practice getting back to full focus quickly at the top of each block."],
            ["Plan your breaks", "With more, shorter blocks, decide in advance where you'll take breaks, and check your exam's break rules in the official materials."],
          ].map(([t, d]) => (
            <div key={t} className="border-t-2 border-text pt-4">
              <h3 className="text-[18px] font-bold">{t}</h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="panel" eyebrow="Argonaut" title="How Argonaut's timed mode matches it">
        <div className="grid gap-10 md:grid-cols-2">
          <FactSheet
            rows={[
              ["Timed pace", `${TIMED_SECONDS_PER_QUESTION} s per question`],
              ["Default block", `${DEFAULT_BLOCK} questions`],
              ["Block time", "30 minutes"],
              ["Within a block", "Move freely, change answers"],
              ["Explanations", "When the block ends"],
            ]}
          />
          <Prose className="text-[16px]">
            <p>
              The test screen has a highlighter, strike-out, lab values, a calculator, notes and marking, with keyboard shortcuts (A to E to answer, arrow to
              move, M to mark). Custom blocks can run up to 40 questions when you want longer practice, but the default matches the real exam.
            </p>
            <p>
              See it in the <Link href="/usmle-step-1-question-bank">Step 1</Link> and <Link href="/usmle-step-2-ck-question-bank">Step 2 CK</Link> banks, or
              answer a <Link href="/free-usmle-practice-questions">free question</Link> now.
            </p>
          </Prose>
        </div>
      </Section>
    </GuideShell>
  );
}
