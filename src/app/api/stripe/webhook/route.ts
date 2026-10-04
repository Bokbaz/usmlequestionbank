import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRICES, type PriceKey } from "@/lib/plans";

// Stripe -> plan entitlements. Verified with STRIPE_WEBHOOK_SECRET.
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
  const apply = async (sub: Stripe.Subscription) => {
    const userId = sub.metadata?.user_id;
    if (!userId) return;
    const priceKey = (sub.metadata?.price_key ?? null) as PriceKey | null;
    const tier = sub.metadata?.tier ?? (priceKey ? PRICES[priceKey]?.tier : null) ?? "core";
    const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
    const periodEnd = item?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end ?? null;
    const { error } = await admin.rpc("billing_apply_subscription", {
      p_user: userId,
      p_subscription: sub.id,
      p_status: sub.status,
      p_plan: tier,
      p_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      p_cancel_at_period_end: sub.cancel_at_period_end,
      p_price_key: priceKey,
      p_customer: typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
    });
    if (error) throw new Error(error.message);
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(typeof session.subscription === "string" ? session.subscription : session.subscription.id);
          await apply(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await apply(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
