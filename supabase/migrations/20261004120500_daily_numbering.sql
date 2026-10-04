-- Number Daily Challenges from the first scheduled day (launch = #1).
create or replace function private.daily_number(p_day date)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select (p_day - coalesce((select min(day) from public.daily_challenges), p_day)) + 1;
$$;
revoke all on function private.daily_number(date) from public, anon, authenticated;
