"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge, NuggetGlyph } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/misc";
import { cn, plural } from "@/lib/utils";
import { promoteQuestion, setQuestionFlags, setQuestionStatus } from "../actions";

export type AdminQuestionRow = {
  id: string;
  code: string;
  lead_in: string;
  status: "draft" | "published" | "retired";
  source: string;
  is_free: boolean;
  is_daily_eligible: boolean;
  is_nugget: boolean;
  owner_id: string | null;
  author_difficulty: number;
  system: { short_name: string } | null;
  topic: { name: string } | null;
  stats: { n_attempts: number; n_correct: number } | null;
};

const STATUS_TONE = { published: "correct", draft: "neutral", retired: "incorrect" } as const;

export function QuestionTable({ rows, total, argo }: { rows: AdminQuestionRow[]; total: number; argo: boolean }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const ids = [...selected];
  const all = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const run = (fn: () => Promise<{ error?: string }>, done: string) =>
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success(done);
        setSelected(new Set());
      }
    });

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="rounded-[10px] border border-border bg-surface">
      <div className="flex min-h-12 flex-wrap items-center gap-2 border-b border-border px-4 py-2">
        <p className="mr-auto text-[13.5px] text-muted">
          {ids.length ? <span className="font-semibold text-text">{ids.length} selected</span> : plural(total, "question")}
        </p>
        {ids.length > 0 && (
          <>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setQuestionStatus(ids, "published"), "Published")}>
              Publish
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setQuestionStatus(ids, "draft"), "Moved to draft")}>
              Draft
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setQuestionStatus(ids, "retired"), "Retired")}>
              Retire
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setQuestionFlags(ids, { is_free: true }), "Marked free")}>
              Free
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setQuestionFlags(ids, { is_free: false }), "Marked paid")}>
              Paid
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setQuestionFlags(ids, { is_daily_eligible: true }), "Daily-eligible")}>
              Daily on
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setQuestionFlags(ids, { is_daily_eligible: false }), "Removed from Daily pool")}>
              Daily off
            </Button>
          </>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-border bg-panel text-[12.5px] text-muted">
              <th className="w-10 px-4 py-2.5">
                <Checkbox
                  checked={all ? true : ids.length ? "indeterminate" : false}
                  onCheckedChange={() => setSelected(all ? new Set() : new Set(rows.map((r) => r.id)))}
                  aria-label="Select all on this page"
                />
              </th>
              <th className="px-2 py-2.5 font-semibold">ID</th>
              <th className="px-2 py-2.5 font-semibold">Question</th>
              <th className="px-2 py-2.5 font-semibold">System</th>
              <th className="px-2 py-2.5 font-semibold">Status</th>
              <th className="px-2 py-2.5 text-right font-semibold">Answers</th>
              <th className="px-4 py-2.5 text-right font-semibold">Correct</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const n = r.stats?.n_attempts ?? 0;
              return (
                <tr key={r.id} className={cn("border-b border-border last:border-0", selected.has(r.id) && "bg-brand-soft/40")}>
                  <td className="px-4 py-2.5 align-top">
                    <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} aria-label={`Select ${r.code}`} />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 align-top font-semibold">{r.code}</td>
                  <td className="max-w-[460px] px-2 py-2.5 align-top">
                    <p className="truncate">{r.lead_in}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
                      {r.topic?.name ?? "No topic"}
                      {r.is_nugget && <NuggetGlyph />}
                      {r.is_free && <Badge tone="brand">Free</Badge>}
                      {r.is_daily_eligible && <Badge tone="gold">Daily</Badge>}
                      {r.source === "argo" && <Badge tone="neutral">ARGO</Badge>}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 align-top text-muted">{r.system?.short_name ?? "–"}</td>
                  <td className="px-2 py-2.5 align-top">
                    <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                  </td>
                  <td className="tabular px-2 py-2.5 text-right align-top">{n}</td>
                  <td className="tabular px-4 py-2.5 text-right align-top">
                    {n ? `${Math.round((100 * (r.stats?.n_correct ?? 0)) / n)}%` : "–"}
                    {argo && r.owner_id && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => promoteQuestion(r.id), `${r.code} moved into the bank`)}
                        className="ml-3 text-[12.5px] font-semibold text-brand-strong hover:underline"
                      >
                        Promote
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No questions match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
