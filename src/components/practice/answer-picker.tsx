"use client";

import { useId, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Pick an answer, check it, and the explanation (rendered on the server and passed in as
// children) opens. Native radio inputs, so arrow keys and screen readers work as expected.
// Without JavaScript the explanation still opens from its own toggle.
export function AnswerPicker({
  options,
  correctLabel,
  children,
}: {
  options: { label: string; body: string }[];
  correctLabel: string;
  children: React.ReactNode;
}) {
  const name = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const right = checked && selected === correctLabel;

  function check() {
    setChecked(true);
    setOpen(true);
  }

  return (
    <div>
      <fieldset className="mt-6">
        <legend className="sr-only">Answer choices</legend>
        <div className="grid gap-2">
          {options.map((o) => {
            const isSel = selected === o.label;
            const isCorrect = checked && o.label === correctLabel;
            const isWrongPick = checked && isSel && o.label !== correctLabel;
            return (
              <label
                key={o.label}
                className={cn(
                  "flex w-full items-start gap-3 rounded-[10px] border px-3.5 py-3 text-left transition-[background-color,border-color] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-strong",
                  checked ? "cursor-default" : "cursor-pointer",
                  isCorrect
                    ? "border-correct/45 bg-correct-soft"
                    : isWrongPick
                      ? "border-incorrect/45 bg-incorrect-soft"
                      : isSel
                        ? "border-brand bg-brand-soft"
                        : "border-border bg-surface hover:border-border-strong hover:bg-panel",
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={o.label}
                  checked={isSel}
                  disabled={checked}
                  onChange={() => setSelected(o.label)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "mt-px grid size-7 shrink-0 place-items-center rounded-[7px] text-[13px] font-bold",
                    isCorrect ? "bg-correct text-surface" : isWrongPick ? "bg-incorrect text-surface" : isSel ? "bg-brand text-on-brand" : "bg-panel text-muted",
                  )}
                >
                  {isCorrect ? <Check className="size-4" strokeWidth={3} /> : isWrongPick ? <X className="size-4" strokeWidth={3} /> : o.label}
                </span>
                <span className="flex-1 pt-[3px] text-[16px] leading-snug text-text">
                  <span className="sr-only">{o.label}. </span>
                  {o.body}
                  {isCorrect && <span className="sr-only"> (correct answer)</span>}
                  {isWrongPick && <span className="sr-only"> (your answer, incorrect)</span>}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        {!checked ? (
          <Button size="lg" onClick={check} disabled={!selected}>
            Check answer
          </Button>
        ) : (
          <p role="status" className={cn("flex items-center gap-2 text-[16px] font-bold", right ? "text-correct" : "text-incorrect")}>
            {right ? <Check className="size-5" strokeWidth={3} /> : <X className="size-5" strokeWidth={3} />}
            {right ? "Correct." : `Not quite. The answer is ${correctLabel}.`}
          </p>
        )}
      </div>

      <details className="reveal-panel group mt-6 border-t-2 border-text" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-bold text-text [&::-webkit-details-marker]:hidden">
          <span>{open ? "Answer and explanation" : "Show the answer and explanation"}</span>
          <span aria-hidden className="text-[20px] leading-none text-faint transition-transform duration-200 group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="pb-2">{children}</div>
      </details>
    </div>
  );
}
