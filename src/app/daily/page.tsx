import type { Metadata } from "next";
import { DailyGame } from "@/components/daily/daily-game";
import { createPublicClient } from "@/lib/supabase/public";
import type { DailyState } from "@/lib/daily/types";

export const metadata: Metadata = {
  title: "Daily Challenge",
  description: "One ultra-hard USMLE Step 1 question every day. Two minutes on the clock. A global leaderboard.",
};

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const { data } = await createPublicClient().rpc("daily_today", { p_guest: null });
  return <DailyGame initial={(data as DailyState) ?? null} />;
}
