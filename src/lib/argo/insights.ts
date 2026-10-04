// ARGO insights: turns the raw attempt log and model state into the analytics the
// dashboards show. Pure functions so they can run anywhere and be unit-tested.

import { effectiveMastery, ERROR_META, evidence, recall, strength, SYSTEM_WEIGHT, type ErrorType } from "./model";

export type AttemptRow = {
  question_id: string;
  is_correct: boolean;
  omitted: boolean;
  time_ms: number;
  position: number | null;
  block_size: number | null;
  change_pattern: "none" | "c2i" | "i2c" | "i2i" | null;
  confidence: number | null;
  error_type: ErrorType | null;
  system_id: number | null;
  discipline_id: number | null;
  competency_id: number | null;
  topic_id: number | null;
  kind: "custom" | "argo" | "daily" | "review";
  is_first_attempt: boolean;
  created_at: string;
};

export type ConceptRow = {
  dim: "system" | "discipline" | "competency" | "topic" | "nugget";
  ref_id: number;
  delta: number;
  n: number;
  n_correct: number;
  streak: number;
  half_life: number;
  misconceptions: number;
  last_seen_at: string | null;
  last_correct_at: string | null;
};

export type Taxonomy = {
  systems: { id: number; slug: string; short_name: string; sort: number }[];
  disciplines: { id: number; slug: string; name: string; kind: string; sort: number }[];
  competencies: { id: number; slug: string; name: string; group_name: string; sort: number }[];
  topics: { id: number; name: string; slug: string; system_id: number }[];
};

export type ArgoInputs = {
  attempts: AttemptRow[];
  concepts: ConceptRow[];
  theta: number;
  confusions: { correct_concept: string; chosen_concept: string; n: number; last_at: string }[];
  snapshots: { day: string; theta: number; readiness: number | null; accuracy: number | null; n_attempts: number }[];
  taxonomy: Taxonomy;
  overview: { percentile: number | null; peer_accuracy: number | null; peer_count: number } | null;
  nuggetNames?: Map<number, string>;
};

export type Weakness = {
  dim: ConceptRow["dim"];
  refId: number;
  name: string;
  context?: string;
  mastery: number;
  n: number;
  accuracy: number | null;
  priority: number;
  reasons: string[];
  recall: number;
};

const dayKey = (iso: string) => iso.slice(0, 10);
const pct = (num: number, den: number) => (den > 0 ? (100 * num) / den : null);

function conceptName(c: { dim: ConceptRow["dim"]; ref_id: number }, tx: Taxonomy, nuggets?: Map<number, string>) {
  switch (c.dim) {
    case "system":
      return { name: tx.systems.find((s) => s.id === c.ref_id)?.short_name ?? "System", context: "System" };
    case "discipline":
      return { name: tx.disciplines.find((d) => d.id === c.ref_id)?.name ?? "Discipline", context: "Discipline" };
    case "competency":
      return { name: tx.competencies.find((d) => d.id === c.ref_id)?.name ?? "Task", context: "Physician task" };
    case "topic": {
      const t = tx.topics.find((d) => d.id === c.ref_id);
      const sys = t ? tx.systems.find((s) => s.id === t.system_id)?.short_name : undefined;
      return { name: t?.name ?? "Topic", context: sys ? `Topic · ${sys}` : "Topic" };
    }
    case "nugget":
      return { name: nuggets?.get(c.ref_id) ?? "Nugget", context: "Nugget" };
  }
}

function conceptWeight(c: ConceptRow, tx: Taxonomy) {
  if (c.dim === "system") {
    const slug = tx.systems.find((s) => s.id === c.ref_id)?.slug ?? "";
    return (SYSTEM_WEIGHT[slug] ?? 5) / 7;
  }
  if (c.dim === "topic") {
    const t = tx.topics.find((d) => d.id === c.ref_id);
    const slug = tx.systems.find((s) => s.id === t?.system_id)?.slug ?? "";
    return (SYSTEM_WEIGHT[slug] ?? 5) / 7;
  }
  if (c.dim === "nugget") return 1.3;
  return 1;
}

export function rankConcepts(inp: Pick<ArgoInputs, "concepts" | "theta" | "taxonomy" | "nuggetNames">, now = Date.now()): Weakness[] {
  return inp.concepts
    .filter((c) => c.n > 0)
    .map((c) => {
      const s = strength(inp.theta, c.delta);
      const r = recall(c.half_life, c.last_seen_at, now);
      const m = effectiveMastery(s, r);
      const e = evidence(c.n);
      const priority = (1 - m) * conceptWeight(c, inp.taxonomy) * (0.4 + 0.6 * e) * (1 + 0.15 * c.misconceptions);
      const reasons: string[] = [];
      const acc = pct(c.n_correct, c.n);
      reasons.push(`${Math.round(m * 100)}% mastery after ${c.n} ${c.n === 1 ? "question" : "questions"}`);
      if (c.misconceptions > 0) reasons.push(`${c.misconceptions} confident ${c.misconceptions === 1 ? "miss" : "misses"}`);
      if (c.last_correct_at && r < 0.55) {
        const days = Math.round((now - new Date(c.last_correct_at).getTime()) / 86_400_000);
        reasons.push(`last correct ${days} ${days === 1 ? "day" : "days"} ago, memory fading`);
      }
      if (c.streak >= 3) reasons.push(`${c.streak} correct in a row`);
      const { name, context } = conceptName(c, inp.taxonomy, inp.nuggetNames);
      return { dim: c.dim, refId: c.ref_id, name, context, mastery: m, n: c.n, accuracy: acc, priority, reasons, recall: r };
    })
    .sort((a, b) => b.priority - a.priority);
}

export function computeInsights(inp: ArgoInputs, now = Date.now()) {
  const { attempts, taxonomy: tx } = inp;
  const scored = attempts.filter((a) => a.kind !== "daily");
  const first = scored.filter((a) => a.is_first_attempt);
  const answered = first.filter((a) => !a.omitted);
  const correct = first.filter((a) => a.is_correct).length;

  // Mastery by system (all 19, untested shown as unknown).
  const conceptByKey = new Map(inp.concepts.map((c) => [`${c.dim}:${c.ref_id}`, c]));
  const systems = [...tx.systems]
    .sort((a, b) => a.sort - b.sort)
    .map((s) => {
      const c = conceptByKey.get(`system:${s.id}`);
      const rows = first.filter((a) => a.system_id === s.id);
      const m = c ? effectiveMastery(strength(inp.theta, c.delta), recall(c.half_life, c.last_seen_at, now)) : null;
      return {
        id: s.id,
        slug: s.slug,
        name: s.short_name,
        n: rows.length,
        accuracy: pct(rows.filter((r) => r.is_correct).length, rows.length),
        mastery: m,
        evidence: c ? evidence(c.n) : 0,
        weight: SYSTEM_WEIGHT[s.slug] ?? 5,
      };
    });

  // Readiness: blueprint-weighted mastery; untested systems count as 35%.
  const totalW = systems.reduce((sum, s) => sum + s.weight, 0);
  const readiness =
    (100 *
      systems.reduce((sum, s) => {
        const ev = s.evidence;
        const m = s.mastery ?? 0.35;
        return sum + s.weight * (ev * m + (1 - ev) * 0.35);
      }, 0)) /
    totalW;

  const ranked = rankConcepts(inp, now);
  const weaknesses = ranked.filter((w) => w.dim !== "competency").slice(0, 8);
  const strengths = [...ranked].filter((w) => w.n >= 3).sort((a, b) => b.mastery - a.mastery).slice(0, 5);

  // System x discipline heatmap of first-attempt accuracy.
  const cellMap = new Map<string, { n: number; c: number }>();
  for (const a of first) {
    if (!a.system_id || !a.discipline_id) continue;
    const k = `${a.system_id}:${a.discipline_id}`;
    const v = cellMap.get(k) ?? { n: 0, c: 0 };
    v.n++;
    if (a.is_correct) v.c++;
    cellMap.set(k, v);
  }
  const heatRows = systems.filter((s) => s.n > 0);
  const heatCols = [...tx.disciplines]
    .sort((a, b) => a.sort - b.sort)
    .filter((d) => first.some((a) => a.discipline_id === d.id));
  const heatmap = {
    rows: heatRows.map((s) => ({ id: s.id, name: s.name })),
    cols: heatCols.map((d) => ({ id: d.id, name: d.name })),
    cells: [...cellMap.entries()].map(([k, v]) => {
      const [sys, disc] = k.split(":").map(Number);
      return { system: sys, discipline: disc, n: v.n, accuracy: (100 * v.c) / v.n };
    }),
  };

  // Error taxonomy over wrong answers.
  const wrong = scored.filter((a) => !a.is_correct);
  const errorCounts = new Map<ErrorType, number>();
  for (const a of wrong) {
    const t = (a.error_type ?? "gap") as ErrorType;
    errorCounts.set(t, (errorCounts.get(t) ?? 0) + 1);
  }
  const errors = (Object.keys(ERROR_META) as ErrorType[])
    .filter((t) => t !== "lucky_guess")
    .map((t) => ({ type: t, label: ERROR_META[t].label, count: errorCounts.get(t) ?? 0, pct: pct(errorCounts.get(t) ?? 0, wrong.length) ?? 0 }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count);
  const luckyGuesses = scored.filter((a) => a.error_type === "lucky_guess").length;

  // Weekly error trend (last 8 weeks), as share of answers in that week.
  const weekStart = (d: Date) => {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
    return x.toISOString().slice(0, 10);
  };
  const weeks = new Map<string, { total: number; byType: Partial<Record<ErrorType, number>> }>();
  for (const a of scored) {
    const w = weekStart(new Date(a.created_at));
    const v = weeks.get(w) ?? { total: 0, byType: {} };
    v.total++;
    if (!a.is_correct) {
      const t = (a.error_type ?? "gap") as ErrorType;
      v.byType[t] = (v.byType[t] ?? 0) + 1;
    }
    weeks.set(w, v);
  }
  const errorTrend = [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, v]) => ({ week, total: v.total, byType: v.byType }));

  // Confidence calibration.
  const calibration = [1, 2, 3].map((level) => {
    const rows = scored.filter((a) => a.confidence === level && !a.omitted);
    return { level, label: level === 3 ? "Sure" : level === 2 ? "Think so" : "Guessing", n: rows.length, accuracy: pct(rows.filter((r) => r.is_correct).length, rows.length) };
  });

  // Pacing.
  const bins = [
    { lo: 0, hi: 30, label: "<30s" },
    { lo: 30, hi: 60, label: "30–60s" },
    { lo: 60, hi: 90, label: "60–90s" },
    { lo: 90, hi: 120, label: "90–120s" },
    { lo: 120, hi: 180, label: "2–3m" },
    { lo: 180, hi: Infinity, label: ">3m" },
  ];
  const timed = scored.filter((a) => !a.omitted && a.time_ms > 0);
  const pacing = bins.map((b) => {
    const rows = timed.filter((a) => a.time_ms / 1000 >= b.lo && a.time_ms / 1000 < b.hi);
    return { label: b.label, n: rows.length, accuracy: pct(rows.filter((r) => r.is_correct).length, rows.length) };
  });
  const sortedTimes = timed.map((a) => a.time_ms / 1000).sort((a, b) => a - b);
  const medianTimeS = sortedTimes.length ? sortedTimes[Math.floor(sortedTimes.length / 2)] : null;
  const overTargetPct = pct(timed.filter((a) => a.time_ms > 90_000).length, timed.length);

  // Stamina: accuracy by position within blocks of 10+ questions.
  const blocks = scored.filter((a) => (a.block_size ?? 0) >= 10 && a.position != null && !a.omitted);
  const stamina = [
    { lo: 0, hi: 10, label: "Q1–10" },
    { lo: 10, hi: 20, label: "Q11–20" },
    { lo: 20, hi: 30, label: "Q21–30" },
    { lo: 30, hi: 40, label: "Q31–40" },
  ].map((b) => {
    const rows = blocks.filter((a) => (a.position ?? 0) >= b.lo && (a.position ?? 0) < b.hi);
    return { label: b.label, n: rows.length, accuracy: pct(rows.filter((r) => r.is_correct).length, rows.length) };
  });

  // Answer changes.
  const c2i = scored.filter((a) => a.change_pattern === "c2i").length;
  const i2c = scored.filter((a) => a.change_pattern === "i2c").length;
  const i2i = scored.filter((a) => a.change_pattern === "i2i").length;

  // Competencies (physician tasks / lead-in types).
  const competencies = [...tx.competencies]
    .sort((a, b) => a.sort - b.sort)
    .map((c) => {
      const rows = first.filter((a) => a.competency_id === c.id && !a.omitted);
      return { id: c.id, name: c.name, group: c.group_name, n: rows.length, accuracy: pct(rows.filter((r) => r.is_correct).length, rows.length) };
    })
    .filter((c) => c.n > 0);

  // Topics due for review: previously correct, memory now fading.
  const dueForReview = ranked
    .filter((w) => w.dim === "topic")
    .filter((w) => {
      const c = conceptByKey.get(`topic:${w.refId}`);
      return c && c.n_correct > 0 && w.recall < 0.55;
    })
    .sort((a, b) => a.recall - b.recall)
    .slice(0, 8);

  // Activity calendar (last 16 weeks) and current streak of study days.
  const perDay = new Map<string, number>();
  for (const a of attempts) perDay.set(dayKey(a.created_at), (perDay.get(dayKey(a.created_at)) ?? 0) + 1);
  const calendar: { day: string; n: number }[] = [];
  const today = new Date(now);
  for (let i = 111; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const k = d.toISOString().slice(0, 10);
    calendar.push({ day: k, n: perDay.get(k) ?? 0 });
  }
  let studyStreak = 0;
  for (let i = calendar.length - 1; i >= 0; i--) {
    if (calendar[i].n > 0) studyStreak++;
    else if (i === calendar.length - 1) continue;
    else break;
  }

  const nuggetConcepts = inp.concepts.filter((c) => c.dim === "nugget");
  const nuggets = {
    seen: nuggetConcepts.length,
    mastered: nuggetConcepts.filter((c) => effectiveMastery(strength(inp.theta, c.delta), recall(c.half_life, c.last_seen_at, now)) >= 0.75 && c.n_correct > 0).length,
  };

  return {
    totals: {
      attempts: scored.length,
      answered: answered.length,
      firstAttempts: first.length,
      correct,
      accuracy: pct(correct, first.length),
      avgTimeS: timed.length ? timed.reduce((s, a) => s + a.time_ms, 0) / timed.length / 1000 : null,
      omitted: first.filter((a) => a.omitted).length,
    },
    theta: inp.theta,
    readiness,
    percentile: inp.overview?.percentile ?? null,
    peerAccuracy: inp.overview?.peer_accuracy ?? null,
    peerCount: inp.overview?.peer_count ?? 0,
    weaknesses,
    strengths,
    systems,
    heatmap,
    errors,
    wrongCount: wrong.length,
    luckyGuesses,
    errorTrend,
    calibration,
    pacing,
    medianTimeS,
    overTargetPct,
    stamina,
    changes: { c2i, i2c, i2i, net: i2c - c2i },
    confusions: inp.confusions.slice(0, 8),
    dueForReview,
    calendar,
    studyStreak,
    competencies,
    trend: inp.snapshots.map((s) => ({ day: s.day, readiness: s.readiness, theta: s.theta, accuracy: s.accuracy })),
    nuggets,
  };
}

export type ArgoInsights = ReturnType<typeof computeInsights>;
