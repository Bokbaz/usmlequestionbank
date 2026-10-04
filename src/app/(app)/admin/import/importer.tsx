"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, FileText, Sparkles, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge, NuggetGlyph } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/segmented";
import { parseAqf, revalidateAqf, toUpsertPayload, type AqfQuestion } from "@/lib/aqf/parse";
import { SYSTEMS, resolveCompetency, resolveDiscipline, resolveSystem, systemName } from "@/lib/taxonomy";
import { cn, plural } from "@/lib/utils";

type Phase = "input" | "review" | "importing" | "done";
type Filter = "all" | "errors" | "warnings" | "ready";
type ItemResult = { index: number; code: string | null; id?: string; created?: boolean; topicId?: number | null; error?: string; nugget?: "curated" | "auto" | "review" | "none" };
type Classified = { index: number; system: string; discipline: string; competency: string; category: string | null; topic: string; key_concept: string; difficulty: number };
type Structured = {
  stem: string;
  lead_in: string;
  options: { label: string; text: string }[];
  correct: string | null;
  explanation: string | null;
  option_explanations: { label: string; text: string }[];
  objective: string | null;
  references: string[];
};

const PAGE = 50;
const CHUNK = 20;

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `Request failed (${res.status})`);
  return json as T;
}

// Runs fn over items with a fixed number of workers; stops early when shouldStop() is true.
async function pool<T>(items: T[], workers: number, fn: (item: T) => Promise<void>, shouldStop = () => false) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(workers, items.length) }, async () => {
      while (next < items.length && !shouldStop()) await fn(items[next++]);
    }),
  );
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function applyClassification(q: AqfQuestion, c: Classified): AqfQuestion {
  const given = (k: string) => q.meta.includes(k);
  const next: AqfQuestion = { ...q, ai: { ...q.ai, classified: true } };
  if (!q.system || q.systemGuessed) {
    next.system = resolveSystem(c.system) ?? q.system;
    next.systemGuessed = false;
  }
  if (!q.discipline) next.discipline = resolveDiscipline(c.discipline) ?? undefined;
  if (!q.competency) next.competency = resolveCompetency(c.competency) ?? undefined;
  if (!q.category && c.category) next.category = c.category;
  if (!q.topic && c.topic) next.topic = c.topic;
  if (!q.keyConcept && c.key_concept) next.keyConcept = c.key_concept;
  if (!given("difficulty")) next.difficulty = Math.min(5, Math.max(1, Math.round(c.difficulty)));
  return revalidateAqf(next);
}

function applyStructure(q: AqfQuestion, s: Structured): AqfQuestion {
  const optionExplanations = Object.fromEntries(s.option_explanations.map((e) => [e.label, e.text]));
  return revalidateAqf({
    ...q,
    stem: s.stem.trim(),
    leadIn: s.lead_in.trim(),
    options: s.options.map((o) => ({ label: o.label, body: o.text.trim(), concept: q.options.find((x) => x.label === o.label)?.concept })),
    correct: s.correct ?? undefined,
    explanation: s.explanation?.trim() || q.explanation,
    optionExplanations: Object.keys(optionExplanations).length ? optionExplanations : q.optionExplanations,
    objective: s.objective?.trim() || q.objective,
    references: s.references.length ? s.references : q.references,
    ai: { ...q.ai, structured: true },
  });
}

const needsClassification = (q: AqfQuestion) => !q.system || q.systemGuessed || !q.discipline || !q.competency || !q.topic;

export function Importer({ ai }: { ai: boolean }) {
  const [phase, setPhase] = useState<Phase>("input");
  const [fileName, setFileName] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [dragging, setDragging] = useState(false);
  const [questions, setQuestions] = useState<AqfQuestion[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [defaultStatus, setDefaultStatus] = useState<"published" | "draft">("published");
  const [fallbackSystem, setFallbackSystem] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [aiTask, setAiTask] = useState<{ label: string; done: number; total: number } | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0, created: 0, updated: 0, failed: 0, auto: 0, review: 0, curated: 0 });
  const [results, setResults] = useState<ItemResult[]>([]);
  const [finished, setFinished] = useState<{ articles: number; libraryError: string | null; stopped: boolean } | null>(null);
  const stopRef = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // A fallback system fills in questions that neither state nor suggest one.
  const view = useMemo(
    () => questions.map((q) => (!q.system && fallbackSystem ? revalidateAqf({ ...q, system: fallbackSystem }) : q)),
    [questions, fallbackSystem],
  );
  const errors = view.filter((q) => q.errors.length);
  const warned = view.filter((q) => !q.errors.length && q.warnings.length);
  const ready = view.filter((q) => !q.errors.length);
  const toClassify = view.filter(needsClassification);
  const toRepair = view.filter((q) => q.errors.length && q.raw);
  const bySystem = useMemo(() => {
    const m = new Map<string, number>();
    for (const q of ready) m.set(q.system ?? "?", (m.get(q.system ?? "?") ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [ready]);
  const shown = filter === "errors" ? errors : filter === "warnings" ? warned : filter === "ready" ? ready.filter((q) => !q.warnings.length) : view;
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));

  function load(text: string, name: string | null) {
    const res = parseAqf(text);
    setQuestions(res.questions);
    setFileErrors(res.fileErrors);
    setFileName(name);
    setFilter(res.questions.some((q) => q.errors.length) ? "errors" : "all");
    setPage(0);
    setOpenIndex(null);
    setPhase("review");
  }

  async function readFile(file: File) {
    if (file.size > 60 * 1024 * 1024) return toast.error("Files over 60 MB: split them into parts.");
    load(await file.text(), file.name);
  }

  function replace(updated: AqfQuestion[]) {
    const byIndex = new Map(updated.map((q) => [q.index, q]));
    setQuestions((prev) => prev.map((q) => byIndex.get(q.index) ?? q));
  }

  async function classifyAll() {
    const targets = toClassify;
    if (!targets.length) return;
    setAiTask({ label: "Classifying", done: 0, total: targets.length });
    let failures = 0;
    await pool(chunk(targets, 8), 2, async (group) => {
      try {
        const res = await post<{ items: Classified[] }>("/api/admin/ai/classify", {
          items: group.map((q) => ({
            index: q.index,
            stem: q.stem,
            leadIn: q.leadIn,
            options: q.options.map((o) => `${o.label}. ${o.body}`),
            answer: q.options.find((o) => o.label === q.correct)?.body ?? null,
            explanation: q.explanation || null,
          })),
        });
        const byIndex = new Map(res.items.map((c) => [c.index, c]));
        replace(group.map((q) => (byIndex.has(q.index) ? applyClassification(q, byIndex.get(q.index)!) : q)));
      } catch (e) {
        failures += group.length;
        if (failures === group.length) toast.error(e instanceof Error ? e.message : "Classification failed");
      }
      setAiTask((t) => t && { ...t, done: t.done + group.length });
    });
    setAiTask(null);
    toast.success(failures ? `Classified ${targets.length - failures}; ${failures} failed` : `Classified ${plural(targets.length, "question")}`);
  }

  async function repair(targets: AqfQuestion[]) {
    if (!targets.length) return;
    setAiTask({ label: "Repairing", done: 0, total: targets.length });
    let fixed = 0;
    await pool(targets, 3, async (q) => {
      try {
        const res = await post<{ question: Structured }>("/api/admin/ai/structure", { text: q.raw });
        const next = applyStructure(q, res.question);
        if (!next.errors.length) fixed++;
        replace([next]);
      } catch (e) {
        if (targets.length === 1) toast.error(e instanceof Error ? e.message : "Repair failed");
      }
      setAiTask((t) => t && { ...t, done: t.done + 1 });
    });
    setAiTask(null);
    toast.success(`${fixed} of ${plural(targets.length, "question")} now import cleanly`);
  }

  function payloadOf(q: AqfQuestion) {
    const p = toUpsertPayload(q);
    return { ...p, status: q.meta.includes("status") ? q.status : defaultStatus };
  }

  async function commit() {
    const items = ready;
    if (!items.length) return;
    stopRef.current = false;
    setResults([]);
    setFinished(null);
    setProgress({ done: 0, total: items.length, created: 0, updated: 0, failed: 0, auto: 0, review: 0, curated: 0 });
    setPhase("importing");

    let batchId: string;
    try {
      batchId = (await post<{ batchId: string }>("/api/admin/import", { action: "start", fileName, total: items.length })).batchId;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the import");
      setPhase("review");
      return;
    }

    const all: ItemResult[] = [];
    await pool(
      chunk(items, CHUNK),
      2,
      async (group) => {
        const body = { action: "chunk", batchId, items: group.map((q) => ({ index: q.index, payload: payloadOf(q) })) };
        let out: ItemResult[];
        try {
          out = (await post<{ results: ItemResult[] }>("/api/admin/import", body)).results;
        } catch {
          try {
            out = (await post<{ results: ItemResult[] }>("/api/admin/import", body)).results;
          } catch (e) {
            out = group.map((q) => ({ index: q.index, code: q.code ?? null, error: e instanceof Error ? e.message : "Request failed" }));
          }
        }
        all.push(...out);
        setResults([...all]);
        setProgress((p) => ({
          ...p,
          done: p.done + group.length,
          created: p.created + out.filter((r) => r.created).length,
          updated: p.updated + out.filter((r) => r.id && !r.created).length,
          failed: p.failed + out.filter((r) => !r.id).length,
          auto: p.auto + out.filter((r) => r.nugget === "auto").length,
          review: p.review + out.filter((r) => r.nugget === "review").length,
          curated: p.curated + out.filter((r) => r.nugget === "curated").length,
        }));
      },
      () => stopRef.current,
    );

    const topicIds = [...new Set(all.map((r) => r.topicId).filter((t): t is number => t != null))];
    const failed = all.filter((r) => r.error);
    try {
      const fin = await post<{ articles: number; libraryError: string | null }>("/api/admin/import", {
        action: "finish",
        batchId,
        topicIds,
        summary: { created: all.filter((r) => r.created).length, updated: all.filter((r) => r.id && !r.created).length, errors: all.filter((r) => !r.id).length },
        report: {
          stopped: stopRef.current,
          failures: failed.slice(0, 300).map((r) => ({ index: r.index, code: r.code, error: r.error })),
          nuggets: { auto: all.filter((r) => r.nugget === "auto").length, review: all.filter((r) => r.nugget === "review").length },
        },
      });
      setFinished({ ...fin, stopped: stopRef.current });
    } catch (e) {
      setFinished({ articles: 0, libraryError: e instanceof Error ? e.message : "Library rebuild failed", stopped: stopRef.current });
    }
    setPhase("done");
  }

  function reset() {
    setPhase("input");
    setQuestions([]);
    setFileErrors([]);
    setPasted("");
    setFileName(null);
    setResults([]);
    setFinished(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  // ---------------------------------------------------------------- input
  if (phase === "input") {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) readFile(f);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed px-6 py-14 text-center transition-colors duration-150",
              dragging ? "border-brand bg-brand-soft" : "border-border-strong bg-surface hover:border-brand",
            )}
          >
            <Upload className="size-6 text-brand" />
            <span className="text-[15px] font-semibold">Drop a .txt file or click to choose</span>
            <span className="text-[13px] text-muted">Any size. Parsing happens in your browser before anything is saved.</span>
            <input
              ref={fileInput}
              type="file"
              accept=".txt,.md,.aqf,text/plain"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readFile(f);
              }}
            />
          </label>
          <div className="grid gap-2">
            <p className="text-[13px] font-semibold">Or paste questions</p>
            <Textarea rows={8} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder={"### QUESTION\nID: AQ-2001\nSystem: Renal\n..."} className="font-mono text-[13px]" />
            <div>
              <Button variant="secondary" onClick={() => load(pasted, null)} disabled={!pasted.trim()}>
                Preview pasted text
              </Button>
            </div>
          </div>
        </div>
        <FormatGuide />
      </div>
    );
  }

  // ---------------------------------------------------------------- importing / done
  if (phase === "importing" || phase === "done") {
    const pct = progress.total ? (100 * progress.done) / progress.total : 0;
    const failures = results.filter((r) => r.error);
    const byIndex = new Map(view.map((q) => [q.index, q]));
    return (
      <div className="grid gap-6">
        <div className="rounded-[10px] border border-border bg-surface p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="text-[18px] font-[750]">
              {phase === "importing" ? "Importing" : finished?.stopped ? "Import stopped" : "Import complete"}
              {fileName ? <span className="font-normal text-muted"> · {fileName}</span> : null}
            </p>
            <p className="tabular text-[14px] text-muted">
              {progress.done.toLocaleString()} / {progress.total.toLocaleString()}
            </p>
          </div>
          <ProgressBar value={pct} className="mt-4 h-2" tone={phase === "done" ? "correct" : "brand"} />
          <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 text-[14px] sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["New", progress.created],
              ["Updated", progress.updated],
              ["Failed", progress.failed],
              ["Nuggets auto-linked", progress.auto],
              ["Nuggets to review", progress.review],
              ["Curated Nuggets", progress.curated],
            ].map(([k, v]) => (
              <div key={k as string}>
                <dt className="text-[12.5px] text-muted">{k}</dt>
                <dd className={cn("tabular text-[20px] font-[750]", k === "Failed" && (v as number) > 0 && "text-incorrect")}>{(v as number).toLocaleString()}</dd>
              </div>
            ))}
          </dl>
          {phase === "importing" ? (
            <div className="mt-6 flex items-center gap-3">
              <Button variant="secondary" onClick={() => (stopRef.current = true)}>
                Stop after current chunk
              </Button>
              <p className="text-[13px] text-muted">Keep this tab open. Questions are saved as each chunk finishes.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              {finished?.libraryError ? (
                <p className="flex items-center gap-2 text-[14px] text-incorrect">
                  <AlertTriangle className="size-4" /> Library rebuild failed: {finished.libraryError}
                </p>
              ) : (
                <p className="flex items-center gap-2 text-[14px] text-muted">
                  <CheckCircle2 className="size-4 text-correct" /> {plural(finished?.articles ?? 0, "Library chapter")} rebuilt from the imported explanations.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button onClick={reset}>Import another file</Button>
                {progress.review > 0 && (
                  <Button asChild variant="secondary">
                    <Link href="/admin/nuggets">Review {plural(progress.review, "Nugget match", "Nugget matches")}</Link>
                  </Button>
                )}
                <Button asChild variant="secondary">
                  <Link href="/admin/questions">Browse questions</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
        {failures.length > 0 && (
          <div className="overflow-x-auto rounded-[10px] border border-border bg-surface">
            <p className="border-b border-border px-4 py-3 text-[14px] font-semibold">Problems ({failures.length})</p>
            <table className="w-full min-w-[640px] text-left text-[13.5px]">
              <tbody>
                {failures.slice(0, 200).map((r) => (
                  <tr key={r.index} className="border-b border-border last:border-0">
                    <td className="tabular w-16 px-4 py-2.5 text-muted">#{r.index}</td>
                    <td className="w-28 px-2 py-2.5 font-semibold">{r.code ?? byIndex.get(r.index)?.code ?? "new"}</td>
                    <td className={cn("px-2 py-2.5", r.id ? "text-warning" : "text-incorrect")}>{r.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------- review
  return (
    <div className="grid gap-6">
      <div className="rounded-[10px] border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="size-5 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">{fileName ?? "Pasted text"}</p>
              <p className="text-[13px] text-muted">
                {plural(view.length, "question")} found · <span className="text-correct">{ready.length.toLocaleString()} ready</span>
                {warned.length ? <> · {warned.length.toLocaleString()} with warnings</> : null}
                {errors.length ? <> · <span className="text-incorrect">{errors.length.toLocaleString()} blocked</span></> : null}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={reset}>
              Choose another file
            </Button>
            <Button onClick={commit} disabled={!ready.length || aiTask != null}>
              Import {plural(ready.length, "question")}
            </Button>
          </div>
        </div>
        {fileErrors.map((e) => (
          <p key={e} className="mt-3 flex items-center gap-2 text-[14px] text-incorrect">
            <XCircle className="size-4" /> {e}
          </p>
        ))}
        {bySystem.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {bySystem.map(([slug, n]) => (
              <Badge key={slug} tone="neutral">
                {slug === "?" ? "No system" : systemName(slug)} <span className="tabular text-text">{n}</span>
              </Badge>
            ))}
          </div>
        )}
        <div className="mt-5 grid gap-4 border-t border-border pt-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="grid gap-1.5">
            <p className="text-[13px] font-semibold">Publish as</p>
            <Segmented
              value={defaultStatus}
              onChange={setDefaultStatus}
              options={[
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
              ]}
            />
            <p className="text-[12.5px] text-muted">Questions with their own Status line keep it.</p>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="fallback-system" className="text-[13px] font-semibold">
              System for questions without one
            </label>
            <select
              id="fallback-system"
              value={fallbackSystem}
              onChange={(e) => setFallbackSystem(e.target.value)}
              className="h-9 rounded-[6px] border border-border bg-surface px-2 text-[14px]"
            >
              <option value="">Leave blocked</option>
              {SYSTEMS.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {ai && (
            <div className="grid content-start gap-1.5">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                <Sparkles className="size-3.5 text-brand" /> AI assist
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={classifyAll} disabled={!toClassify.length || aiTask != null}>
                  Classify {toClassify.length.toLocaleString()}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => repair(toRepair)} disabled={!toRepair.length || aiTask != null}>
                  Repair {toRepair.length.toLocaleString()} blocked
                </Button>
              </div>
              <p className="text-[12.5px] text-muted">Classify fills system, discipline, task and topic. Repair restructures text the parser could not read; content is never rewritten.</p>
            </div>
          )}
        </div>
        {aiTask && (
          <div className="mt-4">
            <p className="tabular mb-1.5 text-[13px] text-muted">
              {aiTask.label} {aiTask.done} / {aiTask.total}
            </p>
            <ProgressBar value={(100 * aiTask.done) / aiTask.total} className="h-1.5" />
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Segmented
            size="sm"
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(0);
            }}
            options={[
              { value: "all", label: `All ${view.length}` },
              { value: "errors", label: `Blocked ${errors.length}` },
              { value: "warnings", label: `Warnings ${warned.length}` },
              { value: "ready", label: `Clean ${ready.length - warned.length}` },
            ]}
          />
          {pages > 1 && (
            <div className="flex items-center gap-2 text-[13px] text-muted">
              <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="tabular">
                {page + 1} / {pages}
              </span>
              <Button size="sm" variant="ghost" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
        <ul className="overflow-hidden rounded-[10px] border border-border bg-surface">
          {shown.slice(page * PAGE, page * PAGE + PAGE).map((q) => (
            <QuestionRow
              key={q.index}
              q={q}
              open={openIndex === q.index}
              onToggle={() => setOpenIndex((i) => (i === q.index ? null : q.index))}
              onRepair={ai && q.errors.length && q.raw ? () => repair([q]) : undefined}
              busy={aiTask != null}
            />
          ))}
          {!shown.length && <li className="px-4 py-8 text-center text-[14px] text-muted">Nothing in this view.</li>}
        </ul>
      </div>
    </div>
  );
}

function QuestionRow({ q, open, onToggle, onRepair, busy }: { q: AqfQuestion; open: boolean; onToggle: () => void; onRepair?: () => void; busy: boolean }) {
  const state = q.errors.length ? "error" : q.warnings.length ? "warning" : "ok";
  return (
    <li className="border-b border-border last:border-0">
      <button type="button" onClick={onToggle} aria-expanded={open} className="grid w-full grid-cols-[auto_1fr_auto] items-start gap-3 px-4 py-3 text-left hover:bg-panel/60">
        {state === "error" ? (
          <XCircle className="mt-0.5 size-4 text-incorrect" />
        ) : state === "warning" ? (
          <AlertTriangle className="mt-0.5 size-4 text-warning" />
        ) : (
          <CheckCircle2 className="mt-0.5 size-4 text-correct" />
        )}
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
            <span className="tabular">#{q.index}</span>
            {q.code && <span className="font-semibold text-text">{q.code}</span>}
            {q.system && <span>{systemName(q.system)}</span>}
            {q.topic && <span>· {q.topic}</span>}
            {q.nuggets.length > 0 && <NuggetGlyph />}
            {q.ai?.structured && <Badge tone="brand">AI repaired</Badge>}
            {q.ai?.classified && <Badge tone="brand">AI classified</Badge>}
          </span>
          <span className="mt-0.5 block truncate text-[14px]">{q.leadIn || q.stem.slice(0, 140) || "(empty)"}</span>
          {q.errors.length > 0 && <span className="mt-0.5 block text-[12.5px] text-incorrect">{q.errors.join(" · ")}</span>}
        </span>
        <ChevronDown className={cn("mt-0.5 size-4 text-faint transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="grid gap-4 border-t border-border bg-panel/40 px-4 py-4 text-[14px] md:px-11">
          <p className="max-h-60 overflow-y-auto whitespace-pre-line leading-relaxed">{q.stem || "(no stem)"}</p>
          <p className="font-semibold">{q.leadIn || "(no lead-in)"}</p>
          <ul className="grid gap-1">
            {q.options.map((o) => (
              <li key={o.label} className={cn("rounded-[6px] px-2.5 py-1.5", o.label === q.correct ? "bg-correct-soft font-semibold" : "bg-surface")}>
                {o.label}. {o.body}
              </li>
            ))}
          </ul>
          {q.explanation && <p className="line-clamp-4 whitespace-pre-line text-muted">{q.explanation}</p>}
          <dl className="grid gap-1 text-[13px] sm:grid-cols-2">
            {(
              [
                ["Discipline", q.discipline],
                ["Task", q.competency],
                ["Category", q.category],
                ["Key concept", q.keyConcept],
                ["Difficulty", String(q.difficulty)],
                ["Option explanations", `${Object.keys(q.optionExplanations).length} of ${q.options.length}`],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-muted">{k}</dt>
                <dd className="min-w-0 truncate">{v || "–"}</dd>
              </div>
            ))}
          </dl>
          {(q.errors.length > 0 || q.warnings.length > 0) && (
            <ul className="grid gap-1 text-[13px]">
              {q.errors.map((e) => (
                <li key={e} className="text-incorrect">
                  {e}
                </li>
              ))}
              {q.warnings.map((w) => (
                <li key={w} className="text-warning">
                  {w}
                </li>
              ))}
            </ul>
          )}
          {onRepair && (
            <div>
              <Button size="sm" variant="secondary" onClick={onRepair} disabled={busy}>
                <Sparkles className="size-3.5" /> Repair with AI
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function FormatGuide() {
  return (
    <div className="rounded-[10px] border border-border bg-surface p-5 text-[13.5px]">
      <p className="text-[15px] font-semibold">Argonaut Question Format</p>
      <p className="mt-1.5 text-muted">
        One block per question. Only the vignette, choices and answer are required; everything else improves filtering, ARGO tracking and the Library. Loosely formatted text (numbered questions, &quot;Answer: C&quot;) is
        also understood.
      </p>
      <pre className="scrollbar-thin mt-3 overflow-x-auto rounded-[8px] bg-panel p-3 font-mono text-[12px] leading-relaxed text-text">{`### QUESTION
ID: AQ-2001
Exam: Step 1
System: Renal
Discipline: Physiology
Competency: Causes & mechanisms
Topic: Renal tubular acidosis
Difficulty: 3
Free: no

Stem:
A 34-year-old woman ...

Lead-in: Which of the following ...?

A. ...
B. ...

Answer: B
Key concept: ...

Explanation:
...

Option explanations:
A. ...
B. ...

Objective: ...

Textbook:
(Markdown study note for the Library)

Nuggets:
- Title :: One-line high-yield point
### END`}</pre>
      <p className="mt-3 text-muted">Re-importing a question with the same ID updates it in place. Full reference: docs/question-format.md in the repository.</p>
    </div>
  );
}
