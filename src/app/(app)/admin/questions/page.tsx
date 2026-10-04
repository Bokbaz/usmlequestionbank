import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { applyQuestionFilters } from "./filters";
import { QuestionTable, type AdminQuestionRow } from "./question-table";

export const metadata: Metadata = { title: "Questions" };

const PAGE = 50;

export default async function AdminQuestionsPage({ searchParams }: PageProps<"/admin/questions">) {
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const filters = { q: pick("q"), system: pick("system"), status: pick("status"), source: pick("source"), nuggets: pick("nuggets") };
  const page = Math.max(0, Number(pick("page") ?? 0) || 0);

  const supabase = await createClient();
  const [{ data: systems }, res] = await Promise.all([
    supabase.from("systems").select("id, name").order("sort"),
    applyQuestionFilters(
      supabase
        .from("questions")
        .select(
          "id, code, lead_in, status, source, is_free, is_daily_eligible, is_nugget, owner_id, author_difficulty, created_at, system:systems(short_name), topic:topics(name), stats:question_stats(n_attempts, n_correct)",
          { count: "exact" },
        ),
      filters,
    )
      .order("code", { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1),
  ]);
  const rows = (res.data ?? []) as unknown as AdminQuestionRow[];
  const total = res.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filters, page, ...over })) if (v !== undefined && v !== "" && !(k === "page" && v === 0)) p.set(k, String(v));
    return `?${p.toString()}`;
  };
  const exportHref = `/api/admin/export${qs({ page: undefined })}`;

  return (
    <>
      <PageHeader
        title="Questions"
        description="Search the bank, change status in bulk, and export AQF to edit offline. Re-importing an exported file updates questions in place."
        actions={
          <Button asChild variant="secondary">
            <a href={exportHref}>
              <Download className="size-4" /> Export AQF
            </a>
          </Button>
        }
      />
      <form className="mb-4 flex flex-wrap items-end gap-2" action="/admin/questions">
        <Input name="q" defaultValue={filters.q} placeholder="Search text or AQ-1234" className="h-9 w-64 text-[14px]" />
        <select name="system" defaultValue={filters.system ?? ""} className="h-9 w-56 rounded-[6px] border border-border bg-surface px-2 text-[14px]" aria-label="System">
          <option value="">All systems</option>
          {(systems ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={filters.status ?? ""} className="h-9 rounded-[6px] border border-border bg-surface px-2 text-[14px]" aria-label="Status">
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="retired">Retired</option>
        </select>
        <select name="source" defaultValue={filters.source ?? ""} className="h-9 rounded-[6px] border border-border bg-surface px-2 text-[14px]" aria-label="Source">
          <option value="">Bank (all sources)</option>
          <option value="import">Imported</option>
          <option value="seed">Seed</option>
          <option value="argo">ARGO-written (private)</option>
        </select>
        <label className="flex h-9 items-center gap-2 px-1 text-[14px]">
          <input type="checkbox" name="nuggets" value="1" defaultChecked={filters.nuggets === "1"} className="size-4 accent-[var(--brand)]" /> Nuggets
        </label>
        <Button type="submit" size="md" variant="secondary">
          Filter
        </Button>
        {(filters.q || filters.system || filters.status || filters.source || filters.nuggets) && (
          <Link href="/admin/questions" className="px-2 text-[13.5px] font-semibold text-brand hover:underline">
            Clear
          </Link>
        )}
      </form>
      <QuestionTable rows={rows} total={total} argo={filters.source === "argo"} />
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-[13px] text-muted">
          {page > 0 && (
            <Button asChild size="sm" variant="ghost">
              <Link href={qs({ page: page - 1 })}>Previous</Link>
            </Button>
          )}
          <span className="tabular">
            Page {page + 1} of {pages}
          </span>
          {page < pages - 1 && (
            <Button asChild size="sm" variant="ghost">
              <Link href={qs({ page: page + 1 })}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}
