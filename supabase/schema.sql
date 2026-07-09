-- ASTERA backend schema (Supabase / Postgres)
-- Run this in the Supabase SQL editor once, after creating your project.
-- Then enable Auth → Providers → "Anonymous sign-ins".

-- ────────────────────────────────────────────────────────────────────────────
-- Tables
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  handle         text not null,
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

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.rooms (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_room_created_idx on public.messages (room_id, created_at);
create index if not exists rooms_public_idx on public.rooms (is_public, created_at desc);

-- ────────────────────────────────────────────────────────────────────────────
-- Membership helper (SECURITY DEFINER to avoid RLS recursion)
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.is_room_member(p_room uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.room_members m
    where m.room_id = p_room and m.user_id = auth.uid()
  );
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────────────────────────────────

alter table public.profiles     enable row level security;
alter table public.rooms         enable row level security;
alter table public.room_members  enable row level security;
alter table public.messages      enable row level security;

-- Profiles: everyone signed-in can read (to render names/avatars); write own row.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);
drop policy if exists profiles_upsert on public.profiles;
create policy profiles_upsert on public.profiles
  for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated using (id = auth.uid());

-- Rooms: public rooms visible to all; private rooms only to members. Host writes.
drop policy if exists rooms_read on public.rooms;
create policy rooms_read on public.rooms
  for select to authenticated
  using (is_public or host_id = auth.uid() or public.is_room_member(id));
drop policy if exists rooms_insert on public.rooms;
create policy rooms_insert on public.rooms
  for insert to authenticated with check (host_id = auth.uid());
drop policy if exists rooms_update on public.rooms;
create policy rooms_update on public.rooms
  for update to authenticated using (host_id = auth.uid());
drop policy if exists rooms_delete on public.rooms;
create policy rooms_delete on public.rooms
  for delete to authenticated using (host_id = auth.uid());

-- Room members: visible to fellow members; you manage your own membership.
drop policy if exists members_read on public.room_members;
create policy members_read on public.room_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_room_member(room_id));
drop policy if exists members_join on public.room_members;
create policy members_join on public.room_members
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists members_leave on public.room_members;
create policy members_leave on public.room_members
  for delete to authenticated using (user_id = auth.uid());

-- Messages: room members read and post; you own your messages.
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages
  for select to authenticated using (public.is_room_member(room_id));
drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages
  for insert to authenticated
  with check (author_id = auth.uid() and public.is_room_member(room_id));

-- ────────────────────────────────────────────────────────────────────────────
-- Realtime (Postgres changes for chat + member list; playback sync uses
-- Broadcast/Presence channels, no table needed)
-- ────────────────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.rooms;
