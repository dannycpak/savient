-- Demo reviewer profile bootstrap.
-- 1) Create auth user in Supabase Dashboard (email reviewer@sage.demo) OR Auth Admin API.
-- 2) Replace :auth_user_id below with that user's UUID, then run:

-- update public.profiles
-- set display_name = 'App Reviewer',
--     plan = 'plus',
--     checks_used_month = 0,
--     checks_month_key = to_char(timezone('utc', now()), 'YYYY-MM')
-- where id = ':auth_user_id';
--
-- insert into public.subscriptions (user_id, rc_app_user_id, rc_entitlement, status, store)
-- values (':auth_user_id', ':auth_user_id', 'plus', 'active', 'app_store')
-- on conflict (user_id) do update
--   set status = 'active', rc_entitlement = 'plus', updated_at = now();
--
-- Optional sample specimen for screenshots:
-- insert into public.specimens (owner_id, species, locality, est_value_cents, visibility)
-- values (':auth_user_id', 'Aquamarine', 'Pakistan', 45000, 'private');

select 'See comments in supabase/seed/demo_reviewer.sql for reviewer bootstrap steps.' as instructions;
