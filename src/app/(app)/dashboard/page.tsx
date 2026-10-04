import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Brain, CirclePlay, Layers3, Lock, Zap } from "lucide-react";
import { PageHeader, Panel, SectionTitle } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarList } from "@/components/charts/bar-list";
import { ActivityCalendar } from "@/components/charts/calendar";
import { Stat, StatCell, StatRow } from "@/components/charts/stat";
import { effectivePlan, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getInsights } from "@/lib/argo/data";
import { planAllows } from "@/lib/plans";
import { quickStart, startArgoSession } from "@/app/actions/tests";
import type { DailyState } from "@/lib/daily/types";
import { formatSeconds, pct } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function greeting() {
  const h = new Date().getUTCHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const { profile } = await requireUser("/dashboard");
  if (profile && !profile.onboarded) redirect("/welcome");
  const plan = effectivePlan(profile);
  const supabase = await createClient();
  const [insights, testsRes, dailyRes, dueRes] = await Promise.all([
    getInsights(),
    supabase.from("tests").select("id, name, kind, mode, status, question_count, correct_count, answered_count, created_at, completed_at").order("created_at", { ascending: false }).limit(6),
    supabase.rpc("daily_today", { p_guest: null }),
    supabase.from("flashcards").select("id", { count: "exact", head: true }).lte("due_at", new Date().toISOString()),
  ]);
  const tests = testsRes.data ?? [];
  const daily = dailyRes.data as DailyState | null;
  const active = tests.find((t) => t.status !== "completed");
  const isNew = insights.totals.firstAttempts === 0;
  const daysToExam = profile?.exam_date ? Math.ceil((new Date(profile.exam_date).getTime() - Date.now()) / 86_400_000) : null;
  const name = profile?.display_name?.split(" ")[0] ?? "there";
  const examLabel = profile?.target_exam === "step2ck" ? "Step 2 CK" : profile?.target_exam === "step3" ? "Step 3" : "Step 1";
  const weakest = insights.systems
    .filter((s) => s.n > 0 && s.accuracy != null)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))
    .slice(0, 6);
  const peerBySystem = new Map<number, number | null>();
  const { data: overview } = await supabase.rpc("performance_overview");
  for (const s of ((overview as { by_system?: { id: number; peer_accuracy: number | null }[] } | null)?.by_system ?? [])) peerBySystem.set(s.id, s.peer_accuracy);

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name}`}
        description={
          <>
            {examLabel}
            {daysToExam != null && daysToExam >= 0 ? ` in ${daysToExam} ${daysToExam === 1 ? "day" : "days"}` : ""}
            {insights.studyStreak > 1 ? ` · ${insights.studyStreak}-day study streak` : ""}
          </>
        }
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/qbank">Create test</Link>
            </Button>
            {planAllows(plan, "argo") ? (
              <form action={startArgoSession}>
                <input type="hidden" name="size" value="20" />
                <Button type="submit">
                  <Brain className="size-4" /> Start ARGO session
                </Button>
              </form>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="grid content-start gap-6">
          <Panel>
            <div className="border-b border-border px-5 py-3.5">
              <h2 className="text-[15px] font-[700]">Today</h2>
            </div>
            <ul className="divide-y divide-border">
              {active && (
                <TodayRow
                  icon={<CirclePlay className="size-[18px] text-brand" />}
                  title={active.status === "suspended" ? "Resume your suspended block" : "Continue your block"}
                  body={`${active.name ?? (active.kind === "argo" ? "ARGO session" : "Custom block")} · ${active.question_count} questions · ${active.mode}`}
                  action={
                    <Button asChild size="sm">
                      <Link href={`/test/${active.id}`}>Resume</Link>
                    </Button>
                  }
                />
              )}
              {daily?.available && (
                <TodayRow
                  icon={<Zap className="size-[18px] text-gold-ink" />}
                  title={`Daily Challenge #${daily.number}`}
                  body={
                    daily.state === "done" && daily.payload?.result
                      ? daily.payload.result.is_correct
                        ? `Correct in ${formatSeconds(daily.payload.result.time_ms)} · rank #${daily.payload.result.rank} of ${daily.payload.result.players}`
                        : "Missed today. Review the explanation and come back tomorrow."
                      : `${daily.system ?? "Mixed"} · ultra hard · 2 minutes · ${daily.players} played`
                  }
                  action={
                    <Button asChild size="sm" variant={daily.state === "done" ? "secondary" : "primary"}>
                      <Link href="/daily">{daily.state === "done" ? "Review" : daily.state === "started" ? "Finish" : "Play"}</Link>
                    </Button>
                  }
                />
              )}
              <TodayRow
                icon={<Brain className="size-[18px] text-brand" />}
                title={isNew ? "ARGO is waiting for data" : insights.weaknesses[0] ? `Weakest right now: ${insights.weaknesses[0].name}` : "ARGO"}
                body={
                  isNew
                    ? "Answer your first 20 questions and ARGO will map your strengths and weaknesses."
                    : insights.weaknesses[0]
                      ? insights.weaknesses[0].reasons.join(" · ")
                      : "Keep answering to sharpen your model."
                }
                action={
                  planAllows(plan, "argo") ? (
                    <Button asChild size="sm" variant="secondary">
                      <Link href="/argo">Open ARGO</Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="secondary">
                      <Link href="/pricing?from=argo">
                        <Lock className="size-3.5" /> Unlock
                      </Link>
                    </Button>
                  )
                }
              />
              {(dueRes.count ?? 0) > 0 && (
                <TodayRow
                  icon={<Layers3 className="size-[18px] text-muted" />}
                  title={`${dueRes.count} flashcards due`}
                  body="Spaced review takes about a minute per ten cards."
                  action={
                    <Button asChild size="sm" variant="secondary">
                      <Link href="/flashcards">Review</Link>
                    </Button>
                  }
                />
              )}
            </ul>
          </Panel>

          {isNew ? (
            <Panel className="p-6">
              <p className="eyebrow text-brand">First block</p>
              <h2 className="mt-2 text-[22px] font-[750] tracking-[-0.015em]">Start with ten questions in tutor mode</h2>
              <p className="mt-2 max-w-[60ch] text-[15px] text-muted">
                Tutor mode shows the explanation after each answer. Every answer feeds ARGO, so your dashboard fills in as you go.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <form action={quickStart}>
                  <input type="hidden" name="mode" value="tutor" />
                  <input type="hidden" name="count" value="10" />
                  <Button type="submit" size="lg">
                    Start 10 questions <ArrowRight className="size-4" />
                  </Button>
                </form>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/qbank">Build a custom block</Link>
                </Button>
              </div>
            </Panel>
          ) : (
            <>
              <StatRow>
                <StatCell>
                  <Stat label="Answered" value={insights.totals.firstAttempts.toLocaleString()} context={`${insights.totals.omitted} omitted`} />
                </StatCell>
                <StatCell>
                  <Stat
                    label="Accuracy"
                    value={pct(insights.totals.accuracy)}
                    context={insights.peerAccuracy != null ? `All users ${pct(insights.peerAccuracy)}` : "Peer average appears with more users"}
                  />
                </StatCell>
                <StatCell>
                  <Stat label="Percentile" value={insights.percentile != null ? `${insights.percentile}th` : "–"} context={insights.percentile != null ? `Among ${insights.peerCount} active users` : "Needs 20 answers"} />
                </StatCell>
                <StatCell>
                  <Stat label="ARGO readiness" value={planAllows(plan, "argo") ? Math.round(insights.readiness) : <Lock className="mt-1 size-5 text-faint" />} context={planAllows(plan, "argo") ? "Blueprint-weighted mastery, 0 to 100" : "ARGO plan"} />
                </StatCell>
              </StatRow>
              <BarList
                title="Weakest systems"
                subtitle="First-attempt accuracy; the tick shows all users"
                rows={weakest.map((s) => ({ label: s.name, value: s.accuracy, n: s.n, peer: peerBySystem.get(s.id) ?? null }))}
                showPeers
              />
            </>
          )}
        </div>

        <div className="grid content-start gap-6">
          <Panel>
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-[15px] font-[700]">Recent tests</h2>
              <Link href="/tests" className="text-[13px] font-semibold text-brand hover:underline">
                All tests
              </Link>
            </div>
            {tests.length === 0 ? (
              <p className="px-5 py-6 text-[14px] text-muted">Your blocks will appear here.</p>
            ) : (
              <ul className="divide-y divide-border">
                {tests.slice(0, 5).map((t) => {
                  const score = t.status === "completed" && t.question_count ? Math.round((100 * (t.correct_count ?? 0)) / t.question_count) : null;
                  return (
                    <li key={t.id}>
                      <Link href={t.status === "completed" ? `/tests/${t.id}` : `/test/${t.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-panel">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold">{t.name ?? (t.kind === "argo" ? "ARGO session" : "Custom block")}</p>
                          <p className="text-[12.5px] text-muted">
                            {new Date(t.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {t.question_count} q · {t.mode}
                          </p>
                        </div>
                        {score != null ? (
                          <span className="tabular text-[15px] font-[700]">{score}%</span>
                        ) : (
                          <Badge tone="brand">{t.status === "suspended" ? "Suspended" : "In progress"}</Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
          <ActivityCalendar days={insights.calendar} />
          {!isNew && insights.dueForReview.length > 0 && (
            <Panel className="p-5">
              <SectionTitle>Fading from memory</SectionTitle>
              <ul className="grid gap-2">
                {insights.dueForReview.slice(0, 4).map((w) => (
                  <li key={w.refId} className="flex items-center justify-between gap-3 text-[14px]">
                    <span className="truncate">{w.name}</span>
                    <span className="tabular text-[12.5px] text-muted">{Math.round(w.recall * 100)}% recall</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

function TodayRow({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: React.ReactNode; action: React.ReactNode }) {
  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-panel">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-semibold">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{body}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </li>
  );
}
