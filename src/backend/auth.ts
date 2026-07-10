import { palette } from '@/theme';
import { storage, StorageKeys } from '@/storage/storage';

import { supabase } from './supabase';
import type { AuthedUser, ProfileRow } from './types';

const TINTS = ['#C87F4C', '#5B8DEF', '#4ED08A', '#E0685E', '#D9A441', '#3FB6C4', '#D067A8'];

function randomHandle(): string {
  return '@user' + Math.floor(1000 + Math.random() * 9000);
}

function profileToUser(row: ProfileRow): AuthedUser {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    avatarTint: row.avatar_tint,
  };
}

/**
 * Make sure we have an identity to attach to rooms/messages. Uses Supabase
 * anonymous sign-in (enable it in Auth → Providers) so people can start
 * watching immediately; a real login can be layered on later. Also ensures the
 * matching `profiles` row exists. Returns null when the backend isn't set up.
 */
export async function ensureSession(): Promise<AuthedUser | null> {
  if (!supabase) return null;

  let { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.session) {
      console.warn('[astera] anonymous sign-in failed:', error?.message);
      return null;
    }
    session = data.session;
  }

  const userId = session.user.id;
  const displayName = storage.getString(StorageKeys.displayName) || 'İzleyici';

  // Fetch, or create on first run.
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existing) return profileToUser(existing);

  const fresh: ProfileRow = {
    id: userId,
    handle: randomHandle(),
    display_name: displayName,
    avatar_tint: TINTS[Math.floor(Math.random() * TINTS.length)] ?? palette.copper,
    minutes_watched: 0,
    rooms_hosted: 0,
    created_at: new Date().toISOString(),
    handle_updated_at: null,
  };
  const { data: created, error } = await supabase
    .from('profiles')
    .upsert(fresh, { onConflict: 'id' })
    .select('*')
    .single();

  if (error || !created) {
    console.warn('[astera] profile upsert failed:', error?.message);
    return profileToUser(fresh);
  }
  return profileToUser(created);
}

/** True if an account already exists for this email (login vs. register). */
export async function emailExists(email: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('email_exists', { p_email: email.trim() });
  if (error) {
    console.warn('[astera] emailExists:', error.message);
    return false;
  }
  return !!data;
}

/** Sign in to an existing account (replaces the anonymous session). */
export async function signIn(email: string, password: string): Promise<string | null> {
  if (!supabase) return null;
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return error.message;
  await ensureSession();
  return null; // success
}

/**
 * Register: upgrade the current anonymous user to a permanent account (keeps the
 * same id + profile) by adding email + password. Requires "Confirm email" OFF.
 */
export async function register(email: string, password: string, displayName: string): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  let error;
  if (user?.is_anonymous) {
    ({ error } = await supabase.auth.updateUser({ email: email.trim(), password }));
  } else {
    ({ error } = await supabase.auth.signUp({ email: email.trim(), password }));
  }
  if (error) return error.message;
  const name = displayName.trim();
  if (name) {
    storage.setString(StorageKeys.displayName, name);
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) await supabase.from('profiles').upsert({ id: u.id, display_name: name }, { onConflict: 'id' });
  }
  return null; // success
}

/** Set the user's @handle (registered only, once per 7 days). Returns error msg. */
export async function setHandle(handle: string): Promise<{ ok: boolean; value?: string; error?: string }> {
  if (!supabase) return { ok: false, error: 'Bağlantı yok' };
  const { data, error } = await supabase.rpc('set_handle', { p_handle: handle });
  if (error) return { ok: false, error: error.message };
  return { ok: true, value: data as string };
}

/** Fetch the signed-in user's profile row (null when backend is off). */
export async function fetchMyProfile(): Promise<ProfileRow | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return data ?? null;
}

/** Update the local user's display name both locally and on the backend. */
export async function updateDisplayName(name: string): Promise<void> {
  storage.setString(StorageKeys.displayName, name);
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').update({ display_name: name }).eq('id', user.id);
}
