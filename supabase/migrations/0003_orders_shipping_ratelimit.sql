-- Orders: allow buyer/seller updates for shipping + status transitions used by app/RPCs.
-- Seller can set tracking_number and move pending/escrow_held → shipped.
-- Buyer can mark delivered (confirm-delivery function still owns Stripe capture).

create policy orders_buyer_update on public.orders
  for update to authenticated
  using (auth.uid() = buyer_id)
  with check (auth.uid() = buyer_id);

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

-- Auto-confirm helper: mark shipped orders delivered after 7 days (called by cron / edge).
create or replace function public.auto_confirm_delivered_orders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  with updated as (
    update public.orders
      set status = 'delivered'
    where status = 'shipped'
      and tracking_number is not null
      and created_at < now() - interval '7 days'
    returning id
  )
  select count(*) into n from updated;
  return n;
end;
$$;

-- Rate-limit helper: count recent visual checks for a user (last 60s).
create or replace function public.recent_check_count(p_user_id uuid, p_seconds int default 60)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.visual_checks
  where user_id = p_user_id
    and created_at > now() - make_interval(secs => p_seconds);
$$;

grant execute on function public.recent_check_count(uuid, int) to service_role;
