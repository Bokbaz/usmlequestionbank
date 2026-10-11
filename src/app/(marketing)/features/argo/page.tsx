import type { Metadata } from "next";
import { Actions, Container, ContentPage, CtaBand, PageHero, Section } from "@/components/marketing/content";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { DATA_POINTS } from "@/lib/argo/data-points";
import { ERROR_META } from "@/lib/argo/model";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbs, faqPage, webPage } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

const PATH = "/features/argo";
const TITLE = "ARGO: Targeted USMLE Question Practice";
const DESCRIPTION =
  "See which signals ARGO uses, how it chooses review topics and what its feedback means. Explore an example session and the optional question-writing add-on.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH, ownImage: true });

// Grouped for reading; the same 16 points as the homepage list.
const GROUPS: { name: string; points: string[]; note: string }[] = [
  { name: "Accuracy", points: ["Right or wrong", "First answer picked", "Final answer picked", "Number of changes", "Right-to-wrong or wrong-to-right"], note: "Not just whether you were right, but how you got there." },
  { name: "Timing", points: ["Time taken", "Position in the block"], note: "Rushed answers and time sinks look different from knowledge gaps." },
  { name: "Confidence", points: ["How sure you were", "Struck out the right answer", "Opened lab values"], note: "Sure-and-wrong is a misconception; unsure-and-right is a guess." },
  { name: "Topic history", points: ["Organ system", "Discipline", "Physician task", "Topic", "Days since you last saw it"], note: "Where the question sits in the outline, and how recently you saw the topic." },
  { name: "Expectation", points: ["Predicted vs actual"], note: "How likely you were to get it right, given everything before it." },
];

// The default 20-question ARGO session (lib/argo/planner.ts): quotas of 45%, 20% and 20%, the
// rest scouts or fill.
const MIX = [
  { key: "weakness", n: 9, label: "Weak-spot questions", body: "New questions on your weakest topics, chosen so you'd get about 7 in 10 right: hard enough to teach, not so hard they crush you." },
  { key: "confusion", n: 4, label: "Confusion drills", body: "Questions that put the concepts you mix up side by side, built from the wrong answers you actually pick." },
  { key: "retest", n: 4, label: "Spaced retests", body: "Questions you missed at least a day ago, oldest first, so a fix turns into memory." },
  { key: "scout", n: 3, label: "Coverage scouts", body: "Systems you haven't tried yet, highest exam weight first, so new weak spots show up early." },
] as const;

const TONE: Record<(typeof MIX)[number]["key"], string> = {
  weakness: "bg-signal",
  confusion: "bg-[oklch(0.82_0.12_90)]",
  retest: "bg-on-ink",
  scout: "bg-on-ink/35",
};

const FAQ: FaqItem[] = [
  {
    q: "Is ARGO included in the $48?",
    a: "Yes. ARGO sessions and the full analytics come with Full access, paid once. Only the optional question-writing add-on costs extra, at $4.99 a month.",
  },
  {
    q: "Do I have to use ARGO?",
    a: "No. You can always build your own blocks by exam, system, discipline, topic or question status, in tutor or timed mode. ARGO sessions are there when you want the next block chosen for you.",
  },
  {
    q: "How long before ARGO is useful?",
    a: "It starts on your first answer, but its picture sharpens with volume. Early sessions lean on scouting across high-weight systems; after a few hundred answers the weak-spot targets are much more specific.",
  },
  {
    q: "Does ARGO predict my USMLE score?",
    a: "No. The readiness index is your mastery across systems, weighted by how much each counts on the exam's content outline, on a 0 to 100 scale. It tracks progress; it isn't a predicted score.",
  },
  {
    q: "What happens to my answer data?",
    a: "It's used to run your ARGO model and your stats, and to show anonymous peer statistics on questions. We don't sell it or use advertising trackers. The [privacy policy](/privacy) has the details.",
  },
];

export default function ArgoPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "ARGO", path: PATH },
  ];
  return (
    <ContentPage>
      <PageHero
        crumbs={crumbs}
        eyebrow="ARGO adaptive analytics · included in Full access"
        title="How ARGO turns your question history into targeted practice"
        lead={
          <p>
            ARGO is Argonaut&apos;s analytics engine. It logs 16 data points on every answer, works out which topics are costing you the most points, and
            builds your next session around them. Then it measures again.
          </p>
        }
        actions={<Actions primary={{ href: "/free-usmle-practice-questions", label: "Try free questions" }} secondary={{ href: "/pricing", label: "See pricing" }} />}
      />

      <Section eyebrow="1 · Measure" title="What ARGO records on every answer" intro={<p>Sixteen signals in five groups. Nothing to fill in: they come from how you answer.</p>}>
        <div className="grid gap-0">
          {GROUPS.map((g) => (
            <div key={g.name} className="grid gap-3 border-t border-border py-5 first:border-t-2 first:border-text md:grid-cols-[180px_1fr] md:gap-8">
              <h3 className="text-[18px] font-bold">{g.name}</h3>
              <div>
                <p className="flex flex-wrap gap-2">
                  {g.points.map((p) => (
                    <span key={p} className="rounded-full border border-border bg-surface px-3 py-1 text-[13.5px] font-semibold">
                      {p}
                    </span>
                  ))}
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{g.note}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[14px] text-faint">{DATA_POINTS.length} data points in total. Confidence is asked in tutor mode and ARGO sessions.</p>
      </Section>

      <Section tone="surface" eyebrow="2 · Rank" title="What ARGO works out from them">
        <div className="grid gap-10">
          <div>
            <h3 className="text-[19px] font-bold">Mastery, topic by topic</h3>
            <p className="mt-2 max-w-[64ch] text-[16px] leading-relaxed text-muted">
              For every system, discipline and topic, ARGO estimates how well you know it and how much may have faded since you last saw it. A topic you
              aced months ago and haven&apos;t touched since drifts down the list of strengths. Estimates firm up as answers accumulate, so one lucky guess
              doesn&apos;t mark a topic as mastered.
            </p>
          </div>
          <div>
            <h3 className="text-[19px] font-bold">Why you missed it</h3>
            <p className="mt-2 max-w-[64ch] text-[16px] leading-relaxed text-muted">Every miss, and every lucky guess, gets one of these labels, each with its own fix:</p>
            <dl className="mt-5 grid gap-x-10 gap-y-4 md:grid-cols-2">
              {Object.values(ERROR_META).map((e) => (
                <div key={e.label} className="border-t border-border pt-3">
                  <dt className="text-[15.5px] font-bold">
                    {e.label} <span className="font-semibold text-faint">· {e.short}</span>
                  </dt>
                  <dd className="mt-1 text-[14.5px] leading-relaxed text-muted">{e.advice}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="text-[19px] font-bold">A readiness index, not a score prediction</h3>
            <p className="mt-2 max-w-[64ch] text-[16px] leading-relaxed text-muted">
              Readiness is your mastery across systems, weighted by how much each one counts on the official content outline, from 0 to 100. It shows
              whether the work is paying off. It is not a predicted USMLE score, and we don&apos;t sell it as one.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="ink" eyebrow="3 · Fix" title="How ARGO builds your next session" intro={<p>A default ARGO session is 20 questions, mixed like this. No more than three on one topic, and interleaved so neighbours rarely match.</p>}>
        <div>
          <div className="flex h-10 gap-1" role="img" aria-label="Session mix: 9 weak-spot questions, 4 confusion drills, 4 spaced retests, 3 coverage scouts">
            {MIX.flatMap((m) => Array.from({ length: m.n }, (_, i) => <span key={`${m.key}-${i}`} className={cn("flex-1 rounded-[3px]", TONE[m.key])} />))}
          </div>
          <dl className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {MIX.map((m) => (
              <div key={m.key} className="border-t border-on-ink/20 pt-4">
                <dt className="flex items-center gap-3 text-[17px] font-bold">
                  <span aria-hidden className={cn("size-3 rounded-[2px]", TONE[m.key])} />
                  {m.label}
                  <span className="readout ml-auto text-[14px] text-signal">{m.n} of 20</span>
                </dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-on-ink-muted">{m.body}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-[13.5px] text-on-ink-muted">If a slot can&apos;t be filled (say, you&apos;ve answered every question on a weak topic), ARGO fills it from the rest of the bank and tells you which topic ran short.</p>
        </div>
      </Section>

      <Section eyebrow="Example" title="One missed question, start to finish" intro={<p>An illustrative walk-through. Your sessions use your own answers.</p>}>
        <ol className="grid gap-0">
          {[
            ["You miss a question", "A renal tubular acidosis question. You picked the right answer first, changed it, and said you were fairly sure. Time: 2 min 10 s."],
            ["ARGO labels it", "Second-guessing: you changed away from the correct answer. Your renal acid-base mastery drops, and the confusion between type 1 and type 4 RTA is logged."],
            ["Your next session", "Two new acid-base questions near 70% predicted success, a confusion drill putting type 1 and type 4 RTA side by side, and the missed question again once a day has passed."],
            ["It measures again", "Get them right with confidence and the topic climbs. Keep missing them and ARGO keeps it at the top of your list."],
          ].map(([t, d], i) => (
            <li key={t} className="grid grid-cols-[48px_1fr] gap-2 border-t border-border py-5 first:border-t-2 first:border-text">
              <span className="readout pt-1 text-[14px] text-brand-strong">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-[19px] font-bold">{t}</h3>
                <p className="mt-1.5 max-w-[62ch] text-[15.5px] leading-relaxed text-muted">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="surface" eyebrow="Honest limits" title="What ARGO doesn't do">
        <div className="grid gap-8 md:grid-cols-2">
          {[
            ["It starts from zero", "On day one ARGO knows nothing about you, so early sessions scout widely. The targets get sharper with every block."],
            ["It can only use the bank", "ARGO picks from questions that exist. When a weak topic runs out of unseen questions it tells you, and the add-on can write more."],
            ["It doesn't predict your score", "Readiness is a progress measure. No algorithm can promise a result, and the terms say plainly that we don't."],
            ["It doesn't decide for you", "Build your own blocks whenever you like. ARGO sessions are optional, in tutor or timed mode."],
          ].map(([t, d]) => (
            <div key={t} className="border-t-2 border-text pt-4">
              <h3 className="text-[18px] font-bold">{t}</h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Optional add-on · $4.99 a month" title="When the bank runs out: ARGO question writing">
        <div className="grid max-w-[68ch] gap-4 text-[16.5px] leading-relaxed text-muted">
          <p>
            Choosing existing questions is part of Full access. Writing new ones is the add-on. Once you&apos;ve used up the bank&apos;s questions on a topic
            you keep missing, ARGO writes new ones aimed at that concept, using the wrong answers you keep picking as the distractors.
          </p>
          <p>
            Before a written question reaches you, an independent AI solver answers it without seeing the key, and an audit checks the keyed answer, the facts
            and the explanations. Questions that fail are discarded. Written questions are private to your account: they never appear on the public site or in
            anyone else&apos;s bank.
          </p>
        </div>
      </Section>

      <section className="border-t border-border bg-surface">
        <Container className="grid gap-12 py-20 lg:grid-cols-12">
          <h2 className="display text-[clamp(32px,3.6vw,52px)] font-bold lg:col-span-4">ARGO, answered.</h2>
          <div className="lg:col-span-8">
            <Faq items={FAQ} />
          </div>
        </Container>
      </section>

      <CtaBand
        title="Let ARGO pick your next block."
        body="Start with the free questions. Full access unlocks ARGO and the whole bank for $48 once."
        primary={{ href: "/signup", label: "Start free" }}
        secondary={{ href: "/usmle-step-1-question-bank", label: "Step 1 bank" }}
      />

      <JsonLd graph={[breadcrumbs(crumbs), webPage({ path: PATH, name: `${TITLE} | Argonaut USMLE`, description: DESCRIPTION, crumbs }), faqPage(PATH, FAQ)]} />
    </ContentPage>
  );
}
