"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Flame, Timer, Trophy, Users, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/daily/countdown";
import { OptionRow } from "@/components/player/option-row";
import { Stem } from "@/components/player/stem";
import { Explanation } from "@/components/player/explanation";
import { Markdown } from "@/components/markdown";
import type { PlayerItem } from "@/components/player/types";
import { createClient } from "@/lib/supabase/client";
import { getGuestToken, peekGuestToken } from "@/lib/daily/guest";
import type { DailyState } from "@/lib/daily/types";
import { cn, formatClock, formatSeconds } from "@/lib/utils";

export function DailyGame({ initial }: { initial: DailyState | null }) {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<DailyState | null>(initial);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const startedLocal = useRef<number | null>(null);
  const submittedRef = useRef(false);

  const load = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
    const isUser = Boolean(session.session);
    setSignedIn(isUser);
    const guest = isUser ? null : peekGuestToken();
    const { data } = await supabase.rpc("daily_today", { p_guest: guest });
    setState(data as DailyState);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (state?.state !== "started") return;
    if (startedLocal.current == null) startedLocal.current = Date.now() - (state.payload?.elapsed_ms ?? 0);
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [state]);

  const limitMs = (state?.time_limit_s ?? 120) * 1000;
  const elapsedMs = state?.state === "started" && startedLocal.current != null ? now - startedLocal.current : 0;
  const remainingMs = Math.max(0, limitMs - elapsedMs);

  async function start() {
    setBusy(true);
    const guest = signedIn ? null : getGuestToken();
    const { data, error } = await supabase.rpc("daily_start", { p_guest: guest });
    setBusy(false);
    if (error) return toast.error(error.message);
    startedLocal.current = Date.now();
    setState(data as DailyState);
  }

  const submit = useCallback(
    async (optionId: string | null) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setBusy(true);
      const guest = signedIn ? null : peekGuestToken();
      const { data, error } = await supabase.rpc("daily_submit", { p_option: optionId, p_guest: guest });
      setBusy(false);
      if (error) {
        submittedRef.current = false;
        return toast.error(error.message);
      }
      setState(data as DailyState);
    },
    [signedIn, supabase],
  );

  // Out of time: submit whatever is selected.
  useEffect(() => {
    if (state?.state === "started" && remainingMs <= 0) submit(selected);
  }, [remainingMs, selected, state?.state, submit]);

  if (!state) return <div className="h-96 animate-pulse rounded-[14px] bg-sunken" />;
  if (!state.available)
    return (
      <div className="rounded-[14px] border border-border bg-surface p-10 text-center">
        <h2 className="text-[22px] font-[750]">No challenge scheduled today</h2>
        <p className="mt-2 text-muted">Check back tomorrow.</p>
      </div>
    );

  const p = state.payload;

  // ---------------------------------------------------------------- intro
  if (state.state === "none") {
    return (
      <div className="overflow-hidden rounded-[14px] bg-ink text-on-ink">
        <div className="grid gap-10 p-8 md:grid-cols-[1.2fr_1fr] md:p-12">
          <div>
            <p className="eyebrow flex items-center gap-2 text-on-ink-muted">
              <Zap className="size-3.5 text-gold" /> Daily Challenge #{state.number}
            </p>
            <h1 className="display mt-4 text-[clamp(38px,5vw,64px)] font-[820]">One question. Two minutes.</h1>
            <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-on-ink-muted">
              Today&apos;s question is ultra hard and drawn from {state.system ?? "any system"}
              {state.discipline ? ` (${state.discipline.toLowerCase()})` : ""}. The clock starts the moment you reveal it.
              Correct answers are ranked by speed.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="ink" size="xl" onClick={start} loading={busy}>
                Reveal the question
              </Button>
              <Button asChild variant="ink-outline" size="xl">
                <Link href="/daily/leaderboard">Leaderboard</Link>
              </Button>
            </div>
            {signedIn === false && <p className="mt-4 text-[13px] text-on-ink-muted">Playing as a guest. Create an account afterwards to claim your rank.</p>}
          </div>
          <dl className="grid content-center gap-5 md:border-l md:border-on-ink/10 md:pl-10">
            {[
              { icon: Timer, k: "Time limit", v: formatClock(state.time_limit_s) },
              { icon: Users, k: "Played today", v: state.players.toLocaleString() },
              { icon: Trophy, k: "Answered correctly", v: state.pct_correct != null ? `${state.pct_correct}%` : "Be the first" },
            ].map((r) => (
              <div key={r.k} className="flex items-center gap-3">
                <r.icon className="size-5 text-on-ink-muted" />
                <dt className="text-[14px] text-on-ink-muted">{r.k}</dt>
                <dd className="tabular ml-auto text-[18px] font-[700]">{r.v}</dd>
              </div>
            ))}
            <div className="flex items-center gap-3 border-t border-on-ink/10 pt-5">
              <span className="text-[14px] text-on-ink-muted">Next question in</span>
              <Countdown to={state.next_reset} className="tabular ml-auto text-[18px] font-[700]" />
            </div>
          </dl>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- playing
  if (state.state === "started" && p) {
    const urgent = remainingMs < 20_000;
    return (
      <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
        <div className="sticky top-16 z-10 flex items-center justify-between gap-4 bg-ink px-5 py-3 text-on-ink">
          <p className="text-[14px] font-semibold">Daily Challenge #{state.number}</p>
          <div className="flex items-center gap-3">
            <div className="hidden h-1.5 w-40 overflow-hidden rounded-full bg-on-ink/15 sm:block">
              <div className={cn("h-full rounded-full transition-[width] duration-300 ease-linear", urgent ? "bg-incorrect" : "bg-on-ink")} style={{ width: `${(remainingMs / limitMs) * 100}%` }} />
            </div>
            <span className={cn("tabular rounded-[6px] px-2.5 py-1 text-[15px] font-[700]", urgent ? "bg-incorrect text-surface" : "bg-on-ink/10")}>{formatClock(Math.ceil(remainingMs / 1000))}</span>
          </div>
        </div>
        <div className="px-5 py-7 md:px-10">
          <Stem text={p.stem} highlights={[]} onChange={() => {}} readOnly />
          <p className="mt-5 text-[17px] font-semibold">{p.lead_in}</p>
          <div className="mt-6 grid gap-2" role="radiogroup" aria-label="Answer choices">
            {p.options.map((o) => (
              <OptionRow key={o.id} label={o.label} body={o.body} selected={selected === o.id} struck={false} locked={busy} onSelect={() => setSelected(o.id)} onStrike={() => {}} />
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button size="lg" onClick={() => submit(selected)} disabled={!selected} loading={busy}>
              Lock in answer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- done
  const r = p?.result;
  const review = p?.review;
  const topPct = r && r.players > 1 ? Math.max(1, Math.round((100 * r.rank) / r.players)) : null;
  const shareText = r
    ? `Argonaut Daily #${state.number} ${r.is_correct ? "✅" : "❌"}${r.is_correct ? ` ${formatSeconds(r.time_ms)}` : ""}${r.is_correct && topPct ? ` · top ${topPct}%` : ""}\n${typeof window !== "undefined" ? window.location.origin : ""}/daily`
    : "";
  const item: PlayerItem | null =
    p && review
      ? {
          position: 0,
          question_id: "",
          code: `Daily #${state.number}`,
          exam: "step1",
          stem: p.stem,
          lead_in: p.lead_in,
          media: p.media ?? [],
          is_nugget: review.nuggets.length > 0,
          source: "seed",
          system: state.system ?? "",
          system_slug: "",
          discipline: state.discipline,
          competency: null,
          topic: null,
          options: p.options,
          state: { selected_option_id: r?.selected_option_id ?? null, first_option_id: null, changes: 0, confidence: null, marked: false, struck: [], highlights: [], time_ms: r?.time_ms ?? 0, labs_opened: false, submitted: true, is_correct: r?.is_correct ?? false },
          review,
        }
      : null;

  return (
    <div className="grid gap-6">
      <div className={cn("overflow-hidden rounded-[14px] p-8 md:p-10", r?.is_correct ? "bg-ink text-on-ink" : "border border-border bg-surface")}>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className={cn("eyebrow", r?.is_correct ? "text-on-ink-muted" : "text-faint")}>Daily Challenge #{state.number}</p>
            <h1 className="mt-3 flex items-center gap-3 text-[34px] font-[800] tracking-[-0.02em]">
              {r?.is_correct ? <Check className="size-8 text-correct" strokeWidth={3} /> : <X className="size-8 text-incorrect" strokeWidth={3} />}
              {r?.is_correct ? (r.score > 0 ? `Correct in ${formatSeconds(r.time_ms)}` : "Correct") : r?.timed_out ? "Out of time" : "Not today"}
            </h1>
            <p className={cn("mt-2 text-[15px]", r?.is_correct ? "text-on-ink-muted" : "text-muted")}>
              {r?.is_correct
                ? r.score > 0
                  ? `Score ${r.score} · ${signedIn ? `rank #${r.rank} of ${r.players}` : `you would rank #${r.rank} of ${r.players}`}`
                  : "Answered too quickly to be ranked."
                : `${state.pct_correct ?? 0}% of ${state.players} players got this one. Read the explanation below.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {r && (
              <Button
                variant={r.is_correct ? "ink" : "secondary"}
                onClick={async () => {
                  try {
                    if (navigator.share) await navigator.share({ text: shareText });
                    else {
                      await navigator.clipboard.writeText(shareText);
                      toast.success("Result copied. Paste it anywhere.");
                    }
                  } catch {}
                }}
              >
                <Copy className="size-4" /> Share result
              </Button>
            )}
            <Button asChild variant={r?.is_correct ? "ink-outline" : "secondary"}>
              <Link href="/daily/leaderboard">
                <Trophy className="size-4" /> Leaderboard
              </Link>
            </Button>
          </div>
        </div>
        {signedIn === false && (
          <div className={cn("mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[10px] p-5", r?.is_correct ? "bg-on-ink/[0.06]" : "bg-brand-soft")}>
            <div>
              <p className="text-[16px] font-semibold">{r?.is_correct && r.score > 0 ? `Claim rank #${r.rank} and start your streak` : "Save your result and start a streak"}</p>
              <p className={cn("mt-1 text-[14px]", r?.is_correct ? "text-on-ink-muted" : "text-brand-strong")}>Free account. Your answer moves onto the leaderboard instantly.</p>
            </div>
            <Button asChild variant={r?.is_correct ? "ink" : "primary"} size="lg">
              <Link href="/signup?next=/daily">Create free account</Link>
            </Button>
          </div>
        )}
        {signedIn && (
          <p className={cn("mt-6 flex items-center gap-2 text-[14px]", r?.is_correct ? "text-on-ink-muted" : "text-muted")}>
            <Flame className="size-4 text-gold" /> Next question in <Countdown to={state.next_reset} className="tabular font-semibold" />
          </p>
        )}
      </div>
      {item && review ? (
        <div className="rounded-[14px] border border-border bg-surface px-5 py-7 md:px-10">
          <Stem text={item.stem} highlights={[]} onChange={() => {}} readOnly />
          <p className="mt-5 text-[17px] font-semibold">{item.lead_in}</p>
          <div className="mt-6 grid gap-2">
            {item.options.map((o) => (
              <OptionRow
                key={o.id}
                label={o.label}
                body={o.body}
                selected={o.id === item.state.selected_option_id}
                struck={false}
                locked
                correct={o.id === review.correct_option_id}
                wrongPick={o.id === item.state.selected_option_id && o.id !== review.correct_option_id}
                onSelect={() => {}}
                onStrike={() => {}}
              />
            ))}
          </div>
          {signedIn ? (
            <Explanation item={item} review={review} showArticleLink />
          ) : (
            <div className="mt-8 border-t border-border pt-7">
              <Markdown>{review.explanation.split("\n\n").slice(0, 2).join("\n\n")}</Markdown>
              <div className="mt-6 rounded-[10px] bg-panel p-5">
                <p className="font-semibold">The full breakdown of every answer choice is free with an account.</p>
                <Button asChild className="mt-3">
                  <Link href="/signup?next=/daily">Create free account</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
