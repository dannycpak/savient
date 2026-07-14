-- Webhook event log + dispute queue + reconciliation helpers

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('revenuecat', 'stripe')),
  event_id text,
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create unique index webhook_events_source_event_id_uidx
  on public.webhook_events (source, event_id)
  where event_id is not null;

create index webhook_events_unprocessed_idx
  on public.webhook_events (created_at)
  where processed = false;

-- Human review queue for marketplace disputes
create table public.dispute_queue (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  stripe_dispute_id text,
  status text not null default 'open'
    check (status in ('open', 'in_review', 'resolved_buyer', 'resolved_seller', 'closed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dispute_queue_status_idx on public.dispute_queue (status);

alter table public.webhook_events enable row level security;
alter table public.dispute_queue enable row level security;
-- service role only for writes; no client policies (ops via dashboard / edge)

-- Mark stale shipped orders delivered (7-day auto-confirm). Capture still needs confirm-delivery cron caller.
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
    and created_at < now() - interval '7 days';
$$;

-- Credit ledger vs expected non-negative balances (flags anomalies)
create or replace function public.reconcile_credit_anomalies()
returns table (user_id uuid, balance int, issue text)
language sql
stable
security definer
set search_path = public
as $$
  select b.user_id, b.balance,
         case
           when b.balance < 0 then 'negative_balance'
           else 'ok'
         end as issue
  from (
    select p.id as user_id,
           coalesce(sum(c.delta), 0)::int as balance
    from public.profiles p
    left join public.credit_ledger c on c.user_id = p.id
    where p.deleted_at is null
    group by p.id
  ) b
  where b.balance < 0;
$$;

grant execute on function public.orders_due_for_auto_confirm() to service_role;
grant execute on function public.reconcile_credit_anomalies() to service_role;
grant execute on function public.audit_credit_balances() to service_role;
