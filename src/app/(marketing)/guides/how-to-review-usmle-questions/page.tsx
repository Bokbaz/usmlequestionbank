import Link from "next/link";
import { Download } from "lucide-react";
import { Prose, Section } from "@/components/marketing/content";
import { GuideShell, guideMetadata } from "@/components/marketing/guide-shell";
import type { FaqItem } from "@/components/marketing/faq";
import { Button } from "@/components/ui/button";
import { ERROR_META } from "@/lib/argo/model";

const PATH = "/guides/how-to-review-usmle-questions";
export const metadata = guideMetadata(PATH);

const TEMPLATE = "/downloads/usmle-error-log-template.csv";
const EXAMPLE = "/practice-questions/step-1/aq-1053-pulmonary-embolism";

const FAQ: FaqItem[] = [
  {
    q: "How long should I spend reviewing a question block?",
    a: "At least as long as you spent answering it, and often longer. A 20-question block takes 30 minutes to answer; reviewing it well usually takes 30 to 60 minutes.",
  },
  {
    q: "Should I review the questions I got right?",
    a: "Yes, quickly. Check that you were right for the right reason. A correct guess is a weak spot that happened to score a point; treat it like a miss.",
  },
  {
    q: "What should go in a USMLE error log?",
    a: "The question, topic, your answer, the right answer, why you missed it, a one-line takeaway you could apply to a new question, and when to retest. Our [free template](/downloads/usmle-error-log-template.csv) has those columns.",
  },
  {
    q: "Should I redo questions I've already seen?",
    a: "Redo your misses after a gap of a day or more, then again later. You'll remember some answers, so judge yourself by whether you can explain why each choice is right or wrong.",
  },
  {
    q: "Does this work with any question bank?",
    a: "Yes. The method works with any bank. In Argonaut, ARGO labels each miss with its error type and schedules the retests for you.",
  },
];

export default function ReviewGuide() {
  return (
    <GuideShell
      path={PATH}
      summary={
        <p>
          <strong className="font-semibold text-text">In short:</strong> review every question, not only the misses. For each miss, name why it happened,
          write the one rule that would get a new question right, log it, and retest the topic a day or more later. Points come back from fixing the reason,
          not from re-reading the explanation.
        </p>
      }
      faq={FAQ}
      cta={{
        title: "Practice the method now.",
        body: "Answer a free question, then review it with the steps above. Every answer choice is explained.",
        primary: { href: "/free-usmle-practice-questions", label: "Free questions" },
        secondary: { href: "/features/argo", label: "How ARGO helps" },
      }}
    >
      <Section eyebrow="The method" title="Six steps after every block">
        <ol className="grid gap-0">
          {[
            ["Answer like it's test day", "Timed, 20 questions in 30 minutes. Commit to an answer, and note how sure you were before you see the result."],
            ["Review everything", "Go through every question, right or wrong. For correct answers, check you were right for the right reason."],
            ["Name the error", "For every miss and every lucky guess, pick one reason from the list below. The reason decides the fix."],
            ["Read every choice", "Read why each wrong answer is wrong for this patient and what would have made it right. That's where most of the learning is."],
            ["Write the takeaway", "One sentence you could apply to a different question. Not \"PE causes dead space\", but the rule that tells dead space from shunt."],
            ["Log it and retest", "Add a row to your error log with a retest date: the next day, then a week later. Redo the miss, or a fresh question on the same topic."],
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

      <Section tone="surface" eyebrow="Step 3" title="Nine reasons you miss a question, and the fix for each" intro={<p>These are the error types ARGO assigns automatically. You can use them with any bank.</p>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-[15px]">
            <caption className="sr-only">USMLE question error types and how to fix each</caption>
            <thead>
              <tr className="border-b-2 border-text text-[12.5px] uppercase tracking-[0.08em] text-muted">
                <th scope="col" className="py-3 pr-4 font-semibold">Error</th>
                <th scope="col" className="py-3 pr-4 font-semibold">What it looks like</th>
                <th scope="col" className="py-3 font-semibold">The fix</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(ERROR_META).map((e) => (
                <tr key={e.label} className="border-b border-border align-top">
                  <th scope="row" className="py-3 pr-4 font-bold">{e.label}</th>
                  <td className="py-3 pr-4 text-muted">{e.short}</td>
                  <td className="py-3">{e.advice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="Worked example" title="One miss, reviewed">
        <Prose>
          <p>
            Take <Link href={EXAMPLE}>this free Step 1 question</Link> on pulmonary embolism. A patient 8 days after knee surgery is breathless and
            hypocapnic, and the gap between arterial and mixed-expired CO2 is large. The question asks for the mechanism.
          </p>
          <ul>
            <li>
              <strong>Your answer:</strong> A, absent ventilation of perfused alveoli (shunt). You were fairly sure.
            </li>
            <li>
              <strong>Correct answer:</strong> C, reduced perfusion of ventilated alveoli (dead space).
            </li>
            <li>
              <strong>Error type:</strong> misconception. You were confident and wrong, so the fix is to separate the two ideas, not to re-read the topic.
            </li>
            <li>
              <strong>Takeaway:</strong> a big arterial-to-expired CO2 gap means dead space, ventilated alveoli with no blood flow, as in pulmonary embolism.
              Shunt is the reverse: perfused alveoli with no air.
            </li>
            <li>
              <strong>Retest:</strong> tomorrow, then a week later, with a fresh question that makes you choose between shunt and dead space.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section tone="panel" eyebrow="Step 6" title="The error log" intro={<p>A spreadsheet beats a notebook: you can sort by topic and error type and see your patterns.</p>}>
        <div className="overflow-x-auto rounded-[8px] border border-border bg-surface">
          <table className="w-full min-w-[720px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Example error log row</caption>
            <thead>
              <tr className="border-b border-border bg-panel text-muted">
                {["Question", "Topic", "My answer", "Correct", "Error type", "Takeaway", "Retest"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                <td className="readout px-3 py-3">AQ-1053</td>
                <td className="px-3 py-3">Pulmonary embolism</td>
                <td className="px-3 py-3">A (shunt)</td>
                <td className="px-3 py-3">C (dead space)</td>
                <td className="px-3 py-3">Misconception</td>
                <td className="px-3 py-3">Big arterial-to-expired CO2 gap = dead space; shunt is the reverse.</td>
                <td className="px-3 py-3">Next day</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Button asChild size="lg" variant="secondary" className="mt-6">
          <a href={TEMPLATE} download>
            <Download className="size-4" /> Download the free error-log template (CSV)
          </a>
        </Button>
        <p className="mt-3 text-[13.5px] text-muted">Opens in Excel, Numbers or Google Sheets. Free to use and share.</p>
      </Section>
    </GuideShell>
  );
}
