import { NextResponse, type NextRequest } from "next/server";
import { getProfile, getUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  if (request.headers.get("origin") !== origin) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=%2Fsettings%2Fbilling", origin), { status: 303 });
  const profile = await getProfile();
  const stripe = getStripe();
  if (!stripe || !profile?.stripe_customer_id) return NextResponse.redirect(new URL("/settings/billing", origin), { status: 303 });
  try {
    const portal = await stripe.billingPortal.sessions.create({ customer: profile.stripe_customer_id, configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined, return_url: `${origin}/settings/billing` });
    return NextResponse.redirect(portal.url, { status: 303 });
  } catch {
    return NextResponse.redirect(new URL("/settings/billing?error=portal", origin), { status: 303 });
  }
}
