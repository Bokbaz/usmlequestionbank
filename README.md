# Argonaut USMLE

USMLE question bank with ARGO, an adaptive analytics engine. Next.js 16 (App Router) on Vercel, Supabase (Postgres, Auth, Edge Functions, pgvector, pg_cron).

## Layout

- `src/app` routes: marketing (`(marketing)`), auth (`(auth)`), the signed-in app (`(app)`), the full-screen test player (`test/[id]`), the public Daily Challenge (`daily`), API routes (`api`).
- `src/lib/aqf/parse.ts` parses the **Argonaut Question Format** used for bulk imports (see `docs/question-format.md`).
- `src/lib/argo/` ARGO's TypeScript side: insight computations and the session planner. Per-answer model updates run in Postgres (`supabase/migrations/*engine*.sql`).
- `src/lib/nuggets/match.ts` Nugget detection against the private high-yield index (gte-small embeddings via the `embed` Edge Function).
- `supabase/migrations` schema, RLS and RPCs. `supabase/functions/embed` embedding function.
- `content/seed` the launch question set in AQF. `scripts/seed.ts` imports it.

## Environment

See `.env.example`. Secrets live in Vercel project settings and the gitignored `.env.local`.

## Common tasks

```bash
npx tsx scripts/validate-aqf.ts content/seed/*.aqf.txt   # check question files
npx tsx scripts/seed.ts                                  # (re)seed questions, Library, Nuggets, daily schedule
supabase db push --linked                                # apply migrations
```

The high-yield source PDFs are licensed third-party material: they are never committed. `scripts/extract_nuggets.py` builds the private index from a local copy.
