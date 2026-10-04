import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Item analysis" };

type Row = {
  question_id: string;
  code: string;
  system: string;
  topic: string | null;
  n: number;
  p_value: number | null;
  discrimination: number | null;
  difficulty_b: number | null;
  correct_label: string;
  top_wrong_label: string | null;
  top_wrong_share: number | null;
  flag: "possible_miskey" | "negative_discrimination" | "too_easy" | "very_hard" | null;
};

const FLAG = {
  possible_miskey: { label: "Possible miskey", tone: "incorrect", hint: "More students chose one distractor than the key" },
  negative_discrimination: { label: "Negative discrimination", tone: "incorrect", hint: "Weaker students outperform stronger ones" },
  too_easy: { label: "Too easy", tone: "neutral", hint: "Over 95% correct" },
  very_hard: { label: "Very hard", tone: "warning", hint: "Under 30% correct" },
} as const;

export default async function ItemAnalysisPage({ searchParams }: PageProps<"/admin/analysis">) {
  const sp = await searchParams;
  const flaggedOnly = sp.view !== "all";
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_item_analysis");
  const all = ((data ?? []) as Row[]).filter((r) => r.n > 0);
  const rows = flaggedOnly ? all.filter((r) => r.flag) : all;
  const counts = Object.fromEntries(Object.keys(FLAG).map((k) => [k, all.filter((r) => r.flag === k).length]));

  return (
    <>
      <PageHeader
        title="Item analysis"
        description="Classical item statistics from first attempts. p is the share answering correctly; discrimination is the point-biserial correlation with overall ability. Flags need at least 10 to 20 answers."
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <nav className="flex gap-1 text-[13.5px]" aria-label="View">
          {[
            ["flagged", "Flagged"],
            ["all", "All answered"],
          ].map(([v, label]) => (
            <Link
              key={v}
              href={v === "flagged" ? "/admin/analysis" : "/admin/analysis?view=all"}
              className={cn("rounded-[6px] px-3 py-1.5 font-semibold", (v === "all") === !flaggedOnly ? "bg-brand-soft text-brand-strong" : "text-muted hover:bg-panel")}
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-[13px] text-muted">
          {Object.entries(FLAG)
            .map(([k, f]) => `${f.label}: ${counts[k]}`)
            .join(" · ")}
        </p>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={<Activity className="size-6 text-faint" />}
          title={flaggedOnly ? "No flagged items" : "No answers yet"}
          body="Statistics appear once students answer questions. Miskeys and broken distractors surface here first."
        />
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-border bg-surface">
          <table className="w-full min-w-[820px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-border bg-panel text-[12.5px] text-muted">
                <th className="px-4 py-2.5 font-semibold">ID</th>
                <th className="px-2 py-2.5 font-semibold">Topic</th>
                <th className="px-2 py-2.5 text-right font-semibold">Answers</th>
                <th className="px-2 py-2.5 text-right font-semibold">p</th>
                <th className="px-2 py-2.5 text-right font-semibold">Discrimination</th>
                <th className="px-2 py-2.5 font-semibold">Key / top distractor</th>
                <th className="px-4 py-2.5 font-semibold">Flag</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.question_id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 font-semibold">
                    <Link href={`/admin/questions?q=${r.code}`} className="hover:underline">
                      {r.code}
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 text-muted">
                    {r.system}
                    {r.topic ? ` · ${r.topic}` : ""}
                  </td>
                  <td className="tabular px-2 py-2.5 text-right">{r.n}</td>
                  <td className="tabular px-2 py-2.5 text-right">{r.p_value != null ? r.p_value.toFixed(2) : "–"}</td>
                  <td className={cn("tabular px-2 py-2.5 text-right", r.discrimination != null && r.discrimination < 0 && "text-incorrect")}>
                    {r.discrimination != null ? r.discrimination.toFixed(2) : "–"}
                  </td>
                  <td className="tabular px-2 py-2.5">
                    {r.correct_label}
                    {r.top_wrong_label ? ` / ${r.top_wrong_label} (${Math.round((r.top_wrong_share ?? 0) * 100)}%)` : ""}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.flag ? (
                      <span title={FLAG[r.flag].hint}>
                        <Badge tone={FLAG[r.flag].tone}>{FLAG[r.flag].label}</Badge>
                      </span>
                    ) : (
                      <span className="text-faint">–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
