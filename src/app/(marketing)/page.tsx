import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { Constellation } from "@/components/marketing/constellation";
import { HeroDemo } from "@/components/marketing/hero-demo";
import { Reveal } from "@/components/marketing/reveal";
import { ExamDemo } from "@/components/marketing/exam-demo";
import { ArgoStory } from "@/components/marketing/argo-story";
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

export default async function HomePage() {
  const { daily, leaders, indexLines } = await getData();

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-ink text-on-ink">
          <Constellation className="pointer-events-none absolute inset-0 h-full w-full text-on-ink/60" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />
          <div className="relative mx-auto grid min-h-[100svh] max-w-[1240px] items-center gap-14 px-5 pb-20 pt-32 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-28">
            <div>
              <Reveal y={20}>
                <p className="eyebrow text-on-ink-muted">USMLE Step 1 · Step 2 CK</p>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="display mt-6 text-[clamp(46px,6.8vw,98px)] font-[820]">
                  The question bank that hunts your weaknesses.
                </h1>
              </Reveal>
              <Reveal delay={0.18}>
                <p className="mt-7 max-w-[50ch] text-[18px] leading-relaxed text-on-ink-muted">
                  Exam-faithful questions with an explanation for every answer choice. And ARGO, an analytics engine that
                  measures how you think, finds what you&apos;re missing, and builds your next session around it.
                </p>
              </Reveal>
              <Reveal delay={0.26}>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Button asChild variant="ink" size="xl">
                    <Link href="/daily">
                      Play today&apos;s Daily Challenge <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="ink-outline" size="xl">
                    <Link href="/signup">Start free</Link>
                  </Button>
                </div>
                <p className="mt-4 text-[13px] text-on-ink-muted">No card required. The Daily Challenge needs no account.</p>
              </Reveal>
            </div>
            <HeroDemo />
          </div>
        </section>

        {/* Proof band: facts, set as one line of type */}
        <section className="border-b border-border bg-surface">
          <Reveal className="mx-auto max-w-[1240px] px-5 py-9 md:px-8">
            <p className="text-[15px] leading-relaxed text-muted md:text-[16px]">
              Tagged to all <span className="font-semibold text-text">19 systems</span> of the 2026 USMLE content outline
              <span className="mx-3 text-border-strong" aria-hidden>/</span>
              <span className="font-semibold text-text">15 physician tasks</span> tracked separately
              <span className="mx-3 text-border-strong" aria-hidden>/</span>
              {indexLines ? (
                <>
                  <span className="font-semibold text-text">{indexLines.toLocaleString()}</span> high-yield concepts indexed for Nuggets
                </>
              ) : (
                <>A high-yield concept index behind every Nugget</>
              )}
              <span className="mx-3 text-border-strong" aria-hidden>/</span>
              Written to the <span className="font-semibold text-text">NBME item-writing standard</span>
            </p>
          </Reveal>
        </section>

        {/* Exam interface */}
        <section className="bg-bg">
          <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 py-28 md:px-8 md:py-36 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <p className="eyebrow text-brand">The question bank</p>
              <h2 className="display mt-5 text-[clamp(36px,4.6vw,64px)] font-[800]">Practice on the screen you&apos;ll test on.</h2>
              <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-muted">
                Vignettes written to the NBME item-writing standard, in an interface that behaves like test day: timed
                blocks, highlighting, strike-outs, lab values and keyboard control.
              </p>
              <ul className="mt-8 grid gap-4">
                {[
                  ["Tutor and timed modes", "Learn as you go, or simulate a full block and review at the end."],
                  ["Every choice explained", "Why the answer is right and why each distractor is wrong."],
                  ["See how others answered", "Peer percentages on every option and average time per question."],
                ].map(([t, d]) => (
                  <li key={t} className="grid gap-0.5">
                    <span className="text-[16px] font-semibold">{t}</span>
                    <span className="text-[15px] text-muted">{d}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.12}>
              <ExamDemo />
            </Reveal>
          </div>
        </section>

        <ArgoStory />

        {/* Nuggets */}
        <section className="bg-bg">
          <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 py-28 md:px-8 md:py-36 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal delay={0.1} className="order-2 lg:order-1">
              <NuggetDemo />
            </Reveal>
            <Reveal className="order-1 lg:order-2">
              <p className="eyebrow text-gold-ink">Nuggets</p>
              <h2 className="display mt-5 text-[clamp(36px,4.6vw,64px)] font-[800]">Gold means the exam loves it.</h2>
              <p className="mt-6 max-w-[44ch] text-[17px] leading-relaxed text-muted">
                Every question is checked against an index of high-yield concepts. When the point it tests is one of them,
                it wears gold, and the concept joins your Nugget collection so you can see which classics you own and
                which still beat you.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Library */}
        <section id="library" className="border-y border-border bg-panel">
          <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 py-28 md:px-8 md:py-36 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <p className="eyebrow text-brand">The Library</p>
              <h2 className="display mt-5 text-[clamp(36px,4.6vw,64px)] font-[800]">A textbook written by the questions.</h2>
              <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-muted">
                Every explanation feeds a concise, high-yield chapter organized by the USMLE outline. Read the chapter,
                then drill the questions that test it in one click.
              </p>
              <Button asChild variant="secondary" size="lg" className="mt-8">
                <Link href="/library">
                  Browse the Library <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Reveal>
            <Reveal delay={0.12}>
              <LibraryDemo />
            </Reveal>
          </div>
        </section>

        <DailyTeaser daily={daily} leaders={leaders} />

        {/* Pricing */}
        <section id="pricing" className="bg-bg">
          <div className="mx-auto max-w-[1240px] px-5 py-28 md:px-8 md:py-36">
            <Reveal className="mx-auto max-w-[720px] text-center">
              <p className="eyebrow text-brand">Pricing</p>
              <h2 className="display mt-5 text-[clamp(36px,4.6vw,64px)] font-[800]">Start free. Upgrade when it&apos;s working.</h2>
            </Reveal>
            <Reveal delay={0.1} className="mt-14">
              <PricingTable />
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-surface">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-28 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              <h2 className="display text-[clamp(32px,3.8vw,52px)] font-[800]">Questions, answered.</h2>
            </Reveal>
            <Reveal delay={0.08}>
              <Faq />
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
