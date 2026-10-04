-- Functions get EXECUTE for PUBLIC by default; tighten to explicit role grants.
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
end;
$$;

-- Guests can play the Daily Challenge and read leaderboards.
grant execute on function public.daily_today(uuid) to anon;
grant execute on function public.daily_start(uuid) to anon;
grant execute on function public.daily_submit(uuid, uuid) to anon;
grant execute on function public.daily_leaderboard(date, integer) to anon;
grant execute on function public.streak_leaderboard(integer) to anon;

-- Used inside RLS policies that anon can hit (library/nugget reads).
grant execute on function public.is_admin() to anon;
grant execute on function public.has_plan(public.plan_tier) to anon;
grant execute on function public.plan_rank(public.plan_tier) to anon;
grant execute on function public.can_view_question(public.question_status, uuid, boolean) to anon;

-- Billing is service-role only.
revoke execute on function public.billing_apply_subscription(uuid, text, text, public.plan_tier, timestamptz, boolean, text, text) from authenticated;

-- New functions created later default to the same posture.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;
