-- Profile screen support. Run in the Supabase SQL editor.

-- Keep rooms_hosted real: bump the host's counter whenever they create a room.
create or replace function public.bump_rooms_hosted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set rooms_hosted = rooms_hosted + 1 where id = NEW.host_id;
  return NEW;
end; $$;

drop trigger if exists trg_rooms_hosted on public.rooms;
create trigger trg_rooms_hosted
  after insert on public.rooms
  for each row execute function public.bump_rooms_hosted();

-- Let a user delete their own account (cascades to their profile/rooms).
create or replace function public.delete_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  delete from auth.users where id = auth.uid();
end; $$;
grant execute on function public.delete_account() to authenticated;
