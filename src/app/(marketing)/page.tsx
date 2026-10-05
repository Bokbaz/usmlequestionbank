import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArgoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { TimingTower } from "@/components/marketing/timing-tower";
import { Telemetry } from "@/components/marketing/telemetry";
import { Reveal } from "@/components/marketing/reveal";
import { AnswerTrace } from "@/components/marketing/answer-trace";
import { SellingPoints } from "@/components/marketing/selling-points";
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
    const [daily, leaders] = await Promise.all([sb.rpc("daily_today", { p_guest: null }), sb.rpc("daily_leaderboard", { p_limit: 5 })]);
    return {
      daily: (daily.data as DailyState) ?? null,
      leaders: (leaders.data as LeaderRow[]) ?? [],
    };
  } catch {
    return { daily: null, leaders: [] };
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

// A faint accuracy trace behind the hero copy, drawn once on load.
const TRACE =
  "M0,250 C80,246 120,232 180,236 S300,214 360,206 S470,212 520,188 S640,170 700,160 S820,150 880,122 S1000,112 1060,96 S1180,70 1240,64 S1360,40 1440,30";

function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.09] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px)] [background-size:calc(100%/12)_100%]" />
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:100%_64px]" />
      <svg viewBox="0 0 1440 280" preserveAspectRatio="none" className="absolute inset-x-0 top-[10%] h-[34%] w-full">
        <path
          d={TRACE}
          pathLength={1}
          fill="none"
          stroke="var(--signal)"
          strokeOpacity="0.3"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="1"
          className="motion-safe:animate-[draw_2.8s_var(--ease-out-expo)_0.5s_both]"
        />
      </svg>
      <span className="absolute inset-y-0 left-0 w-px bg-linear-to-b from-transparent via-signal/60 to-transparent motion-safe:animate-[scan_7s_linear_1.2s_infinite] motion-reduce:hidden" />
    </div>
  );
}

const HEADLINE = ["The USMLE Qbank", "that studies you."];

const STEPS = [
  { n: "01", t: "Measure", d: "16 data points on every answer. Every second, every changed mind." },
  { n: "02", t: "Find", d: "The exact topics costing you points, ranked by how much." },
  { n: "03", t: "Fix", d: "A session built to close the biggest gap. Then we measure again." },
];

const BANK_FACTS = [
  { t: "Tutor or timed", d: "Learn as you go, or sit a full block under the clock." },
  { t: "Real exam tools", d: "Highlight, strike out, lab values, calculator, notes." },
  { t: "Peer stats", d: "See how everyone else answered, and how long they took." },
  { t: "Keyboard first", d: "A to E to answer, N and P to move, M to mark." },
];

export default async function HomePage() {
  const { daily, leaders } = await getData();

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero: deep teal */}
        <section className="on-signal relative overflow-hidden bg-brand text-on-brand">
          <HeroBackdrop />
          <div className="relative mx-auto max-w-[1320px] px-5 pt-28 md:px-8 md:pt-36">
            <div className="flex items-center gap-4 motion-safe:animate-[fade-up_700ms_var(--ease-out-expo)_both]">
              <p className="eyebrow">USMLE Step 1 · Step 2 CK</p>
              <span className="h-px flex-1 bg-on-brand/30" />
              <p className="readout hidden text-[12px] text-on-brand-muted sm:block">ARGO · 16 channels · live</p>
            </div>

            <h1 className="display mt-8 text-[clamp(34px,9.4vw,132px)] font-bold">
              {HEADLINE.map((line, i) => (
                <span key={line} className="block overflow-hidden pb-[0.06em]">
                  <span
                    className="block motion-safe:animate-[rise_1s_var(--ease-out-expo)_both]"
                    style={{ animationDelay: `${120 + i * 110}ms` }}
                  >
                    {i === 1 ? (
                      <>
                        that <span className="text-signal">studies you.</span>
                      </>
                    ) : (
                      line
                    )}
                  </span>
                </span>
              ))}
            </h1>

            <div className="mt-12 grid gap-12 border-t border-on-brand/30 pb-14 pt-9 lg:mt-14 lg:grid-cols-[1fr_440px] lg:gap-16">
              <div className="motion-safe:animate-[fade-up_900ms_var(--ease-out-expo)_450ms_both]">
                <p className="max-w-[40ch] text-[19px] font-medium leading-[1.5] md:text-[22px]">
                  Powered by <strong className="font-bold">ARGO</strong>, our algorithm that learns your weak spots over time, then
                  tailors your questions to fix them.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Button asChild variant="carbon" size="xl" className="group">
                    <Link href="/signup">
                      Start free <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                  <Button asChild variant="carbon-outline" size="xl">
                    <Link href="/daily">Try today&apos;s question</Link>
                  </Button>
                </div>
                <p className="mt-4 text-[14px] font-medium text-on-brand-muted">
                  Free to start. <span className="text-on-brand">$48 for lifetime access</span> when you&apos;re ready.
                </p>
              </div>
              <div className="relative z-10 motion-safe:animate-[fade-up_1s_var(--ease-out-expo)_600ms_both]">
                <TimingTower />
              </div>
            </div>

            <AnswerTrace className="motion-safe:animate-[fade-up_1s_var(--ease-out-expo)_800ms_both]" />
            <div className="h-14" />
          </div>
          <Ruler id="ruler-hero" className="relative block text-on-brand/50" />
        </section>

        {/* Why Argonaut: the three selling points, straight after the hero */}
        <section className="bg-bg">
          <div className="mx-auto max-w-[1320px] px-5 pb-20 pt-24 md:px-8 md:pb-28 md:pt-32">
            <Reveal className="grid gap-6 pb-14 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <p className="eyebrow text-brand-strong">Why Argonaut</p>
                <h2 className="display mt-6 max-w-[18ch] text-[clamp(38px,5vw,76px)] font-bold">
                  Built to move your score. Priced so you can afford it.
                </h2>
              </div>
              <p className="max-w-[38ch] text-[17px] leading-relaxed text-muted lg:col-span-4">
                Our whole job is getting you the score you want: a Step 1 pass you never had to sweat, a Step 2 CK score you&apos;re proud
                of. Here&apos;s how.
              </p>
            </Reveal>
            <SellingPoints />
          </div>
        </section>

        {/* ARGO: the motto, shown as telemetry */}
        <section id="argo" className="relative bg-ink text-on-ink">
          <div className="mx-auto max-w-[1320px] px-5 py-28 md:px-8 md:py-36">
            <Reveal>
              <div className="flex items-center gap-2.5">
                <ArgoMark className="size-5 text-on-ink" apex="signal" />
                <p className="eyebrow text-on-ink-muted">ARGO analytics</p>
              </div>
              <h2 className="display mt-7 max-w-[22ch] text-[clamp(34px,4.6vw,68px)] font-bold">
                Analytics so deep, not improving is practically a <span className="text-signal">mathematical impossibility.</span>
              </h2>
            </Reveal>

            <div className="mt-16 grid gap-12 lg:mt-20 lg:grid-cols-[340px_1fr] lg:gap-16">
              <ol className="grid content-start gap-0">
                {STEPS.map((s, i) => (
                  <Reveal
                    as="li"
                    key={s.n}
                    delay={i * 0.08}
                    className="grid grid-cols-[48px_1fr] gap-2 border-t border-on-ink/15 py-6 first:border-t-2 first:border-signal"
                  >
                    <span className="readout text-[14px] text-signal">{s.n}</span>
                    <div>
                      <h3 className="display text-[30px] font-bold leading-none">{s.t}</h3>
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
                <h2 className="display mt-6 text-[clamp(36px,4.4vw,64px)] font-bold">Feels like test day. That&apos;s the point.</h2>
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
              <h2 className="display mt-6 text-[clamp(34px,3.8vw,56px)] font-bold">Gold means the exam loves it.</h2>
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
              <h2 className="display mt-6 text-[clamp(34px,3.8vw,56px)] font-bold">Read it. Then drill it.</h2>
              <p className="mt-5 max-w-[44ch] text-[17px] leading-relaxed text-muted">
                Short, high-yield chapters for every system, built from the explanations. One click takes you from a chapter to its
                questions.
              </p>
              <div className="mt-10">
                <LibraryDemo />
              </div>
              <Link
                href="/library"
                className="mt-6 inline-flex items-center gap-2 text-[15px] font-bold text-text underline decoration-brand-strong decoration-2 underline-offset-[6px] hover:decoration-text"
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
                <h2 className="display mt-6 text-[clamp(36px,4.4vw,64px)] font-bold">
                  <span className="whitespace-nowrap">Big-bank</span> quality. Not <span className="whitespace-nowrap">big-bank</span>{" "}
                  prices.
                </h2>
              </div>
              <p className="max-w-[36ch] text-[18px] leading-relaxed text-muted lg:col-span-4">
                $48 once for lifetime access. Education should be affordable, and it should never be a subscription.
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
              <h2 className="display text-[clamp(34px,3.8vw,56px)] font-bold">Straight answers.</h2>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-8">
              <Faq />
            </Reveal>
          </div>
        </section>

        {/* Closing call */}
        <section className="on-signal relative overflow-hidden bg-brand text-on-brand">
          <Ruler id="ruler-close" className="block text-on-brand/50" />
          <div className="mx-auto flex max-w-[1320px] flex-col gap-10 px-5 py-24 md:px-8 md:py-32 lg:flex-row lg:items-end lg:justify-between">
            <Reveal>
              <h2 className="display max-w-[14ch] text-[clamp(44px,6.6vw,104px)] font-bold">
                Lights out. Let&apos;s get you that score.
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="shrink-0">
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="carbon" size="xl" className="group">
                  <Link href="/signup">
                    Start free <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild variant="carbon-outline" size="xl">
                  <Link href="/daily">Try today&apos;s question</Link>
                </Button>
              </div>
              <p className="readout mt-4 text-[13px] text-on-brand-muted">$48 · once · lifetime access</p>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
