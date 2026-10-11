import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import type Stripe from "stripe";
import { checkoutPaid, offerForProduct } from "../src/lib/billing-model";

const USER = "11111111-1111-4111-8111-111111111111";
const SUB = { id: "sub_writer", status: "active", period_end: "2099-01-01T00:00:00Z", cancel_at_period_end: false, product_id: "prod_generator", unit_amount: 499, currency: "usd" };

async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create schema private;
    create function auth.role() returns text language sql as $$ select current_setting('request.jwt.claim.role', true) $$;
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function public.is_admin() returns boolean language sql as $$ select auth.role() = 'service_role' $$;
    create type public.plan_tier as enum ('free', 'core', 'argo');
    create table auth.users(id uuid primary key);
    create table public.profiles(id uuid primary key references auth.users(id), role text default 'user', plan public.plan_tier default 'free', plan_expires_at timestamptz, stripe_customer_id text);
    create table public.purchases(id text primary key, user_id uuid references auth.users(id), payment_intent text unique, offer text default 'access', amount integer, currency text, status text default 'paid', created_at timestamptz default now(), refunded_at timestamptz);
    create table public.subscriptions(id text primary key, user_id uuid references auth.users(id), status text, plan public.plan_tier, price_key text, current_period_end timestamptz, cancel_at_period_end boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());
    insert into auth.users values ('${USER}'); insert into public.profiles(id) values ('${USER}');
    select set_config('request.jwt.claim.role', 'service_role', false);
  `);
  await db.exec(await readFile(new URL("../supabase/migrations/20261011152356_product_licenses.sql", import.meta.url), "utf8"));
  return db;
}
async function event(db: PGlite, id: string, payload: object, time = 100) {
  await db.query("select public.billing_apply_event($1, $2, $3::jsonb)", [id, time, JSON.stringify(payload)]);
}
function purchase(session: string, pi: string, amount = 4800) {
  return { session_id: session, offer: "access", product_id: "prod_qbank", payment_intent: pi, amount, currency: "usd", receipt_url: null };
}
async function plan(db: PGlite) { return (await db.query<{ plan: string }>("select plan from public.profiles where id = $1", [USER])).rows[0].plan; }
async function generator(db: PGlite) { return (await db.query<{ status: string }>("select status from public.billing_licenses where entitlement = 'argo_generator'")).rows[0]?.status; }

// Exercise the actual PostgreSQL migration/RPC, not a TypeScript copy of entitlement rules.
test("discounted and free purchases grant product licenses; duplicate delivery is harmless", async () => {
  const db = await database();
  try {
    const payload = { user_id: USER, purchases: [purchase("cs_discount", "pi_discount", 1)] };
    await event(db, "evt_discount", payload);
    await event(db, "evt_discount", payload);
    await event(db, "evt_free", { user_id: USER, purchases: [purchase("cs_free", "pi_free", 0)] });
    assert.equal(await plan(db), "argo");
    assert.equal((await db.query<{ count: number }>("select count(*)::int as count from public.purchases")).rows[0].count, 2);
  } finally { await db.close(); }
});

test("refund-before-fulfillment and later checkout retries cannot resurrect a license", async () => {
  const db = await database();
  try {
    await event(db, "evt_refund", { refund_payment_intent: "pi_early" });
    await event(db, "evt_checkout", { user_id: USER, purchases: [purchase("cs_early", "pi_early")] });
    await event(db, "evt_checkout_retry", { user_id: USER, purchases: [purchase("cs_early", "pi_early")] });
    assert.equal(await plan(db), "free");
    assert.equal((await db.query<{ status: string }>("select status from public.purchases")).rows[0].status, "refunded");
  } finally { await db.close(); }
});

test("refunding one purchase preserves another license and restores manual grants", async () => {
  const db = await database();
  try {
    await db.query("select public.admin_set_plan($1, 'core', null)", [USER]);
    await event(db, "evt_a", { user_id: USER, purchases: [purchase("cs_a", "pi_a")] });
    await event(db, "evt_b", { user_id: USER, purchases: [purchase("cs_b", "pi_b", 9000)] });
    await event(db, "evt_refund_a", { refund_payment_intent: "pi_a" });
    assert.equal(await plan(db), "argo");
    await event(db, "evt_refund_b", { refund_payment_intent: "pi_b" });
    assert.equal(await plan(db), "core");
  } finally { await db.close(); }
});

test("subscription status alone grants no license; a paid invoice does, cancellation retains paid access", async () => {
  const db = await database();
  try {
    await event(db, "evt_sub", { user_id: USER, subscription: SUB });
    assert.equal(await generator(db), "revoked");
    await event(db, "evt_invoice", { user_id: USER, subscription: { ...SUB, cancel_at_period_end: true }, invoice: { id: "in_writer", subscription_id: SUB.id, payment_intent: "pi_writer", amount: 0, currency: "usd", period_end: SUB.period_end } }, 101);
    assert.equal(await generator(db), "active");
    await event(db, "evt_late_sub", { user_id: USER, subscription: { ...SUB, status: "incomplete" } }, 99);
    assert.equal(await generator(db), "active");
    await event(db, "evt_refunded_invoice", { refund_payment_intent: "pi_writer" }, 102);
    assert.equal(await generator(db), "revoked");
  } finally { await db.close(); }
});

test("bundle refund revokes both licenses, while refunding an older period keeps newer paid access", async () => {
  const db = await database();
  try {
    await event(db, "evt_bundle", { user_id: USER, purchases: [purchase("cs_bundle", "pi_bundle")], subscription: SUB, invoice: { id: "in_bundle", subscription_id: SUB.id, payment_intent: "pi_bundle", amount: 5299, currency: "usd", period_end: SUB.period_end } });
    await event(db, "evt_renew", { user_id: USER, subscription: { ...SUB, period_end: "2099-02-01T00:00:00Z" }, invoice: { id: "in_renew", subscription_id: SUB.id, payment_intent: "pi_renew", amount: 499, currency: "usd", period_end: "2099-02-01T00:00:00Z" } }, 101);
    await event(db, "evt_refund_bundle", { refund_payment_intent: "pi_bundle" }, 102);
    assert.equal(await plan(db), "free");
    assert.equal(await generator(db), "active");
    await event(db, "evt_refund_renew", { refund_payment_intent: "pi_renew" }, 103);
    assert.equal(await generator(db), "revoked");
  } finally { await db.close(); }
});

test("a failed event rolls back its deduplication record, so a corrected retry succeeds", async () => {
  const db = await database();
  try {
    await assert.rejects(event(db, "evt_retry", { user_id: USER, purchases: [{ ...purchase("cs_retry", "pi_retry"), product_id: null }] }));
    await event(db, "evt_retry", { user_id: USER, purchases: [purchase("cs_retry", "pi_retry")] });
    assert.equal(await plan(db), "argo");
    await db.exec("select set_config('request.jwt.claim.role', 'authenticated', false)");
    await assert.rejects(event(db, "evt_forged", { user_id: USER, purchases: [purchase("cs_forged", "pi_forged")] }), /Service role only/);
  } finally { await db.close(); }
});

test("payment fulfillment accepts no-payment-required promotions and rejects unpaid/unfinished sessions", () => {
  assert.equal(checkoutPaid({ status: "complete", payment_status: "no_payment_required" }), true);
  assert.equal(checkoutPaid({ status: "complete", payment_status: "paid" }), true);
  assert.equal(checkoutPaid({ status: "complete", payment_status: "unpaid" }), false);
  assert.equal(checkoutPaid({ status: "open", payment_status: "paid" }), false);
  const product = { id: "prod_qbank", metadata: { app: "argonaut_usmle", argonaut_offer: "access", entitlement: "qbank_lifetime" } } as unknown as Stripe.Product;
  assert.equal(offerForProduct(product), "access");
  assert.equal(offerForProduct({ ...product, metadata: { ...product.metadata, app: "other_app" } }), null);
});
