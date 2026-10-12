-- Seeded players start on different days, so early streaks don't all equal the challenge number.
create or replace function private.daily_board_rows(p_day date)
returns table (username text, display_name text, country text, score integer, time_ms integer, streak integer)
language sql
stable
security definer
set search_path = ''
as $$
  with dc as (select time_limit_s from public.daily_challenges where day = p_day),
  t as (
    select s.*, dc.time_limit_s lim,
      round(dc.time_limit_s * 1000 * (0.30 + 0.27 * (1 - (0.55 * s.skill + 0.45 * private.unit_hash(p_day::text || ':' || s.id)))))::integer ms
    from private.daily_board_seed s cross join dc
  )
  select t.username::text, t.display_name, t.country,
    round(1000 * (0.5 + 0.5 * greatest(0, 1 - t.ms / (t.lim * 1000.0))))::integer,
    t.ms,
    least(((p_day - date '2026-01-01') + t.phase) % t.cycle + 1, greatest(1, private.daily_number(p_day) - t.id % 6))::integer
  from t;
$$;
revoke all on function private.daily_board_rows(date) from public, anon, authenticated;
