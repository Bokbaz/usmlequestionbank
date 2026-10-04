-- Fix: smallint argument for private.record_attempt in submit_item.
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
    coalesce(v_item.first_option_id, p_first, p_option), greatest(v_item.changes, coalesce(p_changes, 0::smallint))::smallint,
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

