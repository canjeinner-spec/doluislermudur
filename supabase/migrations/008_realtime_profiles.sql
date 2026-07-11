-- 008_realtime_profiles.sql
-- Stream profile edits over Realtime so a member changing their display name or
-- photo re-flows into everyone's room roster and chat instantly. Without this
-- the "profiles" table isn't in the publication and no change events arrive.
-- Run in the Supabase SQL editor.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
