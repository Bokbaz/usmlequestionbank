import type { Metadata } from "next";
import { PageHeader, Panel, SectionTitle } from "@/components/app/page-header";
import { createClient } from "@/lib/supabase/server";
import { DaySlot, type EligibleQuestion } from "./day-slot";

export const metadata: Metadata = { title: "Daily Challenge" };

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

export default async function AdminDailyPage() {
  const supabase = await createClient();
  const todayMs = Date.parse(new Date().toISOString().slice(0, 10));
  const from = iso(todayMs - 7 * DAY);
  const to = iso(todayMs + 21 * DAY);

  const [{ data: scheduled }, { data: pool }, { data: used }] = await Promise.all([
    supabase.from("daily_challenges").select("day, time_limit_s, question:questions(id, code, lead_in)").gte("day", from).lte("day", to).order("day"),
    supabase
      .from("questions")
      .select("id, code, lead_in, author_difficulty, system:systems(short_name)")
      .eq("is_daily_eligible", true)
      .eq("status", "published")
      .is("owner_id", null)
      .order("code"),
    supabase.from("daily_challenges").select("question_id, day"),
  ]);
  const past = (scheduled ?? []).filter((d) => d.day < iso(todayMs));
  const stats = await Promise.all(
    past.map(async (d) => {
      const [all, correct] = await Promise.all([
        supabase.from("daily_attempts").select("id", { count: "exact", head: true }).eq("day", d.day).not("submitted_at", "is", null),
        supabase.from("daily_attempts").select("id", { count: "exact", head: true }).eq("day", d.day).eq("is_correct", true),
      ]);
      return { day: d.day, players: all.count ?? 0, correct: correct.count ?? 0 };
    }),
  );
  const lastUsed = new Map<string, string>();
  for (const u of used ?? []) if (!lastUsed.has(u.question_id) || lastUsed.get(u.question_id)! < u.day) lastUsed.set(u.question_id, u.day);
  const eligible: EligibleQuestion[] = ((pool ?? []) as unknown as (Omit<EligibleQuestion, "lastUsed" | "system"> & { system: { short_name: string } | null })[])
    .map((q) => ({ ...q, system: q.system?.short_name ?? "", lastUsed: lastUsed.get(q.id) ?? null }))
    .sort((a, b) => (a.lastUsed ?? "").localeCompare(b.lastUsed ?? ""));
  const byDay = new Map((scheduled ?? []).map((d) => [d.day, d]));
  const upcoming = Array.from({ length: 22 }, (_, i) => iso(todayMs + i * DAY));
  const unused = eligible.filter((q) => !q.lastUsed).length;

  return (
    <>
      <PageHeader
        title="Daily Challenge"
        description={`One ultra-hard question per UTC day. Empty days are filled automatically at midnight UTC from the eligible pool, never-used questions first. ${eligible.length} eligible, ${unused} never used.`}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <Panel className="p-5">
          <SectionTitle>Next three weeks</SectionTitle>
          <ul className="divide-y divide-border">
            {upcoming.map((day, i) => {
              const d = byDay.get(day);
              const q = d?.question as unknown as { id: string; code: string; lead_in: string } | null;
              return <DaySlot key={day} day={day} isToday={i === 0} current={q ? { id: q.id, code: q.code, leadIn: q.lead_in, timeLimit: d!.time_limit_s } : null} eligible={eligible} />;
            })}
          </ul>
        </Panel>
        <Panel className="p-5">
          <SectionTitle>Last seven days</SectionTitle>
          {stats.length === 0 ? (
            <p className="text-[14px] text-muted">No past challenges yet.</p>
          ) : (
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-left text-[12.5px] text-muted">
                  <th className="pb-2 font-semibold">Day</th>
                  <th className="pb-2 font-semibold">Question</th>
                  <th className="pb-2 text-right font-semibold">Players</th>
                  <th className="pb-2 text-right font-semibold">Correct</th>
                </tr>
              </thead>
              <tbody>
                {stats
                  .slice()
                  .reverse()
                  .map((s) => {
                    const q = byDay.get(s.day)?.question as unknown as { code: string } | null;
                    return (
                      <tr key={s.day} className="border-t border-border">
                        <td className="tabular py-2">{s.day}</td>
                        <td className="py-2 font-semibold">{q?.code ?? "–"}</td>
                        <td className="tabular py-2 text-right">{s.players}</td>
                        <td className="tabular py-2 text-right">{s.players ? `${Math.round((100 * s.correct) / s.players)}%` : "–"}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </>
  );
}
