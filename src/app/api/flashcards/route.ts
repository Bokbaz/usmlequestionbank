import { NextResponse } from "next/server";
import * as z from "zod";
import { getUser } from "@/lib/auth";
import { buildCard, loadCardMaterial } from "@/lib/flashcards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// One short Claude call at most; the fallback card needs none.
export const maxDuration = 60;

const Body = z.object({ questionId: z.uuid() });

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Log in to save flashcards" }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { questionId } = parsed.data;

  const supabase = await createClient();
  const service = createAdminClient();
  const [existing, attempt, daily] = await Promise.all([
    supabase.from("flashcards").select("id").eq("question_id", questionId).limit(1).maybeSingle(),
    supabase.from("attempts").select("id").eq("question_id", questionId).limit(1).maybeSingle(),
    // Daily answers live in daily_attempts, and daily_challenges is admin-only under RLS.
    service
      .from("daily_attempts")
      .select("id, daily_challenges!inner(question_id)")
      .eq("user_id", user.id)
      .eq("daily_challenges.question_id", questionId)
      .not("submitted_at", "is", null)
      .limit(1)
      .maybeSingle(),
  ]);
  if (existing.data) return NextResponse.json({ error: "Already in your deck", id: existing.data.id }, { status: 409 });
  // The card shows the answer, so only questions the student has already answered qualify.
  if (!attempt.data && !daily.data) return NextResponse.json({ error: "Answer the question first" }, { status: 403 });

  const material = await loadCardMaterial(service, questionId);
  if (!material) return NextResponse.json({ error: "Question not found" }, { status: 404 });
  const card = await buildCard(material);

  const { data, error } = await supabase
    .from("flashcards")
    .insert({ user_id: user.id, question_id: questionId, front: card.front, back: card.back })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, front: card.front, back: card.back });
}
