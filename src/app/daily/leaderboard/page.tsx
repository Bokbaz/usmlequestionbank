import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { flagEmoji } from "@/lib/countries";
import type { LeaderRow } from "@/lib/daily/types";
import { Button } from "@/components/ui/button";
import { cn, formatSeconds } from "@/lib/utils";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

type StreakRow = { rank: number; username: string; display_name: string | null; country: string | null; streak: number; best_streak: number; is_me: boolean | null };

export default async function LeaderboardPage({ searchParams }: PageProps<"/daily/leaderboard">) {
  const sp = await searchParams;
  const tab = sp.tab === "streaks" ? "streaks" : "today";
  const supabase = await createClient();
  const [today, streaks, daily] = await Promise.all([
    supabase.rpc("daily_leaderboard", { p_limit: 100 }),
    supabase.rpc("streak_leaderboard", { p_limit: 50 }),
    supabase.rpc("daily_today", { p_guest: null }),
  ]);
  const rows = (today.data ?? []) as LeaderRow[];
  const srows = (streaks.data ?? []) as StreakRow[];
  const number = (daily.data as { number?: number } | null)?.number;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-faint">Daily Challenge{number ? ` #${number}` : ""}</p>
          <h1 className="mt-2 text-[34px] font-[800] tracking-[-0.02em]">Leaderboard</h1>
          <p className="mt-1 text-[15px] text-muted">Correct answers ranked by speed. Resets at 00:00 UTC.</p>
        </div>
        <Button asChild>
          <Link href="/daily">
            <Zap className="size-4" /> Play today
          </Link>
        </Button>
      </div>
      <div className="mt-6 inline-flex rounded-[8px] border border-border bg-panel p-0.5">
        {[
          ["today", "Today"],
          ["streaks", "Streaks"],
        ].map(([k, label]) => (
          <Link
            key={k}
            href={k === "today" ? "/daily/leaderboard" : "/daily/leaderboard?tab=streaks"}
            className={cn("rounded-[6px] px-4 py-1.5 text-[13.5px] font-semibold", tab === k ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text")}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-[12px] border border-border bg-surface">
        {tab === "today" ? (
          rows.length === 0 ? (
            <p className="px-6 py-12 text-center text-muted">No ranked answers yet today. Be the first.</p>
          ) : (
            <table className="w-full border-collapse text-[14.5px]">
              <thead>
                <tr className="border-b border-border bg-panel text-left text-[12.5px] text-muted">
                  <th className="w-16 px-4 py-2.5 font-semibold">Rank</th>
                  <th className="px-4 py-2.5 font-semibold">Player</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Time</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Score</th>
                  <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">Streak</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.rank}-${r.username}`} className={cn("border-b border-border last:border-0", r.is_me && "bg-brand-soft")}>
                    <td className={cn("tabular px-4 py-3 font-[700]", r.rank <= 3 ? "text-gold-ink" : "text-muted")}>{r.rank}</td>
                    <td className="px-4 py-3">
                      <span className="mr-2">{flagEmoji(r.country)}</span>
                      <span className="font-semibold">{r.display_name || r.username}</span>
                      <span className="ml-2 text-[12.5px] text-faint">@{r.username}</span>
                      {r.is_me && <span className="ml-2 text-[12px] font-semibold text-brand">You</span>}
                    </td>
                    <td className="tabular px-4 py-3 text-right text-muted">{r.is_correct ? formatSeconds(r.time_ms) : "–"}</td>
                    <td className="tabular px-4 py-3 text-right font-[700]">{r.score}</td>
                    <td className="tabular hidden px-4 py-3 text-right text-muted sm:table-cell">{r.streak > 0 ? `${r.streak}` : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : srows.length === 0 ? (
          <p className="px-6 py-12 text-center text-muted">Streaks appear after consecutive correct days.</p>
        ) : (
          <table className="w-full border-collapse text-[14.5px]">
            <thead>
              <tr className="border-b border-border bg-panel text-left text-[12.5px] text-muted">
                <th className="w-16 px-4 py-2.5 font-semibold">Rank</th>
                <th className="px-4 py-2.5 font-semibold">Player</th>
                <th className="px-4 py-2.5 text-right font-semibold">Current</th>
                <th className="px-4 py-2.5 text-right font-semibold">Best</th>
              </tr>
            </thead>
            <tbody>
              {srows.map((r) => (
                <tr key={`${r.rank}-${r.username}`} className={cn("border-b border-border last:border-0", r.is_me && "bg-brand-soft")}>
                  <td className="tabular px-4 py-3 font-[700] text-muted">{r.rank}</td>
                  <td className="px-4 py-3">
                    <span className="mr-2">{flagEmoji(r.country)}</span>
                    <span className="font-semibold">{r.display_name || r.username}</span>
                  </td>
                  <td className="tabular px-4 py-3 text-right font-[700]">
                    <Flame className="mr-1 inline size-4 text-gold" />
                    {r.streak}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-muted">{r.best_streak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
