"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/lib/utils";

export function Countdown({ to, className }: { to: string; className?: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = now == null ? null : Math.max(0, Math.round((target - now) / 1000));
  return (
    <span className={className} suppressHydrationWarning>
      {s == null ? "--:--:--" : formatClock(s)}
    </span>
  );
}
