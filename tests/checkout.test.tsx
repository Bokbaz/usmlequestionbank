import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { StripeCheckoutSession } from "@stripe/stripe-js";
import { CheckoutSummary } from "../src/components/billing/checkout-summary";

function session({ total = "$52.99", discount = 0, renewal = "$4.99" } = {}) {
  // Recurring items may precede one-time items in Stripe's response.
  return {
    currency: "usd",
    lineItems: [
      { recurring: { interval: "month" }, unitAmount: { amount: "$4.99" } },
      { recurring: null, unitAmount: { amount: "$48.00" } },
    ],
    total: { total: { amount: total }, discount: { minorUnitsAmount: discount, amount: "$12.00" } },
    recurring: { dueNext: { total: { amount: renewal } } },
  } as unknown as StripeCheckoutSession;
}

test("bundle summary separates lifetime and monthly prices regardless of Stripe item order", () => {
  const html = renderToStaticMarkup(<CheckoutSummary includesAccess includesWriter session={session()} />);
  assert.match(html, /Question Bank Lifetime Access[\s\S]*?\$48\.00/);
  assert.match(html, /ARGO Question Generator Subscription[\s\S]*?\$4\.99/);
  assert.match(html, /Due today[\s\S]*?\$52\.99/);
  assert.match(html, /Then \$4\.99\/month for ARGO only/);
  assert.match(html, /Lifetime QBank access stays yours/);
});

test("summary reflects Stripe's discounted and zero totals rather than the advertised price", () => {
  for (const total of ["$36.00", "$0.00"]) {
    const html = renderToStaticMarkup(<CheckoutSummary includesAccess includesWriter={false} session={session({ total, discount: 1200 })} />);
    assert.match(html, /Discount/);
    assert.ok(html.includes(`aria-live="polite">${total}</dd>`));
    assert.match(html, /One payment\. No subscription or expiry date/);
    assert.doesNotMatch(html, /Loading your final total/);
  }
});

test("existing lifetime owners see only the generator and its actual next renewal total", () => {
  const html = renderToStaticMarkup(<CheckoutSummary includesAccess={false} includesWriter session={session({ total: "$2.50", renewal: "$2.50" })} />);
  assert.doesNotMatch(html, /Question Bank Lifetime Access/);
  assert.match(html, /Then \$2\.50\/month for ARGO only/);
  assert.match(html, /Your existing lifetime QBank access stays yours/);
});
