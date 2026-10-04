"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { scheduleDaily, unscheduleDaily } from "../actions";

export type EligibleQuestion = { id: string; code: string; lead_in: string; author_difficulty: number; system: string; lastUsed: string | null };

export function DaySlot({
  day,
  isToday,
  current,
  eligible,
}: {
  day: string;
  isToday: boolean;
  current: { id: string; code: string; leadIn: string; timeLimit: number } | null;
  eligible: EligibleQuestion[];
}) {
  const [editing, setEditing] = useState(false);
  const [pick, setPick] = useState(current?.id ?? eligible[0]?.id ?? "");
  const [limit, setLimit] = useState(current?.timeLimit ?? 120);
  const [pending, start] = useTransition();
  const label = new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

  const save = () =>
    start(async () => {
      const res = await scheduleDaily(day, pick, limit);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Scheduled for ${label}`);
      setEditing(false);
    });
  const clear = () =>
    start(async () => {
      const res = await unscheduleDaily(day);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Cleared; it will be auto-picked");
    });

  return (
    <li className="py-3">
      <div className="flex items-start gap-4">
        <p className="tabular w-28 shrink-0 text-[13.5px] font-semibold">
          {label}
          {isToday && <span className="block text-[12px] font-normal text-brand-strong">Today</span>}
        </p>
        <div className="min-w-0 flex-1">
          {current ? (
            <>
              <p className="text-[13.5px] font-semibold">
                {current.code} <span className="font-normal text-muted">· {current.timeLimit}s</span>
              </p>
              <p className="truncate text-[13px] text-muted">{current.leadIn}</p>
            </>
          ) : (
            <p className="text-[13.5px] text-muted">Auto-pick at midnight UTC</p>
          )}
        </div>
        {!editing && (
          <div className="flex shrink-0 gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} disabled={!eligible.length}>
              {current ? "Change" : "Assign"}
            </Button>
            {current && !isToday && (
              <Button size="sm" variant="ghost" onClick={clear} disabled={pending}>
                Clear
              </Button>
            )}
          </div>
        )}
      </div>
      {editing && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-32">
          <select value={pick} onChange={(e) => setPick(e.target.value)} className="h-9 min-w-0 max-w-[340px] flex-1 rounded-[6px] border border-border bg-surface px-2 text-[13.5px]" aria-label="Question">
            {eligible.map((q) => (
              <option key={q.id} value={q.id}>
                {q.code} · {q.system} · {q.lastUsed ? `used ${q.lastUsed}` : "never used"}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-[13px] text-muted">
            <input type="number" min={30} max={600} step={10} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="h-9 w-20 rounded-[6px] border border-border bg-surface px-2 text-[13.5px] text-text" />s
          </label>
          <Button size="sm" onClick={save} loading={pending} disabled={!pick}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      )}
    </li>
  );
}
