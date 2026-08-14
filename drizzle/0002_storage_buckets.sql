-- Storage buckets for profile pictures and event cover images.
--
-- These are the one place the browser talks to Supabase directly, so unlike
-- the public tables (RLS enabled, zero policies) these DO need policies.
--
-- Public read: avatars and event posters are shown to anonymous visitors.
-- Signed URLs would add latency and cache-busting for no security benefit.
--
-- Writes are scoped: a user may only write inside a folder named for their own
-- uid, so nobody can overwrite another member's avatar. Event covers are
-- uploaded server-side by admins, so they get no client-side insert policy.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('event-covers', 'event-covers', true)
on conflict (id) do nothing;
--> statement-breakpoint

drop policy if exists "avatars are publicly readable" on storage.objects;
--> statement-breakpoint
create policy "avatars are publicly readable" on storage.objects
  for select using (bucket_id = 'avatars');
--> statement-breakpoint

drop policy if exists "event covers are publicly readable" on storage.objects;
--> statement-breakpoint
create policy "event covers are publicly readable" on storage.objects
  for select using (bucket_id = 'event-covers');
--> statement-breakpoint

drop policy if exists "users write own avatar" on storage.objects;
--> statement-breakpoint
create policy "users write own avatar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
--> statement-breakpoint

drop policy if exists "users update own avatar" on storage.objects;
--> statement-breakpoint
create policy "users update own avatar" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
--> statement-breakpoint

drop policy if exists "users delete own avatar" on storage.objects;
--> statement-breakpoint
create policy "users delete own avatar" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
