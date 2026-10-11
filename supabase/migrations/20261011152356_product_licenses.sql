-- Product licenses are independent of price, discount, currency and checkout mode.
-- All event effects commit together; refunds are remembered even if fulfillment arrives later.
create table public.billing_licenses (
  source_id text not null,
  entitlement text not null check (entitlement in ('qbank_lifetime', 'argo_generator')),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('active', 'revoked')),
  expires_at timestamptz,
  payment_intent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_id, entitlement)
);
create index billing_licenses_user_idx on public.billing_licenses(user_id, entitlement);
alter table public.billing_licenses enable row level security;
create policy "licenses own read" on public.billing_licenses for select to authenticated
  using (user_id = (select auth.uid()));
grant select on public.billing_licenses to authenticated;

create table public.billing_checkouts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  offer text not null check (offer in ('access', 'writer')),
  includes_access boolean not null,
  includes_writer boolean not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.billing_checkouts enable row level security;
create index billing_checkouts_user_idx on public.billing_checkouts(user_id, created_at desc);
create policy "checkouts own read" on public.billing_checkouts for select to authenticated
  using (user_id = (select auth.uid()));
grant select on public.billing_checkouts to authenticated;

create table public.billing_invoices (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id text not null references public.subscriptions(id),
  payment_intent text,
  amount integer not null,
  currency text not null,
  period_end timestamptz not null,
  status text not null check (status in ('paid', 'refunded')),
  receipt_url text,
  created_at timestamptz not null default now()
);
create index billing_invoices_subscription_idx on public.billing_invoices(subscription_id, period_end desc);
create index billing_invoices_payment_idx on public.billing_invoices(payment_intent);
create index billing_invoices_user_idx on public.billing_invoices(user_id);
alter table public.billing_invoices enable row level security;
create policy "invoices own read" on public.billing_invoices for select to authenticated
  using (user_id = (select auth.uid()));
grant select on public.billing_invoices to authenticated;

create table private.billing_events (id text primary key, created_at timestamptz not null default now());
create table private.billing_refunds (payment_intent text primary key, created_at timestamptz not null default now());
create table private.billing_manual_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan public.plan_tier not null,
  expires_at timestamptz
);
alter table private.billing_events enable row level security;
alter table private.billing_refunds enable row level security;
alter table private.billing_manual_plans enable row level security;

alter table public.purchases add column stripe_product_id text;
alter table public.purchases add column receipt_url text;
alter table public.subscriptions add column billing_event_created bigint not null default 0;
alter table public.subscriptions add column stripe_product_id text;
alter table public.subscriptions add column unit_amount integer;
alter table public.subscriptions add column currency text;

-- Preserve existing free/manual grants and migrate historic billing records.
insert into private.billing_manual_plans(user_id, plan, expires_at)
select p.id,
  case when exists (select 1 from public.purchases x where x.user_id = p.id) then 'free'::public.plan_tier else p.plan end,
  case when exists (select 1 from public.purchases x where x.user_id = p.id) then null else p.plan_expires_at end
from public.profiles p;
insert into public.billing_licenses(source_id, entitlement, user_id, status, payment_intent)
select id, 'qbank_lifetime', user_id, case when status = 'paid' then 'active' else 'revoked' end, payment_intent
from public.purchases where offer = 'access';
insert into private.billing_refunds(payment_intent)
select payment_intent from public.purchases where status = 'refunded' and payment_intent is not null;
insert into public.billing_licenses(source_id, entitlement, user_id, status, expires_at)
select id, 'argo_generator', user_id,
  case when status in ('active', 'trialing', 'past_due') and current_period_end > now() then 'active' else 'revoked' end,
  current_period_end from public.subscriptions where price_key = 'writer';
-- A synthetic period preserves access to already-paid legacy subscriptions until the next invoice.
insert into public.billing_invoices(id, user_id, subscription_id, amount, currency, period_end, status)
select 'legacy_' || id, user_id, id, 0, 'usd', current_period_end, 'paid'
from public.subscriptions where price_key = 'writer' and status in ('active', 'trialing', 'past_due') and current_period_end > now();

create or replace function private.billing_sync_access(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_base private.billing_manual_plans;
begin
  select * into v_base from private.billing_manual_plans where user_id = p_user;
  update public.profiles set
    plan = case when exists (select 1 from public.billing_licenses where user_id = p_user and entitlement = 'qbank_lifetime' and status = 'active')
      then 'argo'::public.plan_tier else coalesce(v_base.plan, 'free'::public.plan_tier) end,
    plan_expires_at = case when exists (select 1 from public.billing_licenses where user_id = p_user and entitlement = 'qbank_lifetime' and status = 'active')
      then null else v_base.expires_at end
  where id = p_user and role <> 'admin';
end;
$$;

create or replace function private.billing_sync_writer(p_subscription text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_sub public.subscriptions; v_until timestamptz;
begin
  select * into v_sub from public.subscriptions where id = p_subscription;
  if v_sub.id is null or v_sub.price_key <> 'writer' then return; end if;
  select max(period_end) into v_until from public.billing_invoices where subscription_id = p_subscription and status = 'paid';
  insert into public.billing_licenses(source_id, entitlement, user_id, status, expires_at)
  values (p_subscription, 'argo_generator', v_sub.user_id,
    case when v_sub.status in ('active', 'trialing', 'past_due') and v_until > now() then 'active' else 'revoked' end, v_until)
  on conflict (source_id, entitlement) do update set status = excluded.status, expires_at = excluded.expires_at, updated_at = now();
end;
$$;

create or replace function public.billing_apply_event(p_event text, p_created bigint, p_payload jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_purchase jsonb; v_sub jsonb; v_invoice jsonb; v_pi text; v_id text; v_status text; v_row record;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'Service role only' using errcode = '42501';
  end if;
  -- Serialize short billing transactions, including refund-before-purchase races.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('argonaut_billing', 0));
  insert into private.billing_events(id) values (p_event) on conflict do nothing;
  if not found then return; end if;
  v_user := nullif(p_payload->>'user_id', '')::uuid;
  if v_user is not null then
    insert into private.billing_manual_plans(user_id, plan, expires_at)
    select id, plan, plan_expires_at from public.profiles where id = v_user on conflict do nothing;
    update public.profiles set stripe_customer_id = coalesce(p_payload->>'customer_id', stripe_customer_id) where id = v_user;
  end if;

  for v_purchase in select value from jsonb_array_elements(coalesce(p_payload->'purchases', '[]'::jsonb)) loop
    if v_user is null or v_purchase->>'offer' <> 'access' or nullif(v_purchase->>'product_id', '') is null then
      raise exception 'Invalid purchase';
    end if;
    v_id := v_purchase->>'session_id'; v_pi := v_purchase->>'payment_intent';
    v_status := case when exists (select 1 from private.billing_refunds where payment_intent = v_pi) then 'refunded' else 'paid' end;
    insert into public.purchases(id, user_id, payment_intent, offer, amount, currency, status, stripe_product_id, receipt_url, refunded_at)
    values(v_id, v_user, v_pi, 'access', (v_purchase->>'amount')::integer, v_purchase->>'currency', v_status,
      v_purchase->>'product_id', v_purchase->>'receipt_url', case when v_status = 'refunded' then now() end)
    on conflict(id) do nothing;
    if not exists (select 1 from public.purchases where id = v_id and user_id = v_user) then raise exception 'Purchase ownership mismatch'; end if;
    insert into public.billing_licenses(source_id, entitlement, user_id, status, payment_intent)
    select id, 'qbank_lifetime', user_id, case when status = 'paid' then 'active' else 'revoked' end, payment_intent
    from public.purchases where id = v_id
    on conflict(source_id, entitlement) do update set status = excluded.status, updated_at = now();
  end loop;

  v_sub := p_payload->'subscription';
  if v_sub is not null and v_sub <> 'null'::jsonb then
    if v_user is null then raise exception 'Subscription has no owner'; end if;
    insert into public.subscriptions(id, user_id, status, plan, price_key, current_period_end, cancel_at_period_end,
      billing_event_created, stripe_product_id, unit_amount, currency)
    values (v_sub->>'id', v_user, v_sub->>'status', 'argo', 'writer', (v_sub->>'period_end')::timestamptz,
      coalesce((v_sub->>'cancel_at_period_end')::boolean, false), p_created, v_sub->>'product_id', (v_sub->>'unit_amount')::integer, v_sub->>'currency')
    on conflict(id) do update set status = excluded.status, current_period_end = excluded.current_period_end,
      cancel_at_period_end = excluded.cancel_at_period_end, billing_event_created = excluded.billing_event_created,
      stripe_product_id = excluded.stripe_product_id, unit_amount = excluded.unit_amount, currency = excluded.currency, updated_at = now()
    where public.subscriptions.user_id = excluded.user_id and public.subscriptions.billing_event_created <= excluded.billing_event_created;
    if not exists (select 1 from public.subscriptions where id = v_sub->>'id' and user_id = v_user) then raise exception 'Subscription ownership mismatch'; end if;
  end if;

  v_invoice := p_payload->'invoice';
  if v_invoice is not null and v_invoice <> 'null'::jsonb then
    v_pi := v_invoice->>'payment_intent';
    delete from public.billing_invoices where id = 'legacy_' || (v_invoice->>'subscription_id');
    insert into public.billing_invoices(id, user_id, subscription_id, payment_intent, amount, currency, period_end, status, receipt_url)
    values(v_invoice->>'id', v_user, v_invoice->>'subscription_id', v_pi, (v_invoice->>'amount')::integer, v_invoice->>'currency',
      (v_invoice->>'period_end')::timestamptz,
      case when exists (select 1 from private.billing_refunds where payment_intent = v_pi) then 'refunded' else 'paid' end, v_invoice->>'receipt_url')
    on conflict(id) do nothing;
  end if;
  if v_sub is not null then perform private.billing_sync_writer(v_sub->>'id'); end if;

  v_pi := p_payload->>'refund_payment_intent';
  if v_pi is not null then
    insert into private.billing_refunds(payment_intent) values(v_pi) on conflict do nothing;
    update public.purchases set status = 'refunded', refunded_at = now() where payment_intent = v_pi;
    update public.billing_licenses set status = 'revoked', updated_at = now() where payment_intent = v_pi;
    update public.billing_invoices set status = 'refunded' where payment_intent = v_pi;
    for v_row in select distinct user_id from public.purchases where payment_intent = v_pi loop
      perform private.billing_sync_access(v_row.user_id);
    end loop;
    for v_row in select distinct subscription_id from public.billing_invoices where payment_intent = v_pi loop
      perform private.billing_sync_writer(v_row.subscription_id);
    end loop;
  end if;
  if v_user is not null then perform private.billing_sync_access(v_user); end if;
end;
$$;

create or replace function public.writer_addon_active()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.billing_licenses where user_id = (select auth.uid())
    and entitlement = 'argo_generator' and status = 'active' and expires_at > now());
$$;

-- Admin grants remain independent from purchases and survive a refunded purchase.
create or replace function public.admin_set_plan(p_user uuid, p_plan public.plan_tier, p_expires timestamptz default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('argonaut_billing', 0));
  insert into private.billing_manual_plans(user_id, plan, expires_at) values(p_user, p_plan, p_expires)
  on conflict(user_id) do update set plan = excluded.plan, expires_at = excluded.expires_at;
  perform private.billing_sync_access(p_user);
end;
$$;

revoke all on function private.billing_sync_access(uuid), private.billing_sync_writer(text) from public, anon, authenticated;
revoke all on function public.billing_apply_event(text, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.billing_apply_event(text, bigint, jsonb) to service_role;
grant all on public.billing_licenses, public.billing_checkouts, public.billing_invoices to service_role;
