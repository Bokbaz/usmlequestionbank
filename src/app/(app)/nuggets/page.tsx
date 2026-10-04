import type { Metadata } from "next";
import { Gem } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { NuggetGlyph } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { quickNuggets } from "./actions";

export const metadata: Metadata = { title: "Nuggets" };

type MyNugget = { id: number; slug: string; title: string; body: string | null; system_name: string | null; attempts: number; correct: number; last_seen_at: string | null; half_life: number };

function status(n: MyNugget) {
  if (n.attempts === 0) return { label: "New", tone: "text-muted" };
  const acc = n.correct / n.attempts;
  if (acc === 1 && n.half_life >= 4) return { label: "Mastered", tone: "text-gold-ink" };
  if (acc >= 0.5) return { label: "Learning", tone: "text-brand-strong" };
  return { label: "Missed", tone: "text-incorrect" };
}

export default async function NuggetsPage() {
  await requireUser("/nuggets");
  const supabase = await createClient();
  const [{ data }, { data: totals }] = await Promise.all([supabase.rpc("my_nuggets"), supabase.rpc("nugget_totals")]);
  const mine = (data ?? []) as MyNugget[];
  const t = (totals ?? { nuggets: 0, nugget_questions: 0 }) as { nuggets: number; nugget_questions: number };
  const mastered = mine.filter((n) => status(n).label === "Mastered").length;
  const groups = new Map<string, MyNugget[]>();
  for (const n of mine) groups.set(n.system_name ?? "Other", [...(groups.get(n.system_name ?? "Other") ?? []), n]);

  return (
    <>
      <PageHeader
        eyebrow={<span className="flex items-center gap-1.5 text-gold-ink"><NuggetGlyph className="size-3.5" /> Nuggets</span>}
        title="Your Nugget collection"
        description="Ultra-high-yield concepts you have met in questions. Get each one right with a gap in between to master it."
        actions={
          <form action={quickNuggets}>
            <Button type="submit" variant="gold">
              <NuggetGlyph className="size-3.5" /> Practice Nugget questions
            </Button>
          </form>
        }
      />
      <div className="mb-8 rounded-[10px] border border-border bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[15px] font-[700]">
            {mastered} mastered · {mine.length} met · {t.nuggets} in the bank
          </p>
          <p className="text-[13px] text-muted">{t.nugget_questions} questions test a Nugget</p>
        </div>
        <ProgressBar value={t.nuggets ? (100 * mine.length) / t.nuggets : 0} tone="gold" className="mt-3 h-2" />
      </div>
      {mine.length === 0 ? (
        <EmptyState icon={<Gem className="size-6 text-gold-ink" />} title="No Nuggets collected yet" body="Questions marked with a gold diamond test an ultra-high-yield concept. Answer one and it joins your collection." />
      ) : (
        <div className="grid gap-8">
          {[...groups.entries()].map(([system, list]) => (
            <section key={system}>
              <h2 className="eyebrow text-faint">{system}</h2>
              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-[10px] border border-border bg-surface">
                {list.map((n) => {
                  const s = status(n);
                  return (
                    <li key={n.id} className="grid gap-1 px-5 py-4 md:grid-cols-[1fr_auto] md:gap-6">
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold leading-snug">{n.title}</p>
                        {n.body && <p className="mt-1 max-w-[80ch] text-[13.5px] leading-relaxed text-muted">{n.body}</p>}
                      </div>
                      <div className="flex items-center gap-4 text-[13px] md:flex-col md:items-end md:gap-0.5">
                        <span className={`font-[700] ${s.tone}`}>{s.label}</span>
                        <span className="tabular text-muted">
                          {n.correct}/{n.attempts} correct
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
