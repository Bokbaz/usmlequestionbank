"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Copy, FileText, Sparkles, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge, NuggetGlyph } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/segmented";
import { parseAqf, revalidateAqf, toUpsertPayload, type AqfQuestion } from "@/lib/aqf/parse";
import {
  applyPlacement,
  argoCompetency,
  argoMatchInput,
  argoToQuestion,
  detectArgo,
  isDuplicatePair,
  parseArgo,
  validateArgo,
  type ArgoFormat,
  type ArgoPlacement,
} from "@/lib/import/argo-format";
import { SYSTEMS, resolveCompetency, resolveDiscipline, resolveSystem, systemName } from "@/lib/taxonomy";
import { cn, plural } from "@/lib/utils";

type Phase = "input" | "placing" | "review" | "importing" | "done";
type Filter = "all" | "errors" | "warnings" | "ready" | "duplicates";
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
const PLACE_CHUNK = 10;

const ARGO_LABEL: Record<ArgoFormat, string> = { json: "ARGO export (JSON)", jsonl: "ARGO export (JSONL)", csv: "ARGO export (CSV)", txt: "ARGO export (text)" };

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

// ARGO exports carry their own checks (placement, question_id).
const revalidate = (q: AqfQuestion) => (q.argo ? validateArgo(q) : revalidateAqf(q));

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

// Marks later questions in the file that repeat an earlier new one (same exam and testing
// point). Bank duplicates were flagged by the server already.
function markFileDuplicates(qs: AqfQuestion[]): AqfQuestion[] {
  const kept: AqfQuestion[] = [];
  return qs.map((q) => {
    const p = q.placement;
    if (!p?.vector || p.existing || p.duplicate) return q;
    const twin = kept.find((k) => k.exam === q.exam && isDuplicatePair(dot(p.vector!, k.placement!.vector!), q.argo?.condition, k.argo?.condition));
    if (!twin) {
      kept.push(q);
      return q;
    }
    const similarity = dot(p.vector, twin.placement!.vector!);
    const answer = twin.options.find((o) => o.label === twin.correct)?.body ?? "";
    return { ...q, placement: { ...p, duplicate: { code: `#${twin.index}`, similarity, leadIn: twin.leadIn, answer, inFile: twin.index } } };
  });
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
  return revalidate(next);
}

function applyStructure(q: AqfQuestion, s: Structured): AqfQuestion {
  const optionExplanations = Object.fromEntries(s.option_explanations.map((e) => [e.label, e.text]));
  return revalidate({
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
  const [argoFormat, setArgoFormat] = useState<ArgoFormat | null>(null);
  const [placing, setPlacing] = useState({ done: 0, total: 0 });
  // Duplicates are skipped unless the admin chooses to import them.
  const [importDuplicates, setImportDuplicates] = useState<Set<number>>(new Set());
  const stopRef = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // A fallback system fills in questions that neither state nor suggest one.
  const view = useMemo(
    () => questions.map((q) => (!q.system && !q.argo && fallbackSystem ? revalidateAqf({ ...q, system: fallbackSystem }) : q)),
    [questions, fallbackSystem],
  );
  const skipped = (q: AqfQuestion) => Boolean(q.placement?.duplicate) && !importDuplicates.has(q.index);
  const errors = view.filter((q) => q.errors.length);
  const duplicates = view.filter((q) => q.placement?.duplicate);
  const warned = view.filter((q) => !q.errors.length && !skipped(q) && q.warnings.length);
  const ready = view.filter((q) => !q.errors.length && !skipped(q));
  const updates = ready.filter((q) => q.placement?.existing).length;
  const unplaced = view.filter((q) => q.placement?.error);
  const toClassify = view.filter(needsClassification);
  const toRepair = view.filter((q) => q.errors.length && q.raw);
  const bySystem = useMemo(() => {
    const m = new Map<string, number>();
    for (const q of ready) m.set(q.system ?? "?", (m.get(q.system ?? "?") ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [ready]);
  const shown =
    filter === "errors"
      ? errors
      : filter === "warnings"
        ? warned
        : filter === "ready"
          ? ready.filter((q) => !q.warnings.length)
          : filter === "duplicates"
            ? duplicates
            : view;
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));

  function load(text: string, name: string | null) {
    setFileName(name);
    setPage(0);
    setOpenIndex(null);
    setImportDuplicates(new Set());
    const format = detectArgo(name, text);
    setArgoFormat(format);
    if (format) return loadArgo(format, text);
    const res = parseAqf(text);
    setQuestions(res.questions);
    setFileErrors(res.fileErrors);
    setFilter(res.questions.some((q) => q.errors.length) ? "errors" : "all");
    setPhase("review");
  }

  // ARGO pipeline exports: parse, then let the server place every question before review.
  async function loadArgo(format: ArgoFormat, text: string) {
    const res = parseArgo(format, text);
    const parsed = res.items.map((item, i) => argoToQuestion(item, i + 1));
    const ids = new Map<string, number>();
    const fileErrors = [...res.fileErrors];
    if (res.notApproved) fileErrors.push(`${plural(res.notApproved, "question")} not marked APPROVED left out`);
    setFileErrors(fileErrors);
    setQuestions(parsed);
    if (!parsed.length) return setPhase("review");
    const placed = await place(parsed);
    const final = markFileDuplicates(placed).map((q) => {
      // The same question_id twice in one file: only the first copy imports.
      const first = q.sourceRef ? ids.get(q.sourceRef) : undefined;
      if (q.sourceRef && first == null) ids.set(q.sourceRef, q.index);
      return validateArgo({ ...q, argo: q.argo && { ...q.argo, sameIdAs: first }, placement: q.placement && { ...q.placement, vector: undefined } });
    });
    setQuestions(final);
    setFilter(final.some((q) => q.errors.length) ? "errors" : "all");
    setPhase("review");
  }

  async function place(targets: AqfQuestion[]): Promise<AqfQuestion[]> {
    setPhase("placing");
    setPlacing({ done: 0, total: targets.length });
    const byIndex = new Map<number, ArgoPlacement>();
    await pool(chunk(targets, PLACE_CHUNK), 3, async (group) => {
      const items = group.map((q) => {
        const m = argoMatchInput(q);
        return {
          index: q.index,
          sourceRef: q.sourceRef ?? `missing-${q.index}`,
          exam: q.exam,
          system: (q.argo?.system ?? "").slice(0, 80),
          category: q.argo?.category?.slice(0, 500) ?? null,
          condition: q.argo?.condition?.slice(0, 500) ?? null,
          leadIn: m.leadIn.slice(0, 2_000),
          correctText: m.correctText.slice(0, 2_000),
          keyConcept: m.keyConcept ?? null,
          objective: m.objective?.slice(0, 2_000) ?? null,
        };
      });
      try {
        const res = await post<{ placements: ArgoPlacement[] }>("/api/admin/import", { action: "place", items });
        for (const p of res.placements) byIndex.set(p.index, p);
      } catch (e) {
        for (const q of group) byIndex.set(q.index, { index: q.index, error: e instanceof Error ? e.message : "request failed" });
      }
      setPlacing((p) => ({ ...p, done: p.done + group.length }));
    });
    return targets.map((q) => applyPlacement(q, byIndex.get(q.index) ?? { index: q.index, error: "no answer from the server" }));
  }

  async function retryPlacement() {
    const placed = await place(unplaced);
    replace(markFileDuplicates(placed).map((q) => validateArgo({ ...q, placement: q.placement && { ...q.placement, vector: undefined } })));
    setPhase("review");
  }

  // Manual placement in the review: system and topic of one question.
  function edit(q: AqfQuestion, change: { system?: string; topic?: string }) {
    const next: AqfQuestion = { ...q, ...change };
    if (change.system && change.system !== q.system) {
      next.category = undefined;
      if (q.argo && !q.placement?.existing) next.competency = argoCompetency(q.argo.physicianTask, change.system, q.argo.category);
    }
    if (change.topic !== undefined) next.topic = change.topic.trim() || undefined;
    replace([revalidate(next)]);
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
    setArgoFormat(null);
    setImportDuplicates(new Set());
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
            <Upload className="size-6 text-brand-strong" />
            <span className="text-[15px] font-semibold">Drop a question file or click to choose</span>
            <span className="text-[13px] text-muted">ARGO exports (.json, .jsonl, .csv, .txt) or Argonaut Question Format. Nothing is saved until you import.</span>
            <input
              ref={fileInput}
              type="file"
              accept=".txt,.md,.aqf,.json,.jsonl,.ndjson,.csv,text/plain,application/json,text/csv"
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

  // ---------------------------------------------------------------- placing
  if (phase === "placing") {
    return (
      <div className="rounded-[10px] border border-border bg-surface p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-[18px] font-[750]">
            Matching questions to the bank
            {fileName ? <span className="font-normal text-muted"> · {fileName}</span> : null}
          </p>
          <p className="tabular text-[14px] text-muted">
            {placing.done.toLocaleString()} / {placing.total.toLocaleString()}
          </p>
        </div>
        <ProgressBar value={placing.total ? (100 * placing.done) / placing.total : 0} className="mt-4 h-2" />
        <p className="mt-4 text-[13px] text-muted">
          Questions already in the bank keep their system and topic. New ones go next to their closest questions, and repeats of existing questions are set aside. Nothing is saved yet.
        </p>
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
                  <CheckCircle2 className="size-4 text-correct" />
                  {finished?.articles
                    ? `${plural(finished.articles, "Library chapter")} rebuilt from the imported explanations.`
                    : "No Library chapters changed. Draft questions join the Library when they are published."}
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
            <FileText className="size-5 shrink-0 text-brand-strong" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">
                {fileName ?? "Pasted text"}
                {argoFormat && <span className="font-normal text-muted"> · {ARGO_LABEL[argoFormat]}</span>}
              </p>
              <p className="text-[13px] text-muted">
                {plural(view.length, "question")} found · <span className="text-correct">{ready.length.toLocaleString()} ready</span>
                {argoFormat ? (
                  <>
                    {" "}
                    ({(ready.length - updates).toLocaleString()} new, {updates.toLocaleString()} {updates === 1 ? "update" : "updates"})
                  </>
                ) : null}
                {warned.length ? <> · {warned.length.toLocaleString()} with warnings</> : null}
                {duplicates.length ? <> · {plural(duplicates.length, "duplicate")}</> : null}
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
            <p className="text-[12.5px] text-muted">
              {argoFormat ? "Applies to new questions. Questions already in the bank keep their status." : "Questions with their own Status line keep it."}
            </p>
          </div>
          {duplicates.length > 0 && (
            <div className="grid content-start gap-1.5">
              <p className="text-[13px] font-semibold">Duplicates</p>
              <Segmented
                value={importDuplicates.size === duplicates.length ? "import" : "skip"}
                onChange={(v) => setImportDuplicates(v === "import" ? new Set(duplicates.map((q) => q.index)) : new Set())}
                options={[
                  { value: "skip", label: `Skip ${duplicates.length}` },
                  { value: "import", label: "Import anyway" },
                ]}
              />
              <p className="text-[12.5px] text-muted">Same exam and testing point as a question already in the bank or earlier in this file. Open one to compare or decide per question.</p>
            </div>
          )}
          {unplaced.length > 0 && (
            <div className="grid content-start gap-1.5">
              <p className="text-[13px] font-semibold">Placement</p>
              <div>
                <Button size="sm" variant="secondary" onClick={retryPlacement}>
                  Retry {plural(unplaced.length, "question")}
                </Button>
              </div>
              <p className="text-[12.5px] text-muted">These could not be matched to the bank and stay blocked until placed.</p>
            </div>
          )}
          <div className={cn("grid gap-1.5", argoFormat && "hidden")}>
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
                <Sparkles className="size-3.5 text-brand-strong" /> AI assist
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
              ...(duplicates.length ? [{ value: "duplicates" as const, label: `Duplicates ${duplicates.length}` }] : []),
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
              onEdit={(change) => edit(q, change)}
              skipped={skipped(q)}
              onToggleDuplicate={() =>
                setImportDuplicates((prev) => {
                  const next = new Set(prev);
                  if (next.has(q.index)) next.delete(q.index);
                  else next.add(q.index);
                  return next;
                })
              }
              busy={aiTask != null}
            />
          ))}
          {!shown.length && <li className="px-4 py-8 text-center text-[14px] text-muted">Nothing in this view.</li>}
        </ul>
      </div>
    </div>
  );
}

function QuestionRow({
  q,
  open,
  onToggle,
  onRepair,
  onEdit,
  skipped,
  onToggleDuplicate,
  busy,
}: {
  q: AqfQuestion;
  open: boolean;
  onToggle: () => void;
  onRepair?: () => void;
  onEdit: (change: { system?: string; topic?: string }) => void;
  skipped: boolean;
  onToggleDuplicate: () => void;
  busy: boolean;
}) {
  const state = q.errors.length ? "error" : skipped ? "skipped" : q.warnings.length ? "warning" : "ok";
  const p = q.placement;
  return (
    <li className="border-b border-border last:border-0">
      <button type="button" onClick={onToggle} aria-expanded={open} className="grid w-full grid-cols-[auto_1fr_auto] items-start gap-3 px-4 py-3 text-left hover:bg-panel/60">
        {state === "error" ? (
          <XCircle className="mt-0.5 size-4 text-incorrect" />
        ) : state === "skipped" ? (
          <Copy className="mt-0.5 size-4 text-faint" />
        ) : state === "warning" ? (
          <AlertTriangle className="mt-0.5 size-4 text-warning" />
        ) : (
          <CheckCircle2 className="mt-0.5 size-4 text-correct" />
        )}
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
            <span className="tabular">#{q.index}</span>
            {q.code && <span className="font-semibold text-text">{q.code}</span>}
            {p?.existing && <Badge tone="neutral">Update</Badge>}
            {p && !p.existing && !p.error && !p.duplicate && <Badge tone="brand">New</Badge>}
            {p?.duplicate && <Badge tone={skipped ? "neutral" : "warning"}>{skipped ? "Duplicate, skipped" : "Duplicate, importing"}</Badge>}
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
          {p?.duplicate && (
            <div className="grid gap-2 rounded-[8px] border border-border bg-surface p-3 text-[13.5px]">
              <p className="font-semibold">
                {p.duplicate.inFile != null
                  ? `Same testing point as question #${p.duplicate.inFile} in this file (${Math.round(100 * p.duplicate.similarity)}% similar)`
                  : p.duplicate.recorded
                    ? `Recorded as a duplicate of ${p.duplicate.code} when its batch was imported`
                    : `Same testing point as ${p.duplicate.code} in the bank (${Math.round(100 * p.duplicate.similarity)}% similar)`}
              </p>
              <p className="text-muted">
                {p.duplicate.leadIn}
                {p.duplicate.answer ? <span className="text-text"> · {p.duplicate.answer}</span> : null}
              </p>
              <div>
                <Button size="sm" variant="secondary" onClick={onToggleDuplicate}>
                  {skipped ? "Import this one anyway" : "Skip this one"}
                </Button>
              </div>
            </div>
          )}
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
          {q.argo && <Placement q={q} onEdit={onEdit} />}
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

// Where an ARGO export question goes, with the system and topic editable before import.
function Placement({ q, onEdit }: { q: AqfQuestion; onEdit: (change: { system?: string; topic?: string }) => void }) {
  const p = q.placement;
  const s = p?.suggested;
  const why = p?.existing
    ? `Already in the bank as ${p.existing.code}: the text is updated, its placement and flags are kept.`
    : s?.basis === "neighbor" && s.neighbor
      ? `Placed next to ${s.neighbor.code} (${Math.round(100 * s.neighbor.similarity)}% similar).`
      : s?.basis === "topic-name"
        ? "Existing topic named in the condition."
        : s
          ? "New Library topic named after the condition."
          : null;
  return (
    <div className="grid gap-2 rounded-[8px] border border-border bg-surface p-3">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <label className="grid gap-1 text-[12.5px] text-muted">
          System
          <select
            value={q.system ?? ""}
            onChange={(e) => onEdit({ system: e.target.value })}
            className="h-9 rounded-[6px] border border-border bg-surface px-2 text-[14px] text-text"
          >
            {!q.system && <option value="">Choose a system</option>}
            {SYSTEMS.map((sys) => (
              <option key={sys.slug} value={sys.slug}>
                {sys.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[12.5px] text-muted">
          Library topic
          <Input key={`${q.index}-${q.topic}`} defaultValue={q.topic ?? ""} onBlur={(e) => e.target.value !== (q.topic ?? "") && onEdit({ topic: e.target.value })} className="h-9 text-[14px]" />
        </label>
      </div>
      {why && <p className="text-[12.5px] text-muted">{why}</p>}
      {q.argo && (
        <p className="text-[12.5px] text-faint">
          File: {q.argo.system}
          {q.argo.condition ? ` · ${q.argo.condition}` : ""}
          {q.sourceRef ? ` · ${q.sourceRef}` : ""}
        </p>
      )}
    </div>
  );
}

function FormatGuide() {
  return (
    <div className="rounded-[10px] border border-border bg-surface p-5 text-[13.5px]">
      <p className="text-[15px] font-semibold">ARGO exports</p>
      <p className="mt-1.5 text-muted">
        Upload an approved batch exactly as exported: <span className="font-mono text-[12.5px]">approved_….json</span>, <span className="font-mono text-[12.5px]">.jsonl</span>,{" "}
        <span className="font-mono text-[12.5px]">.csv</span> or <span className="font-mono text-[12.5px]">.txt</span>. All four give the same result. Questions already in the bank are updated in place and keep
        their system and topic; new ones are placed next to their closest questions, and repeats are set aside for you to check. Source notes in the file are never imported.
      </p>
      <p className="mt-5 text-[15px] font-semibold">Argonaut Question Format</p>
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
