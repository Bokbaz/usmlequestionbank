import Link from "next/link";
import { Check } from "lucide-react";
import { Prose, Section, SourceNote } from "@/components/marketing/content";
import { GuideShell, guideMetadata } from "@/components/marketing/guide-shell";
import type { FaqItem } from "@/components/marketing/faq";
import { REFUND_DAYS, REFUND_MAX_ANSWERED } from "@/lib/legal";
import { CHECKED, competitor } from "@/lib/public/competitors";
import { getBankStats } from "@/lib/public/content";

const PATH = "/compare/uworld";
export const metadata = guideMetadata(PATH);
export const revalidate = 3600;

export default async function CompareUworldPage() {
  const stats = await getBankStats().catch(() => null);
  const uw = competitor("uworld");
  const s1 = stats?.exams.step1.total.toLocaleString("en-US") ?? "1,000+";
  const s2 = stats?.exams.step2ck.total.toLocaleString("en-US") ?? "700+";
  const free = stats?.publicQuestions ?? 70;

  const rows: [string, string, string][] = [
    ["Exams in one purchase", "Step 1 and Step 2 CK", "One exam (Step 2 CK sold separately)"],
    ["Price", "$48, once", "$349 (30 days) to $749 (730 days) per exam"],
    ["A year of both exams", "$48", "$1,158 (two 360-day QBanks at $579)"],
    ["Access length", "No expiry, for as long as Argonaut runs", "30 to 730 days; can't be paused once activated"],
    ["Questions (advertised)", `${s1} Step 1 · ${s2} Step 2 CK`, "3,600+ Step 1 · 4,250+ Step 2 CK and shelf"],
    ["Try before you buy", `${free} free questions, no account`, "No trial account; a demo with a few sample questions"],
    ["Self-assessments", "None", "One to three included with 90-day and longer plans"],
    ["Adaptive practice", "ARGO: sessions built around your weak spots", "Not compared here"],
    ["How questions are written", "Written to the NBME Item-Writing Guide, reviewed by an MD", "Not compared here"],
    ["Refunds", `Full refund within ${REFUND_DAYS} days if under ${REFUND_MAX_ANSWERED} questions answered`, "See UWorld's terms"],
  ];

  const faq: FaqItem[] = [
    {
      q: "Is Argonaut a good UWorld alternative?",
      a: "For price, yes: $48 once covers Step 1 and Step 2 CK with no expiry, against $349 to $749 per exam for UWorld. UWorld has the bigger bank. Many students use Argonaut alongside UWorld, or as their main bank when budget matters.",
    },
    {
      q: "Is Argonaut cheaper than UWorld?",
      a: "Yes. Argonaut is $48 once for both exams. UWorld lists its Step 1 QBank from $349 for 30 days to $749 for 730 days, with Step 2 CK sold separately at the same prices (checked " + CHECKED + ").",
    },
    {
      q: "Does Argonaut have as many questions as UWorld?",
      a: `No. Argonaut has ${s1} Step 1 and ${s2} Step 2 CK questions today; UWorld advertises 3,600+ Step 1 and 4,250+ Step 2 CK and shelf questions.`,
    },
    {
      q: "Are Argonaut's questions as good as UWorld's?",
      a: "We haven't run a head-to-head study, so we won't claim one. What we can show is how ours are made: written to the NBME Item-Writing Guide, approved by a clinician, and monitored with item statistics and student reports. [Try the free questions](/free-usmle-practice-questions) and judge for yourself.",
    },
    {
      q: "Can I use Argonaut and UWorld together?",
      a: "Yes. A common pattern is one main bank plus a second for fresh questions. Argonaut's price makes it an easy second bank, and ARGO focuses your time on your weakest topics.",
    },
  ];

  return (
    <GuideShell
      path={PATH}
      kind="Comparison"
      summary={
        <p>
          <strong className="font-semibold text-text">Short answer:</strong> UWorld has the bigger bank and sells each exam separately, from $349 for 30
          days. Argonaut wins on price, at $48 once for Step 1 and Step 2 CK with no expiry, and is built for exam accuracy: every question is written to the
          NBME Item-Writing Guide and approved by a clinician, with ARGO aiming practice at your weak spots.
        </p>
      }
      faq={faq}
      cta={{
        title: "See the questions for yourself.",
        body: `Answer ${free} free questions with full explanations. If Argonaut isn't for you, you've lost nothing.`,
        primary: { href: "/free-usmle-practice-questions", label: "Free questions" },
        secondary: { href: "/pricing", label: "Pricing" },
      }}
    >
      <Section eyebrow="Disclosure" title="Who wrote this" split={false}>
        <p className="max-w-[72ch] text-[16.5px] leading-relaxed text-muted">
          Argonaut wrote this page, and we sell Argonaut. Facts about UWorld come from{" "}
          <a href={uw.source} target="_blank" rel="noreferrer" className="font-semibold text-text underline underline-offset-2">
            UWorld&apos;s own website
          </a>
          , checked {CHECKED}. Where we haven&apos;t compared something fairly, the table says so rather than guessing. UWorld is a trademark of its owner;
          Argonaut is not affiliated with UWorld.
        </p>
      </Section>

      <Section tone="surface" eyebrow="Side by side" title="Argonaut and UWorld, feature by feature" split={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[15px]">
            <caption className="sr-only">Argonaut and UWorld compared, as of {CHECKED}</caption>
            <thead>
              <tr className="border-b-2 border-text">
                <th scope="col" className="w-[26%] py-3 pr-4 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                  <span className="sr-only">Feature</span>
                </th>
                <th scope="col" className="py-3 pr-4 text-[17px] font-bold">Argonaut</th>
                <th scope="col" className="py-3 text-[17px] font-bold">UWorld</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, a, u]) => (
                <tr key={label} className="border-b border-border align-top">
                  <th scope="row" className="py-3 pr-4 font-semibold">{label}</th>
                  <td className="bg-brand-soft/50 px-3 py-3">{a}</td>
                  <td className="px-3 py-3 text-muted">{u}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceNote className="mt-6">
          UWorld prices, durations, counts and trial policy from{" "}
          <a href={uw.source} target="_blank" rel="noreferrer">
            medical.uworld.com
          </a>{" "}
          (Step 1 and Step 2 CK pages), checked {CHECKED}. Argonaut figures are live from our bank.
        </SourceNote>
      </Section>

      <Section eyebrow="The verdict" title="Where each one wins">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="border-t-2 border-text pt-4">
            <h3 className="text-[19px] font-bold">Argonaut wins on</h3>
            <ul className="mt-4 grid gap-3 text-[15.5px] leading-relaxed">
              {[
                "Price: $48 once for both exams, against $1,158 for a year of both on UWorld.",
                "Access: no expiry, so a delayed exam date never costs you a renewal.",
                "Exam accuracy by design: written to the NBME Item-Writing Guide, approved by a clinician, and 20-question timed blocks that match the 2026 exam.",
                "Practice aimed at you: ARGO builds each session around your weakest topics and retests your misses.",
                `Trying first: ${free} free questions with full explanations, no account.`,
              ].map((x) => (
                <li key={x} className="flex gap-3">
                  <Check aria-hidden className="mt-1 size-4 shrink-0 text-brand-strong" strokeWidth={3} />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t-2 border-text pt-4">
            <h3 className="text-[19px] font-bold">UWorld wins on</h3>
            <ul className="mt-4 grid gap-3 text-[15.5px] leading-relaxed">
              {[
                "Size: 3,600+ Step 1 and 4,250+ Step 2 CK and shelf questions advertised.",
                "Self-assessments included with 90-day and longer plans.",
                "Familiarity: many students already know its interface and explanations.",
                "Extras: QBank Plus adds medical videos.",
              ].map((x) => (
                <li key={x} className="flex gap-3">
                  <Check aria-hidden className="mt-1 size-4 shrink-0 text-faint" strokeWidth={3} />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section tone="surface" eyebrow="Choosing" title="Which should you use?">
        <Prose>
          <p>
            <strong>If budget is tight,</strong> Argonaut gives you a complete Step 1 and Step 2 CK bank for $48, with no clock running on your access.
          </p>
          <p>
            <strong>If you want the largest bank and can afford it,</strong> UWorld is the bigger product. Many students add Argonaut as a second bank for fresh
            questions and ARGO&apos;s weak-spot sessions.
          </p>
          <p>
            Either way, compare the questions, not the marketing. Ours are free to try: <Link href="/free-usmle-step-1-questions">Step 1</Link> and{" "}
            <Link href="/free-usmle-step-2-ck-questions">Step 2 CK</Link>. For the wider market, see{" "}
            <Link href="/guides/usmle-question-bank-comparison">USMLE question banks compared</Link>, the{" "}
            <Link href="/guides/best-usmle-question-bank">best USMLE question bank in 2026</Link> and{" "}
            <Link href="/compare/uworld-alternatives">UWorld alternatives</Link>.
          </p>
        </Prose>
      </Section>
    </GuideShell>
  );
}
