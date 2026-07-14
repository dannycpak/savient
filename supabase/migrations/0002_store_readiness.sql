-- Store-readiness: storage, account purge helpers, billing-issue pause, check refunds.

-- Allow billing_issue on subscriptions (grace: keep plan row, pause Visual Checks)
alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('trialing', 'active', 'canceled', 'expired', 'billing_issue'));

-- Private storage buckets (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('specimen-photos', 'specimen-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('check-uploads', 'check-uploads', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: path must start with auth.uid()
drop policy if exists specimen_photos_select on storage.objects;
drop policy if exists specimen_photos_insert on storage.objects;
drop policy if exists specimen_photos_update on storage.objects;
drop policy if exists specimen_photos_delete on storage.objects;
drop policy if exists check_uploads_select on storage.objects;
drop policy if exists check_uploads_insert on storage.objects;
drop policy if exists check_uploads_update on storage.objects;
drop policy if exists check_uploads_delete on storage.objects;

create policy specimen_photos_select on storage.objects
  for select to authenticated
  using (bucket_id = 'specimen-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy specimen_photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'specimen-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy specimen_photos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'specimen-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy specimen_photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'specimen-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy check_uploads_select on storage.objects
  for select to authenticated
  using (bucket_id = 'check-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy check_uploads_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'check-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy check_uploads_update on storage.objects
  for update to authenticated
  using (bucket_id = 'check-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy check_uploads_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'check-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

-- Soft-delete: mark profile; clients must treat deleted_at as signed-out.
-- Hard ban + auth.users deletion happens in purge-deleted-accounts Edge Function.
create or replace function public.soft_delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set deleted_at = now(), purge_after = now() + interval '30 days'
  where id = auth.uid() and deleted_at is null;
end;
$$;

-- Refund a just-consumed check (allowance or credit) when AI fails after consume.
create or replace function public.refund_check(p_user_id uuid, p_consumed text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_consumed = 'allowance' then
    update public.profiles
      set checks_used_month = greatest(checks_used_month - 1, 0)
      where id = p_user_id;
  elsif p_consumed = 'credit' then
    insert into public.credit_ledger (user_id, delta, reason)
    values (p_user_id, 1, 'refund');
  end if;
end;
$$;

-- Visual Check paused during RevenueCat BILLING_ISSUE grace period
create or replace function public.checks_paused(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = p_user_id and status = 'billing_issue'
  );
$$;

-- Simple per-user rate limit: max 10 Visual Check attempts / 10 minutes
create or replace function public.rate_limit_visual_check(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.visual_checks
  where user_id = p_user_id
    and created_at > now() - interval '10 minutes';
  return v_count < 10;
end;
$$;

-- Consume check, but refuse when billing_issue grace is active for plus pause
create or replace function public.consume_check(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_used int;
  v_credits int;
  v_month text := to_char(timezone('utc', now()), 'YYYY-MM');
begin
  if public.checks_paused(p_user_id) then
    raise exception 'BILLING_ISSUE' using errcode = 'P0001';
  end if;

  select plan, checks_used_month
    into v_plan, v_used
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'profile not found';
  end if;

  if v_plan = 'plus' then
    return 'allowance';
  end if;

  if coalesce((select checks_month_key from public.profiles where id = p_user_id), '') <> v_month then
    update public.profiles
      set checks_used_month = 0,
          checks_month_key = v_month
      where id = p_user_id;
    v_used := 0;
  end if;

  if v_used < 3 then
    update public.profiles
      set checks_used_month = checks_used_month + 1,
          checks_month_key = v_month
      where id = p_user_id;
    return 'allowance';
  end if;

  select coalesce(sum(delta), 0)::int into v_credits from public.credit_ledger where user_id = p_user_id;
  if v_credits < 1 then
    raise exception 'NO_CHECKS' using errcode = 'P0001';
  end if;

  insert into public.credit_ledger (user_id, delta, reason)
  values (p_user_id, -1, 'check_used');
  return 'credit';
end;
$$;

grant execute on function public.refund_check(uuid, text) to service_role;
grant execute on function public.checks_paused(uuid) to authenticated, service_role;
grant execute on function public.rate_limit_visual_check(uuid) to service_role;
