import { NextResponse, type NextRequest } from "next/server";
import { applyQuestionFilters } from "@/app/(app)/admin/questions/filters";
import { toAqf, type ExportQuestion } from "@/lib/aqf/serialize";
import { getAdminClient } from "@/lib/auth";

export const maxDuration = 120;

type Row = {
  code: string;
  exam: ExportQuestion["exam"];
  status: ExportQuestion["status"];
  stem: string;
  lead_in: string;
  media: ExportQuestion["media"];
  author_difficulty: number;
  tags: string[];
  is_free: boolean;
  is_daily_eligible: boolean;
  system: { name: string } | null;
  discipline: { name: string } | null;
  competency: { name: string } | null;
  category: { name: string } | null;
  topic: { name: string } | null;
  options: { id: string; label: string; body: string; concept: string | null }[];
  key: {
    correct_option_id: string;
    explanation: string | null;
    option_explanations: Record<string, string> | null;
    educational_objective: string | null;
    textbook: string | null;
    key_concept: string | null;
    references: string[] | null;
  } | null;
  question_nuggets: { method: string; nuggets: { title: string; body: string | null } | null }[];
};

const SELECT =
  "code, exam, status, stem, lead_in, media, author_difficulty, tags, is_free, is_daily_eligible, system:systems(name), discipline:disciplines(name), competency:competencies(name), category:categories(name), topic:topics(name), options:question_options(id, label, body, concept), key:question_keys(correct_option_id, explanation, option_explanations, educational_objective, textbook, key_concept, references), question_nuggets(method, nuggets(title, body))";

export async function GET(request: NextRequest) {
  const admin = await getAdminClient();
  if (!admin) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const sp = request.nextUrl.searchParams;
  const filters = { q: sp.get("q") ?? undefined, system: sp.get("system") ?? undefined, status: sp.get("status") ?? undefined, source: sp.get("source") ?? undefined, nuggets: sp.get("nuggets") ?? undefined };

  const blocks: string[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await applyQuestionFilters(admin.supabase.from("questions").select(SELECT), filters)
      .order("code")
      .range(from, from + 499);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rows = (data ?? []) as unknown as Row[];
    for (const r of rows) {
      if (!r.key || !r.system) continue;
      const options = [...r.options].sort((a, b) => a.label.localeCompare(b.label));
      blocks.push(
        toAqf({
          code: r.code,
          exam: r.exam,
          status: r.status,
          system: r.system.name,
          discipline: r.discipline?.name,
          competency: r.competency?.name,
          category: r.category?.name,
          topic: r.topic?.name,
          difficulty: r.author_difficulty,
          tags: r.tags,
          isFree: r.is_free,
          isDaily: r.is_daily_eligible,
          stem: r.stem,
          leadIn: r.lead_in,
          media: r.media ?? [],
          options,
          correct: options.find((o) => o.id === r.key!.correct_option_id)?.label ?? "A",
          keyConcept: r.key.key_concept,
          explanation: r.key.explanation,
          optionExplanations: r.key.option_explanations ?? {},
          objective: r.key.educational_objective,
          textbook: r.key.textbook,
          references: r.key.references ?? [],
          // Only hand-curated cards travel with the question; detected links are rebuilt on import.
          nuggets: r.question_nuggets.filter((n) => n.method === "manual" && n.nuggets).map((n) => ({ title: n.nuggets!.title, body: n.nuggets!.body })),
        }),
      );
    }
    if (rows.length < 500) break;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(blocks.join("\n\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="argonaut-questions-${stamp}.aqf.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
