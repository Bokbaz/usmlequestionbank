"use client";

import { ChartFrame } from "./frame";

const SEQ = ["--seq-1", "--seq-2", "--seq-3", "--seq-4", "--seq-5", "--seq-6", "--seq-7"];

export function ActivityCalendar({ days, title = "Study activity", subtitle, className }: { days: { day: string; n: number }[]; title?: string; subtitle?: React.ReactNode; className?: string }) {
  const max = Math.max(1, ...days.map((d) => d.n));
  const color = (n: number) => (n === 0 ? "var(--sunken)" : `var(${SEQ[Math.min(6, Math.floor((n / max) * 6.999))]})`);
  const first = new Date(days[0]?.day ?? Date.now());
  const offset = (first.getUTCDay() + 6) % 7;
  const cells = [...Array(offset).fill(null), ...days];
  const weeks: ({ day: string; n: number } | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const total = days.reduce((s, d) => s + d.n, 0);
  return (
    <ChartFrame
      title={title}
      subtitle={subtitle ?? `${total.toLocaleString()} answers in the last 16 weeks`}
      className={className}
      table={{ columns: ["Date", "Answers"], rows: days.filter((d) => d.n > 0).map((d) => [d.day, d.n]) }}
    >
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((w, i) => (
          <div key={i} className="grid grid-rows-7 gap-[3px]">
            {w.map((d, j) =>
              d ? (
                <span
                  key={d.day}
                  title={`${d.day}: ${d.n} answers`}
                  aria-label={`${d.day}: ${d.n} answers`}
                  className="size-3 rounded-[3px]"
                  style={{ background: color(d.n) }}
                />
              ) : (
                <span key={`x${j}`} className="size-3" />
              ),
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted">
        <span>Less</span>
        <span className="size-3 rounded-[3px]" style={{ background: "var(--sunken)" }} />
        {SEQ.filter((_, i) => i % 2 === 0).map((s) => (
          <span key={s} className="size-3 rounded-[3px]" style={{ background: `var(${s})` }} />
        ))}
        <span>More</span>
      </div>
    </ChartFrame>
  );
}
