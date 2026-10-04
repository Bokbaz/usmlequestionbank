import { NextResponse } from "next/server";
import * as z from "zod";
import { AiError, aiEnabled } from "@/lib/ai/client";
import { aiErrorResponse } from "@/lib/ai/http";
import { writeVerifiedQuestion } from "@/lib/ai/writer";
import { WRITE_DIMS, buildWriterContext, logGeneration, saveWrittenQuestion, weeklyWriteLimit, writesThisWeek } from "@/lib/argo/write";
import { effectivePlan, getProfile, getUser } from "@/lib/auth";
import { planAllows } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Writing takes one long Claude call and two parallel verification calls.
export const maxDuration = 300;

const Body = z.object({ dim: z.enum(WRITE_DIMS), ref: z.number().int().positive() });

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const profile = await getProfile();
  if (!planAllows(effectivePlan(profile), "argo")) return NextResponse.json({ error: "ARGO question writing is part of the ARGO plan" }, { status: 402 });
  if (!aiEnabled()) return NextResponse.json({ error: "Question writing is not switched on yet" }, { status: 503 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { dim, ref } = parsed.data;

  const service = createAdminClient();
  const isAdmin = profile?.role === "admin";
  const limit = weeklyWriteLimit();
  const used = await writesThisWeek(service, user.id);
  if (!isAdmin && used >= limit) {
    return NextResponse.json({ error: `You have used this week's ${limit} new questions. More unlock as the week rolls over.`, remaining: 0 }, { status: 429 });
  }

  const session = await createClient();
  const { data: ability } = await session.from("user_ability").select("theta").maybeSingle();
  const built = await buildWriterContext(service, user.id, ability?.theta ?? 0, profile?.target_exam ?? "step1", dim, ref);
  if (!built) return NextResponse.json({ error: "ARGO could not find that concept" }, { status: 404 });
  const { ctx, scope } = built;
  const remaining = isAdmin ? null : Math.max(0, limit - used - 1);

  let result;
  try {
    result = await writeVerifiedQuestion(ctx);
  } catch (e) {
    await logGeneration(service, { userId: user.id, scope, status: "failed", error: e instanceof Error ? e.message : String(e) });
    if (e instanceof AiError) return aiErrorResponse(e);
    throw e;
  }

  if (result.status === "rejected") {
    await logGeneration(service, { userId: user.id, scope, status: "rejected", result });
    return NextResponse.json({ status: "rejected", concept: scope.name, reasons: result.verdict.reasons.slice(0, 3), remaining });
  }

  try {
    const row = await saveWrittenQuestion(service, user.id, ctx.exam, result.question, scope);
    await logGeneration(service, { userId: user.id, scope, status: "accepted", questionId: row.id, result });
    return NextResponse.json({ status: "accepted", concept: scope.name, id: row.id, code: row.code, keyConcept: result.question.key_concept, remaining });
  } catch (e) {
    await logGeneration(service, { userId: user.id, scope, status: "failed", result, error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "The question passed review but could not be saved. Try again." }, { status: 500 });
  }
}
