-- Pricing moved to a one-time purchase plus an optional add-on subscription:
--   Full access ($48 once): plan 'argo' with no expiry.
--   ARGO question writing ($4.99/month): a subscription row with price_key 'writer'. It no
--   longer changes profiles.plan; the app checks the subscription row directly.

create table public.purchases (
  id text primary key,                         -- Stripe Checkout Session id
  user_id uuid not null references auth.users (id) on delete cascade,
  payment_intent text unique,
  offer text not null default 'access',
  amount integer not null,                     -- minor units (cents)
  currency text not null default 'usd',
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at timestamptz not null default now(),
  refunded_at timestamptz
);
create index purchases_user_idx on public.purchases (user_id);
alter table public.purchases enable row level security;
create policy "purchases own read" on public.purchases for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create or replace function public.billing_apply_purchase(
  p_user uuid, p_session text, p_payment_intent text, p_amount integer, p_currency text, p_customer text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'Service role only' using errcode = '42501';
  end if;
  insert into public.purchases (id, user_id, payment_intent, amount, currency)
  values (p_session, p_user, p_payment_intent, p_amount, coalesce(p_currency, 'usd'))
  on conflict (id) do nothing;
  update public.profiles set
    stripe_customer_id = coalesce(p_customer, stripe_customer_id),
    plan = case when role = 'admin' then plan else 'argo'::public.plan_tier end,
    plan_expires_at = case when role = 'admin' then plan_expires_at else null end
  where id = p_user;
end;
$$;

-- A full refund of the purchase removes access unless another paid purchase exists.
create or replace function public.billing_refund_purchase(p_payment_intent text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'Service role only' using errcode = '42501';
  end if;
  update public.purchases set status = 'refunded', refunded_at = now()
  where payment_intent = p_payment_intent and status = 'paid'
  returning user_id into v_user;
  if v_user is null then return; end if;
  if not exists (select 1 from public.purchases where user_id = v_user and status = 'paid') then
    update public.profiles set plan = 'free', plan_expires_at = null where id = v_user and role <> 'admin';
  end if;
end;
$$;

-- Subscriptions are now only the question-writing add-on: record them, leave the plan alone.
create or replace function public.billing_apply_subscription(
  p_user uuid, p_subscription text, p_status text, p_plan public.plan_tier,
  p_period_end timestamptz, p_cancel_at_period_end boolean, p_price_key text, p_customer text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
  update public.profiles set stripe_customer_id = coalesce(p_customer, stripe_customer_id) where id = p_user;
end;
$$;

-- Whether the signed-in student has an active question-writing add-on (2 days grace).
create or replace function public.writer_addon_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = (select auth.uid())
      and s.price_key = 'writer'
      and s.status in ('active', 'trialing', 'past_due')
      and coalesce(s.current_period_end, now()) > now() - interval '2 days'
  );
$$;

revoke execute on function public.billing_apply_purchase(uuid, text, text, integer, text, text) from public, anon, authenticated;
revoke execute on function public.billing_refund_purchase(text) from public, anon, authenticated;
grant execute on function public.billing_apply_purchase(uuid, text, text, integer, text, text) to service_role;
grant execute on function public.billing_refund_purchase(text) to service_role;
revoke execute on function public.writer_addon_active() from public, anon;
grant execute on function public.writer_addon_active() to authenticated, service_role;
