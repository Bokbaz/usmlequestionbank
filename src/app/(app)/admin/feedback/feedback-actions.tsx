"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setFeedbackStatus } from "../actions";

export function FeedbackActions({ id, status }: { id: number; status: "open" | "resolved" | "dismissed" }) {
  const [pending, start] = useTransition();
  const set = (next: "open" | "resolved" | "dismissed") =>
    start(async () => {
      const res = await setFeedbackStatus(id, next);
      if (res.error) toast.error(res.error);
    });
  return status === "open" ? (
    <div className="flex gap-1">
      <Button size="sm" variant="secondary" onClick={() => set("resolved")} disabled={pending}>
        Resolve
      </Button>
      <Button size="sm" variant="ghost" onClick={() => set("dismissed")} disabled={pending}>
        Dismiss
      </Button>
    </div>
  ) : (
    <Button size="sm" variant="ghost" onClick={() => set("open")} disabled={pending}>
      Reopen
    </Button>
  );
}
