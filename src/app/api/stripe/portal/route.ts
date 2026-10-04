import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.redirect(new URL("/login", origin), { status: 303 });
  const stripe = getStripe();
  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", auth.user.id).single();
  if (!stripe || !profile?.stripe_customer_id) return NextResponse.redirect(new URL("/settings/billing", origin), { status: 303 });
  const portal = await stripe.billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${origin}/settings/billing` });
  return NextResponse.redirect(portal.url, { status: 303 });
}
