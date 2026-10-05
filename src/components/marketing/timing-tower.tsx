"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ArgoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

type Row = { id: string; system: string; acc: number; trend: number };

// Four "laps" of one student's block-by-block accuracy. Biostatistics is ARGO's focus:
// it climbs and overtakes, then the focus moves to the next weakest system.
const LAPS: { block: number; focus: string; radio: string; rows: Row[] }[] = [
  {
    block: 14,
    focus: "bio",
    radio: "Biostatistics is costing you about 3 points a block. 12 questions lined up.",
    rows: [
      { id: "cvs", system: "Cardiovascular", acc: 84, trend: 4.2 },
      { id: "ren", system: "Renal", acc: 79, trend: 6.8 },
      { id: "res", system: "Respiratory", acc: 76, trend: 1.1 },
      { id: "gi", system: "Gastrointestinal", acc: 73, trend: 2.0 },
      { id: "end", system: "Endocrine", acc: 71, trend: 9.4 },
      { id: "neu", system: "Neurology", acc: 66, trend: 3.3 },
      { id: "hem", system: "Heme & Onc", acc: 61, trend: -0.8 },
      { id: "bio", system: "Biostatistics", acc: 52, trend: -2.6 },
    ],
  },
  {
    block: 15,
    focus: "bio",
    radio: "Biostats up 6 points. Endocrine just passed GI. Keep pushing.",
    rows: [
      { id: "cvs", system: "Cardiovascular", acc: 84, trend: 3.9 },
      { id: "ren", system: "Renal", acc: 79, trend: 5.1 },
      { id: "res", system: "Respiratory", acc: 77, trend: 1.6 },
      { id: "end", system: "Endocrine", acc: 74, trend: 9.9 },
      { id: "gi", system: "Gastrointestinal", acc: 73, trend: 1.2 },
      { id: "neu", system: "Neurology", acc: 66, trend: 2.4 },
      { id: "hem", system: "Heme & Onc", acc: 62, trend: 0.4 },
      { id: "bio", system: "Biostatistics", acc: 58, trend: 6.0 },
    ],
  },
  {
    block: 16,
    focus: "bio",
    radio: "Biostats is past Heme & Onc. Next target: Neurology.",
    rows: [
      { id: "cvs", system: "Cardiovascular", acc: 85, trend: 3.1 },
      { id: "ren", system: "Renal", acc: 80, trend: 4.4 },
      { id: "res", system: "Respiratory", acc: 77, trend: 1.0 },
      { id: "end", system: "Endocrine", acc: 75, trend: 8.2 },
      { id: "gi", system: "Gastrointestinal", acc: 73, trend: 0.6 },
      { id: "neu", system: "Neurology", acc: 66, trend: 1.8 },
      { id: "bio", system: "Biostatistics", acc: 64, trend: 11.5 },
      { id: "hem", system: "Heme & Onc", acc: 62, trend: 0.2 },
    ],
  },
  {
    block: 17,
    focus: "hem",
    radio: "Biostats sorted: up 15 in three blocks. Switching focus to Heme & Onc.",
    rows: [
      { id: "cvs", system: "Cardiovascular", acc: 85, trend: 2.8 },
      { id: "ren", system: "Renal", acc: 80, trend: 3.9 },
      { id: "res", system: "Respiratory", acc: 78, trend: 1.4 },
      { id: "end", system: "Endocrine", acc: 76, trend: 7.0 },
      { id: "gi", system: "Gastrointestinal", acc: 74, trend: 0.9 },
      { id: "bio", system: "Biostatistics", acc: 67, trend: 14.8 },
      { id: "neu", system: "Neurology", acc: 66, trend: 1.1 },
      { id: "hem", system: "Heme & Onc", acc: 62, trend: 0.1 },
    ],
  },
];

const LAP_MS = 3400;

export function TimingTower({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [lap, setLap] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setLap((l) => (l + 1) % LAPS.length), lap === LAPS.length - 1 ? LAP_MS * 1.6 : LAP_MS);
    return () => clearTimeout(t);
  }, [lap, reduce]);

  const L = LAPS[reduce ? 0 : lap];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[8px] bg-ink text-on-ink shadow-[0_40px_80px_-30px_oklch(0.15_0.04_215/0.6)] ring-1 ring-on-ink/10",
        className,
      )}
      role="img"
      aria-label="Example timing screen: a student's accuracy by system, ranked, with Biostatistics climbing after targeted sessions."
    >
      <div className="flex items-center gap-3 border-b border-on-ink/10 px-5 py-3.5">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full rounded-full bg-signal opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex size-2 rounded-full bg-signal" />
        </span>
        <span className="eyebrow text-on-ink">Live timing</span>
        <span className="eyebrow ml-auto text-on-ink-muted">
          Block <span className="tabular text-on-ink">{L.block}</span>
        </span>
      </div>

      <div className="grid grid-cols-[28px_1fr_56px_64px] gap-3 px-5 pb-1.5 pt-3 text-on-ink-muted" aria-hidden>
        <span className="eyebrow text-[10px]">Pos</span>
        <span className="eyebrow text-[10px]">System</span>
        <span className="eyebrow text-right text-[10px]">Acc</span>
        <span className="eyebrow text-right text-[10px]">Trend</span>
      </div>

      <LayoutGroup>
        <ol className="px-2 pb-2" aria-hidden>
          {L.rows.map((r, i) => {
            const focus = r.id === L.focus;
            return (
              <motion.li
                key={r.id}
                layout={!reduce}
                transition={{ layout: { duration: 0.8, ease: EASE } }}
                className={cn(
                  "grid h-10 grid-cols-[28px_1fr_56px_64px] items-center gap-3 rounded-[4px] px-3",
                  focus ? "bg-brand text-on-brand" : i % 2 ? "bg-on-ink/[0.035]" : "",
                )}
              >
                <span className={cn("font-display text-[14px] font-bold tabular", focus ? "" : "text-on-ink-muted")}>{i + 1}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[14px] font-bold">{r.system}</span>
                  {focus && <span className="eyebrow hidden shrink-0 text-[9.5px] sm:inline">Focus</span>}
                </span>
                <span className="text-right font-display text-[15px] font-bold tabular">{r.acc}%</span>
                <Trend value={r.trend} onSignal={focus} />
              </motion.li>
            );
          })}
        </ol>
      </LayoutGroup>

      <div className="border-t border-on-ink/10 bg-ink-2 px-5 py-4">
        <div className="flex items-center gap-2">
          <ArgoMark className="size-3.5 text-on-ink" apex="signal" />
          <span className="eyebrow text-on-ink-muted">Team radio · ARGO</span>
          <Waveform key={lap} />
        </div>
        <div className="relative mt-2 min-h-[44px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={L.radio}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="text-[15px] font-semibold leading-snug"
            >
              {L.radio}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Trend({ value, onSignal }: { value: number; onSignal: boolean }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "text-right text-[13px] font-bold tabular",
        onSignal ? "" : up ? "text-[oklch(0.82_0.15_150)]" : "text-[oklch(0.74_0.15_22)]",
      )}
    >
      {up ? "▲" : "▼"} {up ? "+" : "−"}
      {Math.abs(value).toFixed(1)}
    </span>
  );
}

const BARS = [3, 6, 10, 7, 12, 5, 9, 4, 11, 6, 8, 3, 7, 10, 5, 2];

// CSS-only so server and client markup match; re-keyed per lap to replay.
function Waveform() {
  return (
    <span className="ml-auto flex h-3.5 items-center gap-[2px]" aria-hidden>
      {BARS.map((h, i) => (
        <span
          key={i}
          className="w-[2px] origin-center rounded-full bg-signal motion-safe:animate-[radio_1.4s_var(--ease-out-expo)_both]"
          style={{ height: h, animationDelay: `${i * 30}ms` }}
        />
      ))}
    </span>
  );
}
