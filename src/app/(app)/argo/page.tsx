import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { ArgoMark } from "@/components/brand/logo";
import { PageHeader, Panel, SectionTitle } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/misc";
import { BarList } from "@/components/charts/bar-list";
import { Columns } from "@/components/charts/columns";
import { MasteryHeatmap } from "@/components/charts/heatmap";
import { LineChart } from "@/components/charts/line-chart";
import { Stat, StatCell, StatRow } from "@/components/charts/stat";
import { effectivePlan, requireUser } from "@/lib/auth";
import { getArgoInputs, getInsights } from "@/lib/argo/data";
import { planSession, type Candidate } from "@/lib/argo/planner";
import { ERROR_META } from "@/lib/argo/model";
import { planAllows } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { drillConcept, retestTopics, startArgoSession } from "@/app/actions/tests";
import { pct } from "@/lib/utils";
import { aiEnabled } from "@/lib/ai/client";
import { weeklyWriteLimit, writesThisWeek } from "@/lib/argo/write";
import { ArgoWriter } from "./argo-writer";

export const metadata: Metadata = { title: "ARGO" };

const MIX_LABEL = { weakness: "Weakness targets", confusion: "Confusion drills", retest: "Spaced retests", scout: "Coverage scouts", fill: "Best-fit practice" } as const;
const MIX_COLOR = { weakness: "var(--series-1)", confusion: "var(--series-2)", retest: "var(--series-3)", scout: "var(--viz-5)", fill: "var(--border-strong)" } as const;

export default async function ArgoPage({ searchParams }: PageProps<"/argo">) {
  const { profile } = await requireUser("/argo");
  const sp = await searchParams;
  const plan = effectivePlan(profile);
  const unlocked = planAllows(plan, "argo");
  const [insights, inputs] = await Promise.all([getInsights(), getArgoInputs()]);
  const enough = insights.totals.firstAttempts >= 5;

  if (!unlocked) {
    return (
      <>
        <PageHeader eyebrow={<span className="flex items-center gap-1.5"><ArgoMark className="size-3.5 text-brand" /> ARGO</span>} title="Your personal weakness-hunting engine" description="ARGO models how you answer, not just what you answer, and builds every session around what will move your score." />
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Panel className="p-6">
            <p className="text-[15px] font-[700]">What ARGO already sees in your answers</p>
            {enough ? (
              <ul className="mt-4 grid gap-3">
                {insights.weaknesses.slice(0, 3).map((w) => (
                  <li key={`${w.dim}-${w.refId}`} className="rounded-[8px] bg-panel p-3.5">
                    <p className="text-[14.5px] font-semibold">{w.name}</p>
                    <p className="text-[13px] text-muted">{w.context}</p>
                  </li>
                ))}
                {insights.errors[0] && (
                  <li className="rounded-[8px] bg-panel p-3.5 text-[14px]">
                    Most common reason you miss: <strong>{insights.errors[0].label.toLowerCase()}</strong>
                  </li>
                )}
              </ul>
            ) : (
              <p className="mt-3 text-[14.5px] text-muted">Answer a few questions and ARGO will show which concepts are costing you points.</p>
            )}
          </Panel>
          <Panel className="bg-ink p-6 text-on-ink">
            <p className="flex items-center gap-2 text-[15px] font-[700]">
              <Lock className="size-4" /> Unlock ARGO
            </p>
            <ul className="mt-4 grid gap-2 text-[14px] text-on-ink/90">
              <li>Adaptive sessions built from your weakest concepts</li>
              <li>Error taxonomy: gaps, misconceptions, second-guessing, traps, forgetting</li>
              <li>Mastery map, calibration, pacing and stamina analytics</li>
              <li>Confusion-pair drills and spaced retests</li>
            </ul>
            <Button asChild variant="ink" size="lg" className="mt-6">
              <Link href="/pricing?from=argo">
                See ARGO plans <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Panel>
        </div>
      </>
    );
  }

  const supabase = await createClient();
  const [candidates, confusion] = await Promise.all([supabase.rpc("argo_candidates"), supabase.rpc("argo_confusion_candidates", { p_limit: 60 })]);
  const preview = planSession({
    candidates: (candidates.data ?? []) as Candidate[],
    concepts: inputs.concepts,
    theta: inputs.theta,
    taxonomy: inputs.taxonomy,
    confusionIds: ((confusion.data ?? []) as { question_id: string }[]).map((r) => r.question_id),
    size: 20,
    exam: profile?.target_exam ?? null,
  });
  const canWrite = aiEnabled() && preview.shortfall.length > 0;
  const writesLeft = canWrite && profile.role !== "admin" ? Math.max(0, weeklyWriteLimit() - (await writesThisWeek(supabase, profile.id))) : null;
  const mixEntries = (Object.entries(preview.mix) as [keyof typeof MIX_LABEL, number][]).filter(([, v]) => v > 0);
  const totalMix = mixEntries.reduce((s, [, v]) => s + v, 0);
  const errorParam = typeof sp.error === "string" ? sp.error : null;

  return (
    <>
      <PageHeader
        eyebrow={<span className="flex items-center gap-1.5"><ArgoMark className="size-3.5 text-brand" /> ARGO</span>}
        title="Your model"
        description="Updated with every answer. Every number below links back to the answers that produced it."
        actions={
          <form action={startArgoSession} className="flex items-center gap-2">
            <select name="size" defaultValue="20" className="h-9 rounded-[6px] border border-border bg-surface px-2 text-[14px]" aria-label="Session size">
              <option value="10">10 questions</option>
              <option value="20">20 questions</option>
              <option value="40">40 questions</option>
            </select>
            <select name="mode" defaultValue="tutor" className="h-9 rounded-[6px] border border-border bg-surface px-2 text-[14px]" aria-label="Session mode">
              <option value="tutor">Tutor</option>
              <option value="timed">Timed</option>
            </select>
            <Button type="submit">
              <ArgoMark className="size-4" /> Start ARGO session
            </Button>
          </form>
        }
      />
      {errorParam && (
        <p className="mb-6 rounded-[8px] bg-incorrect-soft px-4 py-3 text-[14px] font-medium text-incorrect">
          {errorParam === "bank" ? "No questions are available for a session yet." : errorParam}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        <Panel className="p-6">
          <p className="text-[13px] text-muted">Readiness index</p>
          <p className="mt-1 text-[64px] font-[750] leading-none tracking-[-0.03em]">{Math.round(insights.readiness)}</p>
          <p className="mt-2 max-w-[42ch] text-[13.5px] text-muted">
            Blueprint-weighted mastery across all 19 systems. Untested systems count as unknown, so coverage raises it as much as accuracy does.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
            <Stat label="Answers analyzed" value={insights.totals.attempts.toLocaleString()} />
            <Stat label="Percentile" value={insights.percentile != null ? `${insights.percentile}th` : "–"} context={insights.percentile == null ? "Needs 20 answers" : undefined} />
            <Stat label="Accuracy" value={pct(insights.totals.accuracy)} />
            <Stat label="Nuggets mastered" value={`${insights.nuggets.mastered} / ${insights.nuggets.seen}`} />
          </div>
        </Panel>

        <Panel className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-[700]">Next session, as ARGO would build it now</p>
            <span className="text-[13px] text-muted">{preview.items.length} questions</span>
          </div>
          {preview.items.length === 0 ? (
            <p className="mt-4 text-[14px] text-muted">You have seen every question available to you. New questions arrive as the bank grows.</p>
          ) : (
            <>
              <div className="mt-4 flex h-3 gap-[2px]">
                {mixEntries.map(([k, v]) => (
                  <span key={k} className="h-full first:rounded-l-[4px] last:rounded-r-[4px]" style={{ flexGrow: v, background: MIX_COLOR[k] }} title={`${MIX_LABEL[k]}: ${v}`} />
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-muted">
                {mixEntries.map(([k, v]) => (
                  <li key={k} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[2px]" style={{ background: MIX_COLOR[k] }} />
                    {MIX_LABEL[k]} <span className="tabular font-semibold text-text">{v}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[13px] font-semibold text-muted">Targets</p>
              {preview.targets.length ? (
                <ul className="mt-2 grid gap-2">
                  {preview.targets.slice(0, 4).map((t) => (
                    <li key={`${t.dim}-${t.refId}`} className="flex items-start justify-between gap-3 text-[14px]">
                      <span className="min-w-0">
                        <span className="font-semibold">{t.name}</span>
                        <span className="block text-[12.5px] text-muted">{t.reasons[0]}</span>
                      </span>
                      <span className="tabular shrink-0 text-[13px] text-muted">{Math.round(t.mastery * 100)}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[13.5px] text-muted">Calibration session: ARGO samples broadly until it has enough evidence to target.</p>
              )}
              {canWrite ? (
                <ArgoWriter targets={preview.shortfall.slice(0, 3)} remaining={writesLeft} />
              ) : (
                preview.shortfall.length > 0 && (
                  <p className="mt-4 flex gap-2 rounded-[8px] bg-panel p-3 text-[13px] text-muted">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
                    Running low on unseen questions for {preview.shortfall.map((s) => s.name).slice(0, 2).join(" and ")}. ARGO fills the gap with spaced retests until new questions arrive.
                  </p>
                )
              )}
            </>
          )}
          <p className="mt-4 text-[12px] text-faint">Mix: {totalMix} planned. Questions are interleaved so the same topic rarely appears twice in a row.</p>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Panel className="p-5">
          <SectionTitle>Weakest concepts</SectionTitle>
          {insights.weaknesses.length === 0 ? (
            <p className="text-[14px] text-muted">ARGO needs a few answers before it can rank concepts.</p>
          ) : (
            <ul className="divide-y divide-border">
              {insights.weaknesses.map((w) => (
                <li key={`${w.dim}-${w.refId}`} className="grid grid-cols-[1fr_auto] items-center gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-semibold">{w.name}</p>
                    <p className="text-[12.5px] text-muted">
                      {w.context} · {w.reasons.join(" · ")}
                    </p>
                    <ProgressBar value={w.mastery * 100} className="mt-2 h-1" tone={w.mastery < 0.45 ? "incorrect" : "brand"} />
                  </div>
                  <form action={drillConcept}>
                    <input type="hidden" name="dim" value={w.dim} />
                    <input type="hidden" name="ref" value={w.refId} />
                    <input type="hidden" name="name" value={w.name} />
                    <Button type="submit" size="sm" variant="secondary">
                      Drill
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel className="p-5">
          <SectionTitle>Why you miss</SectionTitle>
          {insights.errors.length === 0 ? (
            <p className="text-[14px] text-muted">No misses analyzed yet.</p>
          ) : (
            <ul className="grid gap-3">
              {insights.errors.slice(0, 5).map((e) => (
                <li key={e.type}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] font-semibold">{e.label}</span>
                    <span className="tabular text-[13px] text-muted">
                      {e.count} · {Math.round(e.pct)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden">
                    <div className="h-full rounded-r-[4px] bg-[var(--series-1)]" style={{ width: `${e.pct}%` }} />
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-snug text-muted">{ERROR_META[e.type].advice}</p>
                </li>
              ))}
              {insights.luckyGuesses > 0 && (
                <li className="rounded-[8px] bg-panel px-3 py-2 text-[13px] text-muted">
                  Plus {insights.luckyGuesses} correct {insights.luckyGuesses === 1 ? "answer" : "answers"} you marked as a guess, treated as weak until confirmed.
                </li>
              )}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <MasteryHeatmap title="Mastery map" subtitle="Systems by discipline, first-attempt accuracy" rows={insights.heatmap.rows} cols={insights.heatmap.cols} cells={insights.heatmap.cells} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Columns
          title="Confidence calibration"
          subtitle="Accuracy at each confidence level"
          data={insights.calibration.map((c) => ({ label: c.label, value: c.accuracy, n: c.n, reference: c.level === 1 ? 35 : c.level === 2 ? 65 : 90 }))}
          referenceLabel="Well calibrated"
          emptyText="Tap Sure, Think so or Guessing before submitting in tutor mode to unlock calibration."
        />
        <Columns title="Pacing" subtitle={insights.medianTimeS ? `Median ${Math.round(insights.medianTimeS)}s per question` : "Accuracy by time spent"} data={insights.pacing.map((p) => ({ label: p.label, value: p.accuracy, n: p.n }))} />
        <Columns title="Stamina" subtitle="Accuracy by position in blocks of 10+" data={insights.stamina.map((p) => ({ label: p.label, value: p.accuracy, n: p.n }))} emptyText="Complete a block of 10 or more questions to see stamina." />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel className="p-5">
          <SectionTitle>Answer changes</SectionTitle>
          <StatRow className="border-0 p-0 md:divide-x-0">
            <StatCell>
              <Stat label="Wrong → right" value={insights.changes.i2c} />
            </StatCell>
            <StatCell>
              <Stat label="Right → wrong" value={insights.changes.c2i} />
            </StatCell>
          </StatRow>
          <p className="mt-3 text-[13px] text-muted">
            {insights.changes.c2i + insights.changes.i2c === 0
              ? "No changed answers yet."
              : insights.changes.net >= 0
                ? "Your changes help more than they hurt. Trust your re-reads."
                : "Your changes cost you points. Change an answer only when you find a specific missed clue."}
          </p>
        </Panel>
        <Panel className="p-5">
          <SectionTitle>Confusion pairs</SectionTitle>
          {insights.confusions.length === 0 ? (
            <p className="text-[14px] text-muted">When you pick one concept for another, the pair appears here.</p>
          ) : (
            <ul className="grid gap-2.5">
              {insights.confusions.slice(0, 5).map((c) => (
                <li key={`${c.correct_concept}-${c.chosen_concept}`} className="text-[13.5px]">
                  <span className="text-muted">Chose</span> <span className="font-semibold">{c.chosen_concept}</span> <span className="text-muted">for</span>{" "}
                  <span className="font-semibold">{c.correct_concept}</span>
                  <span className="tabular ml-1.5 text-muted">× {c.n}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel className="p-5">
          <SectionTitle
            action={
              insights.dueForReview.length > 0 ? (
                <form action={retestTopics}>
                  <input type="hidden" name="topics" value={insights.dueForReview.map((d) => d.refId).join(",")} />
                  <Button type="submit" size="sm" variant="secondary">
                    Retest now
                  </Button>
                </form>
              ) : null
            }
          >
            Fading from memory
          </SectionTitle>
          {insights.dueForReview.length === 0 ? (
            <p className="text-[14px] text-muted">Nothing due. Topics you got right reappear here as their memory half-life runs out.</p>
          ) : (
            <ul className="grid gap-2">
              {insights.dueForReview.slice(0, 5).map((d) => (
                <li key={d.refId} className="flex justify-between gap-3 text-[13.5px]">
                  <span className="truncate">{d.name}</span>
                  <span className="tabular text-muted">{Math.round(d.recall * 100)}% recall</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <LineChart title="Readiness over time" subtitle="Daily snapshot of your readiness index" points={insights.trend.map((t) => ({ x: t.day, y: t.readiness }))} reference={{ value: 70, label: "Target 70" }} />
        <BarList title="By physician task" subtitle="Which kinds of questions cost you" rows={insights.competencies.map((c) => ({ label: c.name, value: c.accuracy, n: c.n }))} />
      </div>

      <details className="mt-8 rounded-[10px] border border-border bg-surface p-5 text-[14px] text-muted">
        <summary className="cursor-pointer font-semibold text-text">How ARGO works</summary>
        <div className="mt-3 grid max-w-[80ch] gap-2 leading-relaxed">
          <p>
            <strong className="text-text">Ability and mastery.</strong> Every answer updates an item-response model: your overall ability, an offset for each system, discipline, task, topic and Nugget, and the difficulty of the question itself, calibrated across all users. Mastery is the predicted chance you answer an average question on that concept correctly.
          </p>
          <p>
            <strong className="text-text">Memory.</strong> Each concept carries a half-life that grows when you succeed after a gap and shrinks when you miss. Mastery decays as recall fades, which is how topics re-enter your sessions at the right time.
          </p>
          <p>
            <strong className="text-text">Why you miss.</strong> Misses are classified from your behavior: changing away from a correct first choice, confident errors, unusually fast errors on known material, choosing the most popular wrong answer, losing a concept you once knew, and running long.
          </p>
          <p>
            <strong className="text-text">Sessions.</strong> ARGO ranks concepts by how much they cost you, weighted by exam emphasis and evidence, then picks unseen questions you have roughly a 70% chance of answering, the zone where practice teaches the most.
          </p>
        </div>
      </details>
    </>
  );
}
