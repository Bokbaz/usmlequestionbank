"use client";

import { Check, X, Strikethrough } from "lucide-react";
import { cn } from "@/lib/utils";

export function OptionRow({
  label,
  body,
  selected,
  struck,
  locked,
  correct,
  wrongPick,
  peerPct,
  celebrate = false,
  onSelect,
  onStrike,
}: {
  label: string;
  body: string;
  selected: boolean;
  struck: boolean;
  locked: boolean;
  correct?: boolean;
  wrongPick?: boolean;
  peerPct?: number | null;
  /** True only on the render right after this answer was submitted: plays the reveal once. */
  celebrate?: boolean;
  onSelect: () => void;
  onStrike: () => void;
}) {
  const revealed = correct !== undefined;
  const nailedIt = celebrate && revealed && correct && selected;
  const missed = celebrate && revealed && wrongPick;
  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={locked}
      tabIndex={locked ? -1 : 0}
      onClick={() => !locked && !struck && onSelect()}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !locked) {
          e.preventDefault();
          onSelect();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!locked) onStrike();
      }}
      className={cn(
        "group relative flex items-start gap-3 rounded-[10px] border px-3.5 py-3 text-left outline-none transition-[background-color,border-color] duration-150",
        revealed
          ? correct
            ? "border-correct/45 bg-correct-soft"
            : wrongPick
              ? "border-incorrect/45 bg-incorrect-soft"
              : "border-border bg-surface"
          : selected
            ? "border-brand bg-brand-soft"
            : "border-border bg-surface hover:border-border-strong hover:bg-panel",
        !locked && "cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-strong",
        missed && "motion-safe:animate-[nudge_360ms_var(--ease-out-quart)]",
      )}
    >
      {nailedIt && (
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <span className="absolute inset-y-0 left-0 w-full bg-linear-to-r from-transparent via-correct/20 to-transparent motion-safe:animate-[sweep_700ms_var(--ease-out-quart)_120ms_both] motion-reduce:hidden" />
        </span>
      )}
      {revealed && peerPct != null && (
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <span
            className={cn("absolute inset-y-0 left-0 transition-[width] duration-700 ease-[var(--ease-out-quart)]", correct ? "bg-correct/10" : "bg-sunken/70")}
            style={{ width: `${peerPct}%` }}
          />
        </span>
      )}
      <span
        className={cn(
          "relative mt-px grid size-7 shrink-0 place-items-center rounded-[7px] text-[13px] font-bold",
          nailedIt && "motion-safe:animate-[chip-pop_420ms_var(--ease-out-quart)_both]",
          revealed && correct
            ? "bg-correct text-surface"
            : revealed && wrongPick
              ? "bg-incorrect text-surface"
              : selected
                ? "bg-brand text-on-brand"
                : "bg-panel text-muted group-hover:text-text",
        )}
      >
        {nailedIt ? <CheckBurst /> : revealed && correct ? <Check className="size-4" strokeWidth={3} aria-label="Correct answer" /> : revealed && wrongPick ? <X className="size-4" strokeWidth={3} aria-label="Your answer" /> : label}
      </span>
      <span className={cn("relative flex-1 pt-[3px] text-[16px] leading-snug", struck ? "text-faint line-through decoration-faint decoration-1" : "text-text")}>{body}</span>
      {revealed && peerPct != null && (
        <span className="tabular relative pt-[5px] text-[13px] font-semibold text-muted" title="Share of users who chose this">
          {peerPct}%
        </span>
      )}
      {!locked && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStrike();
          }}
          aria-label={struck ? `Restore option ${label}` : `Strike out option ${label}`}
          title={struck ? "Restore" : "Strike out (or right-click)"}
          className="relative grid size-7 shrink-0 place-items-center rounded-[6px] text-faint opacity-0 transition-opacity hover:bg-sunken hover:text-text focus:opacity-100 group-hover:opacity-100"
        >
          <Strikethrough className="size-4" />
        </button>
      )}
    </div>
  );
}

const SPARKS = [0, 60, 120, 180, 240, 300];

// The correct-answer moment: a drawn tick, a ring pulsing out, six short sparks.
function CheckBurst() {
  return (
    <>
      <svg viewBox="0 0 24 24" className="size-4" aria-label="Correct answer" role="img">
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="24"
          className="motion-safe:animate-[check-draw_320ms_var(--ease-out-quart)_140ms_both]"
        />
      </svg>
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[7px] ring-2 ring-correct motion-safe:animate-[ring-out_600ms_var(--ease-out-quart)_both] motion-reduce:hidden" />
      {SPARKS.map((a) => (
        <span
          key={a}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -ml-px -mt-[5px] h-[5px] w-[2px] origin-[50%_100%] rounded-full bg-correct opacity-0 motion-safe:animate-[spark_520ms_var(--ease-out-quart)_160ms_both] motion-reduce:hidden"
          style={{ "--a": `${a}deg` } as React.CSSProperties}
        />
      ))}
    </>
  );
}
