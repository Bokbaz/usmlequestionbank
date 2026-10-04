"use client";

import { useState } from "react";
import { Table2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type LegendItem = { label: string; color: string; shape?: "rect" | "line" | "tick" };

// Every chart ships a title, an optional legend (2+ series), and a table view twin.
export function ChartFrame({
  title,
  subtitle,
  legend,
  table,
  children,
  className,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  legend?: LegendItem[];
  table?: { columns: string[]; rows: (string | number | null)[][] };
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className={cn("rounded-[10px] border border-border bg-surface p-5", className)} aria-label={title}>
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-[700] tracking-[-0.005em]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          {table && (
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              className="grid size-8 place-items-center rounded-[6px] text-faint transition-colors hover:bg-panel hover:text-text"
              aria-label={showTable ? "Show chart" : "Show data table"}
              aria-pressed={showTable}
              title={showTable ? "Chart view" : "Table view"}
            >
              {showTable ? <BarChart3 className="size-4" /> : <Table2 className="size-4" />}
            </button>
          )}
        </div>
      </header>
      {legend && legend.length > 1 && !showTable && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5 text-[12.5px] text-muted">
              {l.shape === "line" ? (
                <span className="h-0.5 w-3.5 rounded-full" style={{ background: l.color }} />
              ) : l.shape === "tick" ? (
                <span className="h-3 w-0.5 rounded-full" style={{ background: l.color }} />
              ) : (
                <span className="size-2.5 rounded-[2px]" style={{ background: l.color }} />
              )}
              {l.label}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        {showTable && table ? (
          <div className="max-h-[360px] overflow-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead className="sticky top-0 bg-surface">
                <tr>
                  {table.columns.map((c, i) => (
                    <th key={c} className={cn("border-b border-border px-2 py-2 font-semibold text-muted", i > 0 && "text-right")}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {r.map((cell, j) => (
                      <td key={j} className={cn("px-2 py-1.5", j > 0 && "tabular text-right")}>
                        {cell ?? "–"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

// Lightweight tooltip anchored inside a relatively positioned chart container.
export function TooltipBox({ x, y, children, containerWidth }: { x: number; y: number; children: React.ReactNode; containerWidth: number }) {
  const left = Math.min(Math.max(x, 70), containerWidth - 70);
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-[6px] border border-border bg-surface px-2.5 py-1.5 text-[12.5px] shadow-[var(--shadow-float)]"
      style={{ left, top: y - 8 }}
    >
      {children}
    </div>
  );
}
