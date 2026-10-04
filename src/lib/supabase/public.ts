import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cookie-less anonymous client for cacheable public data (marketing, leaderboards).
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
