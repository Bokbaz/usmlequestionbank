// ARGO session planner. Chooses the next block of questions from the student's model:
//   - weakness targets: unseen questions on the highest-priority weak concepts, chosen
//     near 70% predicted success (desirable difficulty: hard enough to teach, not crush)
//   - confusion drills: questions that pit the concepts the student mixes up
//   - spaced retests: previously missed questions whose memory is due
//   - coverage scouts: untested, high-weight systems so new weaknesses surface early
// The order is interleaved so consecutive questions rarely share a topic.

import { predictedCorrect, SYSTEM_WEIGHT } from "./model";
import { rankConcepts, type ConceptRow, type Taxonomy, type Weakness } from "./insights";

export type Candidate = {
  question_id: string;
  system_id: number;
  discipline_id: number | null;
  competency_id: number | null;
  topic_id: number | null;
  is_nugget: boolean;
  exam: "step1" | "step2ck" | "step3";
  difficulty_b: number;
  source: string;
  seen: number;
  last_correct: boolean | null;
  last_seen_at: string | null;
};

export type PlannedItem = { questionId: string; reason: "weakness" | "confusion" | "retest" | "scout" | "fill"; target?: string };

export type SessionPlan = {
  items: PlannedItem[];
  targets: { name: string; context?: string; mastery: number; reasons: string[]; dim: string; refId: number }[];
  mix: Record<PlannedItem["reason"], number>;
  shortfall: { name: string; dim: string; refId: number; available: number }[];
  bankExhausted: boolean;
};

const DAY = 86_400_000;

export function planSession(opts: {
  candidates: Candidate[];
  concepts: ConceptRow[];
  theta: number;
  taxonomy: Taxonomy;
  confusionIds: string[];
  size?: number;
  exam?: Candidate["exam"] | null;
  now?: number;
}): SessionPlan {
  const { candidates, concepts, theta, taxonomy, confusionIds, size = 20, exam, now = Date.now() } = opts;
  const pool = exam ? candidates.filter((c) => c.exam === exam) : candidates;
  const conceptDelta = new Map(concepts.map((c) => [`${c.dim}:${c.ref_id}`, c.delta]));
  const deltaFor = (c: Candidate) => {
    const ds = [`system:${c.system_id}`, `discipline:${c.discipline_id}`, `competency:${c.competency_id}`, `topic:${c.topic_id}`]
      .map((k) => conceptDelta.get(k))
      .filter((d): d is number => d != null);
    return ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : 0;
  };
  const learningValue = (c: Candidate) => {
    const p = predictedCorrect(theta, deltaFor(c), c.difficulty_b);
    return 1 - Math.min(1, Math.abs(p - 0.7) / 0.7);
  };

  const ranked: Weakness[] = rankConcepts({ concepts, theta, taxonomy }, now).filter((w) => w.dim !== "competency" && w.dim !== "nugget");
  const targets = ranked.filter((w) => w.mastery < 0.8).slice(0, 6);

  const chosen = new Set<string>();
  const items: PlannedItem[] = [];
  const perTopic = new Map<number, number>();
  const take = (c: Candidate, reason: PlannedItem["reason"], target?: string) => {
    if (chosen.has(c.question_id) || items.length >= size) return false;
    if (c.topic_id != null && (perTopic.get(c.topic_id) ?? 0) >= 3) return false;
    chosen.add(c.question_id);
    if (c.topic_id != null) perTopic.set(c.topic_id, (perTopic.get(c.topic_id) ?? 0) + 1);
    items.push({ questionId: c.question_id, reason, target });
    return true;
  };

  const matches = (c: Candidate, t: Weakness) =>
    (t.dim === "topic" && c.topic_id === t.refId) ||
    (t.dim === "system" && c.system_id === t.refId) ||
    (t.dim === "discipline" && c.discipline_id === t.refId);

  const quota = {
    weakness: Math.round(size * 0.45),
    confusion: Math.round(size * 0.2),
    retest: Math.round(size * 0.2),
  };

  // 1. Weakness targets
  const shortfall: SessionPlan["shortfall"] = [];
  if (targets.length) {
    const unseen = pool.filter((c) => c.seen === 0);
    const scoredUnseen = unseen
      .map((c) => {
        const best = targets.find((t) => matches(c, t));
        return { c, t: best, score: best ? best.priority * learningValue(c) * (c.is_nugget ? 1.2 : 1) : 0 };
      })
      .filter((x) => x.t)
      .sort((a, b) => b.score - a.score);
    let n = 0;
    for (const x of scoredUnseen) {
      if (n >= quota.weakness) break;
      if (take(x.c, "weakness", x.t!.name)) n++;
    }
    for (const t of targets) {
      const available = unseen.filter((c) => matches(c, t)).length;
      if (available < 3) shortfall.push({ name: t.name, dim: t.dim, refId: t.refId, available });
    }
  }

  // 2. Confusion drills
  const confusionSet = new Set(confusionIds);
  const confusion = pool
    .filter((c) => confusionSet.has(c.question_id))
    .sort((a, b) => Number(a.seen > 0) - Number(b.seen > 0) || learningValue(b) - learningValue(a));
  let nConf = 0;
  for (const c of confusion) {
    if (nConf >= quota.confusion) break;
    if (take(c, "confusion")) nConf++;
  }

  // 3. Spaced retests: missed before, at least a day ago, oldest first.
  const retests = pool
    .filter((c) => c.seen > 0 && c.last_correct === false && c.last_seen_at && now - new Date(c.last_seen_at).getTime() > DAY)
    .sort((a, b) => new Date(a.last_seen_at!).getTime() - new Date(b.last_seen_at!).getTime());
  let nRe = 0;
  for (const c of retests) {
    if (nRe >= quota.retest) break;
    if (take(c, "retest")) nRe++;
  }

  // 4. Coverage scouts: untested systems by blueprint weight.
  const testedSystems = new Set(concepts.filter((c) => c.dim === "system" && c.n > 0).map((c) => c.ref_id));
  const scouts = pool
    .filter((c) => c.seen === 0 && !testedSystems.has(c.system_id))
    .sort((a, b) => {
      const wa = SYSTEM_WEIGHT[taxonomy.systems.find((s) => s.id === a.system_id)?.slug ?? ""] ?? 5;
      const wb = SYSTEM_WEIGHT[taxonomy.systems.find((s) => s.id === b.system_id)?.slug ?? ""] ?? 5;
      return wb - wa || learningValue(b) - learningValue(a);
    });
  const usedScoutSystems = new Set<number>();
  for (const c of scouts) {
    if (items.length >= size) break;
    if (usedScoutSystems.has(c.system_id)) continue;
    if (take(c, "scout")) usedScoutSystems.add(c.system_id);
  }

  // 5. Fill: best remaining unseen, then any remaining missed questions.
  const rest = pool
    .filter((c) => !chosen.has(c.question_id) && c.seen === 0)
    .sort((a, b) => learningValue(b) - learningValue(a));
  for (const c of rest) take(c, "fill");
  const restSeen = pool.filter((c) => !chosen.has(c.question_id) && c.last_correct === false);
  for (const c of restSeen) take(c, "retest");

  // Interleave so the same topic rarely appears back to back.
  const byId = new Map(pool.map((c) => [c.question_id, c]));
  const ordered: PlannedItem[] = [];
  const remaining = [...items];
  while (remaining.length) {
    const prevTopic = ordered.length ? byId.get(ordered[ordered.length - 1].questionId)?.topic_id : null;
    const idx = remaining.findIndex((it) => byId.get(it.questionId)?.topic_id !== prevTopic);
    ordered.push(...remaining.splice(idx === -1 ? 0 : idx, 1));
  }

  const mix = { weakness: 0, confusion: 0, retest: 0, scout: 0, fill: 0 };
  for (const it of ordered) mix[it.reason]++;

  return {
    items: ordered,
    targets: targets.map((t) => ({ name: t.name, context: t.context, mastery: t.mastery, reasons: t.reasons, dim: t.dim, refId: t.refId })),
    mix,
    shortfall,
    bankExhausted: ordered.length < Math.min(size, 5),
  };
}
