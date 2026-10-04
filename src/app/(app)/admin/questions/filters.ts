import type { SupabaseClient } from "@supabase/supabase-js";

export type QuestionFilters = { q?: string; system?: string; status?: string; source?: string; nuggets?: string };

// Shared by the admin question list and the AQF export so both see the same set.
export function applyQuestionFilters<T>(query: T, f: QuestionFilters): T {
  // PostgREST builder methods are chainable; typed loosely to share across selects.
  let b = query as unknown as ReturnType<ReturnType<SupabaseClient["from"]>["select"]>;
  const q = f.q?.trim();
  if (q) b = /^AQ-\d+$/i.test(q) ? b.eq("code", q.toUpperCase()) : b.textSearch("search", q, { type: "websearch", config: "english" });
  if (f.system) b = b.eq("system_id", Number(f.system));
  if (f.status === "published" || f.status === "draft" || f.status === "retired") b = b.eq("status", f.status);
  if (f.source === "argo") b = b.eq("source", "argo");
  else {
    b = b.is("owner_id", null);
    if (f.source === "import" || f.source === "seed" || f.source === "admin") b = b.eq("source", f.source);
  }
  if (f.nuggets === "1") b = b.eq("is_nugget", true);
  return b as unknown as T;
}
