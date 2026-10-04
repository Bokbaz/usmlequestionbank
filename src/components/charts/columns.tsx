"use client";

import { useState } from "react";
import { ChartFrame } from "./frame";

export type ColumnDatum = { label: string; value: number | null; n: number; reference?: number | null };

// Vertical columns (0-100 scale) with value on the cap; optional reference tick per column.
export function Columns({
  title,
  subtitle,
  data,
  unit = "%",
  referenceLabel,
  emptyText = "Not enough answers yet.",
  className,
  minN = 1,
}: {
  title: string;
  subtitle?: React.ReactNode;
  data: ColumnDatum[];
  unit?: string;
  referenceLabel?: string;
  emptyText?: string;
  className?: string;
  minN?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const hasData = data.some((d) => d.n >= minN && d.value != null);
  const h = 150;
  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      className={className}
      legend={referenceLabel ? [{ label: "You", color: "var(--series-1)" }, { label: referenceLabel, color: "var(--text)", shape: "line" }] : undefined}
      table={{
        columns: referenceLabel ? ["Group", "Value", referenceLabel, "Answers"] : ["Group", "Value", "Answers"],
        rows: data.map((d) =>
          referenceLabel
            ? [d.label, d.value == null ? null : `${Math.round(d.value)}${unit}`, d.reference == null ? null : `${Math.round(d.reference)}${unit}`, d.n]
            : [d.label, d.value == null ? null : `${Math.round(d.value)}${unit}`, d.n],
        ),
      }}
    >
      {!hasData ? (
        <p className="py-8 text-[14px] text-muted">{emptyText}</p>
      ) : (
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
          {data.map((d, i) => {
            const v = d.n >= minN && d.value != null ? d.value : null;
            return (
              <div
                key={d.label}
                className="flex flex-col items-center outline-none"
                tabIndex={0}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${d.label}: ${v == null ? "not enough data" : `${Math.round(v)}${unit}`}, ${d.n} answers`}
              >
                <div className="relative w-full" style={{ height: h }}>
                  <span className="absolute inset-x-0 bottom-0 h-px bg-[var(--border-strong)]" />
                  {v != null && (
                    <>
                      <span
                        className="absolute bottom-0 left-1/2 w-[min(24px,60%)] -translate-x-1/2 rounded-t-[4px] transition-[height,filter] duration-500 ease-[var(--ease-out-quart)]"
                        style={{ height: `${(v / 100) * h}px`, background: "var(--series-1)", filter: hover === i ? "brightness(1.12)" : undefined }}
                      />
                      <span className="tabular absolute left-1/2 -translate-x-1/2 text-[12px] font-semibold text-text" style={{ bottom: `${(v / 100) * h + 4}px` }}>
                        {Math.round(v)}
                        {unit}
                      </span>
                    </>
                  )}
                  {d.reference != null && (
                    <span className="absolute left-1/2 h-0.5 w-[min(40px,90%)] -translate-x-1/2 rounded-full bg-text" style={{ bottom: `${(d.reference / 100) * h}px` }} />
                  )}
                  {hover === i && (
                    <span className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[6px] border border-border bg-surface px-2 py-1 text-[12px] shadow-[var(--shadow-float)]">
                      <strong className="tabular">{v == null ? "Too few" : `${Math.round(v)}${unit}`}</strong>
                      <span className="text-muted"> · {d.n} answers</span>
                    </span>
                  )}
                </div>
                <span className="mt-2 text-center text-[11.5px] leading-tight text-muted">{d.label}</span>
                <span className="tabular text-[11px] text-faint">n={d.n}</span>
              </div>
            );
          })}
        </div>
      )}
    </ChartFrame>
  );
}
