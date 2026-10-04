import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatClock } from "@/lib/utils";

export const metadata: Metadata = { title: "Previous tests" };

export default async function TestsPage() {
  await requireUser("/tests");
  const supabase = await createClient();
  const { data: tests } = await supabase
    .from("tests")
    .select("id, name, kind, mode, status, question_count, correct_count, answered_count, elapsed_seconds, created_at, completed_at")
    .order("created_at", { ascending: false })
    .limit(200);
  return (
    <>
      <PageHeader
        title="Previous tests"
        description="Resume suspended blocks, or review any completed block question by question."
        actions={
          <Button asChild>
            <Link href="/qbank">Create test</Link>
          </Button>
        }
      />
      {!tests?.length ? (
        <EmptyState icon={<ClipboardList className="size-6 text-faint" />} title="No blocks yet" body="Your custom blocks and ARGO sessions will be listed here." action={<Button asChild><Link href="/qbank">Create your first test</Link></Button>} />
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-border bg-surface">
          <table className="w-full min-w-[720px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-border bg-panel text-[12.5px] text-muted">
                <th className="px-4 py-2.5 font-semibold">Block</th>
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 font-semibold">Mode</th>
                <th className="px-4 py-2.5 text-right font-semibold">Questions</th>
                <th className="px-4 py-2.5 text-right font-semibold">Time</th>
                <th className="px-4 py-2.5 text-right font-semibold">Score</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => {
                const score = t.status === "completed" ? Math.round((100 * (t.correct_count ?? 0)) / t.question_count) : null;
                return (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-panel/60">
                    <td className="px-4 py-3">
                      <span className="font-semibold">{t.name ?? (t.kind === "argo" ? "ARGO session" : "Custom block")}</span>
                      {t.kind === "argo" && (
                        <Badge tone="brand" className="ml-2">
                          ARGO
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{new Date(t.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-4 py-3 capitalize text-muted">{t.mode}</td>
                    <td className="tabular px-4 py-3 text-right">{t.question_count}</td>
                    <td className="tabular px-4 py-3 text-right text-muted">{formatClock(t.elapsed_seconds)}</td>
                    <td className="tabular px-4 py-3 text-right font-[700]">{score != null ? `${score}%` : <Badge tone="neutral">{t.status === "suspended" ? "Suspended" : "Active"}</Badge>}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={t.status === "completed" ? `/tests/${t.id}` : `/test/${t.id}`} className="text-[13.5px] font-semibold text-brand hover:underline">
                        {t.status === "completed" ? "Results" : "Resume"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
