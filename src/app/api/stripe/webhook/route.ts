import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { fulfillStripeEvent } from "@/lib/stripe-fulfillment";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }
  try {
    await fulfillStripeEvent(stripe, event);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe fulfillment failed", { eventId: event.id, type: event.type, message: error instanceof Error ? error.message : "Database failure" });
    return NextResponse.json({ error: "Fulfillment failed; retry required" }, { status: 500 });
  }
}
