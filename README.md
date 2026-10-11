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

Configured in `src/lib/plans.ts`; Stripe Checkout uses inline prices, so no products need creating in Stripe.

- **Full access**: $48 one-time payment (`mode: payment`). Sets the plan to `argo` with no expiry. A full refund revokes it.
- **ARGO question writing**: $4.99/month subscription (`price_key = 'writer'`), sold only to Full-access accounts. Quota: `ARGO_WRITE_MONTHLY_LIMIT` drafts per rolling 30 days (default 15).

Stripe setup: set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Vercel, enable the customer portal (for add-on cancellation), and point a webhook at `/api/stripe/webhook` with these events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`.

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
