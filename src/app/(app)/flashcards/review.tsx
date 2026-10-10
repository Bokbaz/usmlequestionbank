"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/misc";
import { createClient } from "@/lib/supabase/client";

export type Card = { id: string; front: string; back: string; ease: number; interval_days: number; reps: number; lapses: number; due_at: string };

// SM-2 style scheduling: grade 0 (again) to 3 (easy).
function schedule(c: Card, grade: 0 | 1 | 2 | 3) {
  let ease = c.ease;
  let interval = c.interval_days;
  let reps = c.reps;
  let lapses = c.lapses;
  if (grade === 0) {
    lapses += 1;
    reps = 0;
    interval = 10 / 1440; // 10 minutes
    ease = Math.max(1.3, ease - 0.2);
  } else {
    reps += 1;
    if (reps === 1) interval = grade === 3 ? 4 : 1;
    else if (reps === 2) interval = grade === 3 ? 7 : 3;
    else interval = interval * (grade === 1 ? 1.2 : grade === 3 ? ease * 1.3 : ease);
    ease = Math.max(1.3, ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0));
  }
  return { ease, interval_days: interval, reps, lapses, due_at: new Date(Date.now() + interval * 86_400_000).toISOString() };
}

export function FlashcardReview({ cards, total, nextDue }: { cards: Card[]; total: number; nextDue: string | null }) {
  const [queue, setQueue] = useState(cards);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [removed, setRemoved] = useState(0);
  const card = queue[0];

  async function remove() {
    if (!card || !window.confirm("Delete this card from your deck?")) return;
    const { error } = await createClient().from("flashcards").delete().eq("id", card.id);
    if (error) return toast.error(error.message);
    setQueue((q) => q.slice(1));
    setFlipped(false);
    setRemoved((n) => n + 1);
    toast.success("Card deleted");
  }

  async function grade(g: 0 | 1 | 2 | 3) {
    if (!card) return;
    const next = schedule(card, g);
    const { error } = await createClient().from("flashcards").update(next).eq("id", card.id);
    if (error) return toast.error(error.message);
    setQueue((q) => (g === 0 ? [...q.slice(1), { ...card, ...next }] : q.slice(1)));
    setFlipped(false);
    if (g > 0) setDone((d) => d + 1);
  }

  if (!card)
    return (
      <div className="rounded-[12px] border border-border bg-surface p-10 text-center">
        <p className="text-[20px] font-[750]">All caught up</p>
        <p className="mt-2 text-muted">
          {done ? `${done} reviewed this session. ` : ""}
          {removed ? `${removed} deleted. ` : ""}
          {nextDue ? `Next card due ${new Date(nextDue).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.` : `${total} cards in your deck.`}
        </p>
      </div>
    );

  return (
    <div
      className="mx-auto max-w-[760px]"
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault();
          setFlipped(true);
        } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) grade((Number(e.key) - 1) as 0 | 1 | 2 | 3);
      }}
      tabIndex={0}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="tabular text-[13px] text-muted">{queue.length} left in this session</p>
        <Button variant="ghost" size="sm" onClick={remove} aria-label="Delete this card">
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>
      <div className="min-h-[300px] rounded-[14px] border border-border bg-surface p-8">
        <Markdown>{card.front}</Markdown>
        {flipped && (
          <div className="mt-6 border-t border-border pt-6">
            <Markdown>{card.back}</Markdown>
          </div>
        )}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {!flipped ? (
          <Button size="lg" onClick={() => setFlipped(true)}>
            Show answer <Kbd>Space</Kbd>
          </Button>
        ) : (
          (
            [
              [0, "Again", "danger"],
              [1, "Hard", "secondary"],
              [2, "Good", "primary"],
              [3, "Easy", "secondary"],
            ] as const
          ).map(([g, label, variant]) => (
            <Button key={g} size="lg" variant={variant} onClick={() => grade(g)}>
              {label} <span className="text-[12px] opacity-70">{g + 1}</span>
            </Button>
          ))
        )}
      </div>
    </div>
  );
}
