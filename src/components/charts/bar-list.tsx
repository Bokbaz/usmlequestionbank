"use client";

import { useState } from "react";
import { ChartFrame, type LegendItem } from "./frame";

export type BarRow = { label: string; value: number | null; n?: number; peer?: number | null; href?: string; note?: string };

// Horizontal bars (0-100). Optional peer marker as a thin tick: two series, so a legend shows.
export function BarList({
  title,
  subtitle,
  rows,
  unit = "%",
  showPeers = false,
  emptyText = "No data yet.",
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  rows: BarRow[];
  unit?: string;
  showPeers?: boolean;
  emptyText?: string;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const legend: LegendItem[] | undefined = showPeers
    ? [
        { label: "You", color: "var(--series-1)" },
        { label: "All users", color: "var(--text)", shape: "tick" },
      ]
    : undefined;
  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      legend={legend}
      className={className}
      table={{
        columns: showPeers ? ["Category", "You", "All users", "Questions"] : ["Category", "Value", "Questions"],
        rows: rows.map((r) =>
          showPeers
            ? [r.label, r.value == null ? null : `${r.value.toFixed(0)}${unit}`, r.peer == null ? null : `${r.peer.toFixed(0)}${unit}`, r.n ?? null]
            : [r.label, r.value == null ? null : `${r.value.toFixed(0)}${unit}`, r.n ?? null],
        ),
      }}
    >
      {rows.length === 0 ? (
        <p className="py-6 text-[14px] text-muted">{emptyText}</p>
      ) : (
        <ul className="grid gap-2.5">
          {rows.map((r, i) => {
            const v = r.value ?? 0;
            return (
              <li
                key={r.label}
                className="group grid grid-cols-[minmax(110px,180px)_1fr_auto] items-center gap-3 rounded-[6px] outline-none"
                tabIndex={0}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${r.label}: ${r.value == null ? "no data" : `${v.toFixed(0)}${unit}`}${showPeers && r.peer != null ? `, all users ${r.peer.toFixed(0)}${unit}` : ""}${r.n != null ? `, ${r.n} questions` : ""}`}
              >
                <span className="truncate text-[13.5px] text-text" title={r.label}>
                  {r.href ? (
                    <a href={r.href} className="hover:underline">
                      {r.label}
                    </a>
                  ) : (
                    r.label
                  )}
                </span>
                <span className="relative h-5">
                  <span className="absolute inset-y-0 left-0 right-0 my-auto h-px bg-[var(--viz-grid)]" />
                  {r.value != null && (
                    <span
                      className="absolute inset-y-0 left-0 my-auto h-2.5 rounded-r-[4px] transition-[width,filter] duration-500 ease-[var(--ease-out-quart)]"
                      style={{ width: `${Math.max(1, v)}%`, background: "var(--series-1)", filter: hover === i ? "brightness(1.12)" : undefined }}
                    />
                  )}
                  {showPeers && r.peer != null && (
                    <span className="absolute inset-y-0 my-auto h-4 w-0.5 rounded-full bg-text" style={{ left: `calc(${r.peer}% - 1px)` }} />
                  )}
                  {hover === i && (
                    <span className="pointer-events-none absolute -top-8 z-10 -translate-x-1/2 whitespace-nowrap rounded-[6px] border border-border bg-surface px-2 py-1 text-[12px] shadow-[var(--shadow-float)]" style={{ left: `${Math.min(85, Math.max(15, v))}%` }}>
                      <strong className="tabular">{r.value == null ? "No data" : `${v.toFixed(0)}${unit}`}</strong>
                      {showPeers && r.peer != null && <span className="text-muted"> · all users {r.peer.toFixed(0)}{unit}</span>}
                      {r.n != null && <span className="text-muted"> · {r.n} q</span>}
                    </span>
                  )}
                </span>
                <span className="tabular w-12 text-right text-[13px] font-semibold text-text">{r.value == null ? "–" : `${v.toFixed(0)}${unit}`}</span>
              </li>
            );
          })}
        </ul>
      )}
    </ChartFrame>
  );
}
