"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { decideNugget } from "../actions";

export type ReviewItem = {
  id: number;
  question_id: string;
  code: string;
  title: string;
  body: string | null;
  score: number;
  lines: { id: number; body: string; source: string }[];
};

export function ReviewList({ items }: { items: ReviewItem[] }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const open = items.filter((i) => !done.has(i.id));
  if (!open.length) return <p className="text-[14px] text-muted">All reviewed. Refresh for more.</p>;
  return (
    <ul className="grid gap-3">
      {open.map((item) => (
        <ReviewCard key={item.id} item={item} onDone={() => setDone((s) => new Set(s).add(item.id))} />
      ))}
    </ul>
  );
}

function ReviewCard({ item, onDone }: { item: ReviewItem; onDone: () => void }) {
  const [title, setTitle] = useState(item.title);
  const [pending, start] = useTransition();
  const decide = (approve: boolean) =>
    start(async () => {
      const res = await decideNugget(item.id, approve, title);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(approve ? `${item.code} is now a Nugget` : "Dismissed");
      onDone();
    });
  return (
    <li className="rounded-[10px] border border-border bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-[14px] font-semibold">{item.code}</p>
        <p className="tabular text-[13px] text-muted">Match {item.score.toFixed(3)}</p>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="grid content-start gap-2">
          <label className="text-[12.5px] font-semibold text-muted" htmlFor={`title-${item.id}`}>
            Card title (shown to students)
          </label>
          <Input id={`title-${item.id}`} value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-[14px]" />
          {item.body && <p className="text-[13.5px] text-muted">{item.body}</p>}
        </div>
        <div className="grid content-start gap-2">
          <p className="text-[12.5px] font-semibold text-muted">Closest high-yield lines (private)</p>
          <ul className="grid gap-1.5">
            {item.lines.map((l) => (
              <li key={l.id} className="rounded-[6px] bg-panel px-3 py-2 text-[13px]">
                <span className="mr-1.5 text-[11.5px] font-semibold uppercase text-faint">{l.source}</span>
                {l.body}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={() => decide(true)} disabled={pending || !title.trim()}>
          Approve as Nugget
        </Button>
        <Button size="sm" variant="ghost" onClick={() => decide(false)} disabled={pending}>
          Not a Nugget
        </Button>
      </div>
    </li>
  );
}
