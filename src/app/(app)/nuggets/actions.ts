"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function quickNuggets() {
  const supabase = await createClient();
  const base = { p_mode: "tutor", p_count: 15, p_name: "Nugget practice", p_exam: null, p_systems: null, p_disciplines: null, p_competencies: null, p_topics: null, p_nuggets_only: true, p_seconds_per_question: 90 };
  let res = await supabase.rpc("create_test", { ...base, p_pool: ["unused", "incorrect"] });
  if (res.error) res = await supabase.rpc("create_test", { ...base, p_pool: ["all"] });
  if (res.error) redirect(`/qbank?error=${encodeURIComponent("No Nugget questions available on your plan yet.")}`);
  redirect(`/test/${res.data}`);
}
