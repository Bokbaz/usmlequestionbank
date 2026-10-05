"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ArgoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

// The 16 things ARGO records on every answer (mirrors the attempts table).
const CHANNELS = [
  "Result",
  "Time",
  "First pick",
  "Final pick",
  "Changes",
  "Direction",
  "Confidence",
  "Struck answer",
  "Labs",
  "Block pos",
  "System",
  "Discipline",
  "Task",
  "Topic",
  "Predicted",
  "Last seen",
] as const;

type Tone = "good" | "flag" | "plain";
type Answer = { code: string; values: [string, Tone][]; verdict: string };

const ANSWERS: Answer[] = [
  {
    code: "AQ-1042",
    values: [
      ["Correct", "good"],
      ["74s", "plain"],
      ["C", "plain"],
      ["B", "plain"],
      ["1", "plain"],
      ["Wrong → right", "good"],
      ["Think so", "plain"],
      ["No", "plain"],
      ["Opened", "plain"],
      ["17 / 40", "plain"],
      ["Cardio", "plain"],
      ["Pharm", "plain"],
      ["Treatment", "plain"],
      ["Antiarrhythmics", "plain"],
      ["61%", "plain"],
      ["9 days", "plain"],
    ],
    verdict: "Right, but slow and unsure. Antiarrhythmics comes back in 3 days.",
  },
  {
    code: "AQ-1317",
    values: [
      ["Wrong", "flag"],
      ["41s", "plain"],
      ["D", "plain"],
      ["D", "flag"],
      ["0", "plain"],
      ["None", "plain"],
      ["Sure", "flag"],
      ["No", "plain"],
      ["No", "plain"],
      ["32 / 40", "plain"],
      ["Renal", "plain"],
      ["Physio", "plain"],
      ["Mechanism", "plain"],
      ["RTA types", "plain"],
      ["72%", "plain"],
      ["21 days", "flag"],
    ],
    verdict: "Sure and wrong: a misconception. RTA types moves to the top of your list.",
  },
  {
    code: "AQ-2208",
    values: [
      ["Wrong", "flag"],
      ["128s", "flag"],
      ["A", "good"],
      ["E", "flag"],
      ["2", "plain"],
      ["Right → wrong", "flag"],
      ["Guessing", "plain"],
      ["No", "plain"],
      ["Opened", "plain"],
      ["38 / 40", "flag"],
      ["Biostats", "plain"],
      ["Epi", "plain"],
      ["Interpret", "plain"],
      ["Sens vs spec", "plain"],
      ["58%", "plain"],
      ["4 days", "plain"],
    ],
    verdict: "Your first answer was right. Changed late in the block: fatigue flagged.",
  },
];

const STEP_MS = 90;
const HOLD_MS = 3600;

// One answer, logged channel by channel. Loops through three example answers.
export function AnswerTrace({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setI((n) => (n + 1) % ANSWERS.length), CHANNELS.length * STEP_MS + HOLD_MS);
    return () => clearTimeout(t);
  }, [i, reduce]);

  const a = ANSWERS[i];

  return (
    <figure
      className={cn("border-y border-on-brand/25", className)}
      aria-label="Example: ARGO logging 16 data points from a single answer, then deciding what to do next."
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
        <span className="eyebrow flex items-center gap-2 text-on-brand">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full rounded-full bg-signal opacity-70 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-signal" />
          </span>
          Answer logged
        </span>
        <span className="readout text-[12.5px] text-on-brand-muted">
          {a.code} · 16 data points
        </span>
      </div>

      {/* Re-keyed per answer so the cells relight in sequence. */}
      <ol key={a.code} className="grid grid-cols-4 border-t border-on-brand/15 sm:grid-cols-8" aria-hidden>
        {CHANNELS.map((label, c) => {
          const [value, tone] = a.values[c];
          return (
            <li
              key={label}
              className="relative min-w-0 border-b border-r border-on-brand/15 px-2.5 py-2.5 motion-safe:animate-[cell-on_420ms_var(--ease-out-expo)_both] [&:nth-child(4n)]:border-r-0 sm:[&:nth-child(4n)]:border-r sm:[&:nth-child(8n)]:border-r-0"
              style={{ animationDelay: `${c * STEP_MS}ms` }}
            >
              <span
                className="pointer-events-none absolute inset-0 opacity-25 motion-safe:animate-[cell-flash_600ms_ease-out_both]"
                style={{ animationDelay: `${c * STEP_MS}ms` }}
              />
              <span className="readout relative block truncate text-[10px] text-on-brand-muted">
                <span className="hidden sm:inline">{String(c + 1).padStart(2, "0")} </span>
                {label}
              </span>
              <span
                className={cn(
                  "relative mt-1 block text-[12.5px] font-semibold leading-tight [overflow-wrap:anywhere] sm:truncate sm:text-[13.5px]",
                  tone === "good" ? "text-signal" : tone === "flag" ? "text-[oklch(0.9_0.13_90)]" : "text-on-brand",
                )}
              >
                {value}
              </span>
            </li>
          );
        })}
      </ol>

      <figcaption className="flex items-start gap-2.5 py-3.5">
        <ArgoMark className="mt-0.5 size-4 shrink-0 text-on-brand" apex="signal" />
        <p
          key={a.verdict}
          className="text-[15px] font-semibold leading-snug motion-safe:animate-[fade-up_500ms_var(--ease-out-expo)_both]"
          style={{ animationDelay: `${CHANNELS.length * STEP_MS}ms` }}
        >
          <span className="text-on-brand-muted">ARGO: </span>
          {a.verdict}
        </p>
      </figcaption>
    </figure>
  );
}
