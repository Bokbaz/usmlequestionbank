import { NextResponse } from "next/server";
import * as z from "zod";
import { getAdminClient } from "@/lib/auth";
import { ArgoPlaceItem, UpsertPayload, importChunk, placeArgo, recomposeTopics, type ItemResult } from "@/lib/import/pipeline";

export const maxDuration = 120;

const Body = z.discriminatedUnion("action", [
  // ARGO pipeline exports: where each question goes before anything is saved.
  z.object({ action: z.literal("place"), items: z.array(ArgoPlaceItem).min(1).max(25) }),
  z.object({ action: z.literal("start"), fileName: z.string().max(200).nullable(), total: z.number().int().min(0) }),
  z.object({
    action: z.literal("chunk"),
    batchId: z.string().uuid(),
    items: z.array(z.object({ index: z.number().int(), payload: z.unknown() })).min(1).max(25),
  }),
  z.object({
    action: z.literal("finish"),
    batchId: z.string().uuid(),
    topicIds: z.array(z.number().int()).max(5_000),
    summary: z.object({ created: z.number().int(), updated: z.number().int(), errors: z.number().int() }),
    report: z.record(z.string(), z.unknown()),
  }),
]);

export async function POST(request: Request) {
  const admin = await getAdminClient();
  if (!admin) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues.slice(0, 5) }, { status: 400 });
  const body = parsed.data;
  const sb = admin.supabase;

  if (body.action === "place") {
    try {
      return NextResponse.json({ placements: await placeArgo(sb, body.items) });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
  }

  if (body.action === "start") {
    const { data, error } = await sb
      .from("import_batches")
      .insert({ created_by: admin.user.id, file_name: body.fileName, n_questions: body.total })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ batchId: data.id });
  }

  if (body.action === "chunk") {
    // Validate per question so one bad item never sinks its chunk.
    const valid: { index: number; payload: UpsertPayload }[] = [];
    const invalid: ItemResult[] = [];
    for (const item of body.items) {
      const p = UpsertPayload.safeParse(item.payload);
      if (p.success) valid.push({ index: item.index, payload: p.data });
      else {
        const issue = p.error.issues[0];
        invalid.push({ index: item.index, code: null, error: `Invalid ${issue.path.join(".") || "question"}: ${issue.message}` });
      }
    }
    const results = valid.length ? await importChunk(sb, valid, body.batchId) : [];
    return NextResponse.json({ results: [...results, ...invalid] });
  }

  let articles = 0;
  let libraryError: string | null = null;
  try {
    articles = await recomposeTopics(sb, [...new Set(body.topicIds)]);
  } catch (e) {
    libraryError = e instanceof Error ? e.message : String(e);
  }
  const { error } = await sb
    .from("import_batches")
    .update({
      n_created: body.summary.created,
      n_updated: body.summary.updated,
      n_errors: body.summary.errors,
      report: { ...body.report, articles, libraryError },
    })
    .eq("id", body.batchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ articles, libraryError });
}
