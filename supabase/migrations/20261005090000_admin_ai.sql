-- Admin review queue for Nugget matches and the ARGO question-writing audit log.

-- Imported questions whose best Nugget match falls in the review band wait here for an
-- admin decision. Approving links the question to a Nugget card written in our own words.
create table public.nugget_reviews (
  id bigint primary key generated always as identity,
  question_id uuid not null unique references public.questions (id) on delete cascade,
  index_ids integer[] not null,
  score real not null,
  title text not null,
  body text,
  status text not null default 'open' check (status in ('open', 'approved', 'dismissed')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index nugget_reviews_open_idx on public.nugget_reviews (score desc) where status = 'open';
alter table public.nugget_reviews enable row level security;
create policy "nugget reviews admin" on public.nugget_reviews for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Every question ARGO writes for a student, accepted or rejected by verification.
-- Rows are inserted by the server with the service key; students can read their own.
create table public.argo_generations (
  id bigint primary key generated always as identity,
  user_id uuid not null references auth.users (id) on delete cascade,
  dim text not null check (dim in ('system', 'discipline', 'competency', 'topic', 'nugget')),
  ref_id integer not null,
  concept text not null,
  status text not null check (status in ('accepted', 'rejected', 'failed')),
  question_id uuid references public.questions (id) on delete set null,
  verdict jsonb not null default '{}'::jsonb,
  usage jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index argo_generations_user_idx on public.argo_generations (user_id, created_at desc);
alter table public.argo_generations enable row level security;
create policy "argo generations read" on public.argo_generations for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create or replace function public.admin_nugget_reviews(p_limit integer default 50)
returns table (
  id bigint, question_id uuid, code text, title text, body text, score real, lines jsonb, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return query
    select r.id, r.question_id, q.code, r.title, r.body, r.score,
      coalesce((
        select jsonb_agg(jsonb_build_object('id', ni.id, 'body', ni.body, 'source', ns.slug)
                         order by array_position(r.index_ids, ni.id))
        from public.nugget_index ni join public.nugget_sources ns on ns.id = ni.source_id
        where ni.id = any (r.index_ids)
      ), '[]'::jsonb),
      r.created_at
    from public.nugget_reviews r
    join public.questions q on q.id = r.question_id
    where r.status = 'open'
    order by r.score desc, r.created_at
    limit least(greatest(p_limit, 1), 200);
end;
$$;

-- Generated-question totals for the admin overview.
create or replace function public.admin_argo_generation_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return jsonb_build_object(
    'accepted', (select count(*) from public.argo_generations where status = 'accepted'),
    'rejected', (select count(*) from public.argo_generations where status = 'rejected'),
    'failed', (select count(*) from public.argo_generations where status = 'failed'),
    'last_7d', (select count(*) from public.argo_generations where created_at > now() - interval '7 days'),
    'students', (select count(distinct user_id) from public.argo_generations)
  );
end;
$$;

revoke execute on function public.admin_nugget_reviews(integer) from public, anon;
revoke execute on function public.admin_argo_generation_stats() from public, anon;
grant execute on function public.admin_nugget_reviews(integer) to authenticated, service_role;
grant execute on function public.admin_argo_generation_stats() to authenticated, service_role;
