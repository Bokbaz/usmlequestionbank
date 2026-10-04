import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Question-writing add-on entitlement: an active, trialing or past-due 'writer' subscription
// whose period has not ended more than two days ago.
export async function writerAddonActive(sb: SupabaseClient, userId: string) {
  const since = new Date(Date.now() - 2 * 86_400_000).toISOString();
  const { data } = await sb
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("price_key", "writer")
    .in("status", ["active", "trialing", "past_due"])
    .gt("current_period_end", since)
    .limit(1);
  return Boolean(data?.length);
}

export async function writerSubscription(sb: SupabaseClient, userId: string) {
  const { data } = await sb
    .from("subscriptions")
    .select("id, status, current_period_end, cancel_at_period_end")
    .eq("user_id", userId)
    .eq("price_key", "writer")
    .order("updated_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}
