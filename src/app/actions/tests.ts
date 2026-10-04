"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTaxonomy } from "@/lib/argo/data";
import { planSession, type Candidate } from "@/lib/argo/planner";
import type { ConceptRow } from "@/lib/argo/insights";
import { effectivePlan, getProfile } from "@/lib/auth";
import { planAllows } from "@/lib/plans";

export type CreateTestInput = {
  mode: "tutor" | "timed" | "untimed";
  count: number;
  exam?: "step1" | "step2ck" | "step3" | null;
  systems?: number[];
  disciplines?: number[];
  competencies?: number[];
  pool?: string[];
  nuggetsOnly?: boolean;
  secondsPerQuestion?: number;
  name?: string | null;
};

export async function createTest(input: CreateTestInput): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_test", {
    p_mode: input.mode,
    p_count: Math.max(1, Math.min(40, Math.round(input.count))),
    p_name: input.name ?? null,
    p_exam: input.exam ?? null,
    p_systems: input.systems?.length ? input.systems : null,
    p_disciplines: input.disciplines?.length ? input.disciplines : null,
    p_competencies: input.competencies?.length ? input.competencies : null,
    p_topics: null,
    p_pool: input.pool?.length ? input.pool : ["unused"],
    p_nuggets_only: Boolean(input.nuggetsOnly),
    p_seconds_per_question: input.secondsPerQuestion ?? 90,
  });
  if (error) return { error: error.message.includes("No questions") ? "No questions match these filters. Widen the selection." : error.message };
  return { id: data as string };
}

export async function quickStart(formData: FormData) {
  const mode = (formData.get("mode") as CreateTestInput["mode"]) ?? "tutor";
  const count = Number(formData.get("count") ?? 10);
  const res = await createTest({ mode, count, pool: ["unused"] });
  if (res.error) {
    const retry = await createTest({ mode, count, pool: ["all"] });
    if (retry.id) redirect(`/test/${retry.id}`);
    redirect(`/qbank?error=${encodeURIComponent(res.error)}`);
  }
  redirect(`/test/${res.id}`);
}

export async function createTestFromIds(ids: string[], name: string, mode: "tutor" | "timed" = "tutor"): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_test_from_ids", {
    p_ids: ids.slice(0, 40),
    p_kind: "custom",
    p_mode: mode,
    p_name: name,
    p_meta: {},
    p_seconds_per_question: 90,
  });
  if (error) return { error: error.message };
  return { id: data as string };
}

export async function startArgoSession(formData: FormData) {
  const size = Math.max(5, Math.min(40, Number(formData.get("size") ?? 20)));
  const mode = (formData.get("mode") as "tutor" | "timed") ?? "tutor";
  const profile = await getProfile();
  if (!planAllows(effectivePlan(profile), "argo")) redirect("/pricing?from=argo");

  const supabase = await createClient();
  const [candidates, concepts, ability, confusion, taxonomy] = await Promise.all([
    supabase.rpc("argo_candidates"),
    supabase.from("user_concepts").select("dim, ref_id, delta, n, n_correct, streak, half_life, misconceptions, last_seen_at, last_correct_at"),
    supabase.from("user_ability").select("theta").maybeSingle(),
    supabase.rpc("argo_confusion_candidates", { p_limit: 60 }),
    getTaxonomy(),
  ]);
  const plan = planSession({
    candidates: (candidates.data ?? []) as Candidate[],
    concepts: (concepts.data ?? []) as ConceptRow[],
    theta: ability.data?.theta ?? 0,
    taxonomy,
    confusionIds: ((confusion.data ?? []) as { question_id: string }[]).map((r) => r.question_id),
    size,
    exam: profile?.target_exam ?? null,
  });
  if (!plan.items.length) redirect("/argo?error=bank");

  const { data: testId, error } = await supabase.rpc("create_test_from_ids", {
    p_ids: plan.items.map((i) => i.questionId),
    p_kind: "argo",
    p_mode: mode,
    p_name: `ARGO session · ${plan.targets[0]?.name ?? "calibration"}`,
    p_meta: { mix: plan.mix, targets: plan.targets.slice(0, 4).map((t) => t.name) },
    p_seconds_per_question: 90,
  });
  if (error) redirect(`/argo?error=${encodeURIComponent(error.message)}`);
  await supabase.rpc("argo_record_session", {
    p_test: testId,
    p_plan: { items: plan.items, targets: plan.targets, mix: plan.mix, shortfall: plan.shortfall },
    p_baseline: { theta: ability.data?.theta ?? 0, targets: plan.targets.map((t) => ({ name: t.name, mastery: t.mastery })) },
  });
  redirect(`/test/${testId}`);
}

export async function deleteTest(id: string) {
  const supabase = await createClient();
  await supabase.from("tests").delete().eq("id", id);
}
