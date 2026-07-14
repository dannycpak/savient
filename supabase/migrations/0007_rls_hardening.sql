-- RLS hardening beyond mobile-app migrations 0002–0006
-- - Block client self-grant of Sage+ / quota mutation
-- - Protect order money columns on client updates
-- - Soft-deleted profiles excluded from client RLS
-- - check-uploads UPDATE policy (upsert parity)
-- - Extra indexes for RLS join paths

-- check-uploads upsert needs UPDATE (0002 had select/insert/delete only)
drop policy if exists check_uploads_update on storage.objects;
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

-- Allow HEIC/HEIF from device cameras
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id in ('specimen-photos', 'check-uploads');

-- Prevent clients from self-granting Sage+ or mutating quota / soft-delete
create or replace function public.protect_profile_billing_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
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

-- Orders: clients may ship+track; money/PI fields stay Edge-Function-only
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
  end if;
  return new;
end;
$$;

drop trigger if exists orders_protect_money on public.orders;
create trigger orders_protect_money
  before update on public.orders
  for each row execute function public.protect_order_money_columns();

grant update on public.orders to authenticated;
grant insert, update on public.sellers to authenticated;

grant execute on function public.consume_check(uuid) to service_role;
revoke execute on function public.consume_check(uuid) from public, anon, authenticated;

create index if not exists specimen_photos_specimen_idx on public.specimen_photos (specimen_id);
create index if not exists sellers_profile_idx on public.sellers (profile_id);
create index if not exists orders_buyer_idx on public.orders (buyer_id);
create index if not exists orders_seller_idx on public.orders (seller_id);
create index if not exists ratings_seller_idx on public.ratings (seller_id);
create index if not exists listings_seller_idx on public.listings (seller_id);

-- Soft-deleted accounts: block client profile/catalog access
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id and deleted_at is null);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id and deleted_at is null)
  with check (auth.uid() = id and deleted_at is null);

drop policy if exists specimens_select_own on public.specimens;
create policy specimens_select_own on public.specimens
  for select to authenticated
  using (
    (
      auth.uid() = owner_id
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.deleted_at is null
      )
    )
    or visibility = 'public'
  );
