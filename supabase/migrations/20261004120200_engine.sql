-- Argonaut USMLE: scoring engine, ARGO model updates, test lifecycle, daily challenge,
-- admin import and billing RPCs.
--
-- ARGO model (per answer):
--   P(correct) = 0.2 + 0.8 * sigmoid(theta_user + mean(delta_concepts) - b_item)   (3PL-style, 5 options)
--   theta += K_u (r - P);  delta_c += K_c (r - P);  b_item -= K_i (r - P)  (first attempts only)
--   K shrinks with evidence (uncertainty-weighted Elo, Pelanek 2016).
--   Memory: per-concept half-life h (days). Spaced success grows h, failure shrinks it.
--   recall(t) = 2^(-t/h). ARGO uses strength x recall to decide what to re-test.

create or replace function private.sigmoid(x double precision)
returns double precision
language sql
immutable
set search_path = ''
as $$ select 1.0 / (1.0 + exp(-greatest(least(x, 30), -30))); $$;

-- Review payload for a question (answer key, explanations, peers, nuggets, article).
create or replace function private.review_payload(p_question uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'correct_option_id', k.correct_option_id,
    'correct_label', (select o.label from public.question_options o where o.id = k.correct_option_id),
    'explanation', k.explanation,
    'option_explanations', k.option_explanations,
    'educational_objective', k.educational_objective,
    'key_concept', k.key_concept,
    'references', to_jsonb(k."references"),
    'nuggets', coalesce((
      select jsonb_agg(jsonb_build_object('id', n.id, 'slug', n.slug, 'title', n.title, 'body', n.body) order by n.id)
      from public.question_nuggets qn join public.nuggets n on n.id = qn.nugget_id
      where qn.question_id = p_question), '[]'::jsonb),
    'peer', (
      select jsonb_build_object(
        'n', st.n_attempts,
        'pct_correct', case when st.n_attempts > 0 then round(100.0 * st.n_correct / st.n_attempts) end,
        'option_pct', (
          select coalesce(jsonb_object_agg(e.key, round(100.0 * (e.value)::numeric / nullif(st.n_attempts, 0))), '{}'::jsonb)
          from jsonb_each_text(st.option_counts) e),
        'avg_time_s', case when st.n_attempts > 0 then round(st.total_time_ms / 1000.0 / st.n_attempts) end
      )
      from public.question_stats st where st.question_id = p_question),
    'article', (
      select jsonb_build_object('slug', a.slug, 'title', a.title)
      from public.article_questions aq join public.library_articles a on a.id = aq.article_id
      where aq.question_id = p_question and a.status = 'published'
      limit 1)
  )
  from public.question_keys k
  where k.question_id = p_question;
$$;

-- Update (or create) one concept state row for a user.
create or replace function private.bump_concept(
  p_user uuid, p_dim text, p_ref integer, p_signal double precision,
  p_correct boolean, p_misconception boolean, p_first boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.user_concepts;
  k double precision;
  dt double precision;
  h double precision;
begin
  if p_ref is null then return; end if;

  select * into c from public.user_concepts
  where user_id = p_user and dim = p_dim and ref_id = p_ref
  for update;

  if not found then
    insert into public.user_concepts (user_id, dim, ref_id)
    values (p_user, p_dim, p_ref)
    returning * into c;
  end if;

  k := greatest(0.12, 0.8 / (1 + 0.15 * c.n));
  if not p_first then k := k * 0.5; end if;

  dt := case when c.last_seen_at is null then null
             else extract(epoch from (now() - c.last_seen_at)) / 86400.0 end;
  h := c.half_life;
  if p_correct then
    if dt is null then
      h := 2;
    else
      h := least(180, h * (1.4 + 0.6 * least(dt / greatest(h, 0.25), 2)));
    end if;
  else
    h := greatest(0.5, h * 0.4);
  end if;

  update public.user_concepts set
    delta = greatest(-4, least(4, c.delta + k * p_signal)),
    n = c.n + 1,
    n_correct = c.n_correct + case when p_correct then 1 else 0 end,
    streak = case when p_correct then c.streak + 1 else 0 end,
    half_life = h,
    misconceptions = c.misconceptions + case when p_misconception then 1 else 0 end,
    last_seen_at = now(),
    last_correct_at = case when p_correct then now() else c.last_correct_at end
  where user_id = p_user and dim = p_dim and ref_id = p_ref;
end;
$$;

-- Record one scored answer: attempts log, peer stats, ARGO model, confusions.
create or replace function private.record_attempt(
  p_user uuid,
  p_question uuid,
  p_test uuid,
  p_kind public.test_kind,
  p_mode public.test_mode,
  p_selected uuid,
  p_time_ms integer,
  p_position smallint,
  p_block_size smallint,
  p_first uuid,
  p_changes smallint,
  p_confidence smallint,
  p_struck text[],
  p_labs boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.questions;
  v_correct_id uuid;
  v_correct_label text;
  v_correct_concept text;
  v_selected_label text;
  v_selected_concept text;
  v_first_label text;
  v_is_correct boolean;
  v_omitted boolean := p_selected is null;
  v_first_attempt boolean;
  v_pattern text;
  st public.question_stats;
  v_theta double precision;
  v_n_user integer;
  v_delta double precision;
  v_p double precision;
  v_r double precision;
  v_signal double precision;
  v_error text;
  v_avg_time double precision;
  v_trap_label text;
  v_trap_share double precision;
  v_topic_last_correct timestamptz;
  v_nugget record;
  v_time integer := greatest(0, least(coalesce(p_time_ms, 0), 3600000));
begin
  select * into q from public.questions where id = p_question;
  select k.correct_option_id, coalesce(k.key_concept, o.concept, o.body), o.label
    into v_correct_id, v_correct_concept, v_correct_label
  from public.question_keys k join public.question_options o on o.id = k.correct_option_id
  where k.question_id = p_question;

  if p_selected is not null then
    select label, coalesce(concept, body) into v_selected_label, v_selected_concept
    from public.question_options where id = p_selected and question_id = p_question;
    if v_selected_label is null then
      raise exception 'Option does not belong to question';
    end if;
  end if;
  if p_first is not null then
    select label into v_first_label from public.question_options where id = p_first and question_id = p_question;
  end if;

  v_is_correct := (p_selected is not null and p_selected = v_correct_id);

  v_pattern := case
    when p_first is null or p_selected is null or p_first = p_selected then 'none'
    when p_first = v_correct_id then 'c2i'
    when p_selected = v_correct_id then 'i2c'
    else 'i2i' end;

  v_first_attempt := not exists (
    select 1 from public.attempts a where a.user_id = p_user and a.question_id = p_question
  );

  select * into st from public.question_stats where question_id = p_question for update;
  if not found then
    insert into public.question_stats (question_id, difficulty_b)
    values (p_question, (q.author_difficulty - 3) * 0.6) returning * into st;
  end if;

  insert into public.user_ability (user_id) values (p_user) on conflict do nothing;
  select theta, n into v_theta, v_n_user from public.user_ability where user_id = p_user for update;

  select coalesce(avg(uc.delta), 0) into v_delta
  from public.user_concepts uc
  where uc.user_id = p_user and (
    (uc.dim = 'system' and uc.ref_id = q.system_id) or
    (uc.dim = 'discipline' and uc.ref_id = q.discipline_id) or
    (uc.dim = 'competency' and uc.ref_id = q.competency_id) or
    (uc.dim = 'topic' and uc.ref_id = q.topic_id)
  );

  v_p := 0.2 + 0.8 * private.sigmoid(v_theta + v_delta - st.difficulty_b);
  v_r := case when v_is_correct then 1 else 0 end;
  v_signal := v_r - v_p;

  -- Error taxonomy -------------------------------------------------------------
  v_avg_time := case when st.n_attempts >= 10 then st.total_time_ms::double precision / st.n_attempts else 75000 end;
  if st.n_attempts >= 10 then
    select e.key, (e.value)::double precision / st.n_attempts into v_trap_label, v_trap_share
    from jsonb_each_text(st.option_counts) e
    where e.key <> v_correct_label
    order by (e.value)::integer desc
    limit 1;
  end if;
  select last_correct_at into v_topic_last_correct from public.user_concepts
  where user_id = p_user and dim = 'topic' and ref_id = q.topic_id;

  if v_omitted then
    v_error := 'omitted';
  elsif not v_is_correct then
    v_error := case
      when v_pattern = 'c2i' then 'second_guess'
      when p_confidence = 3 then 'misconception'
      when v_time < greatest(15000, 0.4 * v_avg_time) and v_p >= 0.6 then 'rushed'
      when v_trap_label is not null and v_selected_label = v_trap_label and v_trap_share >= 0.25 then 'trap'
      when v_topic_last_correct is not null and v_topic_last_correct < now() - interval '7 days' then 'retention'
      when v_time > greatest(150000, 2 * v_avg_time) then 'time_sink'
      else 'gap' end;
  elsif p_confidence = 1 then
    v_error := 'lucky_guess';
  end if;

  insert into public.attempts (
    user_id, question_id, test_id, kind, mode, selected_option_id, selected_label, correct_label,
    is_correct, omitted, time_ms, position, block_size, first_label, changes, change_pattern,
    confidence, struck_correct, labs_opened, is_first_attempt, predicted_p, error_type,
    system_id, discipline_id, competency_id, topic_id
  ) values (
    p_user, p_question, p_test, p_kind, p_mode, p_selected, v_selected_label, v_correct_label,
    v_is_correct, v_omitted, v_time, p_position, p_block_size, v_first_label, coalesce(p_changes, 0), v_pattern,
    p_confidence, coalesce(v_correct_label = any(p_struck), false), coalesce(p_labs, false), v_first_attempt, v_p, v_error,
    q.system_id, q.discipline_id, q.competency_id, q.topic_id
  );

  -- Peer statistics (first attempts only, so memory does not inflate them).
  if v_first_attempt then
    update public.question_stats set
      n_attempts = st.n_attempts + 1,
      n_correct = st.n_correct + v_r::integer,
      option_counts = case when v_selected_label is null then st.option_counts
        else jsonb_set(st.option_counts, array[v_selected_label],
               to_jsonb(coalesce((st.option_counts ->> v_selected_label)::integer, 0) + 1)) end,
      total_time_ms = st.total_time_ms + v_time,
      difficulty_b = greatest(-4, least(4, st.difficulty_b - greatest(0.03, 0.5 / (1 + 0.05 * st.n_attempts)) * v_signal)),
      updated_at = now()
    where question_id = p_question;
  end if;

  -- ARGO ability + concept states.
  update public.user_ability set
    theta = greatest(-5, least(5, v_theta + greatest(0.08, 0.6 / (1 + 0.04 * v_n_user)) * v_signal * case when v_first_attempt then 1 else 0.5 end)),
    n = v_n_user + 1,
    updated_at = now()
  where user_id = p_user;

  perform private.bump_concept(p_user, 'system', q.system_id, v_signal, v_is_correct, v_error = 'misconception', v_first_attempt);
  perform private.bump_concept(p_user, 'discipline', q.discipline_id, v_signal, v_is_correct, v_error = 'misconception', v_first_attempt);
  perform private.bump_concept(p_user, 'competency', q.competency_id, v_signal, v_is_correct, v_error = 'misconception', v_first_attempt);
  perform private.bump_concept(p_user, 'topic', q.topic_id, v_signal, v_is_correct, v_error = 'misconception', v_first_attempt);
  for v_nugget in select nugget_id from public.question_nuggets where question_id = p_question loop
    perform private.bump_concept(p_user, 'nugget', v_nugget.nugget_id, v_signal, v_is_correct, v_error = 'misconception', v_first_attempt);
  end loop;

  if not v_is_correct and not v_omitted and v_selected_concept is not null and v_correct_concept is not null then
    insert into public.user_confusions (user_id, correct_concept, chosen_concept, n, last_question_id, last_at)
    values (p_user, left(v_correct_concept, 200), left(v_selected_concept, 200), 1, p_question, now())
    on conflict (user_id, correct_concept, chosen_concept)
    do update set n = public.user_confusions.n + 1, last_question_id = excluded.last_question_id, last_at = now();
  end if;

  return jsonb_build_object('is_correct', v_is_correct, 'error_type', v_error, 'predicted_p', round(v_p::numeric, 3));
end;
$$;

-- Daily snapshot of a user's ARGO state (trend lines on the dashboard).
create or replace function private.snapshot_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_theta double precision;
  v_readiness double precision;
  v_acc double precision;
  v_n integer;
  v_mastery jsonb;
begin
  select theta into v_theta from public.user_ability where user_id = p_user;
  if v_theta is null then return; end if;

  select
    sum(s.step1_weight * (coalesce(uc.n, 0)::double precision / (coalesce(uc.n, 0) + 3) * private.sigmoid(v_theta + coalesce(uc.delta, 0))
        + 3.0 / (coalesce(uc.n, 0) + 3) * 0.35)) / nullif(sum(s.step1_weight), 0),
    jsonb_object_agg(s.slug, round((private.sigmoid(v_theta + coalesce(uc.delta, 0)))::numeric, 3))
  into v_readiness, v_mastery
  from public.systems s
  left join public.user_concepts uc on uc.user_id = p_user and uc.dim = 'system' and uc.ref_id = s.id;

  select avg(case when is_correct then 1.0 else 0.0 end), count(*) into v_acc, v_n
  from public.attempts where user_id = p_user and created_at > now() - interval '30 days';

  insert into public.argo_snapshots (user_id, day, theta, readiness, accuracy, n_attempts, mastery)
  values (p_user, (now() at time zone 'utc')::date, v_theta, round((100 * v_readiness)::numeric, 1), v_acc, v_n, v_mastery)
  on conflict (user_id, day) do update set
    theta = excluded.theta, readiness = excluded.readiness, accuracy = excluded.accuracy,
    n_attempts = excluded.n_attempts, mastery = excluded.mastery;
end;
$$;

-- ---------------------------------------------------------------------------------------
-- Test lifecycle
-- ---------------------------------------------------------------------------------------

-- Pool-filtered question ids the current user may draw from.
create or replace function private.candidate_questions(
  p_user uuid,
  p_exam public.exam_type,
  p_systems smallint[],
  p_disciplines smallint[],
  p_competencies smallint[],
  p_topics integer[],
  p_pool text[],
  p_nuggets_only boolean
)
returns table (question_id uuid, system_id smallint, discipline_id smallint)
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
  select q.id, q.system_id, q.discipline_id
  from public.questions q
  left join last_att la on la.question_id = q.id
  where q.status = 'published'
    and (q.owner_id is null or q.owner_id = p_user)
    and (q.is_free or q.owner_id is not null or public.has_plan('core'))
    and (p_exam is null or q.exam = p_exam)
    and (p_systems is null or cardinality(p_systems) = 0 or q.system_id = any(p_systems))
    and (p_disciplines is null or cardinality(p_disciplines) = 0 or q.discipline_id = any(p_disciplines))
    and (p_competencies is null or cardinality(p_competencies) = 0 or q.competency_id = any(p_competencies))
    and (p_topics is null or cardinality(p_topics) = 0 or q.topic_id = any(p_topics))
    and (not coalesce(p_nuggets_only, false) or q.is_nugget)
    and (
      p_pool is null or cardinality(p_pool) = 0 or 'all' = any(p_pool)
      or ('unused' = any(p_pool) and la.question_id is null)
      or ('incorrect' = any(p_pool) and la.question_id is not null and not la.is_correct and not la.omitted)
      or ('correct' = any(p_pool) and la.is_correct)
      or ('omitted' = any(p_pool) and la.omitted)
      or ('marked' = any(p_pool) and q.id in (select m.question_id from marked m))
    );
$$;

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
  select jsonb_build_object(
    'available', (select count(*) from private.candidate_questions(v_user, p_exam, p_systems, p_disciplines, p_competencies, p_topics, p_pool, p_nuggets_only)),
    'pools', jsonb_build_object(
      'all', (select count(*) from private.candidate_questions(v_user, p_exam, p_systems, p_disciplines, p_competencies, p_topics, array['all'], p_nuggets_only)),
      'unused', (select count(*) from private.candidate_questions(v_user, p_exam, p_systems, p_disciplines, p_competencies, p_topics, array['unused'], p_nuggets_only)),
      'incorrect', (select count(*) from private.candidate_questions(v_user, p_exam, p_systems, p_disciplines, p_competencies, p_topics, array['incorrect'], p_nuggets_only)),
      'marked', (select count(*) from private.candidate_questions(v_user, p_exam, p_systems, p_disciplines, p_competencies, p_topics, array['marked'], p_nuggets_only)),
      'omitted', (select count(*) from private.candidate_questions(v_user, p_exam, p_systems, p_disciplines, p_competencies, p_topics, array['omitted'], p_nuggets_only)),
      'correct', (select count(*) from private.candidate_questions(v_user, p_exam, p_systems, p_disciplines, p_competencies, p_topics, array['correct'], p_nuggets_only))
    ),
    'by_system', (
      select coalesce(jsonb_object_agg(x.system_id, x.n), '{}'::jsonb) from (
        select c.system_id, count(*) n
        from private.candidate_questions(v_user, p_exam, null, p_disciplines, p_competencies, p_topics, p_pool, p_nuggets_only) c
        group by c.system_id) x),
    'by_discipline', (
      select coalesce(jsonb_object_agg(x.discipline_id, x.n), '{}'::jsonb) from (
        select c.discipline_id, count(*) n
        from private.candidate_questions(v_user, p_exam, p_systems, null, p_competencies, p_topics, p_pool, p_nuggets_only) c
        where c.discipline_id is not null
        group by c.discipline_id) x)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function private.insert_test(
  p_user uuid, p_ids uuid[], p_kind public.test_kind, p_mode public.test_mode,
  p_name text, p_filters jsonb, p_meta jsonb, p_seconds integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_test uuid;
begin
  if p_ids is null or cardinality(p_ids) = 0 then
    raise exception 'No questions match these filters' using errcode = 'P0001';
  end if;
  insert into public.tests (user_id, name, kind, mode, filters, question_count, seconds_per_question, meta)
  values (p_user, p_name, p_kind, p_mode, coalesce(p_filters, '{}'::jsonb), cardinality(p_ids),
          greatest(30, least(coalesce(p_seconds, 90), 600)), coalesce(p_meta, '{}'::jsonb))
  returning id into v_test;

  insert into public.test_items (test_id, position, question_id)
  select v_test, (ord - 1)::smallint, qid from unnest(p_ids) with ordinality as u(qid, ord);

  return v_test;
end;
$$;

create or replace function public.create_test(
  p_mode public.test_mode,
  p_count integer,
  p_name text default null,
  p_exam public.exam_type default null,
  p_systems smallint[] default null,
  p_disciplines smallint[] default null,
  p_competencies smallint[] default null,
  p_topics integer[] default null,
  p_pool text[] default array['unused'],
  p_nuggets_only boolean default false,
  p_seconds_per_question integer default 90
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_ids uuid[];
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if p_count < 1 or p_count > 40 then raise exception 'A block holds 1 to 40 questions'; end if;

  select array_agg(c.question_id) into v_ids from (
    select question_id from private.candidate_questions(
      v_user, p_exam, p_systems, p_disciplines, p_competencies, p_topics, p_pool, p_nuggets_only)
    order by random()
    limit p_count
  ) c;

  return private.insert_test(
    v_user, v_ids, 'custom', p_mode, p_name,
    jsonb_build_object('exam', p_exam, 'systems', p_systems, 'disciplines', p_disciplines,
      'competencies', p_competencies, 'topics', p_topics, 'pool', p_pool, 'nuggets_only', p_nuggets_only),
    '{}'::jsonb, p_seconds_per_question);
end;
$$;

-- Used by ARGO (TypeScript selects the ids) and "re-test these" flows.
create or replace function public.create_test_from_ids(
  p_ids uuid[],
  p_kind public.test_kind default 'custom',
  p_mode public.test_mode default 'tutor',
  p_name text default null,
  p_meta jsonb default '{}'::jsonb,
  p_seconds_per_question integer default 90
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_ids uuid[];
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if p_kind = 'argo' and not public.has_plan('argo') then
    raise exception 'ARGO sessions require the ARGO plan' using errcode = '42501';
  end if;
  if cardinality(p_ids) > 40 then raise exception 'A block holds at most 40 questions'; end if;

  -- Keep caller order, drop anything the user may not see.
  select array_agg(u.qid order by u.ord) into v_ids
  from unnest(p_ids) with ordinality as u(qid, ord)
  join public.questions q on q.id = u.qid
  where public.can_view_question(q.status, q.owner_id, q.is_free);

  return private.insert_test(v_user, v_ids, p_kind, p_mode, p_name, '{}'::jsonb, p_meta, p_seconds_per_question);
end;
$$;

create or replace function public.get_test(p_test uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_test public.tests;
  v_items jsonb;
begin
  select * into v_test from public.tests where id = p_test and user_id = (select auth.uid());
  if not found then raise exception 'Test not found' using errcode = 'P0002'; end if;

  select coalesce(jsonb_agg(x.item order by x.pos), '[]'::jsonb) into v_items
  from (
    select ti.position as pos, jsonb_build_object(
      'position', ti.position,
      'question_id', q.id,
      'code', q.code,
      'exam', q.exam,
      'stem', q.stem,
      'lead_in', q.lead_in,
      'media', q.media,
      'is_nugget', q.is_nugget,
      'source', q.source,
      'system', s.short_name,
      'system_slug', s.slug,
      'discipline', d.name,
      'competency', c.name,
      'topic', t.name,
      'options', (
        select jsonb_agg(jsonb_build_object('id', o.id, 'label', o.label, 'body', o.body) order by o.label)
        from public.question_options o where o.question_id = q.id),
      'state', jsonb_build_object(
        'selected_option_id', ti.selected_option_id,
        'first_option_id', ti.first_option_id,
        'changes', ti.changes,
        'confidence', ti.confidence,
        'marked', ti.marked,
        'struck', to_jsonb(ti.struck),
        'highlights', ti.highlights,
        'time_ms', ti.time_ms,
        'labs_opened', ti.labs_opened,
        'submitted', ti.submitted,
        'is_correct', case when ti.submitted or v_test.status = 'completed' then ti.is_correct end),
      'review', case when v_test.status = 'completed' or (ti.submitted and v_test.mode = 'tutor')
                     then private.review_payload(q.id) end
    ) as item
    from public.test_items ti
    join public.questions q on q.id = ti.question_id
    join public.systems s on s.id = q.system_id
    left join public.disciplines d on d.id = q.discipline_id
    left join public.competencies c on c.id = q.competency_id
    left join public.topics t on t.id = q.topic_id
    where ti.test_id = p_test
  ) x;

  return jsonb_build_object('test', to_jsonb(v_test), 'items', v_items);
end;
$$;

-- Persist interaction state without scoring (timed mode, marks, strikes, highlights).
create or replace function public.save_item(
  p_test uuid,
  p_position smallint,
  p_option uuid default null,
  p_first uuid default null,
  p_changes smallint default 0,
  p_confidence smallint default null,
  p_marked boolean default false,
  p_struck text[] default '{}',
  p_highlights jsonb default '[]'::jsonb,
  p_time_ms integer default 0,
  p_labs boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_test public.tests;
  v_item public.test_items;
begin
  select * into v_test from public.tests where id = p_test and user_id = (select auth.uid()) for update;
  if not found then raise exception 'Test not found' using errcode = 'P0002'; end if;
  select * into v_item from public.test_items where test_id = p_test and position = p_position;
  if not found then raise exception 'Item not found' using errcode = 'P0002'; end if;

  if v_item.submitted or v_test.status = 'completed' then
    -- Answers are locked; still allow marks, strikes, highlights.
    update public.test_items set
      marked = coalesce(p_marked, marked),
      struck = coalesce(p_struck, struck),
      highlights = coalesce(p_highlights, highlights)
    where test_id = p_test and position = p_position;
    return;
  end if;

  if p_option is not null and not exists (
    select 1 from public.question_options o where o.id = p_option and o.question_id = v_item.question_id
  ) then
    raise exception 'Option does not belong to question';
  end if;

  update public.test_items set
    selected_option_id = p_option,
    first_option_id = coalesce(first_option_id, p_first, p_option),
    changes = greatest(changes, coalesce(p_changes, 0)),
    confidence = coalesce(p_confidence, confidence),
    marked = coalesce(p_marked, marked),
    struck = coalesce(p_struck, struck),
    highlights = coalesce(p_highlights, highlights),
    time_ms = greatest(time_ms, least(coalesce(p_time_ms, 0), 3600000)),
    labs_opened = labs_opened or coalesce(p_labs, false),
    answered_at = case when p_option is not null then now() else answered_at end
  where test_id = p_test and position = p_position;
end;
$$;

-- Tutor mode: lock an answer and reveal its explanation.
create or replace function public.submit_item(
  p_test uuid,
  p_position smallint,
  p_option uuid,
  p_first uuid default null,
  p_changes smallint default 0,
  p_confidence smallint default null,
  p_struck text[] default '{}',
  p_time_ms integer default 0,
  p_labs boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_test public.tests;
  v_item public.test_items;
  v_res jsonb;
begin
  select * into v_test from public.tests where id = p_test and user_id = v_user for update;
  if not found then raise exception 'Test not found' using errcode = 'P0002'; end if;
  if v_test.status = 'completed' then raise exception 'Test already completed'; end if;
  if v_test.mode = 'timed' then raise exception 'Timed blocks are scored when the block ends'; end if;

  select * into v_item from public.test_items where test_id = p_test and position = p_position for update;
  if not found then raise exception 'Item not found' using errcode = 'P0002'; end if;
  if v_item.submitted then
    return jsonb_build_object('is_correct', v_item.is_correct, 'review', private.review_payload(v_item.question_id));
  end if;

  v_res := private.record_attempt(
    v_user, v_item.question_id, p_test, v_test.kind, v_test.mode, p_option,
    greatest(coalesce(p_time_ms, 0), v_item.time_ms), p_position, v_test.question_count,
    coalesce(v_item.first_option_id, p_first, p_option), greatest(v_item.changes, coalesce(p_changes, 0)),
    coalesce(p_confidence, v_item.confidence), coalesce(p_struck, v_item.struck), v_item.labs_opened or coalesce(p_labs, false));

  update public.test_items set
    selected_option_id = p_option,
    first_option_id = coalesce(first_option_id, p_first, p_option),
    changes = greatest(changes, coalesce(p_changes, 0)),
    confidence = coalesce(p_confidence, confidence),
    struck = coalesce(p_struck, struck),
    time_ms = greatest(time_ms, coalesce(p_time_ms, 0)),
    submitted = true,
    is_correct = (v_res ->> 'is_correct')::boolean,
    answered_at = now()
  where test_id = p_test and position = p_position;

  return v_res || jsonb_build_object('review', private.review_payload(v_item.question_id));
end;
$$;

create or replace function public.save_progress(
  p_test uuid, p_position smallint, p_elapsed integer, p_suspend boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.tests set
    current_position = greatest(0, least(p_position, question_count - 1)),
    elapsed_seconds = greatest(elapsed_seconds, least(coalesce(p_elapsed, 0), 86400)),
    status = case when status = 'completed' then status
                  when p_suspend then 'suspended'::public.test_status
                  else 'active'::public.test_status end
  where id = p_test and user_id = (select auth.uid());
  if not found then raise exception 'Test not found' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.end_test(p_test uuid, p_elapsed integer default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_test public.tests;
  v_item public.test_items;
  v_res jsonb;
  v_correct integer;
  v_answered integer;
begin
  select * into v_test from public.tests where id = p_test and user_id = v_user for update;
  if not found then raise exception 'Test not found' using errcode = 'P0002'; end if;

  if v_test.status <> 'completed' then
    for v_item in
      select * from public.test_items where test_id = p_test and not submitted order by position
    loop
      v_res := private.record_attempt(
        v_user, v_item.question_id, p_test, v_test.kind, v_test.mode, v_item.selected_option_id,
        v_item.time_ms, v_item.position, v_test.question_count, v_item.first_option_id,
        v_item.changes, v_item.confidence, v_item.struck, v_item.labs_opened);
      update public.test_items set submitted = true, is_correct = (v_res ->> 'is_correct')::boolean
      where test_id = p_test and position = v_item.position;
    end loop;

    select count(*) filter (where is_correct), count(*) filter (where selected_option_id is not null)
      into v_correct, v_answered
    from public.test_items where test_id = p_test;

    update public.tests set
      status = 'completed',
      completed_at = now(),
      correct_count = v_correct,
      answered_count = v_answered,
      elapsed_seconds = greatest(elapsed_seconds, coalesce(p_elapsed, 0))
    where id = p_test;

    update public.argo_sessions set result = jsonb_build_object('correct', v_correct, 'answered', v_answered, 'total', v_test.question_count)
    where test_id = p_test;

    perform private.snapshot_user(v_user);
  end if;

  return public.get_test(p_test);
end;
$$;

-- ---------------------------------------------------------------------------------------
-- Performance analytics
-- ---------------------------------------------------------------------------------------
create or replace function public.performance_overview()
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

  with mine as (
    select * from public.attempts where user_id = v_user and is_first_attempt
  ),
  peers as (
    select user_id, avg(case when is_correct then 1.0 else 0 end) acc, count(*) n
    from public.attempts where is_first_attempt and kind <> 'daily'
    group by user_id having count(*) >= 20
  ),
  my_acc as (select avg(case when is_correct then 1.0 else 0 end) acc, count(*) n from mine),
  bank as (
    select count(*) n from public.questions q
    where q.status = 'published' and q.owner_id is null
  )
  select jsonb_build_object(
    'answered', (select count(*) from mine),
    'correct', (select count(*) from mine where is_correct),
    'omitted', (select count(*) from mine where omitted),
    'accuracy', (select round(100 * acc, 1) from my_acc),
    'avg_time_s', (select round(avg(time_ms) / 1000.0) from mine where not omitted),
    'bank_size', (select n from bank),
    'used', (select count(distinct question_id) from mine),
    'percentile', case when (select n from my_acc) >= 20 and (select count(*) from peers) >= 5 then (
      select round(100.0 * count(*) filter (where p.acc < m.acc) / count(*))
      from peers p, my_acc m) end,
    'peer_count', (select count(*) from peers),
    'peer_accuracy', (select round(100 * avg(acc), 1) from peers),
    'changes', (select jsonb_build_object(
        'c2i', count(*) filter (where change_pattern = 'c2i'),
        'i2c', count(*) filter (where change_pattern = 'i2c'),
        'i2i', count(*) filter (where change_pattern = 'i2i')) from public.attempts where user_id = v_user),
    'by_system', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id, 'slug', s.slug, 'name', s.short_name, 'n', x.n, 'correct', x.c,
        'accuracy', round(100.0 * x.c / nullif(x.n, 0), 1),
        'peer_accuracy', (select round(100.0 * avg(case when a.is_correct then 1 else 0 end), 1)
                          from public.attempts a where a.is_first_attempt and a.system_id = s.id))
        order by s.sort), '[]'::jsonb)
      from public.systems s
      join (select system_id, count(*) n, count(*) filter (where is_correct) c from mine group by system_id) x on x.system_id = s.id),
    'by_discipline', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', d.id, 'slug', d.slug, 'name', d.name, 'n', x.n, 'correct', x.c,
        'accuracy', round(100.0 * x.c / nullif(x.n, 0), 1),
        'peer_accuracy', (select round(100.0 * avg(case when a.is_correct then 1 else 0 end), 1)
                          from public.attempts a where a.is_first_attempt and a.discipline_id = d.id))
        order by d.sort), '[]'::jsonb)
      from public.disciplines d
      join (select discipline_id, count(*) n, count(*) filter (where is_correct) c from mine group by discipline_id) x on x.discipline_id = d.id),
    'by_competency', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'slug', c.slug, 'name', c.name, 'group', c.group_name, 'n', x.n, 'correct', x.c,
        'accuracy', round(100.0 * x.c / nullif(x.n, 0), 1)) order by c.sort), '[]'::jsonb)
      from public.competencies c
      join (select competency_id, count(*) n, count(*) filter (where is_correct) cc from mine group by competency_id) x(competency_id, n, c) on x.competency_id = c.id),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'n', d.n, 'correct', d.c) order by d.day), '[]'::jsonb)
      from (select (created_at at time zone 'utc')::date as day, count(*) n, count(*) filter (where is_correct) c
            from public.attempts where user_id = v_user and created_at > now() - interval '120 days'
            group by 1) d)
  ) into v_result;

  return v_result;
end;
$$;

-- Question metadata for ARGO's TypeScript planner (no answer data).
create or replace function public.argo_candidates()
returns table (
  question_id uuid, system_id smallint, discipline_id smallint, competency_id smallint, topic_id integer,
  is_nugget boolean, exam public.exam_type, difficulty_b real, source text,
  seen integer, last_correct boolean, last_seen_at timestamptz
)
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
    and (q.is_free or q.owner_id is not null or public.has_plan('core'));
$$;

-- ---------------------------------------------------------------------------------------
-- Daily challenge (playable without an account via a guest token)
-- ---------------------------------------------------------------------------------------
create or replace function private.daily_day()
returns date
language sql
stable
set search_path = ''
as $$ select (now() at time zone 'utc')::date; $$;

create or replace function private.ensure_daily(p_day date)
returns public.daily_challenges
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.daily_challenges;
  v_q uuid;
begin
  select * into v from public.daily_challenges where day = p_day;
  if found then return v; end if;

  -- Prefer never-used eligible questions, then the least recently used.
  select q.id into v_q
  from public.questions q
  left join lateral (select max(dc.day) last_day from public.daily_challenges dc where dc.question_id = q.id) u on true
  where q.is_daily_eligible and q.status = 'published' and q.owner_id is null
  order by u.last_day nulls first, hashtext(p_day::text || q.id::text)
  limit 1;

  if v_q is null then return null; end if;

  insert into public.daily_challenges (day, question_id) values (p_day, v_q)
  on conflict (day) do nothing;
  select * into v from public.daily_challenges where day = p_day;
  return v;
end;
$$;

create or replace function private.daily_number(p_day date)
returns integer
language sql
immutable
set search_path = ''
as $$ select (p_day - date '2026-10-01') + 1; $$;

create or replace function private.daily_attempt_for(p_day date, p_guest uuid)
returns public.daily_attempts
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.daily_attempts a
  where a.day = p_day
    and ((select auth.uid()) is not null and a.user_id = (select auth.uid())
         or (select auth.uid()) is null and p_guest is not null and a.guest_token = p_guest and a.user_id is null)
  limit 1;
$$;

create or replace function private.daily_result(p_attempt public.daily_attempts, p_limit smallint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'is_correct', p_attempt.is_correct,
    'selected_option_id', p_attempt.selected_option_id,
    'time_ms', p_attempt.time_ms,
    'score', p_attempt.score,
    'timed_out', p_attempt.time_ms > (p_limit + 3) * 1000,
    'rank', (select count(*) + 1 from public.daily_attempts o
             where o.day = p_attempt.day and o.user_id is not null and o.submitted_at is not null
               and (o.score > p_attempt.score or (o.score = p_attempt.score and o.time_ms < p_attempt.time_ms))),
    'players', (select count(*) from public.daily_attempts o where o.day = p_attempt.day and o.submitted_at is not null),
    'pct_correct', (select round(100.0 * count(*) filter (where o.is_correct) / nullif(count(*), 0))
                    from public.daily_attempts o where o.day = p_attempt.day and o.submitted_at is not null)
  );
$$;

create or replace function public.daily_today(p_guest uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := private.daily_day();
  v_dc public.daily_challenges;
  q public.questions;
  v_att public.daily_attempts;
  v_state text := 'none';
  v_payload jsonb := null;
begin
  v_dc := private.ensure_daily(v_day);
  if v_dc is null then
    return jsonb_build_object('day', v_day, 'available', false);
  end if;
  select * into q from public.questions where id = v_dc.question_id;
  v_att := private.daily_attempt_for(v_day, p_guest);

  if v_att.id is not null then
    v_state := case when v_att.submitted_at is null then 'started' else 'done' end;
  end if;

  if v_state = 'started' then
    v_payload := jsonb_build_object(
      'stem', q.stem, 'lead_in', q.lead_in, 'media', q.media,
      'options', (select jsonb_agg(jsonb_build_object('id', o.id, 'label', o.label, 'body', o.body) order by o.label)
                  from public.question_options o where o.question_id = q.id),
      'started_at', v_att.started_at,
      'elapsed_ms', (extract(epoch from (now() - v_att.started_at)) * 1000)::integer);
  elsif v_state = 'done' then
    v_payload := jsonb_build_object(
      'stem', q.stem, 'lead_in', q.lead_in, 'media', q.media,
      'options', (select jsonb_agg(jsonb_build_object('id', o.id, 'label', o.label, 'body', o.body) order by o.label)
                  from public.question_options o where o.question_id = q.id),
      'result', private.daily_result(v_att, v_dc.time_limit_s),
      'review', private.review_payload(q.id));
  end if;

  return jsonb_build_object(
    'day', v_day,
    'number', private.daily_number(v_day),
    'available', true,
    'time_limit_s', v_dc.time_limit_s,
    'system', (select s.short_name from public.systems s where s.id = q.system_id),
    'discipline', (select d.name from public.disciplines d where d.id = q.discipline_id),
    'difficulty', q.author_difficulty,
    'state', v_state,
    'payload', v_payload,
    'players', (select count(*) from public.daily_attempts a where a.day = v_day and a.submitted_at is not null),
    'pct_correct', (select round(100.0 * count(*) filter (where a.is_correct) / nullif(count(*), 0))
                    from public.daily_attempts a where a.day = v_day and a.submitted_at is not null),
    'next_reset', ((v_day + 1)::timestamp at time zone 'utc')
  );
end;
$$;

create or replace function public.daily_start(p_guest uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_day date := private.daily_day();
  v_dc public.daily_challenges;
begin
  if v_user is null and p_guest is null then raise exception 'Guest token required'; end if;
  v_dc := private.ensure_daily(v_day);
  if v_dc is null then raise exception 'No challenge today'; end if;

  if (private.daily_attempt_for(v_day, p_guest)).id is null then
    insert into public.daily_attempts (day, user_id, guest_token)
    values (v_day, v_user, case when v_user is null then p_guest end)
    on conflict do nothing;
  end if;

  return public.daily_today(p_guest);
end;
$$;

create or replace function public.daily_submit(p_option uuid, p_guest uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_day date := private.daily_day();
  v_dc public.daily_challenges;
  v_att public.daily_attempts;
  v_correct_id uuid;
  v_time integer;
  v_ok boolean;
  v_score integer;
  v_streak integer;
  v_last date;
begin
  select * into v_dc from public.daily_challenges where day = v_day;
  if not found then raise exception 'No challenge today'; end if;

  v_att := private.daily_attempt_for(v_day, p_guest);
  if v_att.id is null then raise exception 'Start the challenge first'; end if;
  if v_att.submitted_at is not null then return public.daily_today(p_guest); end if;

  if p_option is not null and not exists (
    select 1 from public.question_options o where o.id = p_option and o.question_id = v_dc.question_id
  ) then
    raise exception 'Option does not belong to question';
  end if;

  select correct_option_id into v_correct_id from public.question_keys where question_id = v_dc.question_id;
  v_time := (extract(epoch from (now() - v_att.started_at)) * 1000)::integer;
  v_ok := p_option is not null and p_option = v_correct_id and v_time <= (v_dc.time_limit_s + 3) * 1000;
  v_score := case when v_ok then round(1000 * (0.5 + 0.5 * greatest(0, 1 - v_time / (v_dc.time_limit_s * 1000.0))))::integer else 0 end;

  update public.daily_attempts set
    submitted_at = now(), selected_option_id = p_option, is_correct = v_ok, time_ms = v_time, score = v_score
  where id = v_att.id;

  if v_user is not null then
    select daily_streak, daily_last_win into v_streak, v_last from public.profiles where id = v_user;
    update public.profiles set
      daily_streak = case when v_ok then (case when v_last = v_day - 1 then coalesce(v_streak, 0) + 1 else 1 end) else 0 end,
      daily_best_streak = greatest(daily_best_streak, case when v_ok then (case when v_last = v_day - 1 then coalesce(v_streak, 0) + 1 else 1 end) else 0 end),
      daily_last_win = case when v_ok then v_day else daily_last_win end
    where id = v_user;
  end if;

  return public.daily_today(p_guest);
end;
$$;

-- Attach a guest's attempt to the account they just created.
create or replace function public.daily_claim(p_guest uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_claimed integer := 0;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  update public.daily_attempts a set user_id = v_user, guest_token = null
  where a.guest_token = p_guest and a.user_id is null
    and not exists (select 1 from public.daily_attempts b where b.day = a.day and b.user_id = v_user);
  get diagnostics v_claimed = row_count;

  if v_claimed > 0 then
    update public.profiles p set
      daily_streak = case when exists (select 1 from public.daily_attempts a where a.user_id = v_user and a.day = private.daily_day() and a.is_correct) then 1 else p.daily_streak end,
      daily_best_streak = greatest(p.daily_best_streak, 1),
      daily_last_win = coalesce((select max(day) from public.daily_attempts a where a.user_id = v_user and a.is_correct), p.daily_last_win)
    where p.id = v_user;
  end if;
  return jsonb_build_object('claimed', v_claimed);
end;
$$;

create or replace function public.daily_leaderboard(p_day date default null, p_limit integer default 50)
returns table (
  rank bigint, username text, display_name text, country text, score integer, time_ms integer,
  is_correct boolean, streak integer, is_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    rank() over (order by a.score desc, a.time_ms asc),
    p.username::text, p.display_name, p.country, a.score, a.time_ms, a.is_correct, p.daily_streak,
    a.user_id = (select auth.uid())
  from public.daily_attempts a
  join public.profiles p on p.id = a.user_id
  where a.day = coalesce(p_day, private.daily_day()) and a.submitted_at is not null
  order by a.score desc, a.time_ms asc
  limit least(greatest(p_limit, 1), 200);
$$;

create or replace function public.streak_leaderboard(p_limit integer default 25)
returns table (rank bigint, username text, display_name text, country text, streak integer, best_streak integer, is_me boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select rank() over (order by p.daily_streak desc, p.daily_best_streak desc),
         p.username::text, p.display_name, p.country, p.daily_streak, p.daily_best_streak, p.id = (select auth.uid())
  from public.profiles p
  where p.daily_streak > 0 or p.daily_best_streak > 0
  order by p.daily_streak desc, p.daily_best_streak desc
  limit least(greatest(p_limit, 1), 100);
$$;

-- ---------------------------------------------------------------------------------------
-- Nugget matching and admin import (admin JWT or the service key)
-- ---------------------------------------------------------------------------------------
create or replace function public.match_nugget_index(
  p_embedding extensions.vector(384), p_count integer default 8, p_min real default 0.78
)
returns table (id integer, body text, section text, source text, similarity real)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return query
    select ni.id, ni.body, ni.section, ns.slug, (-(ni.embedding operator(extensions.<#>) p_embedding))::real
    from public.nugget_index ni join public.nugget_sources ns on ns.id = ni.source_id
    where ni.embedding is not null
      and -(ni.embedding operator(extensions.<#>) p_embedding) >= p_min
    order by ni.embedding operator(extensions.<#>) p_embedding
    limit least(greatest(p_count, 1), 50);
end;
$$;

create or replace function private.slugify(p text)
returns text
language sql
immutable
set search_path = ''
as $$ select trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(p, ''))), '[^a-z0-9]+', '-', 'g')); $$;

-- Upsert one question from the import format. Returns {id, code, created}.
create or replace function public.admin_upsert_question(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_system smallint;
  v_discipline smallint;
  v_competency smallint;
  v_category integer;
  v_topic integer;
  v_qid uuid;
  v_created boolean := false;
  v_opt jsonb;
  v_correct uuid;
  v_code text := nullif(trim(p ->> 'code'), '');
  v_nug jsonb;
  v_nugget_id integer;
  v_any_nugget boolean := false;
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;

  select id into v_system from public.systems
  where slug = p ->> 'system' or lower(name) = lower(p ->> 'system') or lower(short_name) = lower(p ->> 'system');
  if v_system is null then raise exception 'Unknown system: %', p ->> 'system'; end if;

  if nullif(p ->> 'discipline', '') is not null then
    select id into v_discipline from public.disciplines
    where slug = p ->> 'discipline' or lower(name) = lower(p ->> 'discipline');
    if v_discipline is null then raise exception 'Unknown discipline: %', p ->> 'discipline'; end if;
  end if;
  if nullif(p ->> 'competency', '') is not null then
    select id into v_competency from public.competencies
    where slug = p ->> 'competency' or lower(name) = lower(p ->> 'competency');
    if v_competency is null then raise exception 'Unknown competency: %', p ->> 'competency'; end if;
  end if;
  if nullif(p ->> 'category', '') is not null then
    select id into v_category from public.categories
    where system_id = v_system and (slug = private.slugify(p ->> 'category') or lower(name) = lower(p ->> 'category'));
  end if;
  if nullif(p ->> 'topic', '') is not null then
    insert into public.topics (system_id, category_id, slug, name)
    values (v_system, v_category, private.slugify(p ->> 'topic'), trim(p ->> 'topic'))
    on conflict (slug) do update set category_id = coalesce(public.topics.category_id, excluded.category_id)
    returning id into v_topic;
  end if;

  if v_code is not null then
    select id into v_qid from public.questions where code = v_code;
  end if;

  if v_qid is null then
    insert into public.questions (
      code, exam, status, stem, lead_in, media, system_id, discipline_id, competency_id, category_id, topic_id,
      author_difficulty, is_free, is_daily_eligible, source, tags, import_batch_id
    ) values (
      coalesce(v_code, 'AQ-' || nextval('public.question_code_seq')::text),
      coalesce((p ->> 'exam')::public.exam_type, 'step1'),
      coalesce((p ->> 'status')::public.question_status, 'published'),
      p ->> 'stem', p ->> 'lead_in', coalesce(p -> 'media', '[]'::jsonb),
      v_system, v_discipline, v_competency, v_category, v_topic,
      coalesce((p ->> 'difficulty')::smallint, 3),
      coalesce((p ->> 'is_free')::boolean, false),
      coalesce((p ->> 'is_daily_eligible')::boolean, false),
      coalesce(p ->> 'source', 'import'),
      coalesce((select array_agg(x) from jsonb_array_elements_text(p -> 'tags') x), '{}'),
      nullif(p ->> 'batch_id', '')::uuid
    ) returning id into v_qid;
    v_created := true;
  else
    update public.questions set
      exam = coalesce((p ->> 'exam')::public.exam_type, exam),
      stem = p ->> 'stem', lead_in = p ->> 'lead_in', media = coalesce(p -> 'media', media),
      system_id = v_system, discipline_id = v_discipline, competency_id = v_competency,
      category_id = v_category, topic_id = v_topic,
      author_difficulty = coalesce((p ->> 'difficulty')::smallint, author_difficulty),
      is_free = coalesce((p ->> 'is_free')::boolean, is_free),
      is_daily_eligible = coalesce((p ->> 'is_daily_eligible')::boolean, is_daily_eligible),
      tags = coalesce((select array_agg(x) from jsonb_array_elements_text(p -> 'tags') x), tags)
    where id = v_qid;
    delete from public.question_keys where question_id = v_qid;
    -- Keep option ids stable when labels survive so past attempts stay valid.
    delete from public.question_options o
    where o.question_id = v_qid
      and o.label not in (select x ->> 'label' from jsonb_array_elements(p -> 'options') x)
      and not exists (select 1 from public.attempts a where a.selected_option_id = o.id);
  end if;

  for v_opt in select * from jsonb_array_elements(p -> 'options') loop
    insert into public.question_options (question_id, label, body, concept)
    values (v_qid, v_opt ->> 'label', v_opt ->> 'body', nullif(v_opt ->> 'concept', ''))
    on conflict (question_id, label) do update set body = excluded.body, concept = excluded.concept;
  end loop;

  select id into v_correct from public.question_options where question_id = v_qid and label = p ->> 'correct';
  if v_correct is null then raise exception 'Correct option % missing', p ->> 'correct'; end if;

  insert into public.question_keys (question_id, correct_option_id, explanation, option_explanations,
    educational_objective, textbook, key_concept, "references")
  values (
    v_qid, v_correct, p ->> 'explanation', coalesce(p -> 'option_explanations', '{}'::jsonb),
    p ->> 'objective', p ->> 'textbook', nullif(p ->> 'key_concept', ''),
    coalesce((select array_agg(x) from jsonb_array_elements_text(p -> 'references') x), '{}')
  );

  -- Manually curated nuggets carried in the import payload.
  if jsonb_typeof(p -> 'nuggets') = 'array' then
    delete from public.question_nuggets where question_id = v_qid and method = 'manual';
    for v_nug in select * from jsonb_array_elements(p -> 'nuggets') loop
      insert into public.nuggets (slug, title, body, system_id, index_ids, created_by)
      values (
        coalesce(nullif(v_nug ->> 'slug', ''), private.slugify(v_nug ->> 'title')),
        v_nug ->> 'title', v_nug ->> 'body', v_system,
        coalesce((select array_agg(x::integer) from jsonb_array_elements_text(v_nug -> 'index_ids') x), '{}'),
        'seed')
      on conflict (slug) do update set
        title = excluded.title,
        body = coalesce(excluded.body, public.nuggets.body),
        index_ids = (select array(select distinct unnest(public.nuggets.index_ids || excluded.index_ids)))
      returning id into v_nugget_id;
      insert into public.question_nuggets (question_id, nugget_id, score, method)
      values (v_qid, v_nugget_id, 1, 'manual') on conflict do nothing;
      v_any_nugget := true;
    end loop;
  end if;

  update public.questions set is_nugget = exists (select 1 from public.question_nuggets where question_id = v_qid)
  where id = v_qid;

  return jsonb_build_object('id', v_qid, 'code', (select code from public.questions where id = v_qid),
                            'created', v_created, 'topic_id', v_topic, 'system_id', v_system);
end;
$$;

create or replace function public.admin_link_nugget(
  p_question uuid, p_title text, p_body text, p_index_ids integer[], p_score real, p_method text default 'auto'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id integer;
  v_system smallint;
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  select system_id into v_system from public.questions where id = p_question;

  -- Reuse an existing card that already covers one of these index lines.
  select id into v_id from public.nuggets where index_ids && p_index_ids order by id limit 1;
  if v_id is null then
    insert into public.nuggets (slug, title, body, system_id, index_ids, created_by)
    values (private.slugify(p_title) || '-' || substr(md5(random()::text), 1, 5), p_title, p_body, v_system, p_index_ids,
            case when p_method = 'ai' then 'ai' else 'auto' end)
    returning id into v_id;
  else
    update public.nuggets set index_ids = (select array(select distinct unnest(index_ids || p_index_ids))) where id = v_id;
  end if;

  insert into public.question_nuggets (question_id, nugget_id, score, method)
  values (p_question, v_id, p_score, p_method)
  on conflict (question_id, nugget_id) do update set score = excluded.score;
  update public.questions set is_nugget = true where id = p_question;
  return v_id;
end;
$$;

create or replace function public.admin_set_plan(p_user uuid, p_plan public.plan_tier, p_expires timestamptz default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  update public.profiles set plan = p_plan, plan_expires_at = p_expires where id = p_user;
end;
$$;

create or replace function public.admin_schedule_daily(p_day date, p_question uuid, p_time_limit smallint default 120)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  if p_day < private.daily_day() then raise exception 'Cannot reschedule past challenges'; end if;
  if p_day = private.daily_day() and exists (select 1 from public.daily_attempts where day = p_day) then
    raise exception 'Today''s challenge already has players';
  end if;
  insert into public.daily_challenges (day, question_id, time_limit_s) values (p_day, p_question, p_time_limit)
  on conflict (day) do update set question_id = excluded.question_id, time_limit_s = excluded.time_limit_s;
end;
$$;

create or replace function public.admin_item_analysis()
returns table (
  question_id uuid, code text, system text, topic text, n integer, p_value real,
  discrimination real, difficulty_b real, option_counts jsonb, correct_label text,
  top_wrong_label text, top_wrong_share real, flag text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return query
  select q.id, q.code, s.short_name, t.name, st.n_attempts,
    case when st.n_attempts > 0 then (st.n_correct::real / st.n_attempts) end,
    st.discrimination, st.difficulty_b, st.option_counts, o.label, w.label,
    case when st.n_attempts > 0 then w.cnt::real / st.n_attempts end,
    case
      when st.n_attempts >= 10 and w.cnt > st.n_correct then 'possible_miskey'
      when st.discrimination is not null and st.discrimination < 0 then 'negative_discrimination'
      when st.n_attempts >= 20 and st.n_correct::real / st.n_attempts > 0.95 then 'too_easy'
      when st.n_attempts >= 20 and st.n_correct::real / st.n_attempts < 0.3 then 'very_hard'
    end
  from public.questions q
  join public.systems s on s.id = q.system_id
  left join public.topics t on t.id = q.topic_id
  join public.question_stats st on st.question_id = q.id
  join public.question_keys k on k.question_id = q.id
  join public.question_options o on o.id = k.correct_option_id
  left join lateral (
    select e.key as label, (e.value)::integer as cnt from jsonb_each_text(st.option_counts) e
    where e.key <> o.label order by (e.value)::integer desc limit 1
  ) w on true
  where q.owner_id is null
  order by st.n_attempts desc;
end;
$$;

-- Billing: called by the Stripe webhook with the service key only.
create or replace function public.billing_apply_subscription(
  p_user uuid, p_subscription text, p_status text, p_plan public.plan_tier,
  p_period_end timestamptz, p_cancel_at_period_end boolean, p_price_key text, p_customer text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_active boolean := p_status in ('active', 'trialing', 'past_due');
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'Service role only' using errcode = '42501';
  end if;

  insert into public.subscriptions (id, user_id, status, plan, price_key, current_period_end, cancel_at_period_end, updated_at)
  values (p_subscription, p_user, p_status, p_plan, p_price_key, p_period_end, coalesce(p_cancel_at_period_end, false), now())
  on conflict (id) do update set
    status = excluded.status, plan = excluded.plan, price_key = excluded.price_key,
    current_period_end = excluded.current_period_end, cancel_at_period_end = excluded.cancel_at_period_end,
    updated_at = now();

  update public.profiles set
    stripe_customer_id = coalesce(p_customer, stripe_customer_id),
    plan = case when v_active then p_plan else 'free'::public.plan_tier end,
    plan_expires_at = case when v_active then p_period_end + interval '2 days' else null end
  where id = p_user and role <> 'admin';
end;
$$;

-- Nightly item analysis (point-biserial discrimination) and ARGO snapshots.
create or replace function private.nightly()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  with user_acc as (
    select user_id, avg(case when is_correct then 1.0 else 0.0 end) acc
    from public.attempts where is_first_attempt
    group by user_id having count(*) >= 10
  ), item as (
    select a.question_id, corr(case when a.is_correct then 1.0 else 0.0 end, ua.acc) r, count(*) n
    from public.attempts a join user_acc ua on ua.user_id = a.user_id
    where a.is_first_attempt
    group by a.question_id having count(*) >= 10
  )
  update public.question_stats st set discrimination = item.r, updated_at = now()
  from item where st.question_id = item.question_id;

  for r in select distinct user_id from public.attempts where created_at > now() - interval '2 days' loop
    perform private.snapshot_user(r.user_id);
  end loop;
end;
$$;

-- Lock down internal helpers.
revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated, service_role, supabase_auth_admin;
grant execute on function private.handle_new_user() to supabase_auth_admin;
grant execute on function private.guard_profile_columns() to authenticated, service_role;
grant execute on function private.touch_updated_at() to authenticated, service_role;
grant execute on function private.init_question_stats() to authenticated, service_role;

-- Admin/billing RPCs check roles internally; anonymous users only get daily-challenge RPCs.
revoke execute on function public.match_nugget_index(extensions.vector, integer, real) from anon;
revoke execute on function public.admin_upsert_question(jsonb) from anon;
revoke execute on function public.admin_link_nugget(uuid, text, text, integer[], real, text) from anon;
revoke execute on function public.admin_set_plan(uuid, public.plan_tier, timestamptz) from anon;
revoke execute on function public.admin_schedule_daily(date, uuid, smallint) from anon;
revoke execute on function public.admin_item_analysis() from anon;
revoke execute on function public.billing_apply_subscription(uuid, text, text, public.plan_tier, timestamptz, boolean, text, text) from anon, authenticated;
revoke execute on function public.create_test(public.test_mode, integer, text, public.exam_type, smallint[], smallint[], smallint[], integer[], text[], boolean, integer) from anon;
revoke execute on function public.create_test_from_ids(uuid[], public.test_kind, public.test_mode, text, jsonb, integer) from anon;
revoke execute on function public.get_test(uuid) from anon;
revoke execute on function public.save_item(uuid, smallint, uuid, uuid, smallint, smallint, boolean, text[], jsonb, integer, boolean) from anon;
revoke execute on function public.submit_item(uuid, smallint, uuid, uuid, smallint, smallint, text[], integer, boolean) from anon;
revoke execute on function public.save_progress(uuid, smallint, integer, boolean) from anon;
revoke execute on function public.end_test(uuid, integer) from anon;
revoke execute on function public.performance_overview() from anon;
revoke execute on function public.argo_candidates() from anon;
revoke execute on function public.count_questions(public.exam_type, smallint[], smallint[], smallint[], integer[], text[], boolean) from anon;
revoke execute on function public.daily_claim(uuid) from anon;
