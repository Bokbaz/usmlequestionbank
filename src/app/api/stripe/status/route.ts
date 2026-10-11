import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { checkoutPaid, stripeId } from "@/lib/billing-model";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("session_id");
  if (!id || !/^cs_[a-zA-Z0-9_]+$/.test(id)) return NextResponse.json({ error: "Invalid checkout" }, { status: 400 });
  const db = await createClient();
  const { data: checkout, error } = await db.from("billing_checkouts").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not check your payment" }, { status: 503 });
  if (!checkout) return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });
  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    const { data: licenses, error: licenseError } = await db.from("billing_licenses").select("source_id, entitlement, status, expires_at").eq("user_id", user.id);
    if (licenseError) throw licenseError;
    const access = !checkout.includes_access || licenses?.some((l) => l.source_id === id && l.entitlement === "qbank_lifetime" && l.status === "active");
    const writer = !checkout.includes_writer || licenses?.some((l) => l.source_id === session.subscription && l.entitlement === "argo_generator" && l.status === "active" && l.expires_at && Date.parse(l.expires_at) > Date.now());
    const invoiceId = stripeId(session.invoice);
    const invoice = checkout.includes_writer && invoiceId
      ? await db.from("billing_invoices").select("status").eq("id", invoiceId).eq("user_id", user.id).maybeSingle()
      : null;
    if (invoice?.error) throw invoice.error;
    const revoked = invoice?.data?.status === "refunded" || checkout.includes_access && licenses?.some((l) => l.source_id === id && l.entitlement === "qbank_lifetime" && l.status === "revoked");
    return NextResponse.json({ status: checkoutPaid(session) ? revoked ? "revoked" : access && writer ? "ready" : "processing" : session.status === "open" ? "open" : session.status === "expired" ? "expired" : "pending", offer: checkout.offer }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not check your payment. Please retry." }, { status: 503 });
  }
}
