import type Stripe from "stripe";
import { OFFERS, type OfferKey } from "@/lib/plans";

export const BILLING_APP = "argonaut_usmle";
export const BILLING_EVENTS = [
  "checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed",
  "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted",
  "invoice.paid", "invoice.payment_failed", "charge.refunded", "refund.updated",
] as const;

export function stripeId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export function offerForProduct(product: Stripe.Product | Stripe.DeletedProduct): OfferKey | null {
  if ("deleted" in product && product.deleted) return null;
  const metadata = (product as Stripe.Product).metadata;
  const offer = metadata.argonaut_offer;
  return metadata.app === BILLING_APP && (offer === "access" || offer === "writer") && metadata.entitlement === OFFERS[offer].entitlement ? offer : null;
}

export function checkoutPaid(session: Pick<Stripe.Checkout.Session, "status" | "payment_status">) {
  return session.status === "complete" && ["paid", "no_payment_required"].includes(session.payment_status);
}

export function writerLicenseActive(license: { status: string; expires_at: string | null } | null, now = Date.now()) {
  return Boolean(license?.status === "active" && license.expires_at && Date.parse(license.expires_at) > now);
}

export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}
