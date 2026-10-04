"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { recomposeTopics } from "@/lib/import/pipeline";
import { createClient } from "@/lib/supabase/server";

// Every action re-checks the caller: server actions are reachable without the page.
async function admin() {
  await requireAdmin();
  return createClient();
}

type Result = { error?: string };

export async function setQuestionStatus(ids: string[], status: "published" | "draft" | "retired"): Promise<Result> {
  const sb = await admin();
  const { data, error } = await sb.from("questions").update({ status }).in("id", ids.slice(0, 500)).select("topic_id");
  if (error) return { error: error.message };
  // Library chapters only include published questions, so rebuild the affected topics.
  const topics = [...new Set((data ?? []).map((r) => r.topic_id).filter((t): t is number => t != null))];
  try {
    await recomposeTopics(sb, topics);
  } catch (e) {
    return { error: `Status saved, but the Library rebuild failed: ${e instanceof Error ? e.message : e}` };
  }
  revalidatePath("/admin/questions");
  revalidatePath("/library");
  return {};
}

export async function setQuestionFlags(ids: string[], flags: { is_free?: boolean; is_daily_eligible?: boolean }): Promise<Result> {
  const sb = await admin();
  const { error } = await sb.from("questions").update(flags).in("id", ids.slice(0, 500));
  revalidatePath("/admin/questions");
  return error ? { error: error.message } : {};
}

// Moves a student's ARGO-written question into the shared bank after review.
export async function promoteQuestion(id: string): Promise<Result> {
  const sb = await admin();
  const { error } = await sb.from("questions").update({ owner_id: null }).eq("id", id).eq("source", "argo");
  revalidatePath("/admin/questions");
  return error ? { error: error.message } : {};
}

export async function decideNugget(reviewId: number, approve: boolean, title?: string): Promise<Result> {
  const sb = await admin();
  const { data: r, error } = await sb.from("nugget_reviews").select("question_id, index_ids, score, title, body").eq("id", reviewId).single();
  if (error) return { error: error.message };
  if (approve) {
    const { error: linkErr } = await sb.rpc("admin_link_nugget", {
      p_question: r.question_id,
      p_title: (title ?? r.title).trim() || r.title,
      p_body: r.body,
      p_index_ids: r.index_ids,
      p_score: r.score,
      p_method: "manual",
    });
    if (linkErr) return { error: linkErr.message };
  }
  const { error: upErr } = await sb
    .from("nugget_reviews")
    .update({ status: approve ? "approved" : "dismissed", decided_at: new Date().toISOString() })
    .eq("id", reviewId);
  revalidatePath("/admin/nuggets");
  return upErr ? { error: upErr.message } : {};
}

export async function scheduleDaily(day: string, questionId: string, timeLimit: number): Promise<Result> {
  const sb = await admin();
  const { error } = await sb.rpc("admin_schedule_daily", { p_day: day, p_question: questionId, p_time_limit: Math.max(30, Math.min(600, Math.round(timeLimit))) });
  revalidatePath("/admin/daily");
  return error ? { error: error.message } : {};
}

export async function unscheduleDaily(day: string): Promise<Result> {
  const sb = await admin();
  const today = new Date().toISOString().slice(0, 10);
  if (day <= today) return { error: "Only future days can be cleared" };
  const { error } = await sb.from("daily_challenges").delete().eq("day", day);
  revalidatePath("/admin/daily");
  return error ? { error: error.message } : {};
}

export async function setUserPlan(userId: string, plan: "free" | "core" | "argo", expires: string | null): Promise<Result> {
  const sb = await admin();
  const { error } = await sb.rpc("admin_set_plan", { p_user: userId, p_plan: plan, p_expires: expires ? new Date(expires).toISOString() : null });
  revalidatePath("/admin/users");
  return error ? { error: error.message } : {};
}

export async function setFeedbackStatus(id: number, status: "open" | "resolved" | "dismissed"): Promise<Result> {
  const sb = await admin();
  const { error } = await sb.from("question_feedback").update({ status }).eq("id", id);
  revalidatePath("/admin/feedback");
  return error ? { error: error.message } : {};
}
