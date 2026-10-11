"use client";

import { useState } from "react";
import { Search } from "lucide-react";

// Filters the server-rendered catalogue rows (the <li>s of each [data-group]) inside #target by title.
export function LibraryFilter({ target, total }: { target: string; total: number }) {
  const [shown, setShown] = useState(total);

  function filter(value: string) {
    const needle = value.trim().toLowerCase();
    const root = document.getElementById(target);
    if (!root) return;
    let n = 0;
    root.querySelectorAll<HTMLElement>("[data-group]").forEach((g) => {
      let any = false;
      g.querySelectorAll<HTMLElement>("li").forEach((li) => {
        const hit = !needle || (li.textContent ?? "").toLowerCase().includes(needle);
        li.hidden = !hit;
        if (hit) n++;
        any ||= hit;
      });
      g.hidden = !any;
    });
    setShown(n);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <label className="relative min-w-[260px] flex-1">
        <span className="sr-only">Search chapters</span>
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <input
          type="search"
          onChange={(e) => filter(e.target.value)}
          placeholder="Search chapters, such as heart failure"
          className="h-11 w-full rounded-[8px] border border-border bg-surface pl-9 pr-3 text-[15px] focus:border-brand-strong focus:outline-none focus:ring-3 focus:ring-[var(--brand-ring)]"
        />
      </label>
      <p aria-live="polite" className="text-[14px] text-muted">
        {shown === total ? `${total} chapters` : `${shown} of ${total} chapters`}
      </p>
    </div>
  );
}
