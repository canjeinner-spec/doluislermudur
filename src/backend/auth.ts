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
