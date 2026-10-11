import "server-only";
import type Stripe from "stripe";
import { OFFERS, type OfferKey } from "@/lib/plans";
import { offerForProduct } from "@/lib/billing-model";

export async function checkoutPrice(stripe: Stripe, offer: OfferKey) {
  const configured = offer === "access" ? process.env.STRIPE_ACCESS_PRICE_ID : process.env.STRIPE_WRITER_PRICE_ID;
  const price = configured
    ? await stripe.prices.retrieve(configured, { expand: ["product"] })
    : (await stripe.prices.list({ lookup_keys: [OFFERS[offer].lookupKey], active: true, expand: ["data.product"], limit: 1 })).data[0];
  if (!price || !price.active || typeof price.product === "string" || offerForProduct(price.product) !== offer) {
    throw new Error(`Stripe product for ${offer} is not configured`);
  }
  if (offer === "access" ? Boolean(price.recurring) : price.recurring?.interval !== "month" || price.recurring.interval_count !== 1) {
    throw new Error("Stripe price has an unexpected billing interval");
  }
  return price;
}
