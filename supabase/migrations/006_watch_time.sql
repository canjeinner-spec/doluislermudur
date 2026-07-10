-- Accumulate watch time. The app calls this once a minute while a user is in a
-- room, so profiles.minutes_watched grows. Run in the Supabase SQL editor.
create or replace function public.add_watch_minutes(p_minutes integer)
returns void language sql security definer set search_path = public as $$
  update public.profiles
     set minutes_watched = minutes_watched + greatest(p_minutes, 0)
   where id = auth.uid();
$$;
grant execute on function public.add_watch_minutes(integer) to authenticated;
