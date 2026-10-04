import type { SupabaseClient } from "@supabase/supabase-js";

const KEY = "argonaut.dailyGuest";

// A random token lets visitors play the Daily Challenge before they have an account.
export function getGuestToken(): string {
  try {
    let t = localStorage.getItem(KEY);
    if (!t) {
      t = crypto.randomUUID();
      localStorage.setItem(KEY, t);
    }
    return t;
  } catch {
    return crypto.randomUUID();
  }
}

export function peekGuestToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

// After sign-in or sign-up, attach any guest Daily attempt to the account.
export async function claimGuestDaily(supabase: SupabaseClient): Promise<boolean> {
  const token = peekGuestToken();
  if (!token) return false;
  const { data } = await supabase.rpc("daily_claim", { p_guest: token });
  try {
    localStorage.removeItem(KEY);
  } catch {}
  return Boolean((data as { claimed?: number } | null)?.claimed);
}
