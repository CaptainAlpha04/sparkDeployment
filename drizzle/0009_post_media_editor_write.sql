-- Storage for blog and case study imagery, plus the editor role's write gate.
--
-- This is deliberately a separate file from 0008 rather than appended to it.
-- 0008 runs `alter type role add value 'editor'`, and Postgres refuses to let
-- a newly added enum value be *used* in the same transaction that added it.
-- drizzle-kit wraps each migration file in its own transaction, so putting the
-- `role = 'editor'` comparison here is what makes it legal.

create or replace function public.is_editor()
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
      and role in ('editor', 'admin')
  );
$$;
--> statement-breakpoint

revoke all on function public.is_editor() from public;
--> statement-breakpoint
grant execute on function public.is_editor() to authenticated;
--> statement-breakpoint

-- Public read: cover images and inline figures are served to anonymous
-- readers and scraped by crawlers for og:image, so a signed URL is not an
-- option here.
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;
--> statement-breakpoint

drop policy if exists "post media is publicly readable" on storage.objects;
--> statement-breakpoint
create policy "post media is publicly readable" on storage.objects
  for select using (bucket_id = 'post-media');
--> statement-breakpoint

drop policy if exists "editors write post media" on storage.objects;
--> statement-breakpoint
create policy "editors write post media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-media' and public.is_editor());
--> statement-breakpoint

drop policy if exists "editors update post media" on storage.objects;
--> statement-breakpoint
create policy "editors update post media" on storage.objects
  for update to authenticated
  using (bucket_id = 'post-media' and public.is_editor());
--> statement-breakpoint

drop policy if exists "editors delete post media" on storage.objects;
--> statement-breakpoint
create policy "editors delete post media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-media' and public.is_editor());
