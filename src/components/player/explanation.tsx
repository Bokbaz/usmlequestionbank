"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, Check, Clock, Layers3, Users, X } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { NuggetGlyph } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ERROR_META, type ErrorType } from "@/lib/argo/model";
import type { ReviewPayload } from "@/lib/daily/types";
import type { PlayerItem } from "./types";
import { cn, formatSeconds } from "@/lib/utils";

export function Explanation({
  item,
  review,
  errorType,
  showArticleLink = true,
  celebrate = false,
  streak = 0,
}: {
  item: PlayerItem;
  review: ReviewPayload;
  errorType?: ErrorType | null;
  showArticleLink?: boolean;
  /** Answer was revealed just now: animate the verdict in. */
  celebrate?: boolean;
  /** Correct answers in a row, counting this one. Shown from 2. */
  streak?: number;
}) {
  const selected = item.options.find((o) => o.id === item.state.selected_option_id);
  const isCorrect = selected?.id === review.correct_option_id;
  const omitted = !selected;
  const [saving, setSaving] = useState(false);

  async function addFlashcard() {
    setSaving(true);
    const correctText = item.options.find((o) => o.id === review.correct_option_id)?.body ?? "";
    const objective = review.educational_objective ?? "";
    let front = objective;
    for (const needle of [review.key_concept, correctText].filter(Boolean) as string[]) {
      const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (re.test(objective)) {
        front = objective.replace(re, "_____");
        break;
      }
    }
    if (front === objective) front = `${item.topic ?? item.system}: what is the key point?`;
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("flashcards").insert({
      user_id: auth.user!.id,
      question_id: item.question_id,
      front: `**${item.topic ?? item.system}**\n\n${front}`,
      back: `**${correctText}**\n\n${objective}`,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Added to flashcards");
  }

  return (
    <div className="mt-8 border-t border-border pt-7">
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[10px] px-4 py-3",
          isCorrect ? "bg-correct-soft" : "bg-incorrect-soft",
          celebrate && "motion-safe:animate-[fade-up_420ms_var(--ease-out-expo)_both]",
        )}
      >
        <p className={cn("flex items-center gap-2 text-[16px] font-[700]", isCorrect ? "text-correct" : "text-incorrect")}>
          {isCorrect ? <Check className="size-5" strokeWidth={3} /> : <X className="size-5" strokeWidth={3} />}
          {isCorrect ? "Correct" : omitted ? "Omitted" : "Incorrect"}
          <span className="font-semibold text-text">· answer {review.correct_label}</span>
        </p>
        {isCorrect && streak >= 2 && (
          <span className="flex items-center gap-1.5 rounded-full bg-correct px-2.5 py-0.5 text-[13px] font-bold text-surface" aria-live="polite">
            <span className="inline-block overflow-hidden">
              <span key={streak} className="readout inline-block motion-safe:animate-[count-up_380ms_var(--ease-out-expo)_both]">
                {streak}
              </span>
            </span>
            in a row
          </span>
        )}
        {review.peer && review.peer.n > 0 && (
          <span className="flex items-center gap-1.5 text-[13.5px] text-muted">
            <Users className="size-4" /> {review.peer.pct_correct}% answered correctly
          </span>
        )}
        <span className="flex items-center gap-1.5 text-[13.5px] text-muted">
          <Clock className="size-4" /> {formatSeconds(item.state.time_ms)}
          {review.peer?.avg_time_s ? ` (average ${review.peer.avg_time_s}s)` : ""}
        </span>
        {errorType && errorType !== "omitted" && (
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-[12.5px] font-semibold text-text" title={ERROR_META[errorType].advice}>
            ARGO: {ERROR_META[errorType].label}
          </span>
        )}
      </div>

      {review.nuggets.length > 0 && (
        <div className="mt-5 grid gap-3">
          {review.nuggets.map((n) => (
            <div key={n.id} className="rounded-[10px] bg-gold-soft p-4">
              <p className="eyebrow flex items-center gap-1.5 text-gold-ink">
                <NuggetGlyph className="size-3.5" /> Nugget · ultra-high-yield
              </p>
              <p className="mt-1.5 text-[15.5px] font-semibold leading-snug">{n.title}</p>
              {n.body && <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{n.body}</p>}
            </div>
          ))}
        </div>
      )}

      <Markdown className="mt-6">{review.explanation}</Markdown>

      {Object.keys(review.option_explanations ?? {}).length > 0 && (
        <div className="mt-7">
          <h3 className="text-[15px] font-[700]">Why each choice is right or wrong</h3>
          <ul className="mt-3 grid gap-2">
            {item.options.map((o) => {
              const exp = review.option_explanations[o.label];
              if (!exp) return null;
              const right = o.id === review.correct_option_id;
              const mine = o.id === item.state.selected_option_id;
              return (
                <li key={o.id} className={cn("flex gap-3 rounded-[10px] border px-3.5 py-3", right ? "border-correct/40 bg-correct-soft/60" : "border-border bg-surface")}>
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-[6px] text-[12px] font-bold",
                      right ? "bg-correct text-surface" : mine ? "bg-incorrect text-surface" : "bg-panel text-muted",
                    )}
                  >
                    {o.label}
                  </span>
                  <div className="min-w-0 text-[15px] leading-relaxed">
                    <span className="font-semibold">{o.body}.</span>{" "}
                    <span className="text-muted">{exp.replace(/^Correct\.\s*/i, "")}</span>
                    {mine && !right && <span className="ml-1 text-[12.5px] font-semibold text-incorrect">(your answer)</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {review.educational_objective && (
        <div className="mt-7 rounded-[10px] border border-border bg-panel p-4">
          <p className="eyebrow text-brand-strong">Educational objective</p>
          <p className="mt-1.5 text-[15.5px] leading-relaxed">{review.educational_objective}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {showArticleLink && review.article && (
          <Button asChild variant="secondary" size="sm">
            <Link href={`/library/${review.article.slug}`} target="_blank">
              <BookOpen className="size-4" /> Library: {review.article.title}
            </Link>
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={addFlashcard} loading={saving}>
          <Layers3 className="size-4" /> Add to flashcards
        </Button>
        <span className="ml-auto text-[12.5px] text-faint">
          {item.code} · {item.system}
          {item.discipline ? ` · ${item.discipline}` : ""}
          {item.topic ? ` · ${item.topic}` : ""}
        </span>
      </div>

      {review.references?.length > 0 && (
        <details className="mt-5 text-[13px] text-muted">
          <summary className="cursor-pointer font-semibold text-text">References</summary>
          <ul className="mt-2 grid gap-1 pl-4">
            {review.references.map((r) => (
              <li key={r} className="list-disc">
                {r}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
