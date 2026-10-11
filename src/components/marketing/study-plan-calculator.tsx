"use client";

import { useId, useState } from "react";

// A study plan sized from three numbers. Assumptions are shown, not hidden: 90 seconds to answer
// a question (exam pace) and about 2 minutes to review it.
const ANSWER_MIN = 1.5;
const REVIEW_MIN = 2;

export function StudyPlanCalculator({
  examName,
  bankSize,
  defaults,
}: {
  examName: string;
  bankSize: number;
  defaults: { weeks: number; days: number; perDay: number };
}) {
  const [weeks, setWeeks] = useState(defaults.weeks);
  const [days, setDays] = useState(defaults.days);
  const [perDay, setPerDay] = useState(defaults.perDay);
  const id = useId();

  const total = weeks * days * perDay;
  const blocks = Math.max(1, Math.round(perDay / 20));
  const hours = (perDay * (ANSWER_MIN + REVIEW_MIN)) / 60;
  const passes = total / Math.max(1, bankSize);
  const mid = Math.max(2, Math.ceil(weeks / 2));

  const plan: { week: string; focus: string }[] = [
    { week: "Week 1", focus: `Take a baseline self-assessment. Start ${blocks} timed 20-question block${blocks === 1 ? "" : "s"} a day and review every question.` },
  ];
  if (weeks >= 3) plan.push({ week: weeks > 3 ? `Weeks 2–${weeks - 1}` : "Week 2", focus: "Mixed timed blocks every study day. Spend extra time on your three weakest systems, and keep an error log." });
  if (weeks >= 4) plan.push({ week: `Week ${mid}`, focus: "Second self-assessment. Re-rank your weak areas from the result." });
  plan.push({ week: `Week ${weeks}`, focus: "Final self-assessment early in the week, lighter blocks after it, and rest the day before the exam." });

  const sliders: { key: string; label: string; value: number; min: number; max: number; step: number; set: (n: number) => void; unit: string }[] = [
    { key: "w", label: "Weeks until your exam", value: weeks, min: 2, max: 20, step: 1, set: setWeeks, unit: weeks === 1 ? "week" : "weeks" },
    { key: "d", label: "Study days per week", value: days, min: 3, max: 7, step: 1, set: setDays, unit: "days" },
    { key: "q", label: "New questions per day", value: perDay, min: 20, max: 200, step: 10, set: setPerDay, unit: "questions" },
  ];
  return (
    <div className="overflow-hidden rounded-[8px] border border-border bg-surface">
      <div className="grid gap-6 border-b border-border p-5 sm:grid-cols-3 md:p-7">
        {sliders.map((f) => (
          <div key={f.key} className="grid gap-2">
            <label htmlFor={`${id}-${f.key}`} className="text-[14px] font-semibold">
              {f.label}
            </label>
            <input
              id={`${id}-${f.key}`}
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={f.value}
              onChange={(e) => f.set(Number(e.target.value))}
              className="w-full accent-[var(--brand)]"
            />
            <p className="readout text-[15px] text-text">
              {f.value} {f.unit}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-8 bg-ink p-5 text-on-ink md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:p-7" aria-live="polite">
        <dl className="grid content-start gap-3 text-[15px]">
          {[
            ["Questions in total", total.toLocaleString("en-US")],
            ["Blocks per study day", `${blocks} × 20 questions`],
            ["Hours per study day", `about ${hours.toFixed(1)}`],
            [`${examName} bank on Argonaut`, passes >= 1 ? `${passes.toFixed(1)} passes through ${bankSize.toLocaleString("en-US")}` : `${Math.round(passes * 100)}% of ${bankSize.toLocaleString("en-US")}`],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-3">
              <dt className="shrink-0 text-on-ink-muted">{k}</dt>
              <span aria-hidden className="h-px min-w-4 flex-1 translate-y-[-3px] border-b border-dashed border-on-ink/25" />
              <dd className="readout text-right text-signal">{v}</dd>
            </div>
          ))}
        </dl>
        <ol className="grid gap-3">
          {plan.map((p) => (
            <li key={p.week} className="grid grid-cols-[96px_1fr] gap-3 border-t border-on-ink/15 pt-3 text-[14.5px] leading-snug">
              <span className="font-bold">{p.week}</span>
              <span className="text-on-ink-muted">{p.focus}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="border-t border-border px-5 py-3 text-[12.5px] text-muted md:px-7">
        Assumes 90 seconds to answer a question (exam pace) and about 2 minutes to review it. Adjust to how you actually work.
      </p>
    </div>
  );
}

