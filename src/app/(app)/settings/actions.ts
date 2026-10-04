"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Not signed in" };
  const admin = createAdminClient();
  // Stop any renewing add-on before the account (and its subscription rows) disappear.
  const stripe = getStripe();
  if (stripe) {
    const { data: subs } = await admin.from("subscriptions").select("id").eq("user_id", auth.user.id).in("status", ["active", "trialing", "past_due"]);
    for (const s of subs ?? []) {
      try {
        await stripe.subscriptions.cancel(s.id);
      } catch {
        return { error: "Could not cancel your question-writing subscription. Cancel it in Plan and billing, then try again." };
      }
    }
  }
  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) return { error: error.message };
  await supabase.auth.signOut();
  return {};
}
