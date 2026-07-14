-- Storage buckets (private) + RLS hardening for Sage
-- Complements 0001_initial_schema.sql (BACKEND_SPEC § security / Phase 0)

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Private storage buckets
-- ═══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'specimen-photos',
    'specimen-photos',
    false,
    10485760, -- 10 MiB
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'check-uploads',
    'check-uploads',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {auth.uid()}/... — Edge Functions use service_role (bypass).
-- Upsert needs SELECT + INSERT + UPDATE (Supabase storage gotcha).

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
  using (
    bucket_id = 'specimen-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy specimen_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'specimen-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy specimen_photos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'specimen-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'specimen-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy specimen_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'specimen-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy check_uploads_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'check-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy check_uploads_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'check-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy check_uploads_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'check-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'check-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy check_uploads_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'check-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Prevent clients from self-granting Sage+ / mutating quota / soft-delete
--    Feature gates must read DB truth written by webhooks / security definer RPCs.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.protect_profile_billing_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- service_role / postgres may write billing fields (webhooks, consume_check, soft_delete)
  if coalesce(auth.role(), '') = 'authenticated' then
    if new.plan is distinct from old.plan
       or new.checks_used_month is distinct from old.checks_used_month
       or new.checks_month_key is distinct from old.checks_month_key
       or new.deleted_at is distinct from old.deleted_at
       or new.purge_after is distinct from old.purge_after then
      raise exception 'PROFILE_BILLING_READONLY'
        using errcode = '42501',
              hint = 'plan and check quota are updated by RevenueCat webhook / consume_check only';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_billing on public.profiles;
create trigger profiles_protect_billing
  before update on public.profiles
  for each row execute function public.protect_profile_billing_columns();

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Orders: sellers may add tracking / mark shipped; money fields stay server-only
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.protect_order_money_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    if new.amount_cents is distinct from old.amount_cents
       or new.platform_fee_cents is distinct from old.platform_fee_cents
       or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
       or new.buyer_id is distinct from old.buyer_id
       or new.seller_id is distinct from old.seller_id
       or new.listing_id is distinct from old.listing_id then
      raise exception 'ORDER_MONEY_READONLY'
        using errcode = '42501',
              hint = 'price and payment fields are set by Edge Functions only';
    end if;
    -- Clients may only move into shipped (seller + tracking) — capture/release via Edge Functions
    if new.status is distinct from old.status
       and not (
         old.status in ('escrow_held', 'shipped')
         and new.status = 'shipped'
         and new.tracking_number is not null
       ) then
      raise exception 'ORDER_STATUS_FORBIDDEN'
        using errcode = '42501',
              hint = 'status transitions other than ship+track go through Edge Functions';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_protect_money on public.orders;
create trigger orders_protect_money
  before update on public.orders
  for each row execute function public.protect_order_money_columns();

drop policy if exists orders_seller_update on public.orders;
create policy orders_seller_update on public.orders
  for update to authenticated
  using (
    exists (
      select 1 from public.sellers s
      where s.id = seller_id and s.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sellers s
      where s.id = seller_id and s.profile_id = auth.uid()
    )
  );

grant update on public.orders to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Sellers: allow authenticated owner to insert their seller row
-- ═══════════════════════════════════════════════════════════════════════════
grant insert, update on public.sellers to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. RPC grants — clients call credits_balance / soft_delete; consume_check is
--    service_role via visual-check Edge Function (security definer still OK)
-- ═══════════════════════════════════════════════════════════════════════════
grant execute on function public.consume_check(uuid) to service_role;
revoke execute on function public.consume_check(uuid) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Extra indexes for common RLS / join paths
-- ═══════════════════════════════════════════════════════════════════════════
create index if not exists specimen_photos_specimen_idx on public.specimen_photos (specimen_id);
create index if not exists sellers_profile_idx on public.sellers (profile_id);
create index if not exists orders_buyer_idx on public.orders (buyer_id);
create index if not exists orders_seller_idx on public.orders (seller_id);
create index if not exists ratings_seller_idx on public.ratings (seller_id);
create index if not exists listings_seller_idx on public.listings (seller_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. Soft-deleted profiles: block client reads/writes of deleted accounts
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id and deleted_at is null);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id and deleted_at is null)
  with check (auth.uid() = id and deleted_at is null);

-- Soft-deleted users should not see their catalog (defense in depth)
drop policy if exists specimens_select_own on public.specimens;
create policy specimens_select_own on public.specimens
  for select to authenticated
  using (
    (auth.uid() = owner_id and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.deleted_at is null
    ))
    or visibility = 'public'
  );
