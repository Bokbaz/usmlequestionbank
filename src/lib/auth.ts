import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { planAllows, type PlanTier } from "@/lib/plans";

export type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  country: string | null;
  target_exam: "step1" | "step2ck" | "step3";
  exam_date: string | null;
  school_id: number | null;
  school_name: string | null;
  role: "user" | "admin";
  plan: PlanTier;
  plan_expires_at: string | null;
  stripe_customer_id: string | null;
  daily_streak: number;
  daily_best_streak: number;
  settings: Record<string, unknown>;
  onboarded: boolean;
  created_at: string;
};

export type SessionUser = { id: string; email: string | null };

// Verifies the session JWT locally against the project's published signing keys (ES256), so a
// page render no longer waits on a round trip to Supabase Auth.
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
});

export function effectivePlan(profile: Profile | null): PlanTier {
  if (!profile) return "free";
  if (profile.role === "admin") return "argo";
  if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) return "free";
  return profile.plan;
}

export async function requireUser(next = "/dashboard") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const profile = await getProfile();
  return { user, profile: profile! };
}

export async function requireAdmin() {
  const { user, profile } = await requireUser("/admin");
  if (profile?.role !== "admin") redirect("/dashboard");
  return { user, profile };
}

export async function hasPlan(min: PlanTier) {
  return planAllows(effectivePlan(await getProfile()), min);
}

// Route handlers: returns the session client when the caller is an admin, else null.
export async function getAdminClient() {
  const user = await getUser();
  if (!user) return null;
  const profile = await getProfile();
  if (profile?.role !== "admin") return null;
  return { supabase: await createClient(), user };
}
