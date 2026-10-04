import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { computeInsights, type ArgoInputs, type AttemptRow, type ConceptRow, type Taxonomy } from "./insights";

export const getTaxonomy = cache(async (): Promise<Taxonomy> => {
  const sb = await createClient();
  const [systems, disciplines, competencies, topics] = await Promise.all([
    sb.from("systems").select("id, slug, short_name, sort").order("sort"),
    sb.from("disciplines").select("id, slug, name, kind, sort").order("sort"),
    sb.from("competencies").select("id, slug, name, group_name, sort").order("sort"),
    sb.from("topics").select("id, name, slug, system_id").order("name"),
  ]);
  return {
    systems: systems.data ?? [],
    disciplines: disciplines.data ?? [],
    competencies: competencies.data ?? [],
    topics: topics.data ?? [],
  };
});

export const getArgoInputs = cache(async (): Promise<ArgoInputs> => {
  const sb = await createClient();
  const [attempts, concepts, ability, confusions, snapshots, overview, nuggets, taxonomy] = await Promise.all([
    sb
      .from("attempts")
      .select(
        "question_id, is_correct, omitted, time_ms, position, block_size, change_pattern, confidence, error_type, system_id, discipline_id, competency_id, topic_id, kind, is_first_attempt, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(5000),
    sb.from("user_concepts").select("dim, ref_id, delta, n, n_correct, streak, half_life, misconceptions, last_seen_at, last_correct_at"),
    sb.from("user_ability").select("theta, n").maybeSingle(),
    sb.from("user_confusions").select("correct_concept, chosen_concept, n, last_at").order("n", { ascending: false }).limit(20),
    sb.from("argo_snapshots").select("day, theta, readiness, accuracy, n_attempts").order("day").limit(180),
    sb.rpc("performance_overview"),
    sb.rpc("my_nuggets"),
    getTaxonomy(),
  ]);
  return {
    attempts: (attempts.data ?? []) as AttemptRow[],
    concepts: (concepts.data ?? []) as ConceptRow[],
    theta: ability.data?.theta ?? 0,
    confusions: confusions.data ?? [],
    snapshots: snapshots.data ?? [],
    taxonomy,
    overview: (overview.data as ArgoInputs["overview"]) ?? null,
    nuggetNames: new Map(((nuggets.data ?? []) as { id: number; title: string }[]).map((n) => [n.id, n.title])),
  };
});

export const getInsights = cache(async () => computeInsights(await getArgoInputs()));
