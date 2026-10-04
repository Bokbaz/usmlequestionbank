import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, Flag, Minus, X } from "lucide-react";
import { PageHeader, Panel } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { NuggetGlyph } from "@/components/ui/badge";
import { Stat, StatCell, StatRow } from "@/components/charts/stat";
import { ArgoMark } from "@/components/brand/logo";
import type { PlayerData } from "@/components/player/types";
import { requireUser, effectivePlan } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { planAllows } from "@/lib/plans";
import { ERROR_META, type ErrorType } from "@/lib/argo/model";
import { formatClock, formatSeconds } from "@/lib/utils";
import { startArgoSession } from "@/app/actions/tests";

export const metadata: Metadata = { title: "Results" };

export default async function ResultsPage({ params }: PageProps<"/tests/[id]">) {
  const { id } = await params;
  const { profile } = await requireUser(`/tests/${id}`);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_test", { p_test: id });
  if (error || !data) notFound();
  const { test, items } = data as PlayerData;
  if (test.status !== "completed") redirect(`/test/${id}`);
  const { data: attempts } = await supabase.from("attempts").select("question_id, error_type, is_correct, time_ms").eq("test_id", id);
  const errorByQ = new Map((attempts ?? []).map((a) => [a.question_id, a.error_type as ErrorType | null]));
  const correct = items.filter((i) => i.state.is_correct).length;
  const omitted = items.filter((i) => !i.state.selected_option_id).length;
  const score = Math.round((100 * correct) / items.length);
  const avgTime = items.reduce((s, i) => s + i.state.time_ms, 0) / Math.max(1, items.length - omitted);
  const peerAvg = items.map((i) => i.review?.peer?.pct_correct).filter((x): x is number => x != null);
  const errorCounts = new Map<ErrorType, number>();
  for (const it of items) {
    const e = errorByQ.get(it.question_id);
    if (e && e !== "lucky_guess" && !it.state.is_correct) errorCounts.set(e, (errorCounts.get(e) ?? 0) + 1);
  }
  const topErrors = [...errorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const changes = { c2i: 0, i2c: 0 };
  for (const it of items) {
    const s = it.state;
    if (s.first_option_id && s.selected_option_id && s.first_option_id !== s.selected_option_id) {
      const correctId = it.review?.correct_option_id;
      if (s.first_option_id === correctId) changes.c2i++;
      else if (s.selected_option_id === correctId) changes.i2c++;
    }
  }
  const argo = planAllows(effectivePlan(profile), "argo");

  return (
    <>
      <PageHeader
        eyebrow={test.kind === "argo" ? "ARGO session" : "Block results"}
        title={test.name ?? (test.kind === "argo" ? "ARGO session" : "Custom block")}
        description={`${items.length} questions · ${test.mode} · ${formatClock(test.elapsed_seconds)} total`}
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href={`/test/${id}?q=1`}>Review all</Link>
            </Button>
            {argo ? (
              <form action={startArgoSession}>
                <input type="hidden" name="size" value="20" />
                <Button type="submit">
                  <ArgoMark className="size-4" /> Next ARGO session
                </Button>
              </form>
            ) : (
              <Button asChild>
                <Link href="/qbank">New block</Link>
              </Button>
            )}
          </>
        }
      />
      <StatRow className="mb-6">
        <StatCell>
          <Stat label="Score" value={`${score}%`} context={`${correct} of ${items.length} correct`} />
        </StatCell>
        <StatCell>
          <Stat label="All users on these questions" value={peerAvg.length ? `${Math.round(peerAvg.reduce((a, b) => a + b, 0) / peerAvg.length)}%` : "–"} context={peerAvg.length ? "Average first-attempt accuracy" : "Appears as more users answer"} />
        </StatCell>
        <StatCell>
          <Stat label="Average time" value={formatSeconds(avgTime)} context={avgTime > 90_000 ? "Above exam pace (90s)" : "Within exam pace"} tone={avgTime > 90_000 ? "bad" : undefined} />
        </StatCell>
        <StatCell>
          <Stat label="Answer changes" value={`${changes.i2c} helped · ${changes.c2i} hurt`} context={omitted ? `${omitted} omitted` : "None omitted"} />
        </StatCell>
      </StatRow>

      {topErrors.length > 0 && (
        <Panel className="mb-6 p-5">
          <p className="flex items-center gap-2 text-[15px] font-[700]">
            <ArgoMark className="size-4 text-brand" /> Why you missed
          </p>
          <ul className="mt-3 grid gap-3 md:grid-cols-3">
            {topErrors.map(([t, n]) => (
              <li key={t} className="rounded-[8px] bg-panel p-3.5">
                <p className="text-[14px] font-semibold">
                  {ERROR_META[t].label} <span className="tabular text-muted">× {n}</span>
                </p>
                <p className="mt-1 text-[13px] leading-snug text-muted">{ERROR_META[t].advice}</p>
              </li>
            ))}
          </ul>
          {!argo && (
            <p className="mt-3 text-[13px] text-muted">
              ARGO turns these patterns into targeted sessions. <Link href="/pricing?from=results" className="font-semibold text-brand hover:underline">Unlock ARGO</Link>
            </p>
          )}
        </Panel>
      )}

      <div className="overflow-x-auto rounded-[10px] border border-border bg-surface">
        <table className="w-full min-w-[760px] border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-border bg-panel text-[12.5px] text-muted">
              <th className="w-14 px-4 py-2.5 font-semibold">#</th>
              <th className="px-4 py-2.5 font-semibold">Result</th>
              <th className="px-4 py-2.5 font-semibold">Topic</th>
              <th className="px-4 py-2.5 font-semibold">System</th>
              <th className="px-4 py-2.5 text-right font-semibold">All users</th>
              <th className="px-4 py-2.5 text-right font-semibold">Your time</th>
              <th className="px-4 py-2.5 font-semibold">ARGO read</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const e = errorByQ.get(it.question_id);
              return (
                <tr key={it.position} className="border-b border-border last:border-0 hover:bg-panel/60">
                  <td className="tabular px-4 py-2.5">
                    <Link href={`/test/${id}?q=${i + 1}`} className="font-semibold text-brand hover:underline">
                      {i + 1}
                    </Link>
                    {it.state.marked && <Flag className="ml-1.5 inline size-3 fill-gold text-gold" />}
                  </td>
                  <td className="px-4 py-2.5">
                    {!it.state.selected_option_id ? (
                      <span className="flex items-center gap-1.5 text-muted">
                        <Minus className="size-4" /> Omitted
                      </span>
                    ) : it.state.is_correct ? (
                      <span className="flex items-center gap-1.5 font-semibold text-correct">
                        <Check className="size-4" strokeWidth={3} /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 font-semibold text-incorrect">
                        <X className="size-4" strokeWidth={3} /> Incorrect
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1.5">
                      {it.is_nugget && <NuggetGlyph />}
                      {it.topic ?? "–"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{it.system}</td>
                  <td className="tabular px-4 py-2.5 text-right text-muted">{it.review?.peer?.pct_correct != null && it.review.peer.n > 0 ? `${it.review.peer.pct_correct}%` : "–"}</td>
                  <td className="tabular px-4 py-2.5 text-right">{formatSeconds(it.state.time_ms)}</td>
                  <td className="px-4 py-2.5 text-[13px] text-muted">{e && !it.state.is_correct ? ERROR_META[e].label : e === "lucky_guess" ? "Lucky guess" : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
