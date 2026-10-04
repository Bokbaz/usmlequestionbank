import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Plus } from "lucide-react";
import { ArgoMark } from "@/components/brand/logo";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingTable } from "@/components/marketing/pricing-table";
import { effectivePlan, requireUser } from "@/lib/auth";
import { writerSubscription } from "@/lib/billing";
import { OFFERS, formatUsd, planAllows } from "@/lib/plans";
import { stripeConfigured } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Plan and billing" };

const NOTICES: Record<string, { tone: "good" | "info"; text: string }> = {
  "success=access": { tone: "good", text: "Payment received. Full access unlocks within a few seconds." },
  "success=writer": { tone: "good", text: "ARGO question writing is on. It activates within a few seconds." },
  "owned=access": { tone: "info", text: "You already have Full access." },
  "owned=writer": { tone: "info", text: "Question writing is already active on your account." },
  "error=needs_access": { tone: "info", text: "Question writing is an add-on to Full access. Unlock Full access first." },
  "error=stripe_not_configured": { tone: "info", text: "Online payments are not switched on yet. Please check back soon." },
};

const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

export default async function BillingPage({ searchParams }: PageProps<"/settings/billing">) {
  const { user, profile } = await requireUser("/settings/billing");
  const sp = await searchParams;
  const plan = effectivePlan(profile);
  const unlocked = planAllows(plan, "argo");
  const supabase = await createClient();
  const [{ data: purchases }, sub] = await Promise.all([
    supabase.from("purchases").select("id, amount, currency, status, created_at").order("created_at", { ascending: false }),
    writerSubscription(supabase, user.id),
  ]);
  const paid = purchases?.find((p) => p.status === "paid");
  const writerLive = Boolean(sub && ["active", "trialing", "past_due"].includes(sub.status) && sub.current_period_end && new Date(sub.current_period_end) > new Date());
  const notice = Object.entries(NOTICES).find(([k]) => {
    const [key, value] = k.split("=");
    return sp[key] === value;
  })?.[1];

  return (
    <>
      <PageHeader title="Plan and billing" description={<Link href="/settings" className="font-semibold text-brand hover:underline">Back to settings</Link>} />
      {notice && (
        <p className={`mb-6 flex items-center gap-2 rounded-[8px] px-4 py-3 text-[14.5px] font-semibold ${notice.tone === "good" ? "bg-correct-soft text-correct" : "bg-panel text-text"}`}>
          {notice.tone === "good" && <CheckCircle2 className="size-5" />} {notice.text}
        </p>
      )}

      <div className="mb-8 divide-y divide-border rounded-[10px] border border-border bg-surface">
        <section className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[13px] text-muted">
              <ArgoMark className="size-3.5 text-brand" /> {OFFERS.access.name}
            </p>
            <p className="mt-1 text-[20px] font-[750]">{profile.role === "admin" ? "Admin: everything unlocked" : unlocked ? "Unlocked" : plan === "core" ? "QBank only" : "Not unlocked"}</p>
            <p className="mt-1 text-[13.5px] text-muted">
              {unlocked
                ? paid
                  ? `Paid ${formatUsd(paid.amount / 100)} on ${fmt(paid.created_at)}. One payment, no renewals.`
                  : "Granted to your account. No renewals."
                : `${formatUsd(OFFERS.access.amountUsd)} once for every question, the Library and ARGO analytics.`}
            </p>
          </div>
          {!unlocked && (
            <Button asChild>
              <a href="/api/stripe/checkout?offer=access">Unlock for {formatUsd(OFFERS.access.amountUsd)}</a>
            </Button>
          )}
        </section>

        <section className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[13px] text-muted">
              <Plus className="size-3.5 text-brand" strokeWidth={2.5} /> {OFFERS.writer.name}
            </p>
            <p className="mt-1 flex items-center gap-2 text-[20px] font-[750]">
              {profile.role === "admin" ? "Included for admins" : writerLive ? "Active" : "Off"}
              {sub && writerLive && sub.status !== "active" && <Badge tone="warning">{sub.status.replace("_", " ")}</Badge>}
            </p>
            <p className="mt-1 text-[13.5px] text-muted">
              {writerLive && sub?.current_period_end
                ? `${sub.cancel_at_period_end ? "Ends" : "Renews"} ${fmt(sub.current_period_end)} at ${formatUsd(OFFERS.writer.amountUsd)} a month.`
                : `${formatUsd(OFFERS.writer.amountUsd)} a month. ${OFFERS.writer.tagline}`}
            </p>
          </div>
          {profile.role !== "admin" &&
            (writerLive ? (
              profile.stripe_customer_id &&
              stripeConfigured() && (
                <form action="/api/stripe/portal" method="post">
                  <Button type="submit" variant="secondary">
                    Manage or cancel
                  </Button>
                </form>
              )
            ) : unlocked ? (
              <Button asChild variant="secondary">
                <a href="/api/stripe/checkout?offer=writer">Add for {formatUsd(OFFERS.writer.amountUsd)} a month</a>
              </Button>
            ) : (
              <span className="text-[13.5px] text-muted">Requires Full access</span>
            ))}
        </section>
      </div>

      {!unlocked && <PricingTable currentPlan={plan} hasWriter={writerLive} />}
    </>
  );
}
