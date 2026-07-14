-- Allow draft listings before Connect is active; publishing still requires active.

drop policy if exists listings_seller_write on public.listings;

create policy listings_seller_write on public.listings
  for all to authenticated
  using (
    exists (
      select 1 from public.sellers s
      where s.id = seller_id and s.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sellers s
      where s.id = seller_id
        and s.profile_id = auth.uid()
        and (
          status = 'draft'
          or s.connect_onboarding_status = 'active'
        )
    )
  );
