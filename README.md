# Argonaut USMLE

USMLE question bank with ARGO, an adaptive analytics engine. Next.js 16 (App Router) on Vercel, Supabase (Postgres, Auth, Edge Functions, pgvector, pg_cron).

## Layout

- `src/app` routes: marketing (`(marketing)`), auth (`(auth)`), the signed-in app (`(app)`), the full-screen test player (`test/[id]`), the public Daily Challenge (`daily`), API routes (`api`).
- `src/lib/aqf/parse.ts` parses the **Argonaut Question Format** used for bulk imports (see `docs/question-format.md`).
- `src/lib/argo/` ARGO's TypeScript side: insight computations and the session planner. Per-answer model updates run in Postgres (`supabase/migrations/*engine*.sql`).
- `src/lib/nuggets/match.ts` Nugget detection against the private high-yield index (gte-small embeddings via the `embed` Edge Function).
- `supabase/migrations` schema, RLS and RPCs. `supabase/functions/embed` embedding function.
- `content/seed` the launch question set in AQF. `scripts/seed.ts` imports it.
- `src/app/(app)/admin` admin area: importer, question browser and AQF export, Nugget review, item analysis, Daily scheduler, users, feedback.
- `src/lib/ai/` optional Claude features (need `ANTHROPIC_API_KEY`): importer classify/repair and ARGO question writing (write, then blind solve and keyed audit).

## Environment

See `.env.example`. Secrets live in Vercel project settings and the gitignored `.env.local`.

## Billing

Configured in `src/lib/plans.ts`; Stripe Checkout uses inline prices, so no products need creating in Stripe.

- **Full access**: $48 one-time payment (`mode: payment`). Sets the plan to `argo` with no expiry. A full refund revokes it.
- **ARGO question writing**: $4.99/month subscription (`price_key = 'writer'`), sold only to Full-access accounts. Quota: `ARGO_WRITE_MONTHLY_LIMIT` drafts per rolling 30 days (default 15).

Stripe setup: set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Vercel, enable the customer portal (for add-on cancellation), and point a webhook at `/api/stripe/webhook` with these events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`.

## Common tasks

```bash
npx tsx scripts/validate-aqf.ts content/seed/*.aqf.txt   # check question files
npx tsx scripts/seed.ts                                  # (re)seed questions, Library, Nuggets, daily schedule
supabase db push --linked                                # apply migrations
```

The high-yield source PDFs are licensed third-party material: they are never committed. `scripts/extract_nuggets.py` builds the private index from a local copy.
