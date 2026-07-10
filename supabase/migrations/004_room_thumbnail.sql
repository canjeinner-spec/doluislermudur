-- Store a content thumbnail on rooms (og:image for Netflix/Prime/Drive; YouTube
-- derives its own from the video id). Run in the Supabase SQL editor.
alter table public.rooms add column if not exists thumbnail_url text;

-- Only count CONFIRMED accounts as "registered", so a half-finished signup no
-- longer shows the email as existing in the login flow.
create or replace function public.email_exists(p_email text)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from auth.users
    where lower(email) = lower(trim(p_email)) and email_confirmed_at is not null
  );
$$;
