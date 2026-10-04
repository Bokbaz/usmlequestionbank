import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/daily/countdown";
import { Reveal } from "@/components/marketing/reveal";
import type { DailyState, LeaderRow } from "@/lib/daily/types";
import { cn, formatSeconds } from "@/lib/utils";

function gap(ms: number, leaderMs: number) {
  const d = (ms - leaderMs) / 1000;
  return d <= 0 ? "Leader" : `+${d.toFixed(1)}s`;
}

export function DailyTeaser({ daily, leaders }: { daily: DailyState | null; leaders: LeaderRow[] }) {
  const leaderMs = leaders[0]?.time_ms ?? 0;
  return (
    <section id="daily" className="relative overflow-hidden bg-ink text-on-ink">
      <div className="mx-auto max-w-[1320px] px-5 py-28 md:px-8 md:py-36">
        <Reveal>
          <p className="eyebrow text-brand">Daily Challenge{daily?.available ? ` · #${daily.number}` : ""}</p>
          <h2 className="display mt-6 text-[clamp(40px,7vw,96px)] font-[850]">
            One question. Two minutes. <span className="text-brand">Everyone.</span>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <Reveal delay={0.06}>
            <p className="max-w-[42ch] text-[19px] leading-relaxed text-on-ink-muted">
              A brutal Step 1 question every day. Right answers are ranked by speed. No account needed to play.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild variant="ink" size="xl">
                <Link href="/daily">
                  Play today&apos;s question <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="ink-outline" size="xl">
                <Link href="/daily/leaderboard">Full leaderboard</Link>
              </Button>
            </div>
            {daily?.available && (
              <dl className="mt-12 grid max-w-[520px] grid-cols-3 border-t border-on-ink/15 pt-6">
                <div>
                  <dt className="eyebrow text-on-ink-muted">System</dt>
                  <dd className="mt-2 text-[16px] font-bold">{daily.system ?? "Any"}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-on-ink-muted">Played</dt>
                  <dd className="mt-2 font-display text-[18px] font-[800] tabular">{daily.players.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-on-ink-muted">Next in</dt>
                  <dd className="mt-2 font-display text-[18px] font-[800] tabular">
                    <Countdown to={daily.next_reset} />
                  </dd>
                </div>
              </dl>
            )}
          </Reveal>

          <Reveal delay={0.12} className="self-center">
            <div className="overflow-hidden rounded-[8px] bg-ink-2 ring-1 ring-on-ink/10">
              <div className="flex items-center justify-between gap-4 border-b border-on-ink/10 px-5 py-3.5">
                <span className="eyebrow text-on-ink">Today&apos;s timing</span>
                <span className="text-[12.5px] text-on-ink-muted">
                  {daily?.pct_correct != null ? `${daily.pct_correct}% got it right` : "Right answers, fastest first"}
                </span>
              </div>
              {leaders.length ? (
                <ol className="p-2">
                  {leaders.map((r, i) => (
                    <li
                      key={`${r.rank}-${r.username}`}
                      className={cn(
                        "grid h-11 grid-cols-[32px_1fr_auto_72px] items-center gap-3 rounded-[4px] px-3",
                        i % 2 ? "bg-on-ink/[0.035]" : "",
                      )}
                    >
                      <span className={cn("font-display text-[15px] font-[850] tabular", r.rank === 1 ? "text-gold" : "text-on-ink-muted")}>
                        {r.rank}
                      </span>
                      <span className="truncate text-[15px] font-bold">{r.display_name || r.username}</span>
                      <span className="text-[13px] text-on-ink-muted tabular">{formatSeconds(r.time_ms)}</span>
                      <span className={cn("text-right text-[13px] font-bold tabular", r.rank === 1 ? "text-brand" : "text-on-ink")}>
                        {gap(r.time_ms, leaderMs)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="px-5 py-14">
                  <p className="display text-[28px] font-[850]">Pole position is open.</p>
                  <p className="mt-2 text-[15px] text-on-ink-muted">
                    Nobody&apos;s on the board yet. Get it right, get it fast, and it&apos;s yours.
                  </p>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
