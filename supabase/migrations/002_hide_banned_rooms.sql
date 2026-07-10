-- Hide a room from anyone who was kicked/banned from it, until they're invited
-- back (invite_member clears the ban). Run this in the Supabase SQL editor.

drop policy if exists rooms_read on public.rooms;
create policy rooms_read on public.rooms
  for select to authenticated
  using (not public.is_banned(id, auth.uid()));
