import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Paid product license. Subscription status alone never grants access to unpaid periods.
export async function writerAddonActive(sb: SupabaseClient, userId: string) {
  const { data, error } = await sb
    .from("billing_licenses")
    .select("source_id")
    .eq("user_id", userId)
    .eq("entitlement", "argo_generator")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .limit(1);
  if (error) throw error;
  return Boolean(data?.length);
}

export async function writerSubscription(sb: SupabaseClient, userId: string) {
  const { data } = await sb
    .from("subscriptions")
    .select("id, status, current_period_end, cancel_at_period_end, unit_amount, currency")
    .eq("user_id", userId)
    .eq("price_key", "writer")
    .order("updated_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}
