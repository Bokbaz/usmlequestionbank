"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import { ArgoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const OPTIONS = [
  { label: "A", text: "Crypt abscesses limited to the mucosa", pct: 31 },
  { label: "B", text: "Foamy PAS-positive macrophages", pct: 4 },
  { label: "C", text: "Transmural inflammation with noncaseating granulomas", pct: 58 },
  { label: "D", text: "Pseudomembranes erupting from crypts", pct: 3 },
  { label: "E", text: "Villous atrophy with intraepithelial lymphocytes", pct: 4 },
];
const CHOSEN = "A";
const CORRECT = "C";

// 0 idle, 1 selected, 2 revealed, 3 ARGO insight, 4 mastery updated
const TIMINGS = [1400, 1500, 1700, 1600, 3200];

export function HeroDemo() {
  const reduce = useReducedMotion();
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setCycle((s) => (s + 1) % 5), TIMINGS[cycle]);
    return () => clearTimeout(t);
  }, [cycle, reduce]);

  // Reduced motion shows the finished state without cycling.
  const step = reduce ? 4 : cycle;

  const revealed = step >= 2;

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.25, ease: EASE }}
        className="relative overflow-hidden rounded-[14px] bg-surface text-text shadow-[0_30px_80px_-20px_oklch(0.1_0.06_266/0.6)] ring-1 ring-white/10"
      >
        <div className="flex items-center justify-between bg-ink-2 px-4 py-2.5 text-[12px] font-semibold text-on-ink-muted">
          <span className="text-on-ink">Item 7 of 20</span>
          <span className="tabular">Tutor mode · 01:14</span>
        </div>
        <div className="px-5 pb-5 pt-4">
          <p className="text-[13.5px] leading-[1.6] text-text">
            A 24-year-old man has 4 months of crampy right lower quadrant pain, nonbloody diarrhea, weight loss, and oral
            ulcers. A perianal fistula drains pus. Colonoscopy shows patchy ulcers of the terminal ileum with rectal
            sparing.
          </p>
          <p className="mt-2.5 text-[13.5px] font-semibold leading-snug">Biopsy is most likely to show which of the following?</p>
          <ul className="mt-3 grid gap-1.5">
            {OPTIONS.map((o) => {
              const isChosen = step >= 1 && o.label === CHOSEN;
              const isCorrect = revealed && o.label === CORRECT;
              const isWrong = revealed && isChosen && o.label !== CORRECT;
              return (
                <li
                  key={o.label}
                  className={cn(
                    "relative flex items-start gap-2.5 overflow-hidden rounded-[8px] border px-2.5 py-2 text-[12.5px] leading-snug transition-colors duration-300",
                    isCorrect
                      ? "border-correct/40 bg-correct-soft"
                      : isWrong
                        ? "border-incorrect/40 bg-incorrect-soft"
                        : isChosen
                          ? "border-brand/50 bg-brand-soft"
                          : "border-border bg-surface",
                  )}
                >
                  {revealed && (
                    <motion.span
                      aria-hidden
                      className={cn("absolute inset-y-0 left-0", isCorrect ? "bg-correct/10" : "bg-sunken/70")}
                      initial={{ width: 0 }}
                      animate={{ width: `${o.pct}%` }}
                      transition={{ duration: reduce ? 0 : 0.9, ease: EASE, delay: 0.1 }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative grid size-5 shrink-0 place-items-center rounded-[5px] text-[11px] font-bold",
                      isCorrect ? "bg-correct text-surface" : isWrong ? "bg-incorrect text-surface" : isChosen ? "bg-brand text-on-brand" : "bg-panel text-muted",
                    )}
                  >
                    {isCorrect ? <Check className="size-3" strokeWidth={3} /> : isWrong ? <X className="size-3" strokeWidth={3} /> : o.label}
                  </span>
                  <span className="relative flex-1">{o.text}</span>
                  {revealed && <span className="relative tabular text-[11.5px] font-semibold text-muted">{o.pct}%</span>}
                </li>
              );
            })}
          </ul>
        </div>
      </motion.div>

      <AnimatePresence>
        {step >= 3 && (
          <motion.div
            key="argo"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: reduce ? 0.15 : 0.7, ease: EASE }}
            className="relative -mt-5 ml-auto w-[88%] rounded-[12px] border border-white/10 bg-ink-2 p-4 text-on-ink shadow-[0_24px_60px_-18px_oklch(0.05_0.05_266/0.8)] sm:-mr-8"
          >
            <div className="flex items-center gap-2">
              <ArgoMark className="size-4 text-on-ink" />
              <span className="eyebrow text-on-ink-muted">ARGO</span>
              <span className="ml-auto rounded-full bg-on-ink/10 px-2 py-0.5 text-[11px] font-semibold text-on-ink-muted">Confusion pair</span>
            </div>
            <p className="mt-2.5 text-[13.5px] leading-snug">
              Third time this week you chose <span className="font-semibold">ulcerative colitis</span> when the answer was{" "}
              <span className="font-semibold">Crohn disease</span>.
            </p>
            <p className="mt-1.5 text-[12.5px] text-on-ink-muted">Queued: 4 discrimination drills and a retest in 2 days.</p>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11.5px] font-semibold text-on-ink-muted">
                <span>Crohn vs UC mastery</span>
                <span className="tabular text-on-ink">{step >= 4 ? "41% → target 80%" : "41%"}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-on-ink/10">
                <motion.div
                  className="h-full rounded-full bg-[var(--series-1)]"
                  initial={{ width: "0%" }}
                  animate={{ width: "41%" }}
                  transition={{ duration: reduce ? 0 : 1, ease: EASE }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
