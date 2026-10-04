import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArgoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { TimingTower } from "@/components/marketing/timing-tower";
import { Telemetry } from "@/components/marketing/telemetry";
import { Reveal } from "@/components/marketing/reveal";
import { ExamDemo } from "@/components/marketing/exam-demo";
import { NuggetDemo } from "@/components/marketing/nugget-demo";
import { LibraryDemo } from "@/components/marketing/library-demo";
import { DailyTeaser } from "@/components/marketing/daily-teaser";
import { PricingTable } from "@/components/marketing/pricing-table";
import { Faq } from "@/components/marketing/faq";
import { createPublicClient } from "@/lib/supabase/public";
import type { DailyState, LeaderRow } from "@/lib/daily/types";

export const revalidate = 60;

async function getData() {
  try {
    const sb = createPublicClient();
    const [daily, leaders, totals] = await Promise.all([
      sb.rpc("daily_today", { p_guest: null }),
      sb.rpc("daily_leaderboard", { p_limit: 5 }),
      sb.rpc("nugget_totals"),
    ]);
    return {
      daily: (daily.data as DailyState) ?? null,
      leaders: (leaders.data as LeaderRow[]) ?? [],
      indexLines: (totals.data as { index_lines: number } | null)?.index_lines ?? 0,
    };
  } catch {
    return { daily: null, leaders: [], indexLines: 0 };
  }
}

// Fine tick marks along an edge: the "measured to the millimetre" motif.
function Ruler({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={className} width="100%" height="14" aria-hidden>
      <defs>
        <pattern id={id} width="80" height="14" patternUnits="userSpaceOnUse">
          <rect x="0" width="1.5" height="14" fill="currentColor" />
          <rect x="40" width="1" height="9" fill="currentColor" />
          {[8, 16, 24, 32, 48, 56, 64, 72].map((x) => (
            <rect key={x} x={x} width="1" height="5" fill="currentColor" opacity="0.7" />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="14" fill={`url(#${id})`} />
    </svg>
  );
}

const STEPS = [
  { n: "01", t: "Measure", d: "Every answer, every second, every time you change your mind." },
  { n: "02", t: "Find", d: "The exact topics costing you points, ranked by how much." },
  { n: "03", t: "Fix", d: "A session built to close the gap. Then we measure again." },
];

const BANK_FACTS = [
  { t: "Tutor or timed", d: "Learn as you go, or sit a full block under the clock." },
  { t: "Real exam tools", d: "Highlight, strike out, lab values, calculator, notes." },
  { t: "Peer stats", d: "See how everyone else answered, and how long they took." },
  { t: "Keyboard first", d: "A to E to answer, N and P to move, M to mark." },
];

export default async function HomePage() {
  const { daily, leaders, indexLines } = await getData();

  const specs = [
    { v: "19", l: "systems on the USMLE outline, all tracked" },
    { v: "5/5", l: "answer choices explained on every question" },
    indexLines
      ? { v: indexLines.toLocaleString(), l: "high-yield facts behind the Nuggets" }
      : { v: "15", l: "physician tasks scored separately" },
    { v: "$48", l: "once. No subscription, no expiry date." },
  ];

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero: signal orange */}
        <section className="on-signal relative bg-brand text-on-brand">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px)] [background-size:calc(100%/12)_100%]"
          />
          <div className="relative mx-auto max-w-[1320px] px-5 pt-28 md:px-8 md:pt-32">
            <Reveal y={12}>
              <div className="flex items-center gap-4">
                <p className="eyebrow">USMLE Step 1 · Step 2 CK</p>
                <span className="h-px flex-1 bg-on-brand/30" />
                <p className="eyebrow hidden sm:block">Est. 2026</p>
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="display slant mt-8 max-w-[15ch] text-[clamp(40px,7.4vw,112px)] font-[880]">
                A question bank that runs like an F1&nbsp;team.
              </h1>
            </Reveal>

            <div className="mt-12 grid gap-12 border-t-2 border-on-brand pb-16 pt-9 lg:mt-14 lg:grid-cols-[1fr_440px] lg:gap-16 lg:pb-0">
              <Reveal delay={0.14}>
                <p className="max-w-[44ch] text-[19px] font-semibold leading-[1.5] md:text-[21px]">
                  Every answer you give is data. We find exactly where you&apos;re dropping points, and drill you there until you
                  aren&apos;t.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Button asChild variant="carbon" size="xl">
                    <Link href="/signup">
                      Start free <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="carbon-outline" size="xl">
                    <Link href="/daily">Try today&apos;s question</Link>
                  </Button>
                </div>
                <p className="mt-4 text-[14px] font-semibold text-on-brand-muted">Free to start. No card needed.</p>
              </Reveal>
              <Reveal delay={0.22} className="relative z-10 lg:-mb-48">
                <TimingTower />
              </Reveal>
            </div>
          </div>
          <Ruler id="ruler-hero" className="relative block text-on-brand/60" />
        </section>

        {/* Specs + season objectives */}
        <section className="bg-bg">
          <div className="mx-auto max-w-[1320px] px-5 pt-14 md:px-8 lg:pt-16">
            <Reveal>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4 lg:mr-[calc(440px+4rem)] lg:grid-cols-2 xl:grid-cols-4">
                {specs.map((s) => (
                  <div key={s.l} className="border-t border-text pt-4">
                    <dt className="display text-[28px] font-[880] leading-none tabular [font-stretch:108%]">{s.v}</dt>
                    <dd className="mt-2 max-w-[22ch] text-[14px] leading-snug text-muted">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <div className="mx-auto max-w-[1320px] px-5 pb-28 pt-28 md:px-8 md:pb-36 lg:pt-40">
            <div className="grid gap-10 lg:grid-cols-12">
              <Reveal className="lg:col-span-3">
                <p className="eyebrow text-brand-strong">Season objectives</p>
              </Reveal>
              <div className="lg:col-span-9">
                {[
                  {
                    n: "01",
                    t: "Your score is the whole job.",
                    d: "We'll do our genuine best to get you there: a Step 1 pass you never had to sweat, and a Step 2 CK score you're proud of. Nothing here is for any other reason.",
                  },
                  {
                    n: "02",
                    t: "Side mission: beat the giants.",
                    d: "The big banks are good. They also cost hundreds and run out. We're building the same quality for $48, once, and it never expires.",
                  },
                ].map((o, i) => (
                  <Reveal key={o.n} delay={i * 0.08}>
                    <article className="grid gap-4 border-t border-border py-10 first:border-t-2 first:border-text md:grid-cols-[150px_1fr] md:gap-6 md:py-12">
                      <span className="display text-[48px] font-[900] leading-none text-brand md:text-[60px]">{o.n}</span>
                      <div>
                        <h2 className="display text-[clamp(32px,4.2vw,60px)] font-[850]">{o.t}</h2>
                        <p className="mt-5 max-w-[56ch] text-[18px] leading-relaxed text-muted">{o.d}</p>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ARGO: the motto, shown as telemetry */}
        <section id="argo" className="relative bg-ink text-on-ink">
          <div className="mx-auto max-w-[1320px] px-5 py-28 md:px-8 md:py-36">
            <Reveal>
              <div className="flex items-center gap-2.5">
                <ArgoMark className="size-5 text-on-ink" />
                <p className="eyebrow text-on-ink-muted">ARGO analytics</p>
              </div>
              <h2 className="display mt-7 max-w-[22ch] text-[clamp(34px,4.6vw,68px)] font-[850]">
                Analytics so deep, not improving is practically a <span className="text-brand">mathematical impossibility.</span>
              </h2>
            </Reveal>

            <div className="mt-16 grid gap-12 lg:mt-20 lg:grid-cols-[340px_1fr] lg:gap-16">
              <ol className="grid content-start gap-0">
                {STEPS.map((s, i) => (
                  <Reveal
                    as="li"
                    key={s.n}
                    delay={i * 0.08}
                    className="grid grid-cols-[48px_1fr] gap-2 border-t border-on-ink/15 py-6 first:border-t-2 first:border-brand"
                  >
                    <span className="font-display text-[14px] font-[800] text-brand tabular">{s.n}</span>
                    <div>
                      <h3 className="display text-[30px] font-[850] leading-none">{s.t}</h3>
                      <p className="mt-3 text-[16px] leading-relaxed text-on-ink-muted">{s.d}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>
              <Reveal delay={0.1}>
                <Telemetry />
                <p className="mt-4 text-[13px] text-on-ink-muted">Example data. Dashed lines mark ARGO sessions.</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* The questions */}
        <section className="bg-bg">
          <div className="mx-auto max-w-[1320px] px-5 py-28 md:px-8 md:py-36">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
              <Reveal className="lg:col-span-6">
                <p className="eyebrow text-brand-strong">The questions</p>
                <h2 className="display mt-6 text-[clamp(36px,4.4vw,64px)] font-[850]">Feels like test day. That&apos;s the point.</h2>
                <p className="mt-6 max-w-[46ch] text-[18px] leading-relaxed text-muted">
                  Written to NBME standards. Every answer choice explained: the right one, and the four that tempted you.
                </p>
              </Reveal>
              <Reveal delay={0.08} className="lg:col-span-5 lg:col-start-8">
                <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                  {BANK_FACTS.map((f) => (
                    <li key={f.t} className="border-t border-text pt-3">
                      <p className="text-[16px] font-bold">{f.t}</p>
                      <p className="mt-1 text-[14.5px] leading-snug text-muted">{f.d}</p>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <Reveal delay={0.1} className="mt-16">
              <ExamDemo />
            </Reveal>
          </div>
        </section>

        {/* Nuggets + Library */}
        <section id="library" className="border-y border-border bg-panel">
          <div className="mx-auto grid max-w-[1320px] px-5 md:px-8 lg:grid-cols-2">
            <Reveal className="py-24 lg:border-r lg:border-border lg:py-32 lg:pr-14">
              <p className="eyebrow text-gold-ink">Nuggets</p>
              <h2 className="display mt-6 text-[clamp(34px,3.8vw,56px)] font-[850]">Gold means the exam loves it.</h2>
              <p className="mt-5 max-w-[44ch] text-[17px] leading-relaxed text-muted">
                The facts that come up again and again are marked gold. Collect them as you go, and see which classics you&apos;ve nailed
                and which still catch you out.
              </p>
              <div className="mt-10">
                <NuggetDemo />
              </div>
            </Reveal>
            <Reveal delay={0.08} className="border-t border-border py-24 lg:border-t-0 lg:py-32 lg:pl-14">
              <p className="eyebrow text-brand-strong">The Library</p>
              <h2 className="display mt-6 text-[clamp(34px,3.8vw,56px)] font-[850]">Read it. Then drill it.</h2>
              <p className="mt-5 max-w-[44ch] text-[17px] leading-relaxed text-muted">
                Short, high-yield chapters for every system, built from the explanations. One click takes you from a chapter to its
                questions.
              </p>
              <div className="mt-10">
                <LibraryDemo />
              </div>
              <Link
                href="/library"
                className="mt-6 inline-flex items-center gap-2 text-[15px] font-bold text-text underline decoration-brand decoration-2 underline-offset-[6px] hover:decoration-text"
              >
                Browse the Library <ArrowRight className="size-4" />
              </Link>
            </Reveal>
          </div>
        </section>

        <DailyTeaser daily={daily} leaders={leaders} />

        {/* Pricing */}
        <section id="pricing" className="bg-bg">
          <div className="mx-auto max-w-[1320px] px-5 py-28 md:px-8 md:py-36">
            <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <p className="eyebrow text-brand-strong">Pricing</p>
                <h2 className="display mt-6 text-[clamp(36px,4.4vw,64px)] font-[850]">
                  <span className="whitespace-nowrap">Big-bank</span> quality. Not <span className="whitespace-nowrap">big-bank</span>{" "}
                  prices.
                </h2>
              </div>
              <p className="max-w-[36ch] text-[18px] leading-relaxed text-muted lg:col-span-4">
                Everything for $48, once. No subscription, no expiry date, no catch.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="mt-16">
              <PricingTable />
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-surface">
          <div className="mx-auto grid max-w-[1320px] gap-12 px-5 py-28 md:px-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <h2 className="display text-[clamp(34px,3.8vw,56px)] font-[850]">Straight answers.</h2>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-8">
              <Faq />
            </Reveal>
          </div>
        </section>

        {/* Closing call */}
        <section className="on-signal relative overflow-hidden bg-brand text-on-brand">
          <Ruler id="ruler-close" className="block text-on-brand/60" />
          <div className="mx-auto flex max-w-[1320px] flex-col gap-10 px-5 py-24 md:px-8 md:py-32 lg:flex-row lg:items-end lg:justify-between">
            <Reveal>
              <h2 className="display slant max-w-[14ch] text-[clamp(44px,6.6vw,104px)] font-[900]">
                Lights out. Let&apos;s get you that score.
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="flex shrink-0 flex-wrap gap-3">
              <Button asChild variant="carbon" size="xl">
                <Link href="/signup">
                  Start free <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="carbon-outline" size="xl">
                <Link href="/daily">Try today&apos;s question</Link>
              </Button>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
