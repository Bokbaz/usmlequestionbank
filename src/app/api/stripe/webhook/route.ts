import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe -> entitlements. Verified with STRIPE_WEBHOOK_SECRET.
// Subscribe the endpoint to: checkout.session.completed, checkout.session.async_payment_succeeded,
// customer.subscription.created, customer.subscription.updated, customer.subscription.deleted,
// charge.refunded.
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }

  const admin = createAdminClient();
  const idOf = (x: string | { id: string } | null | undefined) => (typeof x === "string" ? x : (x?.id ?? null));

  // One-time Full access purchase, once the money has actually arrived.
  const grantPurchase = async (session: Stripe.Checkout.Session) => {
    const userId = session.metadata?.user_id ?? session.client_reference_id;
    if (!userId || session.mode !== "payment" || session.payment_status !== "paid") return;
    const { error } = await admin.rpc("billing_apply_purchase", {
      p_user: userId,
      p_session: session.id,
      p_payment_intent: idOf(session.payment_intent),
      p_amount: session.amount_total ?? 0,
      p_currency: session.currency ?? "usd",
      p_customer: idOf(session.customer),
    });
    if (error) throw new Error(error.message);
  };

  // Question-writing add-on: recorded as a subscription row; it never changes the plan.
  const recordSubscription = async (sub: Stripe.Subscription) => {
    const userId = sub.metadata?.user_id;
    if (!userId) return;
    const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
    const periodEnd = item?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end ?? null;
    const { error } = await admin.rpc("billing_apply_subscription", {
      p_user: userId,
      p_subscription: sub.id,
      p_status: sub.status,
      p_plan: "argo",
      p_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      p_cancel_at_period_end: sub.cancel_at_period_end,
      p_price_key: sub.metadata?.price_key ?? "writer",
      p_customer: idOf(sub.customer),
    });
    if (error) throw new Error(error.message);
  };

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "payment") await grantPurchase(session);
        else if (session.mode === "subscription" && session.subscription) {
          await recordSubscription(await stripe.subscriptions.retrieve(idOf(session.subscription)!));
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await recordSubscription(event.data.object as Stripe.Subscription);
        break;
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntent = idOf(charge.payment_intent);
        // Only a full refund removes access; partial refunds are goodwill credits.
        if (paymentIntent && charge.refunded) {
          const { error } = await admin.rpc("billing_refund_purchase", { p_payment_intent: paymentIntent });
          if (error) throw new Error(error.message);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
