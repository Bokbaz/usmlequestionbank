import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingTable } from "@/components/marketing/pricing-table";
import { effectivePlan, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/plans";
import { stripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = { title: "Plan and billing" };

export default async function BillingPage({ searchParams }: PageProps<"/settings/billing">) {
  const { profile } = await requireUser("/settings/billing");
  const sp = await searchParams;
  const plan = effectivePlan(profile);
  const supabase = await createClient();
  const { data: subs } = await supabase.from("subscriptions").select("id, status, plan, current_period_end, cancel_at_period_end").order("updated_at", { ascending: false }).limit(1);
  const sub = subs?.[0];
  return (
    <>
      <PageHeader title="Plan and billing" description={<Link href="/settings" className="font-semibold text-brand hover:underline">Back to settings</Link>} />
      {sp.success && (
        <p className="mb-6 flex items-center gap-2 rounded-[8px] bg-correct-soft px-4 py-3 text-[14.5px] font-semibold text-correct">
          <CheckCircle2 className="size-5" /> Payment received. Your plan updates within a few seconds.
        </p>
      )}
      {sp.error === "stripe_not_configured" && (
        <p className="mb-6 rounded-[8px] bg-warning-soft px-4 py-3 text-[14.5px] text-text">
          Online payments are not switched on yet. Please check back soon.
        </p>
      )}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-border bg-surface p-6">
        <div>
          <p className="text-[13px] text-muted">Current plan</p>
          <p className="mt-1 flex items-center gap-2 text-[22px] font-[750]">
            {profile.role === "admin" ? "Admin (full access)" : PLANS[plan].name}
            {sub && <Badge tone={sub.status === "active" || sub.status === "trialing" ? "correct" : "warning"}>{sub.status}</Badge>}
          </p>
          {sub?.current_period_end && (
            <p className="mt-1 text-[13.5px] text-muted">
              {sub.cancel_at_period_end ? "Ends" : "Renews"} {new Date(sub.current_period_end).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
        {profile.stripe_customer_id && stripeConfigured() && (
          <form action="/api/stripe/portal" method="post">
            <Button type="submit" variant="secondary">
              Manage billing
            </Button>
          </form>
        )}
      </div>
      {plan !== "argo" && <PricingTable currentPlan={plan} />}
    </>
  );
}
