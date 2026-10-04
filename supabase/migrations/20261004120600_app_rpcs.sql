-- RPCs used by the app UI: ARGO planner support, Library catalog, Nugget collection,
-- admin user search. All run as definer with explicit auth checks.

-- Questions involving concepts the user confuses (returns ids only, never answer keys).
create or replace function public.argo_confusion_candidates(p_limit integer default 40)
returns table (question_id uuid, concept text, n integer)
language sql
stable
security definer
set search_path = ''
as $$
  with top_pairs as (
    select uc.correct_concept, uc.chosen_concept, uc.n
    from public.user_confusions uc
    where uc.user_id = (select auth.uid())
    order by uc.n desc, uc.last_at desc
    limit 10
  ), concepts as (
    select correct_concept as concept, n from top_pairs
    union
    select chosen_concept, n from top_pairs
  )
  select distinct on (q.id) q.id, c.concept, c.n
  from concepts c
  join public.question_options o on lower(coalesce(o.concept, o.body)) = lower(c.concept)
  join public.questions q on q.id = o.question_id
  where q.status = 'published'
    and (q.owner_id is null or q.owner_id = (select auth.uid()))
    and (q.is_free or q.owner_id is not null or public.has_plan('core'))
  order by q.id, c.n desc
  limit least(greatest(p_limit, 1), 200);
$$;

-- Record an ARGO session plan against a test the caller owns.
create or replace function public.argo_record_session(p_test uuid, p_plan jsonb, p_baseline jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from public.tests t where t.id = p_test and t.user_id = (select auth.uid())) then
    raise exception 'Test not found' using errcode = 'P0002';
  end if;
  insert into public.argo_sessions (user_id, test_id, plan, baseline)
  values ((select auth.uid()), p_test, coalesce(p_plan, '{}'::jsonb), coalesce(p_baseline, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

-- Library catalog: every published article's title and summary (bodies stay gated by RLS).
create or replace function public.library_catalog()
returns table (
  id integer, slug text, title text, summary text, system_slug text, system_name text,
  is_free boolean, reading_minutes smallint, question_count integer, has_nugget boolean,
  unlocked boolean, updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.slug, a.title, a.summary, s.slug, s.short_name, a.is_free, a.reading_minutes,
         (select count(*)::integer from public.article_questions aq where aq.article_id = a.id),
         exists (select 1 from public.article_questions aq join public.questions q on q.id = aq.question_id
                 where aq.article_id = a.id and q.is_nugget),
         (a.is_free or public.has_plan('core')),
         a.updated_at
  from public.library_articles a
  join public.systems s on s.id = a.system_id
  where a.status = 'published'
  order by s.sort, a.title;
$$;

-- Nuggets the user has met (through answered questions), with their own track record.
create or replace function public.my_nuggets()
returns table (
  id integer, slug text, title text, body text, system_name text,
  attempts integer, correct integer, last_seen_at timestamptz, half_life real
)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, n.slug, n.title, n.body, s.short_name,
         coalesce(uc.n, 0), coalesce(uc.n_correct, 0), uc.last_seen_at, uc.half_life
  from public.nuggets n
  left join public.systems s on s.id = n.system_id
  join public.user_concepts uc on uc.user_id = (select auth.uid()) and uc.dim = 'nugget' and uc.ref_id = n.id
  order by uc.last_seen_at desc nulls last;
$$;

-- Count of Nuggets in the bank (for the collection progress bar).
create or replace function public.nugget_totals()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'nuggets', (select count(*) from public.nuggets),
    'nugget_questions', (select count(*) from public.questions where is_nugget and status = 'published' and owner_id is null),
    'index_lines', (select count(*) from public.nugget_index)
  );
$$;

create or replace function public.admin_users(p_search text default null, p_limit integer default 50)
returns table (
  id uuid, email text, display_name text, username text, role public.user_role, plan public.plan_tier,
  plan_expires_at timestamptz, created_at timestamptz, last_sign_in_at timestamptz, attempts bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return query
    select p.id, u.email::text, p.display_name, p.username::text, p.role, p.plan, p.plan_expires_at,
           p.created_at, u.last_sign_in_at,
           (select count(*) from public.attempts a where a.user_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    where p_search is null or p_search = ''
       or u.email ilike '%' || p_search || '%'
       or p.display_name ilike '%' || p_search || '%'
       or p.username::text ilike '%' || p_search || '%'
    order by p.created_at desc
    limit least(greatest(p_limit, 1), 500);
end;
$$;

create or replace function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return jsonb_build_object(
    'questions', (select count(*) from public.questions where owner_id is null),
    'published', (select count(*) from public.questions where owner_id is null and status = 'published'),
    'argo_generated', (select count(*) from public.questions where source = 'argo'),
    'nugget_questions', (select count(*) from public.questions where is_nugget and owner_id is null),
    'articles', (select count(*) from public.library_articles),
    'users', (select count(*) from public.profiles),
    'paid_users', (select count(*) from public.profiles where plan <> 'free'),
    'attempts', (select count(*) from public.attempts),
    'attempts_7d', (select count(*) from public.attempts where created_at > now() - interval '7 days'),
    'daily_players_today', (select count(*) from public.daily_attempts where day = (now() at time zone 'utc')::date and submitted_at is not null),
    'open_feedback', (select count(*) from public.question_feedback where status = 'open'),
    'nugget_index', (select count(*) from public.nugget_index)
  );
end;
$$;

-- ARGO-generated questions belong to one user: allow the upsert RPC to set the owner.
create or replace function public.admin_set_question_owner(p_question uuid, p_owner uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  update public.questions set owner_id = p_owner, is_free = false where id = p_question;
end;
$$;

-- Grants (functions default to no PUBLIC execute after the earlier migration).
grant execute on function public.argo_confusion_candidates(integer) to authenticated, service_role;
grant execute on function public.argo_record_session(uuid, jsonb, jsonb) to authenticated, service_role;
grant execute on function public.library_catalog() to anon, authenticated, service_role;
grant execute on function public.my_nuggets() to authenticated, service_role;
grant execute on function public.nugget_totals() to anon, authenticated, service_role;
grant execute on function public.admin_users(text, integer) to authenticated, service_role;
grant execute on function public.admin_overview() to authenticated, service_role;
grant execute on function public.admin_set_question_owner(uuid, uuid) to authenticated, service_role;
