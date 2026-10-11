import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { SettingsNav } from "@/components/billing/settings-nav";
import { SubscriptionControls } from "@/components/billing/subscription-controls";
import { effectivePlan, requireUser } from "@/lib/auth";
import { writerAddonActive, writerSubscription } from "@/lib/billing";
import { formatMoney } from "@/lib/billing-model";
import { OFFERS, formatUsd, planAllows } from "@/lib/plans";
import { stripeConfigured } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { SUPPORT_EMAIL } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };
const fmt = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function BillingPage({ searchParams }: PageProps<"/settings/billing">) {
  const { user, profile } = await requireUser("/settings/billing");
  const params = await searchParams;
  const unlocked = planAllows(effectivePlan(profile), "argo");
  const db = await createClient();
  const [purchasesResult, invoicesResult, sub, writerLive] = await Promise.all([
    db.from("purchases").select("id, payment_intent, amount, currency, status, created_at, receipt_url").eq("user_id", user.id).order("created_at", { ascending: false }),
    db.from("billing_invoices").select("id, payment_intent, amount, currency, status, created_at, receipt_url").eq("user_id", user.id).not("id", "like", "legacy_%").order("created_at", { ascending: false }),
    writerSubscription(db, user.id), writerAddonActive(db, user.id),
  ]);
  const purchases = purchasesResult.data ?? [];
  const invoices = invoicesResult.data ?? [];
  const invoicePayments = new Set(invoices.map((i) => i.payment_intent).filter(Boolean));
  const history = [
    ...purchases.filter((p) => !p.payment_intent || !invoicePayments.has(p.payment_intent)).map((p) => ({ ...p, name: "Question Bank Lifetime Access" })),
    ...invoices.map((i) => ({ ...i, name: purchases.some((p) => p.payment_intent && p.payment_intent === i.payment_intent) ? "Question Bank + ARGO" : "ARGO Question Generator" })),
  ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const recurring = Boolean(sub && ["active", "trialing", "past_due", "incomplete", "unpaid", "paused"].includes(sub.status));
  const configured = stripeConfigured();
  const canManage = Boolean(configured && profile.stripe_customer_id);
  const paid = purchases.find((p) => p.status === "paid");

  return <>
    <PageHeader title="Settings" description="Your account, access and preferences." />
    <SettingsNav active="billing" />
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="heading text-[24px] font-bold">Billing</h2><p className="mt-1 text-[14px] text-muted">Your licenses, subscription and payment history.</p></div>
      {canManage && <form action="/api/stripe/portal" method="post"><Button type="submit" variant="secondary">Payment methods and invoices<ArrowUpRight className="size-4" aria-hidden /></Button></form>}
    </div>
    {params.owned === "access" && <p role="status" className="mb-6 rounded-[6px] bg-brand-soft p-4 text-[14px]">You already have Question Bank Lifetime Access.</p>}
    {params.owned === "writer" && <p role="status" className="mb-6 rounded-[6px] bg-brand-soft p-4 text-[14px]">You already have an ARGO subscription. Manage it here to avoid a duplicate charge.</p>}
    {params.error === "portal" && <p role="alert" className="mb-6 rounded-[6px] bg-incorrect-soft p-4 text-[14px] text-incorrect">Billing management could not open. Please try again.</p>}
    <div className="divide-y divide-border rounded-[8px] border border-border bg-surface">
      <section className="flex flex-wrap items-start justify-between gap-5 p-5 sm:p-6">
        <div className="min-w-0"><p className="flex items-center gap-2 text-[14px] font-semibold"><BookOpen className="size-4 text-brand-strong" aria-hidden />{OFFERS.access.name}</p>
          <p className="mt-3 text-[20px] font-bold">{profile.role === "admin" ? "Included for admins" : unlocked ? profile.plan_expires_at ? "Access active" : "Lifetime access active" : "Free account"}</p>
          <p className="mt-1 text-[14px] text-muted">{unlocked ? paid ? `Purchased ${fmt(paid.created_at)}. No expiry or renewals.` : profile.plan_expires_at ? `Granted to your account until ${fmt(profile.plan_expires_at)}.` : "Granted to your account. No renewals." : `${formatUsd(OFFERS.access.amountUsd)} once. Every question, the Library and ARGO analytics.`}</p>
        </div>
        {!unlocked && <Button asChild><Link href="/checkout?offer=access">Get lifetime access</Link></Button>}
      </section>
      <section className="flex flex-wrap items-start justify-between gap-5 p-5 sm:p-6">
        <div className="min-w-0"><p className="flex items-center gap-2 text-[14px] font-semibold"><Sparkles className="size-4 text-brand-strong" aria-hidden />{OFFERS.writer.name}</p>
          <p className="mt-3 text-[20px] font-bold">{profile.role === "admin" ? "Included for admins" : writerLive ? "Active" : recurring ? "Payment needs attention" : "Not subscribed"}</p>
          <p className="mt-1 max-w-[60ch] text-[14px] text-muted">{writerLive && sub?.current_period_end ? `${sub.cancel_at_period_end ? "Access ends" : "Next renewal"} ${fmt(sub.current_period_end)}.` : recurring ? "Open payment management to update your payment method or complete your payment." : `${formatUsd(OFFERS.writer.amountUsd)}/month for new questions built around your weak spots. Cancel anytime.`}</p>
          {writerLive && sub?.unit_amount != null && <p className="mt-1 text-[13px] text-muted">Subscription price: {formatMoney(sub.unit_amount, sub.currency ?? "usd")}/month before discounts.</p>}
          {writerLive && !unlocked && <p className="mt-2 text-[13px] text-incorrect">Question Bank access is required to use the generator. Restore it or cancel the subscription below.</p>}
        </div>
        {profile.role !== "admin" && !recurring && <Button asChild variant="secondary"><Link href="/checkout?offer=writer">{unlocked ? "Subscribe to ARGO" : "Get QBank + ARGO"}</Link></Button>}
        {canManage && sub && ["active", "trialing", "past_due"].includes(sub.status) && sub.current_period_end && <SubscriptionControls key={`${sub.id}-${sub.cancel_at_period_end}`} subscriptionId={sub.id} cancelAtPeriodEnd={sub.cancel_at_period_end} ends={fmt(sub.current_period_end)} />}
      </section>
    </div>
    <section className="mt-10">
      <h2 className="text-[18px] font-bold">Payment history</h2>
      {purchasesResult.error || invoicesResult.error ? <p className="mt-4 text-[14px] text-incorrect" role="alert">Payment history could not load. Please refresh to try again.</p> : history.length ? <div className="mt-4 overflow-x-auto rounded-[6px] border border-border">
        <table className="w-full min-w-[580px] text-left text-[13px]"><caption className="sr-only">Your purchases and subscription payments</caption><thead className="bg-panel text-muted"><tr>{["Date", "Purchase", "Amount", "Status", "Receipt"].map((label) => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-border bg-surface">{history.map((payment) => <tr key={payment.id}><td className="whitespace-nowrap px-4 py-4 text-muted">{fmt(payment.created_at)}</td><td className="px-4 py-4 font-medium">{payment.name}</td><td className="readout px-4 py-4">{formatMoney(payment.amount, payment.currency)}</td><td className="px-4 py-4">{payment.status === "refunded" ? "Refunded" : "Paid"}</td><td className="px-4 py-4">{payment.receipt_url ? <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-strong hover:underline">View<span className="sr-only"> receipt for {payment.name} on {fmt(payment.created_at)}</span></a> : "—"}</td></tr>)}</tbody>
        </table></div> : <p className="mt-4 border-t border-border py-5 text-[14px] text-muted">Your receipts will appear here after your first purchase.</p>}
    </section>
    <p className="mt-8 text-[13px] text-muted">Need a refund or help with a payment? <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-brand-strong hover:underline">{SUPPORT_EMAIL}</a>. <Link href="/refunds" className="font-semibold text-brand-strong hover:underline">Refund policy</Link></p>
  </>;
}
