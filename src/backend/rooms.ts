import type { PlatformId } from '@/components/icons';
import { getPlatform, type Participant, type Room } from '@/data';

import { supabase } from './supabase';
import type { MessageRow, ProfileRow, RoomMemberRow, RoomRow } from './types';

async function uid(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Deterministic poster gradient for a room id (we have no real artwork yet). */
function posterFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return h % 6;
}

/** Map a DB room row into the app's Room shape used by the cards/room screen. */
export function toRoom(r: RoomRow, participants: Participant[] = []): Room {
  const platform = getPlatform(r.platform);
  return {
    id: r.id,
    title: r.title,
    subtitle: '',
    platform: (platform?.id ?? 'netflix') as PlatformId,
    platformLabel: r.platform_label || platform?.name || '',
    status: r.status === 'waiting' ? 'waiting' : 'watching',
    isPublic: r.is_public,
    hostName: '',
    participantCount: r.member_count,
    maxParticipants: r.max_participants,
    posterIndex: posterFor(r.id),
    participants,
  };
}

export function memberToParticipant(
  m: RoomMemberRow & { profile: Pick<ProfileRow, 'display_name' | 'handle' | 'avatar_tint'> | null },
  hostId: string
): Participant {
  return {
    id: m.user_id,
    name: m.profile?.display_name ?? 'İzleyici',
    handle: m.profile?.handle ?? '',
    role: m.user_id === hostId ? 'host' : m.role === 'cohost' ? 'cohost' : 'member',
    online: true,
    watching: true,
    tint: m.profile?.avatar_tint ?? '#C87F4C',
  };
}

// ── Queries ────────────────────────────────────────────────────────────────

export async function fetchRooms(): Promise<RoomRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('member_count', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[astera] fetchRooms:', error.message);
    return [];
  }
  return data ?? [];
}

export async function fetchRoom(roomId: string): Promise<RoomRow | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('rooms').select('*').eq('id', roomId).maybeSingle();
  return data ?? null;
}

export type MemberWithProfile = RoomMemberRow & {
  profile: Pick<ProfileRow, 'display_name' | 'handle' | 'avatar_tint'> | null;
};

export async function fetchMembers(roomId: string): Promise<MemberWithProfile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('room_members')
    .select('*, profile:profiles(display_name, handle, avatar_tint)')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });
  if (error) {
    console.warn('[astera] fetchMembers:', error.message);
    return [];
  }
  return (data ?? []) as unknown as MemberWithProfile[];
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createRoom(input: {
  title: string;
  platform: string;
  platformLabel: string;
  contentUrl?: string | null;
  isPublic: boolean;
}): Promise<RoomRow | null> {
  if (!supabase) return null;
  const me = await uid();
  if (!me) return null;

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      title: input.title,
      platform: input.platform,
      platform_label: input.platformLabel,
      content_url: input.contentUrl ?? null,
      host_id: me,
      is_public: input.isPublic,
    })
    .select('*')
    .single();
  if (error || !data) {
    console.warn('[astera] createRoom:', error?.message);
    return null;
  }

  // Host joins their own room.
  await supabase.from('room_members').insert({ room_id: data.id, user_id: me, role: 'host' });
  return data;
}

/** Join a room. Returns false if blocked (e.g. the user was kicked/banned). */
export async function joinRoom(roomId: string): Promise<boolean> {
  if (!supabase) return false;
  const me = await uid();
  if (!me) return false;
  const { error } = await supabase
    .from('room_members')
    .upsert({ room_id: roomId, user_id: me, role: 'member' }, { onConflict: 'room_id,user_id', ignoreDuplicates: true });
  if (error) {
    console.warn('[astera] joinRoom (banned?):', error.message);
    return false;
  }
  return true;
}

export async function leaveRoom(roomId: string): Promise<void> {
  if (!supabase) return;
  const me = await uid();
  if (!me) return;
  await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', me);
}

export async function updateRoomContent(roomId: string, contentUrl: string, title: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('rooms').update({ content_url: contentUrl, title }).eq('id', roomId);
}

/** Host removes a member and bans them until re-invited. */
export async function kickMember(roomId: string, userId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('kick_member', { p_room: roomId, p_user: userId });
  if (error) console.warn('[astera] kickMember:', error.message);
}

/** Host invites by @handle (also lifts a prior ban). Returns the invited user id. */
export async function inviteByHandle(roomId: string, handle: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('invite_member', { p_room: roomId, p_handle: handle });
  if (error) {
    console.warn('[astera] inviteByHandle:', error.message);
    return null;
  }
  return (data as string) ?? null;
}

// ── Realtime subscriptions (Postgres changes) ────────────────────────────────

export function subscribeRooms(onChange: () => void): () => void {
  if (!supabase) return () => {};
  const client = supabase;
  const ch = client
    .channel('rooms-list')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, onChange)
    .subscribe();
  return () => {
    client.removeChannel(ch);
  };
}

export function subscribeRoom(roomId: string, onChange: () => void): () => void {
  if (!supabase) return () => {};
  const client = supabase;
  const ch = client
    .channel(`room-${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      onChange
    )
    .subscribe();
  return () => {
    client.removeChannel(ch);
  };
}

export function subscribeMembers(roomId: string, onChange: () => void): () => void {
  if (!supabase) return () => {};
  const client = supabase;
  const ch = client
    .channel(`room-members-${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
      onChange
    )
    .subscribe();
  return () => {
    client.removeChannel(ch);
  };
}

export function subscribeMessages(roomId: string, onInsert: (m: MessageRow) => void): () => void {
  if (!supabase) return () => {};
  const client = supabase;
  const ch = client
    .channel(`room-messages-${roomId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
      (payload) => onInsert(payload.new as MessageRow)
    )
    .subscribe();
  return () => {
    client.removeChannel(ch);
  };
}
