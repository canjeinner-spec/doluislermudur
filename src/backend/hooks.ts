import { useEffect, useState } from 'react';

import type { Participant, Room } from '@/data';

import { isBackendConfigured } from './config';
import { fetchMyProfile } from './auth';
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
export function useRooms(): { rooms: Room[]; loading: boolean } {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(isBackendConfigured);

  useEffect(() => {
    if (!isBackendConfigured) {
      setLoading(false);
      return;
    }
    let alive = true;
    const load = async () => {
      const rows = await fetchRooms();
      if (alive) {
        setRooms(rows.map((r) => toRoom(r)));
        setLoading(false);
      }
    };
    load();
    const unsub = subscribeRooms(load);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  return { rooms, loading };
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
