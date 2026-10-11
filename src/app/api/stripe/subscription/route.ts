import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getProfile, getUser } from "@/lib/auth";
import { BILLING_APP } from "@/lib/billing-model";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const body = z.object({ subscriptionId: z.string().startsWith("sub_"), cancel: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const profile = await getProfile();
  const stripe = getStripe();
  if (!stripe || !profile?.stripe_customer_id) return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });
  try {
    const sub = await stripe.subscriptions.retrieve(body.data.subscriptionId);
    if (sub.customer !== profile.stripe_customer_id || sub.metadata.app !== BILLING_APP || sub.metadata.price_key !== "writer") return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    if (!["active", "trialing", "past_due"].includes(sub.status)) return NextResponse.json({ error: "This subscription cannot be changed. Open billing management for help." }, { status: 409 });
    await stripe.subscriptions.update(sub.id, { cancel_at_period_end: body.data.cancel });
    return NextResponse.json({ cancelAtPeriodEnd: body.data.cancel });
  } catch {
    return NextResponse.json({ error: "Couldn't update your subscription. Please try again." }, { status: 503 });
  }
}
