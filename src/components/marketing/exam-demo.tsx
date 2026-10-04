import { Calculator, ChevronLeft, ChevronRight, Flag, FlaskConical, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = Array.from({ length: 14 }, (_, i) => i + 1);

// Static preview of the real test player (same layout and tokens).
export function ExamDemo() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-surface shadow-[0_40px_90px_-40px_oklch(0.2_0.06_266/0.45)]">
      <div className="flex items-center gap-4 bg-ink px-4 py-2.5 text-on-ink">
        <span className="text-[13px] font-semibold">Item 12 of 40</span>
        <span className="hidden items-center gap-1.5 rounded-[5px] bg-on-ink/10 px-2 py-1 text-[12px] font-semibold text-on-ink sm:inline-flex">
          <Flag className="size-3.5 fill-gold text-gold" /> Marked
        </span>
        <div className="ml-auto flex items-center gap-1 text-[12px] text-on-ink-muted">
          <span className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 hover:bg-on-ink/10">
            <FlaskConical className="size-3.5" /> Lab values
          </span>
          <span className="hidden items-center gap-1.5 rounded-[5px] px-2 py-1 sm:inline-flex">
            <Calculator className="size-3.5" /> Calculator
          </span>
          <span className="hidden items-center gap-1.5 rounded-[5px] px-2 py-1 md:inline-flex">
            <NotebookPen className="size-3.5" /> Notes
          </span>
        </div>
        <span className="tabular rounded-[5px] bg-on-ink/10 px-2 py-1 text-[12.5px] font-semibold">47:18</span>
      </div>
      <div className="flex">
        <ol className="hidden w-14 shrink-0 border-r border-border bg-panel py-2 sm:block" aria-hidden>
          {NAV.map((n) => (
            <li
              key={n}
              className={cn(
                "relative mx-1.5 mb-0.5 flex h-7 items-center justify-center rounded-[5px] text-[12px] font-semibold tabular",
                n === 12 ? "bg-brand text-on-brand" : n < 12 ? "text-text" : "text-faint",
              )}
            >
              {n}
              {n < 12 && n !== 7 && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-brand/70" />}
              {(n === 7 || n === 12) && <Flag className="absolute left-0.5 top-0.5 size-2.5 fill-gold text-gold" />}
            </li>
          ))}
        </ol>
        <div className="min-w-0 flex-1 px-5 py-5 md:px-7">
          <p className="max-w-[64ch] text-[14px] leading-[1.7] text-text">
            A 63-year-old man comes to the office because of difficulty rising from a chair and climbing stairs for 3
            months. He has smoked two packs of cigarettes daily for 40 years.{" "}
            <mark className="rounded-[2px] bg-highlight px-0.5 text-text">
              After 10 seconds of sustained contraction, the patellar reflex becomes brisker
            </mark>{" "}
            and strength transiently improves.
          </p>
          <p className="mt-3 text-[14px] font-semibold">Which of the following is the most likely mechanism of this patient&apos;s weakness?</p>
          <ul className="mt-3 grid gap-1.5 text-[13.5px]">
            {[
              ["A", "Antibodies against muscle-specific kinase", true],
              ["B", "Antibodies against postsynaptic acetylcholine receptors", false],
              ["C", "Antibodies against presynaptic calcium channels", false],
              ["D", "Degeneration of upper and lower motor neurons", true],
              ["E", "Toxin-mediated cleavage of SNARE proteins", false],
            ].map(([l, t, struck]) => (
              <li
                key={l as string}
                className={cn(
                  "flex items-center gap-2.5 rounded-[8px] border px-3 py-2",
                  l === "C" ? "border-brand/50 bg-brand-soft" : "border-border",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-[5px] text-[11px] font-bold",
                    l === "C" ? "bg-brand text-on-brand" : "bg-panel text-muted",
                  )}
                >
                  {l}
                </span>
                <span className={cn(struck ? "text-faint line-through decoration-faint" : "text-text")}>{t as string}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-panel px-4 py-2.5 text-[12.5px] font-semibold text-muted">
        <span className="inline-flex items-center gap-1">
          <ChevronLeft className="size-4" /> Previous
        </span>
        <span className="hidden sm:inline">Highlight · Strike out · Keyboard A to E</span>
        <span className="inline-flex items-center gap-1 text-text">
          Next <ChevronRight className="size-4" />
        </span>
      </div>
    </div>
  );
}
