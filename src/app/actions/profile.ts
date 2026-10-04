"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileInput = {
  display_name?: string;
  username?: string;
  country?: string | null;
  target_exam?: "step1" | "step2ck" | "step3";
  exam_date?: string | null;
  onboarded?: boolean;
  settings?: Record<string, unknown>;
};

export async function updateProfile(input: ProfileInput): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Not signed in" };
  const patch: Record<string, unknown> = {};
  if (input.display_name !== undefined) {
    const n = input.display_name.trim();
    if (n.length < 2 || n.length > 40) return { error: "Name must be 2 to 40 characters." };
    patch.display_name = n;
  }
  if (input.username !== undefined) {
    const u = input.username.trim();
    if (!/^[A-Za-z0-9_.-]{3,24}$/.test(u)) return { error: "Handle must be 3 to 24 letters, numbers, dots, dashes or underscores." };
    patch.username = u;
  }
  if (input.country !== undefined) patch.country = input.country ? input.country.toUpperCase().slice(0, 2) : null;
  if (input.target_exam !== undefined) patch.target_exam = input.target_exam;
  if (input.exam_date !== undefined) patch.exam_date = input.exam_date || null;
  if (input.onboarded !== undefined) patch.onboarded = input.onboarded;
  if (input.settings !== undefined) {
    const { data: current } = await supabase.from("profiles").select("settings").eq("id", auth.user.id).single();
    patch.settings = { ...(current?.settings ?? {}), ...input.settings };
  }
  const { error } = await supabase.from("profiles").update(patch).eq("id", auth.user.id);
  if (error) {
    if (error.code === "23505") return { error: "That handle is taken. Try another." };
    return { error: error.message };
  }
  revalidatePath("/", "layout");
  return {};
}
