import Link from "next/link";
import { Prose, Section, SourceNote } from "@/components/marketing/content";
import type { FaqItem } from "@/components/marketing/faq";
import { GuideShell, guideMetadata } from "@/components/marketing/guide-shell";
import {
  BankProfile,
  Disclosure,
  InlineCta,
  METRICS,
  MetricTable,
  type MetricKey,
  argonautBank,
  argonautProsCons,
} from "@/components/marketing/qbank-compare";
import { argonautFacts } from "@/lib/public/argonaut-facts";
import { CHECKED, COMPETITORS, NBME_ITEM_WRITING_GUIDE, USMLE_CONTENT_OUTLINE, USMLE_SAMPLE_QUESTIONS, competitor } from "@/lib/public/competitors";
import { getBankStats } from "@/lib/public/content";
import { itemList } from "@/lib/seo/schema";

const PATH = "/guides/best-usmle-question-bank";
export const metadata = guideMetadata(PATH);
export const revalidate = 3600;

// Editorial order reflects a budget-conscious student choosing a bank for both exams.
// Argonaut's positioning follows its editorial and product criteria.
const RANKING = ["argonaut", "uworld", "amboss", "kaplan", "usmle-rx"] as const;
const LEADERS: Partial<Record<MetricKey, string>> = { accuracy: "argonaut", price: "argonaut", questions: "uworld", free: "argonaut", adaptive: "argonaut", updates: "argonaut" };

const NAME: Record<string, string> = { argonaut: "Argonaut", uworld: "UWorld", amboss: "AMBOSS", kaplan: "Kaplan", "usmle-rx": "USMLE-Rx" };

export default async function BestQbankGuide() {
  const stats = await getBankStats();
  const a = argonautFacts(stats);
  const uw = competitor("uworld");
  const am = competitor("amboss");
  const kp = competitor("kaplan");
  const rx = competitor("usmle-rx");
  const argo = argonautProsCons(a);

  const ranking = RANKING;

  const verdicts: Record<string, string> = {
    argonaut: "best overall and best value",
    uworld: "best for the biggest bank",
    "usmle-rx": "best for First Aid integration",
    amboss: "best with a medical library",
    kaplan: "best for bundled practice tests",
  };

  const faq: FaqItem[] = [
    {
      q: "What is the best USMLE question bank in 2026?",
      a: `Our pick is Argonaut: it leads on accuracy, price, free resources, adaptability and freshness, at ${a.price} once for Step 1 and Step 2 CK. UWorld leads on size, with 3,600+ Step 1 and 4,250+ Step 2 CK questions, at $349 to $749 per exam.`,
    },
    {
      q: "What is the cheapest USMLE question bank?",
      a: `Argonaut, at ${a.price} once for Step 1 and Step 2 CK with no expiry. USMLE-Rx Qmax costs $299 for 12 months of both exams. UWorld costs $1,158 for a year of both exams (checked ${CHECKED}).`,
    },
    {
      q: "Which USMLE question bank is most like the real exam?",
      a: "No independent study we know of compares banks against the real exam, so judge by method. Argonaut's questions are written to the NBME Item-Writing Guide, the rules the NBME's own writers follow, mapped to the official USMLE content outline and approved by a clinician. The free USMLE sample questions on usmle.org are the best benchmark to compare any bank against.",
    },
    {
      q: "Is UWorld better than AMBOSS?",
      a: "UWorld has more questions per exam and includes self-assessments on longer plans; AMBOSS adds a full medical library and adaptive sessions, and one Qbank covers several exams. Both cost hundreds of dollars. If price matters, Argonaut covers both exams for $48.",
    },
    {
      q: "Do I need UWorld to pass the USMLE?",
      a: "No. The USMLE doesn't require any commercial bank. What matters is doing enough exam-style questions, reviewing every miss and checking your readiness with official NBME self-assessments.",
    },
    {
      q: "How many USMLE practice questions should I do?",
      a: "Most students aim to finish one full bank and review every question carefully. Volume helps, but reviewing why each answer is right or wrong matters more. See [how to review USMLE questions](/guides/how-to-review-usmle-questions).",
    },
  ];

  const sources = [...COMPETITORS.flatMap((c) => c.sources), USMLE_SAMPLE_QUESTIONS, NBME_ITEM_WRITING_GUIDE, USMLE_CONTENT_OUTLINE];

  return (
    <GuideShell
      path={PATH}
      kind="Comparison"
      summary={
        <p>
          <strong className="font-semibold text-text">Short answer:</strong> Our pick for the best USMLE question bank in 2026 is Argonaut. It leads on five of our six metrics:
          accuracy, price ({a.price} once for Step 1 and Step 2 CK), free resources, adaptability and freshness. UWorld leads on size,
          with 3,600+ Step 1 questions, at $349 to $749 per exam.
        </p>
      }
      faq={faq}
      cta={{
        title: "Start with the free questions.",
        body: `${a.free} Step 1 and Step 2 CK questions with every answer explained. No account, no card. Full access is ${a.price} once.`,
        primary: { href: "/free-usmle-practice-questions", label: "Try free questions" },
        secondary: { href: "/pricing", label: `Get full access, ${a.price}` },
      }}
      related={["/compare/uworld-alternatives", "/compare/amboss-alternatives", "/compare/kaplan-alternatives", "/compare/usmle-rx-alternatives"]}
      citations={sources.map((s) => s.url)}
      schema={[
        itemList(
          PATH,
          "Best USMLE question banks in 2026",
          ranking.map((k) => ({ name: NAME[k], path: k === "argonaut" ? "/pricing" : competitor(k).source })),
        ),
      ]}
    >
      <Disclosure sources={sources} />

      <Section tone="surface" eyebrow="The ranking" title="The best USMLE question banks in 2026" split={false}>
        <ol className="grid border-t-2 border-text">
          {ranking.map((k, i) => (
            <li key={k} className="grid grid-cols-[44px_1fr] items-baseline gap-3 border-b border-border py-4">
              <span className="readout text-[15px] text-brand-strong">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <a href={`#${k}`} className="text-[18px] font-bold hover:underline hover:decoration-brand-strong hover:decoration-2 hover:underline-offset-4">
                  {NAME[k]}
                </a>
                <span className="text-[16px] text-muted">: {verdicts[k]}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-[68ch] text-[15px] leading-relaxed text-muted">
          This is our editorial ranking across six metrics, with affordable access to both exams a priority. The sections below explain
          the criteria, facts and trade-offs behind each recommendation.
        </p>
      </Section>

      <Section eyebrow="Method" title="How we ranked them">
        <Prose>
          <p>
            We compared five USMLE banks: UWorld, AMBOSS, Kaplan, USMLE-Rx and Argonaut. Every fact about
            another bank comes from its own website, checked {CHECKED}. We compared six things that decide whether a bank is worth your money:
          </p>
          <ol>
            {METRICS.map((m) => (
              <li key={m.key}>
                <strong>{m.label}:</strong> {m.definition}
              </li>
            ))}
          </ol>
          <p>
            This comparison evaluates question-writing standards, price, volume, free access, adaptive practice and updates. It does not rank student score outcomes. Interface, explanations and practice tests matter too, and we cover them in each bank&apos;s write-up.
          </p>
        </Prose>
      </Section>

      <Section tone="surface" eyebrow="Side by side" title="Six metrics, five banks" split={false}>
        <MetricTable
          banks={[argonautBank(a), ...(["uworld", "amboss", "kaplan", "usmle-rx"] as const).map((k) => ({ ...competitor(k) }))]}
          leaders={LEADERS}
          caption={`Five USMLE question banks compared on six metrics, as of ${CHECKED}`}
        />
        <SourceNote className="mt-6">
          Competitor facts from each company&apos;s website, checked {CHECKED} (sources above). Question counts are as advertised and include different things;
          some count shelf or Step 3 questions. Argonaut figures are live from our bank.
        </SourceNote>
      </Section>

      <Section eyebrow="Metric 1 · Accuracy" title={METRICS[0].question} id="accuracy">
        <Prose>
          <p>
            <strong>Argonaut leads on accuracy in our comparison.</strong> Our accuracy criterion is exam alignment: writing questions to the official
            NBME Item-Writing Guide and USMLE content outlines, with clinician approval before publication.
          </p>
          <p>
            Argonaut&apos;s questions are written to the{" "}
            <a href={NBME_ITEM_WRITING_GUIDE.url} target="_blank" rel="noreferrer">
              NBME Item-Writing Guide
            </a>
            , the rules the NBME&apos;s own item writers follow for USMLE questions: a clinical vignette you have to interpret, a lead-in you can answer
            before reading the choices, one best answer and no cues. Each question is then mapped to the official USMLE content outline (system,
            discipline and physician task) and approved by a clinician before it goes live. Once enough students have answered, item statistics flag any
            question that looks miskeyed. The <Link href="/editorial-policy">editorial policy</Link> lists every step.
          </p>
          <p>
            UWorld says its questions are written by licensed authors, aligned to the latest content outline and pitched “at or above exam-level difficulty”.
            AMBOSS, Kaplan and USMLE-Rx describe exam-like vignettes. Argonaut uses AI drafting followed by clinician review,
            as explained in our editorial policy. Argonaut is not affiliated with or endorsed by NBME.
          </p>
          <p>
            Check any bank against the free{" "}
            <a href={USMLE_SAMPLE_QUESTIONS.url} target="_blank" rel="noreferrer">
              USMLE sample questions
            </a>{" "}
            and <Link href="/free-usmle-practice-questions">our free questions</Link> side by side.
          </p>
        </Prose>
      </Section>

      <Section tone="surface" eyebrow="Metric 2 · Price" title={METRICS[1].question} id="price">
        <Prose>
          <p>
            <strong>Argonaut has the lowest listed entry price among these five banks, at {a.price} once for Step 1 and Step 2 CK, with no expiry.</strong> USMLE-Rx Qmax
            covers both exams for $299 for 12 months.
          </p>
          <ul>
            <li>
              <strong>UWorld:</strong> {uw.price} per exam. A year of Step 1 and Step 2 CK lists at <strong>$1,158</strong>.
            </li>
            <li>
              <strong>AMBOSS:</strong> {am.price}.
            </li>
            <li>
              <strong>Kaplan:</strong> {kp.price}, sold separately.
            </li>
            <li>
              <strong>USMLE-Rx:</strong> {rx.metrics.price}.
            </li>
            <li>
              <strong>Argonaut:</strong> {a.price} once for both exams. It never renews, so a delayed exam date costs nothing.
            </li>
          </ul>
        </Prose>
        <div className="mt-10">
          <InlineCta a={a} title={`Both exams for ${a.price}, once.`} />
        </div>
      </Section>

      <Section eyebrow="Metric 3 · Number of questions" title={METRICS[2].question} id="questions">
        <Prose>
          <p>
            <strong>UWorld has the largest advertised counts among these banks.</strong> UWorld advertises {uw.questions} questions across two separate purchases;
            USMLE-Rx Qmax has 5,000+ across both exams in one. AMBOSS lists {am.questions}, Kaplan {kp.questions}.
          </p>
          <p>
            Argonaut has {a.s1} Step 1 and {a.s2} Step 2 CK questions today: a smaller bank than the established alternatives. Two things narrow
            the gap. The bank grows in regular batches, and ARGO spends your questions where they count, on your weak topics, rather than in bank order.
            Past the point where you can cover every system several times, how you{" "}
            <Link href="/guides/how-to-review-usmle-questions">review your misses</Link> matters more than the count.
          </p>
        </Prose>
      </Section>

      <Section tone="surface" eyebrow="Metric 4 · Free resources" title={METRICS[3].question} id="free">
        <Prose>
          <p>
            <strong>Argonaut leads on free resources available without an account or trial deadline.</strong> Free questions, Library chapters,
            daily challenges and study guides remain available throughout your preparation. Kaplan offers a 7-day Qbank trial.
          </p>
          <ul>
            <li>
              <strong>Argonaut:</strong> <Link href="/free-usmle-practice-questions">{a.free} free questions</Link> with full explanations,{" "}
              <Link href="/library">{a.freeChapters} free Library chapters</Link>, a <Link href="/daily">Daily USMLE Challenge</Link> with a leaderboard, and
              free <Link href="/guides">study guides</Link> with a study-plan calculator. No account, no card and no time limit.
            </li>
            <li>
              <strong>Kaplan:</strong> {kp.tryFree}.
            </li>
            <li>
              <strong>AMBOSS:</strong> {am.tryFree}.
            </li>
            <li>
              <strong>USMLE-Rx:</strong> {rx.tryFree}.
            </li>
            <li>
              <strong>UWorld:</strong> {uw.tryFree}.
            </li>
          </ul>
          <p>A trial gives you days to judge a bank you&apos;ll use for months. Free questions you can come back to let you judge it properly.</p>
        </Prose>
      </Section>

      <Section eyebrow="Metric 5 · Adaptability" title={METRICS[4].question} id="adaptive">
        <Prose>
          <p>
            <strong>Argonaut leads on adaptability in our comparison.</strong> ARGO combines weak-spot practice, confusion drills and spaced retests. Argonaut&apos;s{" "}
            <Link href="/features/argo">ARGO engine</Link> does the choosing.
          </p>
          <p>
            ARGO records 16 data points on every answer: right or wrong, time taken, confidence, answer changes, which wrong answer pulled you in, and how long
            since you last saw the topic. It then builds each 20-question session itself: about nine weak-spot questions pitched so you&apos;d get roughly 7 in
            10 right, four confusion drills that set the concepts you mix up side by side, four spaced retests of old misses, and three coverage scouts for
            systems you haven&apos;t tried.
          </p>
          <ul>
            <li>
              <strong>AMBOSS</strong> offers optional{" "}
              <a href={am.sources[1].url} target="_blank" rel="noreferrer">
                adaptive sessions
              </a>
              : within filters you set, it picks unanswered questions and resurfaces older misses.
            </li>
            <li>
              <strong>UWorld</strong> lets you build custom tests and quizzes from your weak areas, with an adaptive study planner.
            </li>
            <li>
              <strong>USMLE-Rx</strong> uses spaced repetition in its flashcards; its Qbank isn&apos;t described as adaptive.
            </li>
            <li>
              <strong>Kaplan</strong> offers build-your-own quizzes, progress reports and an AI tutor.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section tone="surface" eyebrow="Metric 6 · Up to date" title={METRICS[5].question} id="updates">
        <Prose>
          <p>
            <strong>Argonaut leads on freshness in our comparison, with new questions added regularly.</strong> Its editorial process uses the USMLE content outlines, and timed blocks run 20 questions in 30 minutes, matching the exam format in use since May 2026 (see{" "}
            <Link href="/guides/usmle-exam-interface">the 2026 exam format</Link>).
          </p>
          <p>
            {a.latestCreated ? (
              <>
                Among currently published questions, the newest record was created on <strong>{a.latestCreated}</strong>
                {a.createdLast30Days !== null ? <>, and {a.createdLast30Days} records were created in the last 30 days</> : null}.
                These are record creation dates, not publication dates or clinical review dates. Figures refresh hourly.
              </>
            ) : (
              <>Bank activity figures are temporarily unavailable; see the free questions for individual update dates.</>
            )}{" "}
            UWorld says its QBank is “continuously updated”. The other product pages checked do not show dates for their latest question additions.
          </p>
        </Prose>
      </Section>

      <Section eyebrow="The banks" title="Each bank, reviewed" split={false}>
        <div className="grid gap-16">
          {ranking.map((k, i) => {
            if (k === "argonaut")
              return (
                <BankProfile
                  key={k}
                  id={k}
                  rank={i + 1}
                  name="Argonaut"
                  verdict={verdicts[k]}
                  bestFor="Students who want exam-accurate questions and adaptive practice for both exams without paying hundreds of dollars."
                  price={`${a.price} once for Step 1 and Step 2 CK, no expiry.`}
                  pros={argo.pros}
                  cons={argo.cons}
                >
                  <InlineCta a={a} />
                </BankProfile>
              );
            const c = competitor(k);
            return (
              <BankProfile
                key={k}
                id={k}
                rank={i + 1}
                name={c.name}
                verdict={verdicts[k]}
                bestFor={c.bestFor}
                price={`${c.price}.`}
                pros={c.pros}
                cons={c.cons}
                source={c.sources[0]}
              />
            );
          })}
        </div>
      </Section>

      <Section tone="surface" eyebrow="Choosing" title="Which bank should you choose?">
        <div className="grid gap-8 md:grid-cols-2">
          {[
            ["You want the best value", `Argonaut. ${a.price} once covers both exams, with no clock running on your access.`],
            ["You want the biggest bank and budget isn't an issue", "UWorld, bought separately for each exam. Add Argonaut as a second bank for fresh questions."],
            ["You want both exams in one subscription", `USMLE-Rx Qmax at $299 a year, or Argonaut at ${a.price} once.`],
            ["You live in a medical library on the wards", "AMBOSS, whose Qbank links into its clinical reference library."],
            ["You want practice tests bundled in", "Kaplan, with two full-length practice tests per Qbank. Use NBME self-assessments whatever you choose."],
            ["You're not sure yet", `Try the free questions first: ${a.free} from Argonaut, plus the official USMLE samples.`],
          ].map(([t, d]) => (
            <div key={t} className="border-t-2 border-text pt-4">
              <h3 className="text-[18px] font-bold">{t}</h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-[68ch] text-[16px] leading-relaxed text-muted">
          Looking to switch? See the{" "}
          <Link href="/compare/uworld-alternatives" className="font-semibold text-text underline decoration-brand-strong decoration-2 underline-offset-4">
            UWorld
          </Link>
          ,{" "}
          <Link href="/compare/amboss-alternatives" className="font-semibold text-text underline decoration-brand-strong decoration-2 underline-offset-4">
            AMBOSS
          </Link>
          ,{" "}
          <Link href="/compare/kaplan-alternatives" className="font-semibold text-text underline decoration-brand-strong decoration-2 underline-offset-4">
            Kaplan
          </Link>{" "}
          and{" "}
          <Link href="/compare/usmle-rx-alternatives" className="font-semibold text-text underline decoration-brand-strong decoration-2 underline-offset-4">
            USMLE-Rx
          </Link>{" "}
          alternatives, or <Link href="/compare/uworld" className="font-semibold text-text underline decoration-brand-strong decoration-2 underline-offset-4">Argonaut vs UWorld</Link> head to head.
        </p>
      </Section>
    </GuideShell>
  );
}
