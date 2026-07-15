-- Soft-launch gaps vs already-applied remote migrations (init_sage_rls … phase2_5).
-- Idempotent: safe on the live `sage` project and when re-applied locally after repair.

-- 30-day account purge scheduler column
alter table public.profiles
  add column if not exists purge_after timestamptz;

-- Allow BILLING_ISSUE pause status used by revenuecat-webhook
alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('trialing', 'active', 'canceled', 'expired', 'billing_issue'));

-- Soft-delete: set deleted_at + purge_after; Edge Function hard-deletes later.
create or replace function public.soft_delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set deleted_at = now(),
      purge_after = now() + interval '30 days'
  where id = auth.uid() and deleted_at is null;
end;
$$;

grant execute on function public.soft_delete_account() to authenticated;

-- App RPC name (remote historically used credit_balance)
create or replace function public.credits_balance(uid uuid default auth.uid())
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(delta), 0)::int
  from public.credit_ledger
  where user_id = uid;
$$;

grant execute on function public.credits_balance(uuid) to authenticated;

-- Pause Visual Checks while RevenueCat reports BILLING_ISSUE
create or replace function public.checks_paused(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = p_user and status = 'billing_issue'
  );
$$;

grant execute on function public.checks_paused(uuid) to authenticated, service_role;

-- Gate consume_check on billing pause (preserve remote arg name p_user)
create or replace function public.consume_check(p_user uuid)
returns check_consumed_t
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan plan_t;
  v_used int;
  v_key text;
  v_now_key text := to_char(now(), 'YYYY-MM');
begin
  if public.checks_paused(p_user) then
    raise exception 'BILLING_ISSUE' using errcode = 'P0001';
  end if;

  select plan, checks_used_month, checks_month_key
    into v_plan, v_used, v_key
  from public.profiles
  where id = p_user
  for update;

  if not found then
    raise exception 'profile not found';
  end if;

  if coalesce(v_key, '') <> v_now_key then
    update public.profiles
      set checks_used_month = 0, checks_month_key = v_now_key
      where id = p_user;
    v_used := 0;
  end if;

  if v_plan = 'plus' then
    update public.profiles
      set checks_used_month = checks_used_month + 1, checks_month_key = v_now_key
      where id = p_user;
    return 'allowance';
  end if;

  if v_used < 3 then
    update public.profiles
      set checks_used_month = checks_used_month + 1, checks_month_key = v_now_key
      where id = p_user;
    return 'allowance';
  end if;

  if public.credit_balance(p_user) >= 1 then
    insert into public.credit_ledger (user_id, delta, reason)
    values (p_user, -1, 'check_used');
    return 'credit';
  end if;

  raise exception 'NO_CHECKS_REMAINING' using errcode = 'P0001';
end;
$$;

-- Service role grants for Edge Functions (purge + admin RPCs)
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
