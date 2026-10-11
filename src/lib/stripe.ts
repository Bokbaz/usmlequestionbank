import "server-only";
import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_RESTRICTED_KEY ?? process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { appInfo: { name: "Argonaut USMLE" } });
}

export function stripeConfigured() {
  return Boolean((process.env.STRIPE_RESTRICTED_KEY || process.env.STRIPE_SECRET_KEY) && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
