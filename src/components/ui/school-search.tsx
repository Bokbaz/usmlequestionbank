"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Loader2, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { flagEmoji } from "@/lib/countries";
import { cn } from "@/lib/utils";

export type SchoolValue = { id: number | null; name: string; country?: string | null };
type Hit = { id: number; name: string; country: string | null; city: string | null };

const regionNames = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
const countryName = (code: string | null) => (code && regionNames ? (regionNames.of(code) ?? code) : code ?? "");

// Typeahead over the medical school directory. Typing keeps the text as a free-form school,
// picking a suggestion links the listed school, so nobody is ever blocked by a gap in the list.
export function SchoolSearch({
  id,
  value,
  onChange,
  placeholder = "Start typing your medical school",
}: {
  id?: string;
  value: SchoolValue | null;
  onChange: (v: SchoolValue | null) => void;
  placeholder?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const listId = useId();
  const [query, setQuery] = useState(value?.name ?? "");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const reqId = useRef(0);
  const wrap = useRef<HTMLDivElement>(null);

  const q = query.trim();
  const exact = hits.some((h) => h.name.toLowerCase() === q.toLowerCase());
  const options: ({ kind: "hit"; hit: Hit } | { kind: "typed" })[] = [
    ...hits.map((hit) => ({ kind: "hit" as const, hit })),
    ...(q.length >= 2 && !exact ? [{ kind: "typed" as const }] : []),
  ];

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Debounced search, started from the input's change handler; stale responses are dropped.
  function search(text: string) {
    clearTimeout(timer.current);
    const t = text.trim();
    const my = ++reqId.current;
    if (t.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const { data } = await supabase.rpc("search_medical_schools", { p_q: t, p_limit: 8 });
      if (my !== reqId.current) return;
      setHits((data as Hit[]) ?? []);
      setActive(0);
      setLoading(false);
    }, 160);
  }

  // Close when focus or a click leaves the widget.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  function pick(i: number) {
    const o = options[i];
    if (!o) return;
    if (o.kind === "hit") {
      onChange({ id: o.hit.id, name: o.hit.name, country: o.hit.country });
      setQuery(o.hit.name);
    } else {
      onChange({ id: null, name: q });
    }
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && options.length) {
      e.preventDefault();
      pick(active);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && q.length >= 2 && (loading || options.length > 0);
  const optionId = (i: number) => `${listId}-opt-${i}`;

  return (
    <div ref={wrap} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
        <input
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && options[active] ? optionId(active) : undefined}
          autoComplete="off"
          spellCheck={false}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            search(e.target.value);
            const t = e.target.value.trim();
            onChange(t ? { id: null, name: t } : null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-11 w-full rounded-[6px] border border-border bg-surface pl-9 pr-9 text-[15px] text-text placeholder:text-faint transition-[border-color,box-shadow] duration-150 hover:border-border-strong focus:border-brand-strong focus:outline-none focus:ring-3 focus:ring-[var(--brand-ring)]"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-faint" aria-hidden />}
        {!loading && value?.id != null && <Check className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-correct" strokeWidth={3} aria-hidden />}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Medical schools"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-[320px] overflow-y-auto rounded-[6px] border border-border bg-surface py-1 shadow-[var(--shadow-float)] motion-safe:animate-[fade-up_180ms_var(--ease-out-quart)_both]"
        >
          {options.map((o, i) => (
            <li
              key={o.kind === "hit" ? o.hit.id : "typed"}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => pick(i)}
              onPointerMove={() => setActive(i)}
              className={cn(
                "flex cursor-pointer items-start gap-3 px-3 py-2.5",
                i === active ? "bg-brand-soft" : "",
                o.kind === "typed" && hits.length > 0 && "border-t border-border",
              )}
            >
              {o.kind === "hit" ? (
                <>
                  <span className="mt-0.5 w-5 shrink-0 text-center text-[15px] leading-none" aria-hidden>
                    {flagEmoji(o.hit.country)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-semibold leading-snug text-text">{o.hit.name}</span>
                    <span className="block text-[12.5px] text-muted">
                      {[o.hit.city, countryName(o.hit.country)].filter(Boolean).join(", ")}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <Plus className="mt-0.5 size-4 shrink-0 text-brand-strong" strokeWidth={2.5} aria-hidden />
                  <span className="text-[14.5px] leading-snug text-text">
                    {hits.length ? "Not listed? " : "No match. "}Use <strong className="font-semibold">&ldquo;{q}&rdquo;</strong>
                  </span>
                </>
              )}
            </li>
          ))}
          {loading && options.length === 0 && <li className="px-3 py-2.5 text-[14px] text-muted">Searching…</li>}
        </ul>
      )}
    </div>
  );
}
