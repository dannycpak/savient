-- Listing photos, push tokens, Visual Check linkage, ship timestamp, refund helper

alter table public.specimens
  add column if not exists visual_check_id uuid references public.visual_checks (id) on delete set null;

alter table public.orders
  add column if not exists shipped_at timestamptz;

create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  is_primary boolean not null default false,
  uploaded_at timestamptz not null default now()
);

create index if not exists listing_photos_listing_idx on public.listing_photos (listing_id);

alter table public.listing_photos enable row level security;

drop policy if exists listing_photos_public_read on public.listing_photos;
create policy listing_photos_public_read on public.listing_photos
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'active' or exists (
          select 1 from public.sellers s
          where s.id = l.seller_id and s.profile_id = auth.uid()
        ))
    )
  );

drop policy if exists listing_photos_seller_write on public.listing_photos;
create policy listing_photos_seller_write on public.listing_photos
  for all using (
    exists (
      select 1 from public.listings l
      join public.sellers s on s.id = l.seller_id
      where l.id = listing_id and s.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      join public.sellers s on s.id = l.seller_id
      where l.id = listing_id and s.profile_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.listing_photos to authenticated;

-- Push tokens for Expo notifications
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  platform text,
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists push_tokens_own on public.push_tokens;
create policy push_tokens_own on public.push_tokens
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.push_tokens to authenticated;

create or replace function public.upsert_push_token(p_token text, p_platform text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.push_tokens (user_id, token, platform, updated_at)
  values (auth.uid(), p_token, p_platform, now())
  on conflict (user_id, token) do update
    set platform = excluded.platform,
        updated_at = now();
end;
$$;

grant execute on function public.upsert_push_token(text, text) to authenticated;

-- Refund a consumed Visual Check (AI failure)
create or replace function public.refund_check(p_user_id uuid, p_consumed text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_consumed = 'allowance' then
    update public.profiles
      set checks_used_month = greatest(0, checks_used_month - 1)
      where id = p_user_id;
  elsif p_consumed = 'credit' then
    insert into public.credit_ledger (user_id, delta, reason)
    values (p_user_id, 1, 'refund');
  end if;
end;
$$;

grant execute on function public.refund_check(uuid, text) to service_role;

-- Auto-confirm based on shipped_at when present
create or replace function public.orders_due_for_auto_confirm()
returns setof public.orders
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.orders
  where status = 'shipped'
    and tracking_number is not null
    and coalesce(shipped_at, created_at) < now() - interval '7 days';
$$;

-- Purge soft-deleted accounts past purge_after (auth user + cascade)
create or replace function public.purge_due_accounts()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int := 0;
  r record;
begin
  for r in
    select id from public.profiles
    where deleted_at is not null
      and purge_after is not null
      and purge_after < now()
    limit 50
  loop
    delete from auth.users where id = r.id;
    n := n + 1;
  end loop;
  return n;
end;
$$;

grant execute on function public.purge_due_accounts() to service_role;

-- Listing photos live in specimen-photos bucket under {uid}/listings/...
-- (storage policies already uid-scoped)
