"use client";

import { useMemo, useRef, useState } from "react";
import { scaleLinear, scaleTime } from "d3-scale";
import { line as d3line } from "d3-shape";
import { ChartFrame } from "./frame";

export type LinePoint = { x: string; y: number | null };

// One axis only. Crosshair snaps to the nearest x; tooltip lists the value.
export function LineChart({
  title,
  subtitle,
  points,
  yDomain = [0, 100],
  yUnit = "",
  reference,
  height = 200,
  emptyText = "Not enough history yet.",
  formatY = (v: number) => `${Math.round(v)}${yUnit}`,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  points: LinePoint[];
  yDomain?: [number, number];
  yUnit?: string;
  reference?: { value: number; label: string };
  height?: number;
  emptyText?: string;
  formatY?: (v: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const width = 640;
  const pad = { l: 36, r: 16, t: 14, b: 26 };
  const data = points.filter((p) => p.y != null) as { x: string; y: number }[];
  const { x, y, path, ticks } = useMemo(() => {
    const dates = data.map((d) => new Date(d.x));
    const x = scaleTime()
      .domain(dates.length > 1 ? [dates[0], dates[dates.length - 1]] : dates.length === 1 ? [new Date(+dates[0] - 3 * 864e5), new Date(+dates[0] + 3 * 864e5)] : [new Date(0), new Date(6 * 864e5)])
      .range([pad.l, width - pad.r]);
    const y = scaleLinear().domain(yDomain).range([height - pad.b, pad.t]).nice();
    const path = d3line<{ x: string; y: number }>()
      .x((d) => x(new Date(d.x)))
      .y((d) => y(d.y))(data);
    return { x, y, path, ticks: y.ticks(4) };
  }, [data, yDomain, height, pad.l, pad.r, pad.t, pad.b]);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * width;
    let best = 0;
    data.forEach((d, i) => {
      if (Math.abs(x(new Date(d.x)) - px) < Math.abs(x(new Date(data[best].x)) - px)) best = i;
    });
    setHover(best);
  };

  const last = data[data.length - 1];
  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      className={className}
      table={{ columns: ["Date", "Value"], rows: data.map((d) => [d.x, formatY(d.y)]) }}
    >
      {data.length < 2 ? (
        <p className="py-8 text-[14px] text-muted">{emptyText}</p>
      ) : (
        <div ref={ref} className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full touch-none"
            role="img"
            aria-label={`${title}: from ${formatY(data[0].y)} to ${formatY(last.y)}`}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" strokeWidth={1} />
                <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--faint)] text-[11px] tabular">
                  {formatY(t)}
                </text>
              </g>
            ))}
            {reference && (
              <g>
                <line x1={pad.l} x2={width - pad.r} y1={y(reference.value)} y2={y(reference.value)} stroke="var(--muted)" strokeWidth={1} />
                <text x={width - pad.r} y={y(reference.value) - 6} textAnchor="end" className="fill-[var(--muted)] text-[11px]">
                  {reference.label}
                </text>
              </g>
            )}
            <path d={path ?? ""} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={x(new Date(last.x))} cy={y(last.y)} r={4} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
            <text x={x(new Date(last.x))} y={y(last.y) - 10} textAnchor="end" className="fill-[var(--text)] text-[12px] font-semibold tabular">
              {formatY(last.y)}
            </text>
            {[data[0], last].map((d, i) => (
              <text key={i} x={x(new Date(d.x))} y={height - 6} textAnchor={i ? "end" : "start"} className="fill-[var(--faint)] text-[11px]">
                {new Date(d.x).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </text>
            ))}
            {hover != null && (
              <g>
                <line x1={x(new Date(data[hover].x))} x2={x(new Date(data[hover].x))} y1={pad.t} y2={height - pad.b} stroke="var(--border-strong)" strokeWidth={1} />
                <circle cx={x(new Date(data[hover].x))} cy={y(data[hover].y)} r={4} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
              </g>
            )}
          </svg>
          {hover != null && (
            <div
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-[6px] border border-border bg-surface px-2.5 py-1.5 text-[12.5px] shadow-[var(--shadow-float)]"
              style={{ left: `${(x(new Date(data[hover].x)) / width) * 100}%` }}
            >
              <strong className="tabular">{formatY(data[hover].y)}</strong>
              <span className="ml-1.5 text-muted">{new Date(data[hover].x).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
            </div>
          )}
        </div>
      )}
    </ChartFrame>
  );
}
