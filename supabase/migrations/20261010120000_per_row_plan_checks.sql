-- Speed: is_admin() and has_plan() are SECURITY DEFINER, so Postgres cannot inline them and
-- re-runs them (a profiles lookup each) for every row scanned. On ~1,800 questions that cost
-- ~270 ms per scan, and count_questions scanned nine times (2.6 s for the Create test page).
-- Wrapping each call in a scalar subquery turns it into a one-time InitPlan (~4 ms).

-- Question pool rows with the user's history, computed once. -----------------------------
create or replace function private.pool_rows(
  p_user uuid, p_exam public.exam_type, p_competencies smallint[], p_topics integer[], p_nuggets_only boolean
)
returns table (question_id uuid, system_id smallint, discipline_id smallint, seen boolean, is_correct boolean, omitted boolean, marked boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with last_att as (
    select distinct on (a.question_id) a.question_id, a.is_correct, a.omitted
    from public.attempts a
    where a.user_id = p_user
    order by a.question_id, a.created_at desc
  ),
  marked as (
    select distinct ti.question_id
    from public.test_items ti join public.tests t on t.id = ti.test_id
    where t.user_id = p_user and ti.marked
  )
  select q.id, q.system_id, q.discipline_id,
         la.question_id is not null, la.is_correct, la.omitted, m.question_id is not null
  from public.questions q
  left join last_att la on la.question_id = q.id
  left join marked m on m.question_id = q.id
  where q.status = 'published'
    and (q.owner_id is null or q.owner_id = p_user)
    and (q.is_free or q.owner_id is not null or (select public.has_plan('core')))
    and (p_exam is null or q.exam = p_exam)
    and (p_competencies is null or cardinality(p_competencies) = 0 or q.competency_id = any(p_competencies))
    and (p_topics is null or cardinality(p_topics) = 0 or q.topic_id = any(p_topics))
    and (not coalesce(p_nuggets_only, false) or q.is_nugget);
$$;
revoke execute on function private.pool_rows(uuid, public.exam_type, smallint[], integer[], boolean) from public, anon;

create or replace function private.candidate_questions(
  p_user uuid, p_exam public.exam_type, p_systems smallint[], p_disciplines smallint[],
  p_competencies smallint[], p_topics integer[], p_pool text[], p_nuggets_only boolean
)
returns table (question_id uuid, system_id smallint, discipline_id smallint)
language sql
stable
security definer
set search_path = ''
as $$
  select r.question_id, r.system_id, r.discipline_id
  from private.pool_rows(p_user, p_exam, p_competencies, p_topics, p_nuggets_only) r
  where (p_systems is null or cardinality(p_systems) = 0 or r.system_id = any(p_systems))
    and (p_disciplines is null or cardinality(p_disciplines) = 0 or r.discipline_id = any(p_disciplines))
    and (
      p_pool is null or cardinality(p_pool) = 0 or 'all' = any(p_pool)
      or ('unused' = any(p_pool) and not r.seen)
      or ('incorrect' = any(p_pool) and r.seen and not r.is_correct and not r.omitted)
      or ('correct' = any(p_pool) and r.is_correct)
      or ('omitted' = any(p_pool) and r.omitted)
      or ('marked' = any(p_pool) and r.marked)
    );
$$;

-- One pass over the pool instead of nine.
create or replace function public.count_questions(
  p_exam public.exam_type default null,
  p_systems smallint[] default null,
  p_disciplines smallint[] default null,
  p_competencies smallint[] default null,
  p_topics integer[] default null,
  p_pool text[] default array['unused'],
  p_nuggets_only boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_result jsonb;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  with f as (
    select r.system_id, r.discipline_id, r.seen, r.is_correct, r.omitted, r.marked,
      (p_systems is null or cardinality(p_systems) = 0 or r.system_id = any(p_systems)) as in_sys,
      (p_disciplines is null or cardinality(p_disciplines) = 0 or r.discipline_id = any(p_disciplines)) as in_disc,
      (
        p_pool is null or cardinality(p_pool) = 0 or 'all' = any(p_pool)
        or ('unused' = any(p_pool) and not r.seen)
        or ('incorrect' = any(p_pool) and r.seen and not r.is_correct and not r.omitted)
        or ('correct' = any(p_pool) and r.is_correct)
        or ('omitted' = any(p_pool) and r.omitted)
        or ('marked' = any(p_pool) and r.marked)
      ) as in_pool
    from private.pool_rows(v_user, p_exam, p_competencies, p_topics, p_nuggets_only) r
  )
  select jsonb_build_object(
    'available', count(*) filter (where in_sys and in_disc and in_pool),
    'pools', jsonb_build_object(
      'all', count(*) filter (where in_sys and in_disc),
      'unused', count(*) filter (where in_sys and in_disc and not seen),
      'incorrect', count(*) filter (where in_sys and in_disc and seen and not is_correct and not omitted),
      'marked', count(*) filter (where in_sys and in_disc and marked),
      'omitted', count(*) filter (where in_sys and in_disc and omitted),
      'correct', count(*) filter (where in_sys and in_disc and is_correct)
    ),
    'by_system', (
      select coalesce(jsonb_object_agg(x.system_id, x.n), '{}'::jsonb)
      from (select f2.system_id, count(*) n from f f2 where f2.in_disc and f2.in_pool group by f2.system_id) x),
    'by_discipline', (
      select coalesce(jsonb_object_agg(x.discipline_id, x.n), '{}'::jsonb)
      from (select f2.discipline_id, count(*) n from f f2
            where f2.in_sys and f2.in_pool and f2.discipline_id is not null group by f2.discipline_id) x)
  ) into v_result
  from f;
  return v_result;
end;
$$;

-- Same fix in the other per-row plan checks. -------------------------------------------
create or replace function public.argo_candidates()
returns table (question_id uuid, system_id smallint, discipline_id smallint, competency_id smallint, topic_id integer, is_nugget boolean, exam public.exam_type, difficulty_b real, source text, seen integer, last_correct boolean, last_seen_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select a.question_id, count(*)::integer seen,
           (array_agg(a.is_correct order by a.created_at desc))[1] last_correct,
           max(a.created_at) last_seen_at
    from public.attempts a where a.user_id = (select auth.uid())
    group by a.question_id
  )
  select q.id, q.system_id, q.discipline_id, q.competency_id, q.topic_id, q.is_nugget, q.exam,
         coalesce(st.difficulty_b, 0), q.source,
         coalesce(m.seen, 0), m.last_correct, m.last_seen_at
  from public.questions q
  left join public.question_stats st on st.question_id = q.id
  left join mine m on m.question_id = q.id
  where q.status = 'published'
    and (q.owner_id is null or q.owner_id = (select auth.uid()))
    and (q.is_free or q.owner_id is not null or (select public.has_plan('core')));
$$;

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
    and (q.is_free or q.owner_id is not null or (select public.has_plan('core')))
  order by q.id, c.n desc
  limit least(greatest(p_limit, 1), 200);
$$;

create or replace function public.library_catalog()
returns table (id integer, slug text, title text, summary text, system_slug text, system_name text, is_free boolean, reading_minutes smallint, question_count integer, has_nugget boolean, unlocked boolean, updated_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.slug, a.title, a.summary, s.slug, s.short_name, a.is_free, a.reading_minutes,
         (select count(*)::integer from public.article_questions aq where aq.article_id = a.id),
         exists (select 1 from public.article_questions aq join public.questions q on q.id = aq.question_id
                 where aq.article_id = a.id and q.is_nugget),
         (a.is_free or (select public.has_plan('core'))),
         a.updated_at
  from public.library_articles a
  join public.systems s on s.id = a.system_id
  where a.status = 'published'
  order by s.sort, a.title;
$$;

create or replace function public.article_nuggets(p_article integer)
returns table (id integer, slug text, title text, body text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct n.id, n.slug, n.title, n.body
  from public.article_questions aq
  join public.question_nuggets qn on qn.question_id = aq.question_id
  join public.nuggets n on n.id = qn.nugget_id
  join public.library_articles a on a.id = aq.article_id
  where aq.article_id = p_article
    and a.status = 'published'
    and (a.is_free or (select public.has_plan('core')));
$$;

-- RLS policies: same wrapping. Permissive policies are OR'd, so the admin "for all" policies
-- also ran is_admin() per row on every SELECT. ----------------------------------------------
alter policy "questions visible" on public.questions using (
  (select public.is_admin()) or (
    status = 'published'
    and (owner_id is null or owner_id = (select auth.uid()))
    and (is_free or owner_id is not null or (select public.has_plan('core')))
  )
);
alter policy "options visible" on public.question_options using (
  exists (
    select 1 from public.questions q
    where q.id = question_options.question_id
      and ((select public.is_admin()) or (
        q.status = 'published'
        and (q.owner_id is null or q.owner_id = (select auth.uid()))
        and (q.is_free or q.owner_id is not null or (select public.has_plan('core')))
      ))
  )
);
alter policy "articles visible" on public.library_articles
  using (status = 'published' and (is_free or (select public.has_plan('core'))));

alter policy "test items own read" on public.test_items using (
  exists (select 1 from public.tests t
          where t.id = test_items.test_id and (t.user_id = (select auth.uid()) or (select public.is_admin())))
);

alter policy "argo generations read" on public.argo_generations using (user_id = (select auth.uid()) or (select public.is_admin()));
alter policy "attempts own read" on public.attempts using (user_id = (select auth.uid()) or (select public.is_admin()));
alter policy "daily attempts own read" on public.daily_attempts using (user_id = (select auth.uid()) or (select public.is_admin()));
alter policy "profiles self read" on public.profiles using (id = (select auth.uid()) or (select public.is_admin()));
alter policy "purchases own read" on public.purchases using (user_id = (select auth.uid()) or (select public.is_admin()));
alter policy "feedback own read" on public.question_feedback using (user_id = (select auth.uid()) or (select public.is_admin()));
alter policy "subscriptions own read" on public.subscriptions using (user_id = (select auth.uid()) or (select public.is_admin()));
alter policy "tests own read" on public.tests using (user_id = (select auth.uid()) or (select public.is_admin()));

alter policy "article questions admin write" on public.article_questions using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "daily challenges admin" on public.daily_challenges using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "imports admin" on public.import_batches using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "articles admin write" on public.library_articles using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "nugget index admin" on public.nugget_index using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "nugget reviews admin" on public.nugget_reviews using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "nugget sources admin" on public.nugget_sources using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "nuggets admin write" on public.nuggets using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "profiles admin update" on public.profiles using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "feedback admin update" on public.question_feedback using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "keys admin" on public.question_keys using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "question nuggets admin" on public.question_nuggets using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "options admin write" on public.question_options using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "stats admin" on public.question_stats using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "questions admin write" on public.questions using ((select public.is_admin())) with check ((select public.is_admin()));
