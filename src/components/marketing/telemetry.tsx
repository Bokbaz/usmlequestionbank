"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const BLOCKS = 16;
// ARGO sessions ("pit stops") run after these blocks.
const PITS = [4, 8, 12];

const CHANNELS = [
  {
    key: "acc",
    label: "Accuracy",
    data: [52, 55, 54, 58, 61, 63, 62, 66, 68, 71, 70, 73, 75, 77, 79, 81],
    domain: [50, 83],
    value: "81%",
    change: "+29 pts",
    primary: true,
  },
  {
    key: "time",
    label: "Time per question",
    data: [98, 95, 97, 92, 90, 88, 89, 84, 82, 80, 81, 78, 76, 75, 74, 72],
    domain: [70, 100],
    value: "72s",
    change: "26s faster",
  },
  {
    key: "sure",
    label: "Sure and right",
    data: [61, 60, 63, 65, 68, 70, 69, 73, 75, 77, 76, 79, 80, 82, 83, 84],
    domain: [58, 86],
    value: "84%",
    change: "+23 pts",
  },
  {
    key: "ret",
    label: "Still right a week later",
    data: [58, 57, 61, 64, 66, 69, 70, 73, 75, 76, 79, 80, 82, 83, 85, 86],
    domain: [55, 88],
    value: "86%",
    change: "+28 pts",
  },
];

const W = 640;
const H = 96;
const PAD = 6;
const x = (i: number) => PAD + (i * (W - PAD * 2)) / (BLOCKS - 1);
const pct = (i: number) => (x(i) / W) * 100;

export function Telemetry({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <figure
      className={cn("overflow-hidden rounded-[8px] bg-ink-2 ring-1 ring-on-ink/10", className)}
      aria-label="Example telemetry over 16 blocks: accuracy rises from 52% to 81%, time per question falls from 98 to 72 seconds, and confident correct answers and one-week retention both climb, with the biggest jumps after each ARGO session."
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-on-ink/10 px-5 py-3.5">
        <span className="eyebrow text-on-ink">Telemetry · last 16 blocks</span>
        <span className="ml-auto flex items-center gap-2 text-[12.5px] text-on-ink-muted">
          <svg width="18" height="10" aria-hidden>
            <line x1="1" x2="17" y1="5" y2="5" stroke="var(--signal)" strokeWidth="2" strokeDasharray="3 3" />
          </svg>
          ARGO session
        </span>
      </div>

      <div aria-hidden>
        {CHANNELS.map((c, ci) => {
          const [lo, hi] = c.domain;
          const y = (v: number) => H - PAD - ((v - lo) / (hi - lo)) * (H - PAD * 2);
          const d = c.data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
          return (
            <div
              key={c.key}
              className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-on-ink/10 px-5 py-3 md:grid-cols-[150px_1fr_96px]"
            >
              <span className="text-[13px] font-semibold text-on-ink-muted md:text-on-ink">{c.label}</span>
              <span className="row-span-2 text-right md:order-last md:row-span-1">
                <span
                  className={cn("block font-display text-[20px] font-bold leading-none tabular", c.primary ? "text-signal" : "text-on-ink")}
                >
                  {c.value}
                </span>
                <span className="mt-1 block text-[12px] font-bold text-[oklch(0.8_0.14_152)]">{c.change}</span>
              </span>
              <div className="relative">
                <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible">
                  {PITS.map((p) => (
                    <line
                      key={p}
                      x1={(x(p - 1) + x(p)) / 2}
                      x2={(x(p - 1) + x(p)) / 2}
                      y1={-14}
                      y2={H + 14}
                      stroke="var(--signal)"
                      strokeWidth="1.5"
                      strokeDasharray="3 4"
                      opacity="0.8"
                    />
                  ))}
                  {c.primary && (
                    <motion.path
                      d={`${d} L${x(BLOCKS - 1)},${H} L${x(0)},${H} Z`}
                      fill="var(--signal)"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 0.14 }}
                      viewport={{ once: true }}
                      transition={reduce ? { duration: 0 } : { duration: 1.2, delay: 0.6 }}
                    />
                  )}
                  <motion.path
                    d={d}
                    fill="none"
                    stroke={c.primary ? "var(--signal)" : "var(--on-ink)"}
                    strokeOpacity={c.primary ? 1 : 0.85}
                    strokeWidth={c.primary ? 3 : 2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                    transition={reduce ? { duration: 0 } : { duration: 1.6, delay: 0.15 * ci, ease: EASE }}
                  />
                  <circle
                    cx={x(BLOCKS - 1)}
                    cy={y(c.data[BLOCKS - 1])}
                    r={c.primary ? 4.5 : 3.5}
                    fill={c.primary ? "var(--signal)" : "var(--on-ink)"}
                  />
                </svg>
              </div>
            </div>
          );
        })}
        <div className="hidden px-5 pb-3 pt-2 md:grid md:grid-cols-[150px_1fr_96px] md:gap-4">
          <span className="text-[11px] font-semibold text-on-ink-muted">Block</span>
          <div className="relative h-4 text-[11px] font-semibold text-on-ink-muted tabular">
            {[0, 3, 7, 11, 15].map((i) => (
              <span key={i} className="absolute -translate-x-1/2" style={{ left: `${pct(i)}%` }}>
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="sr-only">Example data for illustration.</figcaption>
    </figure>
  );
}
