import "server-only";
import type Stripe from "stripe";
import { BILLING_APP, checkoutPaid, offerForProduct, stripeId } from "@/lib/billing-model";
import { createAdminClient } from "@/lib/supabase/admin";

type Purchase = { session_id: string; offer: "access"; product_id: string; payment_intent: string | null; amount: number; currency: string; receipt_url: string | null };
type Subscription = { id: string; status: string; period_end: string | null; cancel_at_period_end: boolean; product_id: string; unit_amount: number | null; currency: string };
type Invoice = { id: string; subscription_id: string; payment_intent: string | null; amount: number; currency: string; period_end: string; receipt_url: string | null };
type Payload = { user_id?: string; customer_id?: string; purchases?: Purchase[]; subscription?: Subscription; invoice?: Invoice; refund_payment_intent?: string };

export async function fulfillStripeEvent(stripe: Stripe, event: Stripe.Event) {
  const db = createAdminClient();
  const payload: Payload = {};

  async function owner(customerId: string | null, fallback?: string | null) {
    if (!customerId) return null;
    const { data, error } = await db.from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();
    if (error) throw error;
    if (data) return data.id as string;
    if (!fallback || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fallback)) return null;
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted || customer.metadata.user_id !== fallback) return null;
    const { data: profile, error: profileError } = await db.from("profiles").select("id, stripe_customer_id").eq("id", fallback).maybeSingle();
    if (profileError) throw profileError;
    return profile && (!profile.stripe_customer_id || profile.stripe_customer_id === customerId) ? profile.id as string : null;
  }

  async function receipt(paymentIntent: string | null) {
    if (!paymentIntent) return null;
    const pi = await stripe.paymentIntents.retrieve(paymentIntent, { expand: ["latest_charge"] });
    return typeof pi.latest_charge === "object" && pi.latest_charge ? pi.latest_charge.receipt_url : null;
  }

  async function subscription(id: string) {
    // Retrieve current state because Stripe does not guarantee event delivery order.
    const sub = await stripe.subscriptions.retrieve(id, { expand: ["items.data.price.product"] });
    const item = sub.items.data.find((i) => typeof i.price.product !== "string" && offerForProduct(i.price.product) === "writer");
    if (!item) return null;
    const customerId = stripeId(sub.customer);
    const userId = await owner(customerId, sub.metadata.user_id);
    if (!userId || !customerId) throw new Error("Subscription owner could not be resolved");
    payload.user_id = userId;
    payload.customer_id = customerId;
    payload.subscription = {
      id: sub.id, status: sub.status, period_end: new Date(item.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end, product_id: stripeId(item.price.product)!,
      unit_amount: item.price.unit_amount, currency: item.price.currency,
    };
    return sub;
  }

  async function invoice(id: string) {
    const inv = await stripe.invoices.retrieve(id);
    const subId = stripeId(inv.parent?.subscription_details?.subscription);
    if (!subId) return;
    const sub = await subscription(subId);
    if (!sub || inv.status !== "paid") return;
    const lines = await stripe.invoices.listLineItems(inv.id, { limit: 100 });
    const prices = await Promise.all(lines.data.map(async (line) => {
      const priceId = line.pricing?.price_details?.price;
      if (!priceId) return { line, offer: null };
      const price = await stripe.prices.retrieve(stripeId(priceId)!, { expand: ["product"] });
      return { line, offer: typeof price.product === "string" ? null : offerForProduct(price.product) };
    }));
    const writerLines = prices.filter((p) => p.offer === "writer");
    if (!writerLines.length) return;
    const payments = await stripe.invoicePayments.list({ invoice: inv.id, status: "paid", limit: 100 });
    const pi = stripeId(payments.data.find((p) => p.payment.type === "payment_intent")?.payment.payment_intent);
    payload.invoice = {
      id: inv.id, subscription_id: subId, payment_intent: pi, amount: inv.amount_paid, currency: inv.currency,
      period_end: new Date(Math.max(...writerLines.map((p) => p.line.period.end)) * 1000).toISOString(),
      receipt_url: inv.hosted_invoice_url ?? null,
    };
  }

  async function checkout(id: string) {
    const session = await stripe.checkout.sessions.retrieve(id);
    if (session.metadata?.app !== BILLING_APP || !checkoutPaid(session)) return;
    const { data: saved, error } = await db.from("billing_checkouts").select("user_id").eq("id", session.id).maybeSingle();
    if (error) throw error;
    const userId = await owner(stripeId(session.customer), saved?.user_id ?? session.client_reference_id);
    if (!userId || saved && saved.user_id !== userId) throw new Error("Checkout owner could not be resolved");
    payload.user_id = userId;
    payload.customer_id = stripeId(session.customer)!;
    let pi = stripeId(session.payment_intent);
    if (session.subscription) {
      const sub = await subscription(stripeId(session.subscription)!);
      if (sub && session.invoice) {
        await invoice(stripeId(session.invoice)!);
        pi = payload.invoice?.payment_intent ?? null;
      }
    }
    const lines = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100, expand: ["data.price.product"] });
    payload.purchases = [];
    for (const line of lines.data) {
      const prod = line.price?.product;
      if (!prod) continue;
      const resolved = typeof prod === "string" ? await stripe.products.retrieve(prod) : prod;
      if (offerForProduct(resolved) !== "access") continue;
      payload.purchases.push({ session_id: session.id, offer: "access", product_id: resolved.id,
        payment_intent: pi, amount: line.amount_total, currency: line.currency, receipt_url: await receipt(pi) });
    }
  }

  async function refund(pi: string) {
    const payments = await stripe.invoicePayments.list({ payment: { type: "payment_intent", payment_intent: pi }, limit: 100 });
    if (payments.data[0]) {
      await invoice(stripeId(payments.data[0].invoice)!);
      // A refunded current generator period must not silently renew.
      if (payload.invoice && payload.subscription && Date.parse(payload.invoice.period_end) >= Date.parse(payload.subscription.period_end ?? "") &&
          !["canceled", "incomplete_expired"].includes(payload.subscription.status)) {
        await stripe.subscriptions.cancel(payload.subscription.id);
        await subscription(payload.subscription.id);
      }
    }
    const sessions = await stripe.checkout.sessions.list({ payment_intent: pi, limit: 1 });
    if (sessions.data[0]) await checkout(sessions.data[0].id);
    if (payments.data[0]) {
      const inv = await stripe.invoices.retrieve(stripeId(payments.data[0].invoice)!);
      if (inv.billing_reason === "subscription_create" && payload.subscription) {
        const sessions = await stripe.checkout.sessions.list({ subscription: payload.subscription.id, limit: 1 });
        if (sessions.data[0]) await checkout(sessions.data[0].id);
      }
    }
    payload.refund_payment_intent = pi;
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await checkout((event.data.object as Stripe.Checkout.Session).id);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await subscription((event.data.object as Stripe.Subscription).id);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
      await invoice((event.data.object as Stripe.Invoice).id);
      break;
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const pi = stripeId(charge.payment_intent);
      const refunds = await stripe.refunds.list({ charge: charge.id, limit: 100 });
      if (pi && refunds.data.some((r) => r.status === "succeeded")) await refund(pi);
      break;
    }
    case "refund.updated": {
      const r = await stripe.refunds.retrieve((event.data.object as Stripe.Refund).id);
      const pi = stripeId(r.payment_intent);
      if (r.status === "succeeded" && pi) await refund(pi);
      break;
    }
    default: return;
  }
  const { error } = await db.rpc("billing_apply_event", { p_event: event.id, p_created: event.created, p_payload: payload });
  if (error) throw error;
}
