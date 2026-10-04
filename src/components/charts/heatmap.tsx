"use client";

import { useState } from "react";
import { ChartFrame } from "./frame";

const STOPS = ["--div-n3", "--div-n2", "--div-n1", "--div-0", "--div-p1", "--div-p2", "--div-p3"];
const EDGES = [30, 45, 55, 65, 75, 85];

export function divergingColor(v: number) {
  const idx = EDGES.findIndex((e) => v < e);
  return `var(${STOPS[idx === -1 ? 6 : idx]})`;
}
// Ink or light text by fill: extremes are dark in light mode.
function textOn(v: number) {
  return v < 30 || v >= 85 ? "#fff" : "var(--text)";
}

export function MasteryHeatmap({
  title,
  subtitle,
  rows,
  cols,
  cells,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  rows: { id: number; name: string }[];
  cols: { id: number; name: string }[];
  cells: { system: number; discipline: number; n: number; accuracy: number }[];
  className?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const map = new Map(cells.map((c) => [`${c.system}:${c.discipline}`, c]));
  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      className={className}
      table={{
        columns: ["System", "Discipline", "Accuracy", "Questions"],
        rows: cells.map((c) => [rows.find((r) => r.id === c.system)?.name ?? "", cols.find((d) => d.id === c.discipline)?.name ?? "", `${Math.round(c.accuracy)}%`, c.n]),
      }}
    >
      {rows.length === 0 ? (
        <p className="py-8 text-[14px] text-muted">Answer questions across systems to build your map.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="grid min-w-[520px] gap-[2px] text-[11.5px]" style={{ gridTemplateColumns: `140px repeat(${cols.length}, minmax(44px, 1fr))` }}>
              <span />
              {cols.map((c) => (
                <span key={c.id} className="truncate px-1 pb-1.5 text-center font-semibold text-muted" title={c.name}>
                  {c.name.split(" ")[0]}
                </span>
              ))}
              {rows.map((r) => (
                <div key={r.id} className="contents">
                  <span className="flex items-center truncate pr-2 font-semibold text-muted" title={r.name}>
                    {r.name}
                  </span>
                  {cols.map((c) => {
                    const cell = map.get(`${r.id}:${c.id}`);
                    const k = `${r.id}:${c.id}`;
                    return cell ? (
                      <span
                        key={k}
                        tabIndex={0}
                        onMouseEnter={() => setHover(k)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(k)}
                        onBlur={() => setHover(null)}
                        aria-label={`${r.name}, ${c.name}: ${Math.round(cell.accuracy)}% over ${cell.n} questions`}
                        className="relative grid h-9 place-items-center rounded-[4px] font-semibold outline-none transition-[filter] tabular"
                        style={{ background: divergingColor(cell.accuracy), color: textOn(cell.accuracy), filter: hover === k ? "brightness(1.08)" : undefined, opacity: cell.n < 3 ? 0.75 : 1 }}
                      >
                        {Math.round(cell.accuracy)}
                        {hover === k && (
                          <span className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[6px] border border-border bg-surface px-2 py-1 text-[12px] font-normal text-text shadow-[var(--shadow-float)]">
                            <strong className="tabular">{Math.round(cell.accuracy)}%</strong>
                            <span className="text-muted">
                              {" "}
                              · {r.name} × {c.name} · {cell.n} q
                            </span>
                          </span>
                        )}
                      </span>
                    ) : (
                      <span key={k} className="h-9 rounded-[4px] border border-dashed border-border" aria-hidden />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
            <span>Weak</span>
            {STOPS.map((s) => (
              <span key={s} className="h-2.5 w-6 rounded-[2px]" style={{ background: `var(${s})` }} />
            ))}
            <span>Strong</span>
            <span className="ml-3">Accuracy, first attempts. Faded cells: fewer than 3 questions.</span>
          </div>
        </>
      )}
    </ChartFrame>
  );
}
