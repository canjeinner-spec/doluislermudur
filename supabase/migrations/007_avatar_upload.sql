-- 007_avatar_upload.sql
-- Real avatar photos: a public "avatars" storage bucket + an avatar_url column
-- on profiles. Each user may only write inside a folder named after their own
-- uid (…/<uid>/avatar_*.jpg), while anyone can read (public bucket → the URL
-- goes straight into <Image>). Run this in the Supabase SQL editor.

-- 1. Column that holds the public URL of the uploaded photo (null = monogram).
alter table public.profiles
  add column if not exists avatar_url text;

-- 2. The bucket. Public so the CDN URL renders without a signed request.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 3. Storage RLS. Read is open; writes are scoped to the caller's own folder,
--    i.e. the first path segment must equal their auth uid.
drop policy if exists "avatars read" on storage.objects;
create policy "avatars read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars insert own" on storage.objects;
create policy "avatars insert own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
