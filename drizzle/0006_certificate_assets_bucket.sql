-- Storage for certificate background artwork.
--
-- Public read: a certificate is rendered on the public verification page, so
-- the background must load without a signed URL.
--
-- Writes are admin-only and go through the server, so there is no client-side
-- insert policy at all — unlike avatars, members never upload here.

insert into storage.buckets (id, name, public)
values ('certificate-assets', 'certificate-assets', true)
on conflict (id) do nothing;
--> statement-breakpoint

drop policy if exists "certificate assets are publicly readable" on storage.objects;
--> statement-breakpoint
create policy "certificate assets are publicly readable" on storage.objects
  for select using (bucket_id = 'certificate-assets');
