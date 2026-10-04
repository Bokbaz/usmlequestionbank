import Link from "next/link";
import { ArrowRight, Timer, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/daily/countdown";
import { Reveal } from "@/components/marketing/reveal";
import type { DailyState, LeaderRow } from "@/lib/daily/types";
import { formatSeconds } from "@/lib/utils";

export function DailyTeaser({ daily, leaders }: { daily: DailyState | null; leaders: LeaderRow[] }) {
  return (
    <section id="daily" className="relative overflow-hidden bg-ink text-on-ink">
      <div className="mx-auto grid max-w-[1240px] gap-14 px-5 py-28 md:grid-cols-[1.05fr_1fr] md:px-8 md:py-36">
        <Reveal>
          <p className="eyebrow text-on-ink-muted">Daily Challenge{daily?.available ? ` · #${daily.number}` : ""}</p>
          <h2 className="display mt-5 text-[clamp(40px,5.6vw,76px)] font-[800]">
            One question.
            <br />
            Two minutes.
            <br />
            Everyone.
          </h2>
          <p className="mt-6 max-w-[44ch] text-[17px] leading-relaxed text-on-ink-muted">
            Every day, one brutal Step 1 question. Correct answers are ranked by speed on a global leaderboard. No account
            needed to play; create one to claim your rank and keep your streak.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="ink" size="lg">
              <Link href="/daily">
                Play today&apos;s question <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="ink-outline" size="lg">
              <Link href="/daily/leaderboard">Leaderboard</Link>
            </Button>
          </div>
          {daily?.available && (
            <dl className="mt-10 grid max-w-[460px] grid-cols-3 gap-6">
              <div>
                <dt className="text-[12.5px] text-on-ink-muted">Today&apos;s system</dt>
                <dd className="mt-1 text-[16px] font-semibold">{daily.system}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[12.5px] text-on-ink-muted">
                  <Users className="size-3.5" /> Players
                </dt>
                <dd className="mt-1 text-[16px] font-semibold">{daily.players.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[12.5px] text-on-ink-muted">
                  <Timer className="size-3.5" /> Next in
                </dt>
                <dd className="mt-1 text-[16px] font-semibold tabular">
                  <Countdown to={daily.next_reset} />
                </dd>
              </div>
            </dl>
          )}
        </Reveal>
        <Reveal delay={0.15} className="self-center">
          <div className="rounded-[14px] border border-white/10 bg-ink-2 p-6">
            <div className="flex items-baseline justify-between">
              <p className="text-[14px] font-semibold">Today&apos;s board</p>
              <p className="text-[12.5px] text-on-ink-muted">
                {daily?.pct_correct != null ? `${daily.pct_correct}% answered correctly` : "Ranked by speed among correct answers"}
              </p>
            </div>
            {leaders.length ? (
              <ol className="mt-4 grid gap-1">
                {leaders.map((r) => (
                  <li key={`${r.rank}-${r.username}`} className="grid grid-cols-[28px_1fr_auto_64px] items-center gap-3 rounded-[8px] px-2 py-2.5 odd:bg-on-ink/[0.03]">
                    <span className={`tabular text-[13px] font-bold ${r.rank === 1 ? "text-gold" : "text-on-ink-muted"}`}>{r.rank}</span>
                    <span className="truncate text-[14px] font-semibold">{r.display_name || r.username}</span>
                    <span className="tabular text-[13px] text-on-ink-muted">{formatSeconds(r.time_ms)}</span>
                    <span className="tabular text-right text-[14px] font-semibold">{r.score}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-6 rounded-[10px] border border-dashed border-on-ink/15 px-5 py-10 text-center">
                <p className="text-[15px] font-semibold">The board is empty.</p>
                <p className="mt-1 text-[13.5px] text-on-ink-muted">Answer correctly and fast to take the top spot.</p>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
