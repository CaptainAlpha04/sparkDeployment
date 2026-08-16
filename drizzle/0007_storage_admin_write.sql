-- Let admins upload certificate artwork and event covers.
--
-- The bug this fixes: 0002 and 0006 created these buckets with public read and
-- deliberately no insert policy, on the assumption that uploads happen
-- "server side" and are therefore privileged. They are not. The Supabase SSR
-- client used in Server Actions carries the signed-in user's JWT and acts as
-- the `authenticated` role, so every upload was rejected with
-- "new row violates row-level security policy".
--
-- Note this cannot be written as a plain EXISTS against public.profiles.
-- profiles has RLS enabled with no policies, so an `authenticated` role reading
-- it from inside a policy always sees zero rows and the check would silently
-- always fail. A SECURITY DEFINER helper is required.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;
--> statement-breakpoint

revoke all on function public.is_admin() from public;
--> statement-breakpoint
grant execute on function public.is_admin() to authenticated;
--> statement-breakpoint

-- Certificate artwork ------------------------------------------------------

drop policy if exists "admins write certificate assets" on storage.objects;
--> statement-breakpoint
create policy "admins write certificate assets" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'certificate-assets' and public.is_admin());
--> statement-breakpoint

drop policy if exists "admins update certificate assets" on storage.objects;
--> statement-breakpoint
create policy "admins update certificate assets" on storage.objects
  for update to authenticated
  using (bucket_id = 'certificate-assets' and public.is_admin());
--> statement-breakpoint

drop policy if exists "admins delete certificate assets" on storage.objects;
--> statement-breakpoint
create policy "admins delete certificate assets" on storage.objects
  for delete to authenticated
  using (bucket_id = 'certificate-assets' and public.is_admin());
--> statement-breakpoint

-- Event covers -------------------------------------------------------------
-- Same gap, not yet hit only because no admin has uploaded a cover image.

drop policy if exists "admins write event covers" on storage.objects;
--> statement-breakpoint
create policy "admins write event covers" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-covers' and public.is_admin());
--> statement-breakpoint

drop policy if exists "admins update event covers" on storage.objects;
--> statement-breakpoint
create policy "admins update event covers" on storage.objects
  for update to authenticated
  using (bucket_id = 'event-covers' and public.is_admin());
--> statement-breakpoint

drop policy if exists "admins delete event covers" on storage.objects;
--> statement-breakpoint
create policy "admins delete event covers" on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-covers' and public.is_admin());
