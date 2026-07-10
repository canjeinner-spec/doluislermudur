import { useCallback, useEffect, useState } from 'react';

import type { Participant, Room } from '@/data';

import { isBackendConfigured } from './config';
import { fetchMyProfile } from './auth';
import { supabase } from './supabase';
import type { ProfileRow } from './types';
import {
  fetchMembers,
  fetchRoom,
  fetchRooms,
  joinRoom,
  leaveRoom,
  memberToParticipant,
  subscribeMembers,
  subscribeRoom,
  subscribeRooms,
  toRoom,
} from './rooms';

/** Live, member-count-sorted list of all rooms. Empty when backend is off. */
export function useRooms(): { rooms: Room[]; loading: boolean; refresh: () => void } {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(isBackendConfigured);

  const refresh = useCallback(async () => {
    if (!isBackendConfigured) return;
    const rows = await fetchRooms();
    setRooms(rows.map((r) => toRoom(r)));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isBackendConfigured) {
      setLoading(false);
      return;
    }
    refresh();
    // Realtime covers member-count changes; a ban doesn't touch the rooms table,
    // so the list is also refreshed on screen focus (see HomeScreen).
    const unsub = subscribeRooms(refresh);
    return () => {
      unsub();
    };
  }, [refresh]);

  return { rooms, loading, refresh };
}

/** Current auth identity + whether it's an anonymous ("Başlayalım") user. */
export function useAuth(): { userId: string | null; isAnonymous: boolean; loading: boolean } {
  const [state, setState] = useState<{ userId: string | null; isAnonymous: boolean }>({
    userId: null,
    isAnonymous: true,
  });
  const [loading, setLoading] = useState(isBackendConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const client = supabase;
    const apply = (u: { id: string; is_anonymous?: boolean } | null) =>
      setState({ userId: u?.id ?? null, isAnonymous: u?.is_anonymous ?? true });
    client.auth.getUser().then(({ data }) => {
      apply(data.user);
      setLoading(false);
    });
    const { data: sub } = client.auth.onAuthStateChange((_e, session) => apply(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { ...state, loading };
}

/** The signed-in user's id (null until resolved / when backend is off). */
export function useMyId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setId(data.user?.id ?? null));
  }, []);
  return id;
}

/** The signed-in user's own profile row, live-ish (refetched on mount). */
export function useMyProfile(): { profile: ProfileRow | null; loading: boolean } {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(isBackendConfigured);

  useEffect(() => {
    if (!isBackendConfigured) {
      setLoading(false);
      return;
    }
    let alive = true;
    fetchMyProfile().then((p) => {
      if (alive) {
        setProfile(p);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return { profile, loading };
}

export type RoomSession = {
  room: Room | null;
  participants: Participant[];
  hostId: string | null;
  contentUrl: string | undefined;
  loading: boolean;
};

/**
 * Join a room on mount, leave on unmount, and keep its row + roster live.
 * Leaving triggers the server-side host hand-off / room deletion. Returns a
 * null room when the backend is off (the caller falls back to local data).
 */
export function useRoomSession(roomId: string | undefined): RoomSession {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);
  const [contentUrl, setContentUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(isBackendConfigured && !!roomId);

  useEffect(() => {
    if (!isBackendConfigured || !roomId) {
      setLoading(false);
      return;
    }
    let alive = true;

    const load = async () => {
      const [r, ms] = await Promise.all([fetchRoom(roomId), fetchMembers(roomId)]);
      if (!alive) return;
      if (r) {
        const parts = ms.map((m) => memberToParticipant(m, r.host_id));
        setHostId(r.host_id);
        setContentUrl(r.content_url ?? undefined);
        setParticipants(parts);
        setRoom(toRoom(r, parts));
      }
      setLoading(false);
    };

    // Join first so RLS lets us read the roster, then load + subscribe.
    joinRoom(roomId).then(load);
    const unsubRoom = subscribeRoom(roomId, load);
    const unsubMembers = subscribeMembers(roomId, load);

    return () => {
      alive = false;
      unsubRoom();
      unsubMembers();
      leaveRoom(roomId);
    };
  }, [roomId]);

  return { room, participants, hostId, contentUrl, loading };
}
