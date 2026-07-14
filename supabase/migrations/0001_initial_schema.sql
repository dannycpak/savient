-- Sage initial schema + RLS + helpers
-- See docs/BACKEND_SPEC.md

create extension if not exists "pgcrypto";

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'plus')),
  checks_used_month int not null default 0,
  checks_month_key text,
  deleted_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz not null default now()
);

create table public.specimens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  species text not null,
  variety text,
  locality text,
  formation text,
  matrix text,
  dims jsonb,
  provenance text,
  acquired_at date,
  acquisition_price_cents int,
  est_value_cents int,
  rarity text,
  condition text,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.specimen_photos (
  id uuid primary key default gen_random_uuid(),
  specimen_id uuid not null references public.specimens (id) on delete cascade,
  storage_path text not null,
  is_primary boolean not null default false,
  uploaded_at timestamptz not null default now()
);

create table public.visual_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  image_path text not null,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'complete', 'failed')),
  model_used text,
  result_json jsonb,
  confidence numeric,
  consumed text check (consumed in ('allowance', 'credit')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  business_name text,
  tier text not null default 'self_certified'
    check (tier in ('self_certified', 'documented', 'lab_verified')),
  credibility_score numeric not null default 0,
  ratings_count int not null default 0,
  stripe_connect_account_id text,
  connect_onboarding_status text not null default 'pending'
    check (connect_onboarding_status in ('pending', 'active', 'restricted')),
  docs_review_flag boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id) on delete cascade,
  specimen_id uuid references public.specimens (id) on delete set null,
  species text not null,
  locality text,
  title text not null,
  description text,
  price_cents int not null check (price_cents > 0),
  currency text not null default 'usd',
  photo_verified boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'sold', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id),
  buyer_id uuid not null references public.profiles (id),
  seller_id uuid not null references public.sellers (id),
  amount_cents int not null,
  platform_fee_cents int not null,
  stripe_payment_intent_id text,
  tracking_number text,
  status text not null default 'pending'
    check (status in ('pending', 'escrow_held', 'shipped', 'delivered', 'disputed', 'released', 'refunded')),
  created_at timestamptz not null default now()
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id),
  seller_id uuid not null references public.sellers (id),
  accuracy text not null check (accuracy in ('as_described', 'minor', 'not_as_described')),
  photo_match boolean not null,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  rc_app_user_id text not null,
  rc_entitlement text not null default 'plus',
  status text not null check (status in ('trialing', 'active', 'canceled', 'expired')),
  renews_at timestamptz,
  store text check (store in ('app_store', 'play', 'stripe_web')),
  updated_at timestamptz not null default now()
);

-- APPEND-ONLY credit ledger
create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta int not null,
  reason text not null check (reason in ('purchase', 'check_used', 'grant', 'refund')),
  rc_transaction_id text unique,
  created_at timestamptz not null default now()
);

create index specimens_owner_idx on public.specimens (owner_id);
create index listings_status_idx on public.listings (status);
create index visual_checks_user_idx on public.visual_checks (user_id);
create index credit_ledger_user_idx on public.credit_ledger (user_id);

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Credits balance (computed)
create or replace function public.credits_balance(uid uuid default auth.uid())
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(delta), 0)::int from public.credit_ledger where user_id = uid;
$$;

-- Soft-delete account
create or replace function public.soft_delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set deleted_at = now(), purge_after = now() + interval '30 days'
  where id = auth.uid();
end;
$$;

-- Consume a visual check (allowance first, then credit)
create or replace function public.consume_check(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_used int;
  v_key text := to_char(timezone('utc', now()), 'YYYY-MM');
  v_credits int;
begin
  select plan, checks_used_month, checks_month_key
    into v_plan, v_used, v_key
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'profile not found';
  end if;

  if v_plan = 'plus' then
    return 'allowance';
  end if;

  if coalesce((select checks_month_key from public.profiles where id = p_user_id), '') <> to_char(timezone('utc', now()), 'YYYY-MM') then
    update public.profiles
      set checks_used_month = 0,
          checks_month_key = to_char(timezone('utc', now()), 'YYYY-MM')
      where id = p_user_id;
    v_used := 0;
  end if;

  if v_used < 3 then
    update public.profiles
      set checks_used_month = checks_used_month + 1,
          checks_month_key = to_char(timezone('utc', now()), 'YYYY-MM')
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

-- Free-tier catalog cap (25) via trigger
create or replace function public.enforce_catalog_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_count int;
begin
  select plan into v_plan from public.profiles where id = new.owner_id;
  if v_plan = 'plus' then
    return new;
  end if;
  select count(*) into v_count from public.specimens where owner_id = new.owner_id;
  if v_count >= 25 then
    raise exception 'CATALOG_CAP' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger specimens_catalog_cap
  before insert on public.specimens
  for each row execute function public.enforce_catalog_cap();

-- Credibility recompute on rating
create or replace function public.recompute_credibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  score numeric;
  cnt int;
begin
  select
    coalesce(
      sum(
        case accuracy
          when 'as_described' then 10
          when 'minor' then 6
          else 2
        end
        * exp(-extract(epoch from (now() - created_at)) / (86400.0 * 180))
      ) / nullif(sum(exp(-extract(epoch from (now() - created_at)) / (86400.0 * 180))), 0),
      0
    ),
    count(*)
  into score, cnt
  from public.ratings
  where seller_id = new.seller_id;

  update public.sellers
    set credibility_score = round(score::numeric, 2),
        ratings_count = cnt
  where id = new.seller_id;
  return new;
end;
$$;

create trigger ratings_recompute
  after insert on public.ratings
  for each row execute function public.recompute_credibility();

-- updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger specimens_touch before update on public.specimens
  for each row execute function public.touch_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.specimens enable row level security;
alter table public.specimen_photos enable row level security;
alter table public.visual_checks enable row level security;
alter table public.sellers enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.ratings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_ledger enable row level security;

-- Profiles
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

-- Specimens
create policy specimens_select_own on public.specimens for select
  using (auth.uid() = owner_id or visibility = 'public');
create policy specimens_insert_own on public.specimens for insert with check (auth.uid() = owner_id);
create policy specimens_update_own on public.specimens for update using (auth.uid() = owner_id);
create policy specimens_delete_own on public.specimens for delete using (auth.uid() = owner_id);

-- Photos
create policy photos_select on public.specimen_photos for select using (
  exists (select 1 from public.specimens s where s.id = specimen_id and (s.owner_id = auth.uid() or s.visibility = 'public'))
);
create policy photos_write on public.specimen_photos for all using (
  exists (select 1 from public.specimens s where s.id = specimen_id and s.owner_id = auth.uid())
) with check (
  exists (select 1 from public.specimens s where s.id = specimen_id and s.owner_id = auth.uid())
);

-- Visual checks
create policy checks_own on public.visual_checks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sellers / listings public read
create policy sellers_public_read on public.sellers for select using (true);
create policy sellers_own_write on public.sellers for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy listings_public_read on public.listings for select using (status = 'active' or exists (
  select 1 from public.sellers s where s.id = seller_id and s.profile_id = auth.uid()
));
create policy listings_seller_write on public.listings for all using (
  exists (select 1 from public.sellers s where s.id = seller_id and s.profile_id = auth.uid())
) with check (
  exists (select 1 from public.sellers s where s.id = seller_id and s.profile_id = auth.uid() and s.connect_onboarding_status = 'active')
);

-- Orders
create policy orders_participant on public.orders for select using (
  auth.uid() = buyer_id or exists (select 1 from public.sellers s where s.id = seller_id and s.profile_id = auth.uid())
);

-- Ratings public read (credibility transparency)
create policy ratings_public_read on public.ratings for select using (true);
create policy ratings_buyer_insert on public.ratings for insert with check (auth.uid() = buyer_id);

-- Subscriptions / credits: read own; writes via service role / security definer only
create policy subscriptions_own on public.subscriptions for select using (auth.uid() = user_id);
create policy credit_ledger_own on public.credit_ledger for select using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.specimens to authenticated;
grant select, insert, update, delete on public.specimen_photos to authenticated;
grant select, insert on public.visual_checks to authenticated;
grant select on public.sellers to authenticated;
grant select, insert, update, delete on public.listings to authenticated;
grant select on public.orders to authenticated;
grant select, insert on public.ratings to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.credit_ledger to authenticated;
grant execute on function public.credits_balance(uuid) to authenticated;
grant execute on function public.soft_delete_account() to authenticated;
