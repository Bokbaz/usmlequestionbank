"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Switch } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/segmented";
import { NuggetGlyph } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { createTest } from "@/app/actions/tests";
import { cn } from "@/lib/utils";

export type Counts = {
  available: number;
  pools: Record<"all" | "unused" | "incorrect" | "marked" | "omitted" | "correct", number>;
  by_system: Record<string, number>;
  by_discipline: Record<string, number>;
};

type Tax = {
  systems: { id: number; slug: string; short_name: string; sort: number }[];
  disciplines: { id: number; slug: string; name: string; kind: string; sort: number }[];
  competencies: { id: number; slug: string; name: string; group_name: string; sort: number }[];
};

const POOLS: { key: keyof Counts["pools"]; label: string; hint: string }[] = [
  { key: "unused", label: "Unused", hint: "Never answered" },
  { key: "incorrect", label: "Incorrect", hint: "Last attempt wrong" },
  { key: "marked", label: "Marked", hint: "Flagged in any block" },
  { key: "omitted", label: "Omitted", hint: "Seen, not answered" },
  { key: "correct", label: "Correct", hint: "Last attempt right" },
];

export function CreateTestForm({
  taxonomy,
  initialCounts,
  defaultExam,
  initialError,
}: {
  taxonomy: Tax;
  initialCounts: Counts | null;
  defaultExam: "step1" | "step2ck" | "step3" | null;
  initialError: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"tutor" | "timed">("tutor");
  const [pace, setPace] = useState("90");
  const [pool, setPool] = useState<string[]>(["unused"]);
  const [exam, setExam] = useState<"all" | "step1" | "step2ck">(defaultExam === "step2ck" ? "step2ck" : "all");
  const [systems, setSystems] = useState<number[]>([]);
  const [disciplines, setDisciplines] = useState<number[]>([]);
  const [nuggetsOnly, setNuggetsOnly] = useState(false);
  const [count, setCount] = useState(20);
  const [counts, setCounts] = useState<Counts | null>(initialCounts);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    if (initialError) toast.error(initialError);
  }, [initialError]);

  const refresh = useCallback(async () => {
    const id = ++reqId.current;
    setLoadingCounts(true);
    const { data } = await createClient().rpc("count_questions", {
      p_exam: exam === "all" ? null : exam,
      p_systems: systems.length ? systems : null,
      p_disciplines: disciplines.length ? disciplines : null,
      p_competencies: null,
      p_topics: null,
      p_pool: pool,
      p_nuggets_only: nuggetsOnly,
    });
    if (id === reqId.current) {
      setCounts(data as Counts);
      setLoadingCounts(false);
    }
  }, [exam, systems, disciplines, pool, nuggetsOnly]);

  useEffect(() => {
    const t = setTimeout(refresh, 180);
    return () => clearTimeout(t);
  }, [refresh]);

  const available = counts?.available ?? 0;
  const effectiveCount = Math.min(count, Math.max(available, 0), 40);

  const sortedSystems = useMemo(() => [...taxonomy.systems].sort((a, b) => a.sort - b.sort), [taxonomy.systems]);
  const foundational = taxonomy.disciplines.filter((d) => d.kind === "foundational");
  const clinical = taxonomy.disciplines.filter((d) => d.kind === "clinical");

  function toggle<T>(list: T[], v: T, set: (l: T[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  function submit() {
    if (!effectiveCount) return;
    start(async () => {
      const res = await createTest({
        mode,
        count: effectiveCount,
        exam: exam === "all" ? null : exam,
        systems,
        disciplines,
        pool,
        nuggetsOnly,
        secondsPerQuestion: Number(pace),
      });
      if (res.error) toast.error(res.error);
      else router.push(`/test/${res.id}`);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid content-start gap-6">
        <Section title="Mode">
          <div className="flex flex-wrap items-center gap-4">
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "tutor", label: "Tutor", hint: "Explanation after each answer" },
                { value: "timed", label: "Timed", hint: "Exam conditions, review at the end" },
              ]}
            />
            {mode === "timed" && (
              <label className="flex items-center gap-2 text-[14px] text-muted">
                Pace
                <select
                  value={pace}
                  onChange={(e) => setPace(e.target.value)}
                  className="h-8 rounded-[6px] border border-border bg-surface px-2 text-[13.5px] text-text"
                >
                  <option value="60">60 s per question (fast)</option>
                  <option value="90">90 s per question (exam pace)</option>
                  <option value="120">120 s per question (extended)</option>
                </select>
              </label>
            )}
          </div>
          <p className="mt-2 text-[13px] text-muted">
            {mode === "tutor" ? "See the answer and full explanation after each question." : "One clock for the block. Answers and explanations appear when you end it."}
          </p>
        </Section>

        <Section title="Question pool">
          <div className="flex flex-wrap gap-2">
            {POOLS.map((p) => {
              const on = pool.includes(p.key);
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    const next = on ? pool.filter((x) => x !== p.key) : [...pool, p.key];
                    setPool(next.length ? next : ["unused"]);
                  }}
                  title={p.hint}
                  aria-pressed={on}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-[8px] border px-3 text-[13.5px] font-semibold transition-colors",
                    on ? "border-brand bg-brand-soft text-brand-strong" : "border-border bg-surface text-muted hover:border-border-strong hover:text-text",
                  )}
                >
                  {p.label}
                  <span className={cn("tabular rounded-full px-1.5 text-[12px]", on ? "bg-surface text-brand-strong" : "bg-panel text-muted")}>
                    {counts?.pools?.[p.key] ?? "–"}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Exam">
          <Segmented
            value={exam}
            onChange={setExam}
            options={[
              { value: "all", label: "All" },
              { value: "step1", label: "Step 1" },
              { value: "step2ck", label: "Step 2 CK" },
            ]}
          />
        </Section>

        <Section
          title="Systems"
          action={
            <button type="button" onClick={() => setSystems(systems.length ? [] : sortedSystems.map((s) => s.id))} className="text-[13px] font-semibold text-brand hover:underline">
              {systems.length ? "Clear" : "Select all"}
            </button>
          }
        >
          <div className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
            {sortedSystems.map((s) => (
              <CheckRow key={s.id} label={s.short_name} n={counts?.by_system?.[s.id] ?? 0} checked={systems.includes(s.id)} onChange={() => toggle(systems, s.id, setSystems)} />
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-muted">None selected means all systems.</p>
        </Section>

        <Section
          title="Disciplines"
          action={
            <button type="button" onClick={() => setDisciplines(disciplines.length ? [] : taxonomy.disciplines.map((d) => d.id))} className="text-[13px] font-semibold text-brand hover:underline">
              {disciplines.length ? "Clear" : "Select all"}
            </button>
          }
        >
          <p className="eyebrow mb-1.5 text-faint">Foundational sciences</p>
          <div className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
            {foundational.map((d) => (
              <CheckRow key={d.id} label={d.name} n={counts?.by_discipline?.[d.id] ?? 0} checked={disciplines.includes(d.id)} onChange={() => toggle(disciplines, d.id, setDisciplines)} />
            ))}
          </div>
          <p className="eyebrow mb-1.5 mt-4 text-faint">Clinical disciplines</p>
          <div className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
            {clinical.map((d) => (
              <CheckRow key={d.id} label={d.name} n={counts?.by_discipline?.[d.id] ?? 0} checked={disciplines.includes(d.id)} onChange={() => toggle(disciplines, d.id, setDisciplines)} />
            ))}
          </div>
        </Section>
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-[10px] border border-border bg-surface p-5">
          <label className="flex items-center justify-between gap-3 rounded-[8px] bg-gold-soft px-3 py-2.5">
            <span className="flex items-center gap-2 text-[14px] font-semibold text-text">
              <NuggetGlyph className="size-3.5" /> Nuggets only
            </span>
            <Switch checked={nuggetsOnly} onCheckedChange={setNuggetsOnly} aria-label="Nuggets only" />
          </label>
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <label htmlFor="count" className="text-[14px] font-semibold">
                Questions
              </label>
              <span className={cn("tabular text-[13px]", loadingCounts ? "text-faint" : "text-muted")}>{available} available</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input
                id="count"
                type="range"
                min={1}
                max={40}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-sunken accent-[var(--brand)]"
              />
              <input
                type="number"
                min={1}
                max={40}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(40, Number(e.target.value) || 1)))}
                className="tabular h-9 w-16 rounded-[6px] border border-border bg-surface px-2 text-center text-[15px] font-semibold"
                aria-label="Number of questions"
              />
            </div>
            {count > available && available > 0 && (
              <p className="mt-2 text-[12.5px] text-muted">Only {available} match; the block will contain {available}.</p>
            )}
          </div>
          <dl className="mt-5 grid gap-1.5 border-t border-border pt-4 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-muted">Mode</dt>
              <dd className="font-semibold capitalize">{mode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Block time</dt>
              <dd className="tabular font-semibold">{mode === "timed" ? `${Math.round((effectiveCount * Number(pace)) / 60)} min` : "Untimed"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Filters</dt>
              <dd className="font-semibold">{systems.length + disciplines.length === 0 ? "None" : `${systems.length} systems, ${disciplines.length} disciplines`}</dd>
            </div>
          </dl>
          <Button className="mt-5 w-full" size="lg" onClick={submit} loading={pending} disabled={!effectiveCount}>
            {effectiveCount ? `Generate ${effectiveCount}-question block` : "No questions match"}
          </Button>
          {!effectiveCount && (
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-muted">
              <Gem className="size-3.5" /> Try the All pool or fewer filters.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[10px] border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-[700]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function CheckRow({ label, n, checked, onChange }: { label: string; n: number; checked: boolean; onChange: () => void }) {
  return (
    <label className={cn("flex h-9 cursor-pointer items-center gap-2.5 rounded-[6px] px-2 transition-colors hover:bg-panel", n === 0 && !checked && "opacity-55")}>
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className="flex-1 truncate text-[14px]">{label}</span>
      <span className="tabular text-[12.5px] text-muted">{n}</span>
    </label>
  );
}
