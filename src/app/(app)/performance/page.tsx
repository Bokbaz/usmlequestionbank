import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { BarList } from "@/components/charts/bar-list";
import { LineChart } from "@/components/charts/line-chart";
import { Stat, StatCell, StatRow } from "@/components/charts/stat";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { pct } from "@/lib/utils";

export const metadata: Metadata = { title: "Performance" };

type Breakdown = { id: number; name: string; n: number; correct: number; accuracy: number | null; peer_accuracy?: number | null; group?: string };
type Overview = {
  answered: number;
  correct: number;
  omitted: number;
  accuracy: number | null;
  avg_time_s: number | null;
  bank_size: number;
  used: number;
  percentile: number | null;
  peer_count: number;
  peer_accuracy: number | null;
  changes: { c2i: number; i2c: number; i2i: number };
  by_system: Breakdown[];
  by_discipline: Breakdown[];
  by_competency: Breakdown[];
  daily: { day: string; n: number; correct: number }[];
};

export default async function PerformancePage() {
  await requireUser("/performance");
  const supabase = await createClient();
  const { data } = await supabase.rpc("performance_overview");
  const o = data as Overview | null;

  if (!o || o.answered === 0) {
    return (
      <>
        <PageHeader title="Performance" description="Accuracy, pace and percentile across every system, discipline and physician task." />
        <EmptyState
          icon={<BarChart3 className="size-6 text-faint" />}
          title="No answers yet"
          body="Complete a block and your performance breaks down here by system, discipline and task, against all users."
          action={
            <Button asChild>
              <Link href="/qbank">Create a test</Link>
            </Button>
          }
        />
      </>
    );
  }

  const trend = cumulativeAccuracy(o.daily);
  const net = o.changes.i2c - o.changes.c2i;

  return (
    <>
      <PageHeader title="Performance" description="First-attempt results only, so retakes never inflate your numbers." />
      <StatRow className="mb-6">
        <StatCell>
          <Stat label="Accuracy" value={pct(o.accuracy)} context={o.peer_accuracy != null ? `All users ${pct(o.peer_accuracy)}` : `${o.correct} of ${o.answered} correct`} />
        </StatCell>
        <StatCell>
          <Stat label="Percentile" value={o.percentile != null ? `${o.percentile}th` : "–"} context={o.percentile != null ? `Among ${o.peer_count} users with 20+ answers` : "Unlocks at 20 answers and 5 peers"} />
        </StatCell>
        <StatCell>
          <Stat label="Bank used" value={`${o.used} / ${o.bank_size}`} context={`${Math.round((100 * o.used) / Math.max(1, o.bank_size))}% of questions seen`} />
        </StatCell>
        <StatCell>
          <Stat label="Average time" value={o.avg_time_s != null ? `${o.avg_time_s}s` : "–"} context={o.avg_time_s != null && o.avg_time_s > 90 ? "Slower than exam pace" : "Exam pace is 90s"} tone={o.avg_time_s != null && o.avg_time_s > 90 ? "bad" : undefined} />
        </StatCell>
        <StatCell>
          <Stat
            label="Answer changes"
            value={net >= 0 ? `+${net}` : `${net}`}
            context={`${o.changes.i2c} wrong→right · ${o.changes.c2i} right→wrong`}
            tone={net < 0 ? "bad" : net > 0 ? "good" : undefined}
          />
        </StatCell>
      </StatRow>

      <div className="grid gap-6">
        <LineChart title="Cumulative accuracy" subtitle="How your overall first-attempt accuracy has moved" points={trend} yUnit="%" emptyText="Answer on at least two different days to see a trend." />
        <BarList
          title="By system"
          subtitle="Your accuracy (bar) against all users (tick)"
          rows={o.by_system.map((s) => ({ label: s.name, value: s.accuracy, n: s.n, peer: s.peer_accuracy ?? null }))}
          showPeers
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <BarList
            title="By discipline"
            rows={o.by_discipline.map((s) => ({ label: s.name, value: s.accuracy, n: s.n, peer: s.peer_accuracy ?? null }))}
            showPeers
          />
          <BarList
            title="By physician task"
            subtitle="What the question asked you to do"
            rows={o.by_competency.map((s) => ({ label: s.name, value: s.accuracy, n: s.n }))}
          />
        </div>
      </div>
    </>
  );
}

// Running first-attempt accuracy, one point per study day.
function cumulativeAccuracy(daily: Overview["daily"]) {
  const out: { x: string; y: number | null }[] = [];
  let n = 0;
  let c = 0;
  for (const d of daily) {
    n += d.n;
    c += d.correct;
    out.push({ x: d.day, y: n ? (100 * c) / n : null });
  }
  return out;
}
