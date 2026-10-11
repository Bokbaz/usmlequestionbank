"use client";

import { useEffect, useState } from "react";
import { PricingTable } from "@/components/marketing/pricing-table";
import type { PlanTier } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";

// The public pricing page is prerendered for everyone (so crawlers get it from the CDN). Signed-in
// visitors then see their own plan on the buttons once the browser has checked their session.
export function PricingTableLive() {
  const [plan, setPlan] = useState<PlanTier | undefined>(undefined);
  const [writer, setWriter] = useState(false);

  useEffect(() => {
    const sb = createClient();
    let alive = true;
    (async () => {
      const { data } = await sb.auth.getSession();
      const user = data.session?.user;
      if (!user) return;
      const [{ data: profile }, { data: addon }] = await Promise.all([
        sb.from("profiles").select("plan, plan_expires_at, role").eq("id", user.id).single(),
        sb.rpc("writer_addon_active"),
      ]);
      if (!alive || !profile) return;
      // Mirrors effectivePlan() in lib/auth.ts (server-only).
      const expired = profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date();
      setPlan(profile.role === "admin" ? "argo" : expired ? "free" : (profile.plan as PlanTier));
      setWriter(Boolean(addon));
    })();
    return () => {
      alive = false;
    };
  }, []);

  return <PricingTable currentPlan={plan} hasWriter={writer} />;
}
