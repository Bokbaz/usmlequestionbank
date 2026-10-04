"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setUserPlan } from "../actions";

export function PlanEditor({ userId, plan, expires }: { userId: string; plan: "free" | "core" | "argo"; expires: string | null }) {
  const [value, setValue] = useState(plan);
  const [until, setUntil] = useState(expires ? expires.slice(0, 10) : "");
  const [pending, start] = useTransition();
  const dirty = value !== plan || until !== (expires ? expires.slice(0, 10) : "");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={value} onChange={(e) => setValue(e.target.value as typeof plan)} className="h-8 rounded-[6px] border border-border bg-surface px-2 text-[13px]" aria-label="Plan">
        <option value="free">Free</option>
        <option value="core">Core</option>
        <option value="argo">ARGO</option>
      </select>
      <input
        type="date"
        value={until}
        onChange={(e) => setUntil(e.target.value)}
        disabled={value === "free"}
        aria-label="Plan expires"
        title="Leave empty for no expiry"
        className="h-8 rounded-[6px] border border-border bg-surface px-2 text-[13px] disabled:opacity-50"
      />
      {dirty && (
        <Button
          size="sm"
          loading={pending}
          onClick={() =>
            start(async () => {
              const res = await setUserPlan(userId, value, value === "free" ? null : until || null);
              if (res.error) toast.error(res.error);
              else toast.success("Plan updated");
            })
          }
        >
          Save
        </Button>
      )}
    </div>
  );
}
