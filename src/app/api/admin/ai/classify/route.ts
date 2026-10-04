import { NextResponse } from "next/server";
import * as z from "zod";
import { classifyQuestions, renderTaxonomy } from "@/lib/ai/importer";
import { getAdminClient } from "@/lib/auth";
import { aiErrorResponse } from "@/lib/ai/http";

export const maxDuration = 150;

const Body = z.object({
  items: z
    .array(
      z.object({
        index: z.number().int(),
        stem: z.string().max(20_000),
        leadIn: z.string().max(2_000),
        options: z.array(z.string().max(2_000)).max(10),
        answer: z.string().max(2_000).nullable().optional(),
        explanation: z.string().max(30_000).nullable().optional(),
      }),
    )
    .min(1)
    .max(10),
});

export async function POST(request: Request) {
  const admin = await getAdminClient();
  if (!admin) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Send 1 to 10 questions" }, { status: 400 });

  const sb = admin.supabase;
  const [systems, categories, disciplines, competencies, topics] = await Promise.all([
    sb.from("systems").select("id, name").order("sort"),
    sb.from("categories").select("system_id, name").order("sort"),
    sb.from("disciplines").select("name").order("sort"),
    sb.from("competencies").select("name, group_name").order("sort"),
    sb.from("topics").select("name").order("id", { ascending: false }).limit(400),
  ]);
  const failed = [systems, categories, disciplines, competencies, topics].find((r) => r.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

  const taxonomy = renderTaxonomy({
    systems: (systems.data ?? []).map((s) => ({
      name: s.name,
      categories: (categories.data ?? []).filter((c) => c.system_id === s.id).map((c) => c.name),
    })),
    disciplines: (disciplines.data ?? []).map((d) => d.name),
    competencies: (competencies.data ?? []).map((c) => ({ name: c.name, group: c.group_name })),
  });

  try {
    const { data, usage } = await classifyQuestions(
      taxonomy,
      (topics.data ?? []).map((t) => t.name).sort(),
      parsed.data.items,
    );
    return NextResponse.json({ items: data.items, usage });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
