import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { NuggetGlyph } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DrillChapterButton } from "./drill-button";

type Catalog = { id: number; slug: string; title: string; summary: string | null; system_slug: string; system_name: string; is_free: boolean; reading_minutes: number; question_count: number; has_nugget: boolean; unlocked: boolean };

export async function generateMetadata({ params }: PageProps<"/library/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()) };
}

export default async function ArticlePage({ params }: PageProps<"/library/[slug]">) {
  const { slug } = await params;
  await requireUser(`/library/${slug}`);
  const supabase = await createClient();
  const { data: catalog } = await supabase.rpc("library_catalog");
  const meta = ((catalog ?? []) as Catalog[]).find((c) => c.slug === slug);
  if (!meta) notFound();
  const related = ((catalog ?? []) as Catalog[]).filter((c) => c.system_slug === meta.system_slug && c.slug !== slug).slice(0, 6);

  const { data: article } = await supabase.from("library_articles").select("id, title, summary, body, updated_at").eq("slug", slug).maybeSingle();
  const [{ data: links }, { data: nuggets }] = article
    ? await Promise.all([
        supabase.from("article_questions").select("question_id").eq("article_id", article.id),
        supabase.rpc("article_nuggets", { p_article: article.id }),
      ])
    : [{ data: [] }, { data: [] }];
  const questionIds = (links ?? []).map((l: { question_id: string }) => l.question_id);

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_300px]">
      <article className="min-w-0">
        <Link href={`/library#${meta.system_slug}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-text">
          <ArrowLeft className="size-4" /> {meta.system_name}
        </Link>
        <h1 className="heading mt-4 text-[38px] font-bold leading-[1.05]">{meta.title}</h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 text-[13px] text-faint">
          <span>{meta.reading_minutes} min read</span>
          <span>{meta.question_count} linked {meta.question_count === 1 ? "question" : "questions"}</span>
          {meta.has_nugget && (
            <span className="flex items-center gap-1 font-semibold text-gold-ink">
              <NuggetGlyph /> Contains Nuggets
            </span>
          )}
        </p>
        {meta.summary && <p className="mt-6 max-w-[68ch] font-serif text-[20px] leading-[1.55] text-text">{meta.summary}</p>}
        {article ? (
          <Markdown serif className="mt-8">
            {article.body}
          </Markdown>
        ) : (
          <div className="mt-10 max-w-[68ch] rounded-[12px] bg-ink p-7 text-on-ink">
            <p className="flex items-center gap-2 text-[17px] font-[700]">
              <Lock className="size-4" /> This chapter is part of Full access
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-on-ink-muted">
              The full Library unlocks with Full access, a single $48 payment: every chapter, linked to the questions that test it.
            </p>
            <Button asChild variant="ink" size="lg" className="mt-5">
              <Link href="/pricing?from=library">Unlock Full access</Link>
            </Button>
          </div>
        )}
      </article>
      <aside className="grid content-start gap-5 xl:sticky xl:top-8">
        {article && questionIds.length > 0 && (
          <div className="rounded-[10px] border border-border bg-surface p-5">
            <p className="text-[15px] font-[700]">Test yourself</p>
            <p className="mt-1 text-[13.5px] text-muted">
              {questionIds.length} {questionIds.length === 1 ? "question tests" : "questions test"} this chapter.
            </p>
            <DrillChapterButton ids={questionIds} title={meta.title} />
          </div>
        )}
        {(nuggets ?? []).length > 0 && (
          <div className="rounded-[10px] bg-gold-soft p-5">
            <p className="eyebrow flex items-center gap-1.5 text-gold-ink">
              <NuggetGlyph className="size-3.5" /> Nuggets in this chapter
            </p>
            <ul className="mt-3 grid gap-3">
              {(nuggets as { id: number; title: string }[]).map((n) => (
                <li key={n.id} className="text-[14px] font-semibold leading-snug">
                  {n.title}
                </li>
              ))}
            </ul>
          </div>
        )}
        {related.length > 0 && (
          <div className="rounded-[10px] border border-border bg-surface p-5">
            <p className="text-[15px] font-[700]">More in {meta.system_name}</p>
            <ul className="mt-2 grid">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/library/${r.slug}`} className="flex items-center justify-between gap-2 py-1.5 text-[14px] text-muted hover:text-text">
                    <span className="truncate">{r.title}</span>
                    {!r.unlocked && <Lock className="size-3.5 shrink-0" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
