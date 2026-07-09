-- ASTERA backend schema (Supabase / Postgres)
-- Paste this whole file into the Supabase SQL editor and Run.
-- Then enable Auth → Providers → "Anonymous sign-ins".
--
-- Room model (ephemeral):
--   • every room is visible in the list; it floats up as its member count grows
--   • when the host leaves, host passes to the earliest-joined remaining member
--   • when the last member leaves, the room is deleted
--   • the host can kick anyone; a kicked person is banned and cannot rejoin
--     until the host invites them again
--   • only the host can invite (by @handle or link)

-- ────────────────────────────────────────────────────────────────────────────
-- Tables
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  handle         text unique not null,
  display_name   text not null default 'İzleyici',
  avatar_tint    text not null default '#C87F4C',
  minutes_watched integer not null default 0,
  rooms_hosted   integer not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists public.rooms (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null default upper(substr(md5(random()::text), 1, 6)),
  title            text not null,
  platform         text not null,
  platform_label   text not null default '',
  content_url      text,
  host_id          uuid not null references public.profiles (id) on delete cascade,
  is_public        boolean not null default true,
  status           text not null default 'watching',
  member_count     integer not null default 0,   -- kept in sync by trigger; list sorts on it
  max_participants integer not null default 10,
  created_at       timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id   uuid not null references public.rooms (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

-- Kicked users. Presence here blocks re-joining until the host removes the row.
create table if not exists public.room_bans (
  room_id   uuid not null references public.rooms (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  banned_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.rooms (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_room_created_idx on public.messages (room_id, created_at);
create index if not exists rooms_list_idx on public.rooms (member_count desc, created_at desc);

-- ────────────────────────────────────────────────────────────────────────────
-- Helpers (SECURITY DEFINER so policies don't recurse through RLS)
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.is_room_member(p_room uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.room_members m
                 where m.room_id = p_room and m.user_id = auth.uid());
$$;

create or replace function public.is_room_host(p_room uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.rooms r
                 where r.id = p_room and r.host_id = auth.uid());
$$;

create or replace function public.is_banned(p_room uuid, p_user uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.room_bans b
                 where b.room_id = p_room and b.user_id = p_user);
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- Triggers: member count, host hand-off, auto-delete of empty rooms
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.sync_member_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (TG_OP = 'INSERT') then
    update public.rooms set member_count = member_count + 1 where id = NEW.room_id;
    return NEW;
  else
    update public.rooms set member_count = greatest(member_count - 1, 0) where id = OLD.room_id;
    return OLD;
  end if;
end; $$;

drop trigger if exists trg_member_count on public.room_members;
create trigger trg_member_count
  after insert or delete on public.room_members
  for each row execute function public.sync_member_count();

create or replace function public.handle_member_leave()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  remaining int;
  new_host  uuid;
  cur_host  uuid;
begin
  select host_id into cur_host from public.rooms where id = OLD.room_id;
  if cur_host is null then
    return OLD; -- room already gone
  end if;

  select count(*) into remaining from public.room_members where room_id = OLD.room_id;

  if remaining = 0 then
    delete from public.rooms where id = OLD.room_id;  -- last one out: room disappears
    return OLD;
  end if;

  if cur_host = OLD.user_id then                       -- host left: promote next-in-line
    select user_id into new_host from public.room_members
      where room_id = OLD.room_id order by joined_at asc limit 1;
    update public.rooms set host_id = new_host where id = OLD.room_id;
    update public.room_members set role = 'host'
      where room_id = OLD.room_id and user_id = new_host;
  end if;
  return OLD;
end; $$;

-- Runs after the count trigger (alphabetical order of trigger names).
drop trigger if exists trg_zz_member_leave on public.room_members;
create trigger trg_zz_member_leave
  after delete on public.room_members
  for each row execute function public.handle_member_leave();

-- ────────────────────────────────────────────────────────────────────────────
-- RPCs the app calls: kick (host only) and invite/unban (host only)
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.kick_member(p_room uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_room_host(p_room) then
    raise exception 'Only the host can remove members';
  end if;
  if p_user = auth.uid() then
    raise exception 'The host cannot kick themselves';
  end if;
  insert into public.room_bans (room_id, user_id) values (p_room, p_user)
    on conflict do nothing;
  delete from public.room_members where room_id = p_room and user_id = p_user;
end; $$;

-- Invite by @handle: lifts any ban so the user may join (link/@handle both land here).
create or replace function public.invite_member(p_room uuid, p_handle text)
returns uuid language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  if not public.is_room_host(p_room) then
    raise exception 'Only the host can invite';
  end if;
  select id into target from public.profiles
    where lower(handle) = lower(ltrim(p_handle, '@'))
       or lower(handle) = lower(p_handle);
  if target is null then
    raise exception 'No user with that handle';
  end if;
  delete from public.room_bans where room_id = p_room and user_id = target;
  return target;
end; $$;

-- ────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────────────────────────────────

alter table public.profiles     enable row level security;
alter table public.rooms         enable row level security;
alter table public.room_members  enable row level security;
alter table public.room_bans     enable row level security;
alter table public.messages      enable row level security;

-- Profiles: any signed-in user can read (names/avatars, @handle lookups); write own.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_upsert on public.profiles;
create policy profiles_upsert on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid());

-- Rooms: every room is listable; only the host mutates room rows.
drop policy if exists rooms_read on public.rooms;
create policy rooms_read on public.rooms for select to authenticated using (true);
drop policy if exists rooms_insert on public.rooms;
create policy rooms_insert on public.rooms for insert to authenticated with check (host_id = auth.uid());
drop policy if exists rooms_update on public.rooms;
create policy rooms_update on public.rooms for update to authenticated using (host_id = auth.uid());
drop policy if exists rooms_delete on public.rooms;
create policy rooms_delete on public.rooms for delete to authenticated using (host_id = auth.uid());

-- Members: fellow members see the roster; you join yourself unless banned; you may
-- leave yourself and the host may remove anyone (host removal also goes via kick_member).
drop policy if exists members_read on public.room_members;
create policy members_read on public.room_members for select to authenticated
  using (user_id = auth.uid() or public.is_room_member(room_id));
drop policy if exists members_join on public.room_members;
create policy members_join on public.room_members for insert to authenticated
  with check (user_id = auth.uid() and not public.is_banned(room_id, auth.uid()));
drop policy if exists members_leave on public.room_members;
create policy members_leave on public.room_members for delete to authenticated
  using (user_id = auth.uid() or public.is_room_host(room_id));

-- Bans: only the host reads/manages their room's ban list.
drop policy if exists bans_host on public.room_bans;
create policy bans_host on public.room_bans for all to authenticated
  using (public.is_room_host(room_id)) with check (public.is_room_host(room_id));

-- Messages: room members read and post.
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated
  using (public.is_room_member(room_id));
drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages for insert to authenticated
  with check (author_id = auth.uid() and public.is_room_member(room_id));

-- ────────────────────────────────────────────────────────────────────────────
-- Realtime (chat + roster + room list changes). Playback sync uses Broadcast.
-- ────────────────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.rooms;
