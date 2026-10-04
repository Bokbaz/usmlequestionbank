-- Auto-numbered questions collided with the seed IDs (AQ-1001 to AQ-1050) because the
-- sequence was never advanced. Move it past every numeric ID in use and make the upsert
-- skip taken numbers from now on.

select setval(
  'public.question_code_seq',
  greatest(1000, coalesce((select max((substring(code from '^AQ-(\d+)$'))::bigint) from public.questions), 1000))
);

-- Upsert one question from the import format. Returns {id, code, created}.
-- New questions without an ID take the next free AQ number, skipping IDs already used by
-- imported files.
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
    if v_code is null then
      loop
        v_code := 'AQ-' || nextval('public.question_code_seq')::text;
        exit when not exists (select 1 from public.questions where code = v_code);
      end loop;
    end if;
    insert into public.questions (
      code, exam, status, stem, lead_in, media, system_id, discipline_id, competency_id, category_id, topic_id,
      author_difficulty, is_free, is_daily_eligible, source, tags, import_batch_id
    ) values (
      v_code,
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

