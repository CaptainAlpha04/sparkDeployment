-- Seed the homepage figures with the values the old site published, so the
-- rebuild is behaviour-identical on day one. They are now editable by an admin
-- rather than hardcoded in JSX, which is how the previous build ended up
-- shipping numbers nobody could substantiate.
--
-- "Affliated" is the original spelling from the live site; kept so the seed is
-- a faithful starting point rather than a silent content change.

insert into site_stats (key, label, value, position) values
  ('student_members',         'Student Members',         '500+', 0),
  ('successful_events',       'Successful Events',       '3+',   1),
  ('affiliated_societies',    'Affliated Societies',     '10+',  2),
  ('affiliated_institutions', 'Affiliated Institutions', '50+',  3)
on conflict (key) do nothing;
