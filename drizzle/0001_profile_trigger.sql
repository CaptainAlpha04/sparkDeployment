-- Mirror auth.users into public.profiles on signup.
--
-- SECURITY DEFINER with an EMPTY search_path is mandatory: omitting the empty
-- search_path is a documented privilege-escalation vector. The consequence is
-- that every reference below must be fully schema-qualified.
--
-- Google OAuth places full_name and avatar_url in raw_user_meta_data; email
-- and password signups may supply nothing at all, so both must be tolerated.
--
-- WARNING: if this function raises, signup fails for EVERY user with an opaque
-- "Database error saving new user" from the Auth API. Covered by
-- src/server/schema/trigger.test.ts.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
--> statement-breakpoint

drop trigger if exists on_auth_user_created on auth.users;
--> statement-breakpoint

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
