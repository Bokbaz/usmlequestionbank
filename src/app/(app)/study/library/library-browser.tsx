"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";
import { NuggetGlyph } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CatalogRow = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  system_slug: string;
  system_name: string;
  is_free: boolean;
  reading_minutes: number;
  question_count: number;
  has_nugget: boolean;
  unlocked: boolean;
};

export function LibraryBrowser({ rows }: { rows: CatalogRow[] }) {
  const [q, setQ] = useState("");
  const [onlyNuggets, setOnlyNuggets] = useState(false);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => (!onlyNuggets || r.has_nugget) && (!needle || r.title.toLowerCase().includes(needle) || (r.summary ?? "").toLowerCase().includes(needle)));
  }, [q, onlyNuggets, rows]);
  const groups = useMemo(() => {
    const m = new Map<string, { name: string; rows: CatalogRow[] }>();
    for (const r of filtered) {
      const g = m.get(r.system_slug) ?? { name: r.system_name, rows: [] };
      g.rows.push(r);
      m.set(r.system_slug, g);
    }
    return [...m.entries()];
  }, [filtered]);

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block">
        <nav className="sticky top-8 grid gap-0.5" aria-label="Systems">
          {groups.map(([slug, g]) => (
            <a key={slug} href={`#${slug}`} className="flex items-center justify-between rounded-[6px] px-2.5 py-1.5 text-[13.5px] text-muted hover:bg-panel hover:text-text">
              <span className="truncate">{g.name}</span>
              <span className="tabular text-[12px] text-faint">{g.rows.length}</span>
            </a>
          ))}
        </nav>
      </aside>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search chapters"
              className="h-10 w-full rounded-[8px] border border-border bg-surface pl-9 pr-3 text-[15px] focus:border-brand-strong focus:outline-none focus:ring-3 focus:ring-[var(--brand-ring)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setOnlyNuggets((v) => !v)}
            aria-pressed={onlyNuggets}
            className={cn(
              "flex h-10 items-center gap-2 rounded-[8px] border px-3.5 text-[14px] font-semibold",
              onlyNuggets ? "border-transparent bg-gold-soft text-gold-ink" : "border-border bg-surface text-muted hover:text-text",
            )}
          >
            <NuggetGlyph className="size-3.5" /> Nugget chapters
          </button>
        </div>
        {groups.length === 0 && <p className="mt-10 text-muted">No chapters match.</p>}
        {groups.map(([slug, g]) => (
          <section key={slug} id={slug} className="mt-8 scroll-mt-8">
            <h2 className="eyebrow text-faint">{g.name}</h2>
            <ul className="mt-2 divide-y divide-border overflow-hidden rounded-[10px] border border-border bg-surface">
              {g.rows.map((r) => (
                <li key={r.id}>
                  <Link href={`/library/${r.slug}`} className="group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-panel">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-[15.5px] font-semibold">
                        {r.title}
                        {r.has_nugget && <NuggetGlyph />}
                      </p>
                      {r.summary && <p className="mt-1 line-clamp-2 max-w-[80ch] text-[13.5px] leading-snug text-muted">{r.summary}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3 pt-0.5 text-[12.5px] text-faint">
                      <span>{r.reading_minutes} min</span>
                      <span className="hidden sm:inline">
                        {r.question_count} {r.question_count === 1 ? "question" : "questions"}
                      </span>
                      {!r.unlocked && <Lock className="size-3.5" aria-label="Locked" />}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
