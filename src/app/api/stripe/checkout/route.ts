import { NextResponse, type NextRequest } from "next/server";
import { effectivePlan, getProfile, getUser } from "@/lib/auth";
import { writerAddonActive } from "@/lib/billing";
import { OFFERS, planAllows, type OfferKey } from "@/lib/plans";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/stripe/checkout?offer=access|writer  -> redirects to Stripe Checkout.
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const offerKey = request.nextUrl.searchParams.get("offer") as OfferKey | null;
  if (!offerKey || !(offerKey in OFFERS)) return NextResponse.redirect(new URL("/pricing", origin));
  const back = (q: string) => NextResponse.redirect(new URL(`/settings/billing?${q}`, origin));

  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL(`/signup?next=${encodeURIComponent(`/api/stripe/checkout?offer=${offerKey}`)}`, origin));
  const profile = await getProfile();
  const plan = effectivePlan(profile);
  const admin = createAdminClient();

  if (offerKey === "access" && planAllows(plan, "argo")) return back("owned=access");
  if (offerKey === "writer") {
    if (!planAllows(plan, "argo")) return back("error=needs_access");
    if (await writerAddonActive(admin, user.id)) return back("owned=writer");
  }

  const stripe = getStripe();
  if (!stripe) return back("error=stripe_not_configured");

  let customer = profile?.stripe_customer_id ?? null;
  if (!customer) {
    const c = await stripe.customers.create({ email: user.email ?? undefined, name: profile?.display_name ?? undefined, metadata: { user_id: user.id } });
    customer = c.id;
    await admin.from("profiles").update({ stripe_customer_id: customer }).eq("id", user.id);
  }

  const offer = OFFERS[offerKey];
  const metadata = { user_id: user.id, offer: offerKey };
  const common = {
    customer,
    client_reference_id: user.id,
    allow_promotion_codes: true,
    metadata,
    success_url: `${origin}/settings/billing?success=${offerKey}`,
    cancel_url: `${origin}/pricing?canceled=1`,
    // Shown above the pay button: the buyer accepts the terms and asks for access straight away.
    custom_text: {
      submit: {
        message: `By paying you agree to our Terms (${origin}/terms) and ask for access to start immediately. Refund policy: ${origin}/refunds`,
      },
    },
  };
  const session =
    offerKey === "access"
      ? await stripe.checkout.sessions.create({
          ...common,
          mode: "payment",
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: Math.round(offer.amountUsd * 100),
                product_data: { name: "Argonaut USMLE: Full access", description: offer.tagline },
              },
            },
          ],
          payment_intent_data: { metadata },
        })
      : await stripe.checkout.sessions.create({
          ...common,
          mode: "subscription",
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: Math.round(offer.amountUsd * 100),
                recurring: { interval: "month" },
                product_data: { name: "Argonaut USMLE: ARGO question writing", description: offer.tagline },
              },
            },
          ],
          subscription_data: { metadata: { ...metadata, price_key: "writer" } },
        });
  return NextResponse.redirect(session.url!, { status: 303 });
}
