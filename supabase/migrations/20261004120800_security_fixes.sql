-- Security fix: the profile guard must run as the caller so API users cannot change
-- their plan, role or Stripe fields. Definer functions (daily streaks, billing) still pass.
create or replace function private.guard_profile_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.plan is distinct from old.plan
     or new.plan_expires_at is distinct from old.plan_expires_at
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.daily_streak is distinct from old.daily_streak
     or new.daily_best_streak is distinct from old.daily_best_streak
     or new.daily_last_win is distinct from old.daily_last_win then
    raise exception 'Not allowed to change protected profile fields' using errcode = '42501';
  end if;
  return new;
end;
$$;
grant execute on function private.guard_profile_columns() to authenticated, service_role;

-- Leaderboard integrity: implausibly fast submissions are not ranked.
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
  -- Nobody reads a vignette and five options in under 8 seconds: such answers still count
  -- as correct for the player but are not ranked.
  v_score := case
    when not v_ok then 0
    when v_time < 8000 then 0
    else round(1000 * (0.5 + 0.5 * greatest(0, 1 - v_time / (v_dc.time_limit_s * 1000.0))))::integer end;

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

