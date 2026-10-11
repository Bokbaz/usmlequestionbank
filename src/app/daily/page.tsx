import type { Metadata } from "next";
import Link from "next/link";
import { DailyGame } from "@/components/daily/daily-game";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { QuestionRows } from "@/components/practice/question-list";
import { JsonLd } from "@/components/seo/json-ld";
import { getDailyArchive } from "@/lib/public/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbs, faqPage, itemList, webPage } from "@/lib/seo/schema";
import { createPublicClient } from "@/lib/supabase/public";
import type { DailyState } from "@/lib/daily/types";

const TITLE = "Daily USMLE Step 1 Question Challenge";
const DESCRIPTION =
  "One hard USMLE Step 1 question a day, two minutes on the clock and a global leaderboard. Free, no account needed. Past questions stay free with explanations.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/daily", ownImage: true });

// Prerendered and refreshed every minute; the game then loads the visitor's own state in the
// browser. Today's question is never in the HTML: it appears only when the clock starts.
export const revalidate = 60;

const FAQ: FaqItem[] = [
  {
    q: "What is the Argonaut Daily Challenge?",
    a: "One hard USMLE Step 1 question every day, the same for everyone. You get two minutes once you reveal it, and correct answers are ranked by speed on a global leaderboard.",
  },
  {
    q: "Do I need an account to play?",
    a: "No. Play as a guest, then sign up free afterwards to claim your spot on the leaderboard and start a streak.",
  },
  {
    q: "How is the score calculated?",
    a: "A correct answer scores between 500 and 1,000 points: the faster you answer, the more you score. Wrong answers score zero, and correct answers in under 8 seconds aren't ranked.",
  },
  {
    q: "When does the next question come out?",
    a: "Every day at 00:00 UTC.",
  },
  {
    q: "Can I see past Daily Challenge questions?",
    a: "Yes. When a day ends, its question joins the free archive below, with the full explanation of every answer choice. You'll find them with the other [free USMLE questions](/free-usmle-practice-questions) too.",
  },
];

const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export default async function DailyPage() {
  const [{ data }, archive] = await Promise.all([createPublicClient().rpc("daily_today", { p_guest: null }), getDailyArchive().catch(() => [])]);
  const today = (data as DailyState) ?? null;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Daily Challenge", path: "/daily" },
  ];

  return (
    <>
      <header className="mb-8">
        <p className="eyebrow text-brand-strong">
          {today?.available ? `Daily Challenge #${today.number} · ${fmtDay(today.day)}` : "Daily Challenge"}
        </p>
        <h1 className="display mt-4 text-[clamp(34px,4.4vw,56px)] font-bold">Daily USMLE Challenge</h1>
        <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-muted">
          One hard Step 1 question a day{today?.system ? `. Today's is from ${today.system}` : ""}. Two minutes on the clock, ranked by speed, free to play without
          an account.
        </p>
      </header>

      <DailyGame initial={today} />

      <section className="mt-16 grid gap-8 border-t-2 border-text pt-8 md:grid-cols-3">
        {[
          ["Reveal", "The clock starts when you open the question. You have two minutes."],
          ["Answer", "Lock in one answer. Correct answers are ranked by speed; anything under 8 seconds isn't ranked."],
          ["Review", "Read the explanation straight away. Tomorrow the question joins the free archive."],
        ].map(([t, d], i) => (
          <div key={t}>
            <p className="readout text-[13px] text-brand-strong">{String(i + 1).padStart(2, "0")}</p>
            <h2 className="mt-2 text-[19px] font-bold">{t}</h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{d}</p>
          </div>
        ))}
      </section>

      {archive.length > 0 && (
        <section id="archive" className="mt-16 scroll-mt-24">
          <h2 className="display text-[clamp(28px,3vw,40px)] font-bold">Previous challenges</h2>
          <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-muted">
            Every past Daily Challenge, free with the full explanation. No account needed.{" "}
            <Link href="/daily/leaderboard" className="font-semibold text-text underline underline-offset-4">
              See today&apos;s leaderboard
            </Link>
          </p>
          <QuestionRows questions={archive.slice(0, 60)} className="mt-6" />
        </section>
      )}

      <section className="mt-16">
        <h2 className="display text-[clamp(28px,3vw,40px)] font-bold">How the Daily Challenge works</h2>
        <div className="mt-6">
          <Faq items={FAQ} />
        </div>
      </section>

      <JsonLd
        graph={[
          breadcrumbs(crumbs),
          webPage({ path: "/daily", name: `${TITLE} | Argonaut USMLE`, description: DESCRIPTION, crumbs }),
          ...(archive.length ? [itemList("/daily", "Previous Daily Challenge questions", archive.slice(0, 60).map((q) => ({ name: `Daily Challenge #${q.daily.number}: ${q.topic ?? q.system.short}`, path: q.path })))] : []),
          faqPage("/daily", FAQ),
        ]}
      />
    </>
  );
}
