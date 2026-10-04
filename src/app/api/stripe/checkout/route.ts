import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { PRICES, PLANS, type PriceKey } from "@/lib/plans";

// GET /api/stripe/checkout?price=argo_3m  -> redirects to Stripe Checkout.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const priceKey = url.searchParams.get("price") as PriceKey | null;
  if (!priceKey || !(priceKey in PRICES)) return NextResponse.redirect(new URL("/pricing", url.origin));

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.redirect(new URL(`/signup?next=${encodeURIComponent(`/api/stripe/checkout?price=${priceKey}`)}`, url.origin));
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.redirect(new URL("/settings/billing?error=stripe_not_configured", url.origin));

  const price = PRICES[priceKey];
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id, display_name").eq("id", auth.user.id).single();
  let customer = profile?.stripe_customer_id ?? null;
  if (!customer) {
    const c = await stripe.customers.create({
      email: auth.user.email,
      name: profile?.display_name ?? undefined,
      metadata: { user_id: auth.user.id },
    });
    customer = c.id;
    await admin.from("profiles").update({ stripe_customer_id: customer }).eq("id", auth.user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: auth.user.id,
    allow_promotion_codes: true,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(price.amountUsd * 100),
          recurring: { interval: "month", interval_count: price.months },
          product_data: { name: `Argonaut ${PLANS[price.tier].name} (${price.label})` },
        },
      },
    ],
    subscription_data: { metadata: { user_id: auth.user.id, price_key: priceKey, tier: price.tier } },
    metadata: { user_id: auth.user.id, price_key: priceKey, tier: price.tier },
    success_url: `${url.origin}/settings/billing?success=1`,
    cancel_url: `${url.origin}/pricing?canceled=1`,
  });
  return NextResponse.redirect(session.url!, { status: 303 });
}
