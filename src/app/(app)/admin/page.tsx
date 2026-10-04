import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed } from "lucide-react";
import { PageHeader, Panel, SectionTitle } from "@/components/app/page-header";
import { Stat, StatCell, StatRow } from "@/components/charts/stat";
import { aiEnabled } from "@/lib/ai/client";
import { monthlyWriteLimit } from "@/lib/argo/write";
import { createClient } from "@/lib/supabase/server";

type Overview = {
  questions: number;
  published: number;
  argo_generated: number;
  nugget_questions: number;
  articles: number;
  users: number;
  paid_users: number;
  attempts: number;
  attempts_7d: number;
  daily_players_today: number;
  open_feedback: number;
  nugget_index: number;
};
type GenStats = { accepted: number; rejected: number; failed: number; last_7d: number; students: number };

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const [{ data: o }, { data: gen }, { count: reviews }, { data: nextDaily }] = await Promise.all([
    supabase.rpc("admin_overview"),
    supabase.rpc("admin_argo_generation_stats"),
    supabase.from("nugget_reviews").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("daily_challenges").select("day").gte("day", new Date().toISOString().slice(0, 10)).order("day", { ascending: false }).limit(1),
  ]);
  const ov = o as Overview;
  const g = gen as GenStats | null;
  const ai = aiEnabled();
  const stripe = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  const scheduledThrough = nextDaily?.[0]?.day ?? null;
  const daysScheduled = scheduledThrough ? Math.round((new Date(scheduledThrough).getTime() - new Date(new Date().toISOString().slice(0, 10)).getTime()) / 86_400_000) + 1 : 0;

  const checklist = [
    { done: ov.questions >= 500, label: "Import the question bank", detail: `${ov.questions.toLocaleString()} questions so far`, href: "/admin/import" },
    { done: daysScheduled >= 14, label: "Keep two weeks of Daily Challenges scheduled", detail: daysScheduled ? `Scheduled through ${scheduledThrough}` : "Nothing scheduled", href: "/admin/daily" },
    { done: stripe, label: "Connect Stripe", detail: stripe ? "Checkout and webhooks configured" : "Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Vercel", href: null },
    { done: ai, label: "Enable Claude", detail: ai ? "AI import assist and ARGO question writing are on" : "Add ANTHROPIC_API_KEY in Vercel", href: null },
    { done: (reviews ?? 0) === 0, label: "Clear the Nugget review queue", detail: `${reviews ?? 0} matches waiting`, href: "/admin/nuggets" },
    { done: ov.open_feedback === 0, label: "Answer question feedback", detail: `${ov.open_feedback} open reports`, href: "/admin/feedback" },
  ];

  return (
    <>
      <PageHeader title="Admin" description="Content, users and the health of the bank." />
      <StatRow className="mb-6">
        <StatCell>
          <Stat label="Questions" value={ov.questions.toLocaleString()} context={`${ov.published.toLocaleString()} published · ${ov.nugget_questions.toLocaleString()} Nuggets`} />
        </StatCell>
        <StatCell>
          <Stat label="Library chapters" value={ov.articles.toLocaleString()} context={`${ov.nugget_index.toLocaleString()} HY index lines`} />
        </StatCell>
        <StatCell>
          <Stat label="Users" value={ov.users.toLocaleString()} context={`${ov.paid_users.toLocaleString()} paying`} />
        </StatCell>
        <StatCell>
          <Stat label="Answers, 7 days" value={ov.attempts_7d.toLocaleString()} context={`${ov.attempts.toLocaleString()} all time`} />
        </StatCell>
        <StatCell>
          <Stat label="Daily players today" value={ov.daily_players_today.toLocaleString()} />
        </StatCell>
      </StatRow>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel className="p-5">
          <SectionTitle>Launch checklist</SectionTitle>
          <ul className="divide-y divide-border">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-start gap-3 py-3">
                {c.done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-correct" /> : <CircleDashed className="mt-0.5 size-4 shrink-0 text-faint" />}
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-semibold">{c.label}</p>
                  <p className="text-[13px] text-muted">{c.detail}</p>
                </div>
                {c.href && (
                  <Link href={c.href} className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-brand hover:underline">
                    Open <ArrowRight className="size-3.5" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <SectionTitle>ARGO question writing</SectionTitle>
          {!ai ? (
            <p className="text-[14px] text-muted">Off. With ANTHROPIC_API_KEY set, students on the $4.99 add-on can ask for new questions on concepts where the bank runs short. Every draft is solved blind and audited by separate Claude calls before a student sees it.</p>
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-4">
                <div>
                  <dt className="text-[12.5px] text-muted">Accepted</dt>
                  <dd className="tabular text-[22px] font-[750]">{g?.accepted ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-[12.5px] text-muted">Rejected</dt>
                  <dd className="tabular text-[22px] font-[750]">{g?.rejected ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-[12.5px] text-muted">Failed</dt>
                  <dd className="tabular text-[22px] font-[750]">{g?.failed ?? 0}</dd>
                </div>
              </dl>
              <p className="mt-4 text-[13px] text-muted">
                {g?.last_7d ?? 0} drafts in the last 7 days for {g?.students ?? 0} students. Limit {monthlyWriteLimit()} drafts per subscriber per 30 days (ARGO_WRITE_MONTHLY_LIMIT). Generated questions stay private to the student who asked for them.
              </p>
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
