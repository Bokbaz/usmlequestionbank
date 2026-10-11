# Argonaut USMLE

USMLE question bank with ARGO, an adaptive analytics engine. Next.js 16 (App Router) on Vercel, Supabase (Postgres, Auth, Edge Functions, pgvector, pg_cron).

## Layout

- `src/app` routes: marketing and public content (`(marketing)`), auth (`(auth)`), the signed-in app (`(app)`), the full-screen test player (`test/[id]`), the public Daily Challenge (`daily`), API routes (`api`), plus `robots.ts`, `sitemap.ts`, `manifest.ts`, `llms.txt` and social images.
- `src/lib/aqf/parse.ts` parses the **Argonaut Question Format** used for bulk imports (see `docs/question-format.md`).
- `src/lib/argo/` ARGO's TypeScript side: insight computations and the session planner. Per-answer model updates run in Postgres (`supabase/migrations/*engine*.sql`).
- `src/lib/nuggets/match.ts` Nugget detection against the private high-yield index (gte-small embeddings via the `embed` Edge Function).
- `supabase/migrations` schema, RLS and RPCs. `supabase/functions/embed` embedding function.
- `content/seed` the Step 2 CK starter questions in AQF. `scripts/seed.ts` imports them.
- `Approved Questions/approved_*.json` (or `.jsonl`, `.csv`, `.txt`) batches from the ARGO question authoring pipeline (not committed). Upload them at `/admin/import`, which places new questions next to their closest bank questions and sets duplicates aside (see `docs/question-format.md`), or import hand-placed batches with `scripts/import-approved.ts`. Both use `src/lib/import/argo-format.ts`. For the script, `content/approved/placements.json` gives each question (by `question_id`) its organ system, Library topic, key concept and free flag, plus an optional category override. `content/approved/skipped.json` lists questions left out because they duplicate one already in the bank (same exam and testing point). Re-importing a batch updates in place (matched on `questions.source_ref`). The pipeline's `sources` are licensed notes and are never imported.
- `content/schools/medical-schools.json` the medical school list for onboarding (open data: Wikidata CC0 + Hipo university list MIT). `scripts/seed-schools.ts` loads it, or the official WDOMS `School.csv` export with `--wdoms`.
- `supabase/templates` auth emails (confirm, magic link, reset), mirrored in `supabase/config.toml`.
- `src/app/(app)/admin` admin area: importer, question browser and AQF export, Nugget review, item analysis, Daily scheduler, users, feedback.
- `src/lib/ai/` optional Claude features (need `ANTHROPIC_API_KEY`): importer classify/repair and ARGO question writing (write, then blind solve and keyed audit).

## Public site and SEO

Everything a visitor or crawler can read without an account is prerendered and refreshed hourly (ISR), with metadata in `<head>`.

- **Canonical host** is `https://argonautusmle.com` (`SITE_URL` in `src/lib/utils.ts`, not an env var). `next.config.ts` 308-redirects `www.` and the `argonaut-usmle.vercel.app` alias to it (API routes on the alias are left alone for webhooks). Every indexable page sets a self-canonical through `pageMetadata()` (`src/lib/seo/metadata.ts`); never put a canonical in a layout.
- **Public data** comes from `src/lib/public/content.ts` (service role, server only). It is the one place that decides what is public: published bank questions only; full text only for `is_free` questions and past Daily Challenges; full Library text only for free chapters. Locked chapters render as title and summary with `noindex`.
- **Pages**: exam pages (`/usmle-step-1-question-bank`, `/usmle-step-2-ck-question-bank`), free questions (`/free-usmle-practice-questions` and per exam), one page per public question (`/practice-questions/<exam>/<code>-<topic>`; old slugs redirect), the public Library (`/library`; signed-in users are rewritten to the in-app Library at `/study/library` by the proxy), subject pages (`src/lib/public/hubs.ts`), guides and the UWorld comparison (`src/lib/public/guides.ts`), `/features/argo`, `/about`, `/editorial-policy`.
- **Facts that go stale**: official exam format and outline shares live in `src/lib/exams.ts` (`OFFICIAL_CHECKED`); competitor prices and counts in `src/lib/public/competitors.ts` (`CHECKED`). Re-check them against the linked sources and update the date together.
- **Crawling**: `src/app/robots.ts` (AI search crawlers read everything public; training-only crawlers get marketing pages only, matching the terms), `src/app/sitemap.ts` (indexable URLs only), `src/app/llms.txt/route.ts`, structured data in `src/lib/seo/schema.ts` (no ratings or claims the page doesn't show), social cards via `opengraph-image.tsx` files and `src/lib/seo/og.tsx` (Geist TTFs in `src/assets/fonts`, OFL).
- **Adding a subject page**: add an entry to `HUBS` (check the classification is clean first) and a two-line `page.tsx` plus `opengraph-image.tsx` at its path. It appears in the footer, sitemap and llms.txt automatically.
- **Search Console / Bing**: verify the domain by DNS, or set `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` for meta-tag verification, then submit `/sitemap.xml`.

## Environment

See `.env.example`. Secrets live in Vercel project settings and the gitignored `.env.local`.

## Auth emails

Sign-up requires email confirmation. Email links use `token_hash` (not PKCE codes), so they work on any device: `/auth/callback` verifies the token, sets the session and sends the user on (new accounts land on `/welcome`). The templates build links as `{{ .RedirectTo }}&token_hash=…`, so the app must always pass a redirect URL that already has a query string (it does: `/auth/callback?next=…`), and that URL's origin must be in the Supabase redirect allow list.

Supabase's built-in mailer only delivers to members of the Supabase organisation and is heavily rate-limited. Before launch, add custom SMTP (for example Resend) under Authentication → SMTP in the Supabase dashboard.

## Billing

Branded embedded Stripe Checkout lives at `/checkout`, using Checkout Sessions with Stripe's Payment and Express Checkout Elements (`ui_mode: elements`). The panel shows the Argonaut logo, selected products, Stripe's current total and monthly renewal, and supports promotion codes. The payment fields follow the site's light/dark theme through the Appearance API. Pricing links preserve the selected product through sign-up, email confirmation and Google sign-in. New customers can add ARGO to the lifetime purchase in one checkout; the QBank is charged once and only the generator renews.

- **Question Bank Lifetime Access**: $48 once. Product metadata: `app=argonaut_usmle`, `argonaut_offer=access`, `entitlement=qbank_lifetime`.
- **ARGO Question Generator Subscription**: $4.99/month. Metadata: `app=argonaut_usmle`, `argonaut_offer=writer`, `entitlement=argo_generator`. Requires QBank access. Quota: `ARGO_WRITE_MONTHLY_LIMIT` drafts per rolling 30 days (default 15). ARGO checkout stays disabled until `ANTHROPIC_API_KEY` is set.
- **Settings → Billing**: license status, renewal/end dates, actual transaction amounts, receipts, payment methods, and onsite cancellation/resumption. Payment-method updates and invoice downloads use the Stripe Customer Portal.

Fulfillment verifies the signature, retrieves Stripe's current objects, resolves ownership through the customer and saved Checkout Session, and validates the product metadata. It never checks an exact amount or Price ID to issue a license. New prices and coupons (including 100% off) continue granting the same product license. `STRIPE_ACCESS_PRICE_ID` and `STRIPE_WRITER_PRICE_ID` select the prices being sold; without overrides the stable lookup keys in `src/lib/plans.ts` are used. When changing a price, update the Price override and the advertised `OFFERS.amountUsd` together, keeping product metadata unchanged.

`billing_apply_event` applies the event and licenses in a single database transaction. Repeated delivery is harmless, failed transactions can retry, and successful refunds are remembered even if they arrive before fulfillment. **Any successful refund, including a partial refund, revokes the licenses paid for by that charge.** For a combined initial purchase, that means both QBank and that ARGO period. Refunds of older ARGO invoices do not remove newer paid periods. A refunded current ARGO period also cancels the subscription to prevent future charges. Pending/failed refunds do not revoke access. Other paid licenses and independent admin grants are preserved.

Generator access comes from paid invoices and ends when its paid period expires; an active/past-due subscription alone does not grant unpaid access. Period-end cancellation preserves the paid period. A success URL or browser refresh never grants access. `/checkout/return` polls the authenticated status endpoint until the webhook has saved the license.

### Runtime setup

See `.env.example`. Production secrets should be sensitive Vercel environment variables; never commit them or send them to the client.

1. `STRIPE_RESTRICTED_KEY` (preferred), or existing `STRIPE_SECRET_KEY`; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from the **same account and mode**. Restricted permissions: Customers, Checkout Sessions, Subscriptions and Customer Portal **write**; Products, Prices, Invoices/Invoice Payments, PaymentIntents, Charges and Refunds **read**. Subscription write is needed for cancellation and refund revocation.
2. `STRIPE_WEBHOOK_SECRET` for `https://argonautusmle.com/api/stripe/webhook`. Events are exported as `BILLING_EVENTS` in `src/lib/billing-model.ts`: Checkout completion and async success/failure, subscription created/updated/deleted, invoice paid/payment failed, charge refunded and refund updated. Pin webhook payloads to the SDK API version, currently `2026-09-30.endive`.
3. `STRIPE_ACCESS_PRICE_ID`, `STRIPE_WRITER_PRICE_ID`, and `STRIPE_PORTAL_CONFIGURATION_ID`. The configured portal allows invoice history, payment methods and cancellation at period end.
4. `ANTHROPIC_API_KEY` to activate generator purchases and generation.

Live Argonaut catalog created on 2026-10-11:

| Item | Stripe ID |
| --- | --- |
| QBank product | `prod_VQEoExmZbosvOX` |
| QBank $48 Price | `price_1UPOL7Gfqh9WpBimbYXas8DJ` |
| ARGO product | `prod_VQEonKrF6ge98B` |
| ARGO $4.99/month Price | `price_1UPOLIGfqh9WpBimRoMU64TU` |
| Portal configuration | `bpc_1UPOS9Gfqh9WpBimDneOtr2P` |
| Webhook endpoint | `we_1UPOVTGfqh9WpBimzMWF01yS` |

The license migration is `20261011152356_product_licenses.sql` and is applied to the linked Supabase project. Its private event/refund/manual-plan tables deliberately have no client RLS policies. Clients can read only their own public billing records; only the service role can call the fulfillment RPC.

Tax collection is not enabled: no active Stripe Tax registrations were present when configuring this integration. Configure registrations and product tax codes before enabling automatic tax. See [Stripe Tax setup](https://docs.stripe.com/tax/set-up).

Run `npm run test:billing` for the real PostgreSQL migration/RPC regression tests (PGlite). They cover changed/zero amounts, duplicate and out-of-order delivery, refund-before-fulfillment, bundled refunds, paid subscription periods, stale subscription events, manual grants, rollback/retry and service-role checks. Use a separate Stripe sandbox with its own catalog, webhook and keys for payment testing; never point preview test purchases at live keys. Live payment completion has not been tested until application keys are installed.

## Common tasks

```bash
npx tsx scripts/validate-aqf.ts content/seed/*.aqf.txt   # check question files
npx tsx scripts/seed.ts                                  # (re)seed the Step 2 CK starter questions, Library, Nuggets
npx tsx --conditions=react-server scripts/import-approved.ts "Approved Questions/approved_X.json" --dry-run --verbose
npx tsx --conditions=react-server scripts/import-approved.ts "Approved Questions/approved_X.json"   # import an approved batch
npx tsx scripts/seed-schools.ts                          # load the medical school list (idempotent)
npx tsx scripts/seed-schools.ts --wdoms School.csv       # add schools from the official WDOMS export
supabase db push --linked                                # apply migrations
```

The high-yield source PDFs are licensed third-party material: they are never committed. `scripts/extract_nuggets.py` builds the private index from a local copy.
