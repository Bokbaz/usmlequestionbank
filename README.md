# Argonaut USMLE

USMLE question bank with ARGO, an adaptive analytics engine. Next.js 16 (App Router) on Vercel, Supabase (Postgres, Auth, Edge Functions, pgvector, pg_cron).

## Layout

- `src/app` routes: marketing (`(marketing)`), auth (`(auth)`), the signed-in app (`(app)`), the full-screen test player (`test/[id]`), the public Daily Challenge (`daily`), API routes (`api`).
- `src/lib/aqf/parse.ts` parses the **Argonaut Question Format** used for bulk imports (see `docs/question-format.md`).
- `src/lib/argo/` ARGO's TypeScript side: insight computations and the session planner. Per-answer model updates run in Postgres (`supabase/migrations/*engine*.sql`).
- `src/lib/nuggets/match.ts` Nugget detection against the private high-yield index (gte-small embeddings via the `embed` Edge Function).
- `supabase/migrations` schema, RLS and RPCs. `supabase/functions/embed` embedding function.
- `content/seed` the Step 2 CK starter questions in AQF. `scripts/seed.ts` imports them.
- `Approved Questions/approved_*.json` batches from the question authoring pipeline (not committed). `scripts/import-approved.ts` imports them; `content/approved/placements.json` gives each question (by `question_id`) its organ system, Library topic, key concept and free flag, plus an optional category override. Re-importing a batch updates in place (matched on `questions.source_ref`). The pipeline's `sources` are licensed notes and are never imported.
- `content/schools/medical-schools.json` the medical school list for onboarding (open data: Wikidata CC0 + Hipo university list MIT). `scripts/seed-schools.ts` loads it, or the official WDOMS `School.csv` export with `--wdoms`.
- `supabase/templates` auth emails (confirm, magic link, reset), mirrored in `supabase/config.toml`.
- `src/app/(app)/admin` admin area: importer, question browser and AQF export, Nugget review, item analysis, Daily scheduler, users, feedback.
- `src/lib/ai/` optional Claude features (need `ANTHROPIC_API_KEY`): importer classify/repair and ARGO question writing (write, then blind solve and keyed audit).

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
