-- Credit balance audit helper for ops / reconciliation jobs.
create or replace function public.audit_credit_balances()
returns table (user_id uuid, balance int, plan text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id as user_id,
         coalesce((select sum(c.delta) from public.credit_ledger c where c.user_id = p.id), 0)::int as balance,
         p.plan
  from public.profiles p
  where p.deleted_at is null
  order by balance desc;
$$;

grant execute on function public.audit_credit_balances() to service_role;
