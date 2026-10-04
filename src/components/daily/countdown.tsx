"use client";

import { useNow } from "@/hooks/use-now";
import { formatClock } from "@/lib/utils";

export function Countdown({ to, className }: { to: string; className?: string }) {
  const now = useNow();
  const s = now == null ? null : Math.max(0, Math.round((new Date(to).getTime() - now) / 1000));
  return <span className={className}>{s == null ? "--:--:--" : formatClock(s)}</span>;
}
