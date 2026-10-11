import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { effectivePlan, getProfile, getUser } from "@/lib/auth";
import { BILLING_APP } from "@/lib/billing-model";
import { planAllows } from "@/lib/plans";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { checkoutPrice } from "@/lib/stripe-catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { aiEnabled } from "@/lib/ai/client";

const Body = z.object({ offer: z.enum(["access", "writer"]), includeWriter: z.boolean().default(false), requestId: z.uuid() });

// Preserve old links without creating a payment session during GET or prefetch.
export async function GET(request: NextRequest) {
  const offer = request.nextUrl.searchParams.get("offer") === "writer" ? "writer" : "access";
  return NextResponse.redirect(new URL(`/checkout?offer=${offer}`, request.url));
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid product" }, { status: 400 });
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue", signIn: true }, { status: 401 });
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Your account is still being set up. Please try again." }, { status: 409 });
  const stripe = getStripe();
  if (!stripe || !stripeConfigured()) return NextResponse.json({ error: "Online checkout is not available yet. Please try again shortly." }, { status: 503 });
  const db = createAdminClient();
  const { offer, requestId } = parsed.data;
  const unlocked = planAllows(effectivePlan(profile), "argo");
  const includesAccess = !unlocked;
  const includesWriter = offer === "writer" || parsed.data.includeWriter;
  if (includesWriter && !aiEnabled()) return NextResponse.json({ error: "ARGO Question Generator is being set up. You can purchase lifetime QBank access now." }, { status: 503 });
  if (!includesAccess && !includesWriter) return NextResponse.json({ redirect: "/settings/billing?owned=access" });

  try {
    let customer = profile.stripe_customer_id;
    if (!customer) {
      const created = await stripe.customers.create({ email: user.email ?? undefined, name: profile.display_name ?? undefined, metadata: { app: BILLING_APP, user_id: user.id } }, { idempotencyKey: `argonaut-customer-${user.id}` });
      const { error } = await db.from("profiles").update({ stripe_customer_id: created.id }).eq("id", user.id);
      if (error) throw error;
      customer = created.id;
    }
    if (includesWriter) {
      // Include past_due and incomplete subscriptions so retries don't create a second subscription.
      const subscriptions = await stripe.subscriptions.list({ customer, status: "all", limit: 100 });
      const existing = subscriptions.data.some((s) => s.metadata.app === BILLING_APP && s.metadata.price_key === "writer" && !["canceled", "incomplete_expired"].includes(s.status));
      if (existing) return NextResponse.json({ redirect: "/settings/billing?owned=writer" });
    }
    const prices = await Promise.all([
      includesAccess ? checkoutPrice(stripe, "access") : Promise.resolve(null),
      includesWriter ? checkoutPrice(stripe, "writer") : Promise.resolve(null),
    ]);
    const origin = request.nextUrl.origin;
    const metadata = { app: BILLING_APP, user_id: user.id, offer, price_key: includesWriter ? "writer" : "access" };
    const session = await stripe.checkout.sessions.create({
      customer, client_reference_id: user.id, metadata, mode: includesWriter ? "subscription" : "payment",
      ui_mode: "elements",
      return_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      integration_identifier: `argonaut_elements_${requestId.replaceAll("-", "").slice(0, 8).split("").map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("")}`,
      allow_promotion_codes: true,
      line_items: prices.filter((p) => p !== null).map((price) => ({ price: price.id, quantity: 1 })),
      ...(includesWriter ? { subscription_data: { metadata, billing_mode: { type: "flexible" as const } } } : { payment_intent_data: { metadata }, invoice_creation: { enabled: true } }),
    }, { idempotencyKey: `argonaut-checkout-elements-${user.id}-${requestId}-${includesAccess}-${includesWriter}` });
    const { error } = await db.from("billing_checkouts").upsert({ id: session.id, user_id: user.id, offer, includes_access: includesAccess, includes_writer: includesWriter, expires_at: new Date(session.expires_at * 1000).toISOString() });
    if (error) throw error;
    return NextResponse.json({ clientSecret: session.client_secret, sessionId: session.id });
  } catch (error) {
    console.error("Checkout failed", { userId: user.id, message: error instanceof Error ? error.message : "Database failure" });
    return NextResponse.json({ error: "We couldn't open checkout. Please try again." }, { status: 503 });
  }
}
