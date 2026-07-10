-- Auth flow support. Run in the Supabase SQL editor.
-- ALSO: Authentication → Providers → Email → turn "Confirm email" OFF, so
-- registering drops the user straight into the app (no email-link step).

-- Does an account already exist for this email? (Used by the login screen to
-- decide password vs. register. Email enumeration is intentional here.)
create or replace function public.email_exists(p_email text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from auth.users where lower(email) = lower(trim(p_email)));
$$;
grant execute on function public.email_exists(text) to anon, authenticated;

-- @handle: registered (non-anonymous) users only, changeable once per 7 days.
alter table public.profiles add column if not exists handle_updated_at timestamptz;

create or replace function public.set_handle(p_handle text)
returns text language plpgsql security definer set search_path = public as $$
declare last_change timestamptz; norm text;
begin
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Kullanıcı adı belirlemek için giriş yapmalısın';
  end if;
  norm := '@' || lower(regexp_replace(ltrim(p_handle, '@'), '[^a-zA-Z0-9_]', '', 'g'));
  if length(norm) < 4 then raise exception 'Kullanıcı adı çok kısa'; end if;
  select handle_updated_at into last_change from public.profiles where id = auth.uid();
  if last_change is not null and last_change > now() - interval '7 days' then
    raise exception 'Kullanıcı adını 7 günde bir değiştirebilirsin';
  end if;
  if exists (select 1 from public.profiles where lower(handle) = norm and id <> auth.uid()) then
    raise exception 'Bu kullanıcı adı alınmış';
  end if;
  update public.profiles set handle = norm, handle_updated_at = now() where id = auth.uid();
  return norm;
end; $$;
grant execute on function public.set_handle(text) to authenticated;
