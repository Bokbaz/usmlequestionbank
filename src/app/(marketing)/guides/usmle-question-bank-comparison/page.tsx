import Link from "next/link";
import { Prose, Section, SourceNote } from "@/components/marketing/content";
import { GuideShell, guideMetadata } from "@/components/marketing/guide-shell";
import type { FaqItem } from "@/components/marketing/faq";
import { CHECKED, COMPETITORS } from "@/lib/public/competitors";
import { getBankStats } from "@/lib/public/content";

const PATH = "/guides/usmle-question-bank-comparison";
export const metadata = guideMetadata(PATH);
export const revalidate = 3600;

const FAQ: FaqItem[] = [
  {
    q: "What is the cheapest full USMLE question bank?",
    a: "Of the banks compared here, Argonaut costs least: $48 once for Step 1 and Step 2 CK, with no expiry. USMLE-Rx Qmax is $299 for 12 months of both exams. UWorld starts at $349 for 30 days of one exam.",
  },
  {
    q: "Which USMLE question bank is best?",
    a: "It depends on what you need. UWorld has the largest advertised banks; AMBOSS ties its Qbank to a full medical library; USMLE-Rx and Argonaut cover both exams in one purchase; Argonaut is the lowest-cost option and adds adaptive ARGO practice. Many students use one main bank and add a second.",
  },
  {
    q: "Do I need more than one question bank?",
    a: "Not always. Finishing one bank thoroughly, with careful review, matters more than starting several. A second bank helps when you've worked through your first and still want fresh questions.",
  },
  {
    q: "Does the size of a question bank matter?",
    a: "Up to a point. You need enough questions to cover every system several times, and to keep practicing without memorizing answers. Past that, how you review matters more than raw count.",
  },
];

export default async function QbankComparisonGuide() {
  const stats = await getBankStats().catch(() => null);
  const s1 = stats?.exams.step1.total;
  const s2 = stats?.exams.step2ck.total;
  const rows = [
    ...COMPETITORS,
    {
      key: "argonaut",
      name: "Argonaut",
      product: "Full access",
      exams: "Step 1 and Step 2 CK",
      price: "$48 once",
      access: "No expiry (for as long as Argonaut runs)",
      questions: s1 && s2 ? `${s1.toLocaleString("en-US")} Step 1; ${s2.toLocaleString("en-US")} Step 2 CK` : "Step 1 and Step 2 CK",
      tryFree: stats ? `${stats.publicQuestions} free questions, no account` : "Free questions, no account",
      notes: "ARGO adaptive sessions and a high-yield Library included. No self-assessments.",
      source: "/pricing",
    },
  ];
  return (
    <GuideShell
      path={PATH}
      summary={
        <p>
          <strong className="font-semibold text-text">In short:</strong> UWorld has the largest advertised banks and sells each exam separately, from $349 for
          30 days. AMBOSS pairs its Qbank with a medical library. USMLE-Rx Qmax covers both exams for $299 a year. Argonaut costs $48 once for both exams with
          no expiry: a smaller bank, with adaptive ARGO practice. Compare the total cost for the time you&apos;ll actually study.
        </p>
      }
      faq={FAQ}
      cta={{
        title: "Try Argonaut before you decide.",
        body: "Answer the free questions with full explanations. No account, no card.",
        primary: { href: "/free-usmle-practice-questions", label: "Free questions" },
        secondary: { href: "/compare/uworld", label: "Argonaut vs UWorld" },
      }}
    >
      <Section eyebrow="Disclosure" title="Who wrote this" split={false}>
        <p className="max-w-[72ch] text-[16.5px] leading-relaxed text-muted">
          Argonaut wrote this page, and we sell one of the banks on it. To keep it fair, every fact about another bank is taken from that company&apos;s own
          website on {CHECKED}, with a link, and we include the places where other banks are ahead of us. Prices change: check each site before you buy.
        </p>
      </Section>

      <Section tone="surface" eyebrow="Side by side" title="Five USMLE question banks" split={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-[14.5px]">
            <caption className="sr-only">USMLE question banks compared on price, access, questions and free trials, as of {CHECKED}</caption>
            <thead>
              <tr className="border-b-2 border-text text-[12px] uppercase tracking-[0.08em] text-muted">
                {["Bank", "Covers", "Price (as listed)", "Access", "Advertised questions", "Try it free", "Also"].map((h) => (
                  <th key={h} scope="col" className="py-3 pr-4 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className={r.key === "argonaut" ? "border-b border-border bg-brand-soft/60 align-top" : "border-b border-border align-top"}>
                  <th scope="row" className="py-3 pr-4">
                    <span className="block font-bold">{r.name}</span>
                    <span className="block text-[13px] font-normal text-muted">{r.product}</span>
                  </th>
                  <td className="py-3 pr-4">{r.exams}</td>
                  <td className="py-3 pr-4 font-semibold">{r.price}</td>
                  <td className="py-3 pr-4">{r.access}</td>
                  <td className="py-3 pr-4">{r.questions}</td>
                  <td className="py-3 pr-4">{r.tryFree}</td>
                  <td className="py-3 pr-4 text-muted">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceNote className="mt-6">
          Sources, checked {CHECKED}:{" "}
          {COMPETITORS.map((c, i) => (
            <span key={c.key}>
              <a href={c.source} target="_blank" rel="noreferrer">
                {c.name}
              </a>
              {i < COMPETITORS.length - 1 ? ", " : ". "}
            </span>
          ))}
          Question counts are as advertised by each company and include different things (some count shelf or Step 3 questions). Trademarks belong to their
          owners; Argonaut is not affiliated with any of these companies.
        </SourceNote>
      </Section>

      <Section eyebrow="Cost" title="What a year of preparation costs">
        <Prose>
          <p>The listed price of a year of access to both Step 1 and Step 2 CK:</p>
          <ul>
            <li>
              <strong>UWorld:</strong> $579 for a 360-day Step 1 QBank plus $579 for a 360-day Step 2 CK QBank: <strong>$1,158</strong>.
            </li>
            <li>
              <strong>USMLE-Rx Qmax:</strong> <strong>$299</strong> for 12 months of Step 1 and Step 2 CK.
            </li>
            <li>
              <strong>Argonaut:</strong> <strong>$48</strong>, once, for both exams, with no expiry.
            </li>
          </ul>
          <p>AMBOSS and Kaplan package their access differently, so a like-for-like annual figure isn&apos;t possible from their listings.</p>
        </Prose>
      </Section>

      <Section tone="surface" eyebrow="How to choose" title="Which bank fits you">
        <div className="grid gap-8 md:grid-cols-2">
          {[
            ["You want the biggest bank", "UWorld advertises the most Step 1 and Step 2 CK questions here, and many students already know its interface. Budget for each exam separately."],
            ["You want a library built in", "AMBOSS ties its Qbank to a full medical reference library and study plans, sold as a membership."],
            ["You want both exams in one purchase", "USMLE-Rx Qmax ($299 a year) and Argonaut ($48 once) both cover Step 1 and Step 2 CK."],
            ["You're on a budget, or want a second bank", "Argonaut is the lowest-cost option here, with every question written to the NBME Item-Writing Guide and approved by a clinician, and ARGO aiming each session at your weak spots."],
          ].map(([t, d]) => (
            <div key={t} className="border-t-2 border-text pt-4">
              <h3 className="text-[18px] font-bold">{t}</h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-[68ch] text-[16px] leading-relaxed text-muted">
          Whichever you choose, how you review matters more than which logo is on the bank. See{" "}
          <Link href="/guides/how-to-review-usmle-questions" className="font-semibold text-text underline decoration-brand-strong decoration-2 underline-offset-4">
            how to review USMLE questions
          </Link>
          .
        </p>
      </Section>
    </GuideShell>
  );
}
