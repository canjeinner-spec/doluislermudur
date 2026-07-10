import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase, type SyncEvent } from '@/backend';
import type { ControlEvent, WebPlayerHandle } from '@/components';

type Args = {
  roomId?: string;
  isHost: boolean;
  enabled: boolean;
  playerRef: RefObject<WebPlayerHandle | null>;
};

/** How far a follower may drift from the host before we hard-seek them back. */
const DRIFT_TOLERANCE = 1.2; // seconds

function applyRemote(p: SyncEvent, player: WebPlayerHandle | null) {
  if (!player) return;
  if (p.kind === 'control') {
    if (p.action === 'play') player.play();
    else if (p.action === 'pause') player.pause();
    else if (p.action === 'seek') player.seek(p.time);
  } else if (p.kind === 'heartbeat') {
    if (p.paused) {
      player.pause();
      return;
    }
    player.play();
    // Where the host should be *now*, accounting for transit time.
    const expected = p.time + (Date.now() - p.at) / 1000;
    const info = player.getInfo();
    if (Math.abs(info.time - expected) > DRIFT_TOLERANCE) player.seek(expected);
  }
}

/**
 * Host-authoritative playback sync over a Realtime Broadcast channel.
 * - Host: emits control events (via broadcastControl) and a periodic heartbeat.
 * - Followers: apply incoming control events and correct drift on each heartbeat.
 */
export function usePlaybackSync({ roomId, isHost, enabled, playerRef }: Args) {
  const chanRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !roomId || !supabase) return;
    const client = supabase;
    const ch = client.channel(`sync:${roomId}`, { config: { broadcast: { self: false } } });

    ch.on('broadcast', { event: 'sync' }, ({ payload }) => {
      if (isHost) return; // the host drives; it doesn't follow
      applyRemote(payload as SyncEvent, playerRef.current);
    });
    ch.subscribe();
    chanRef.current = ch;

    let heartbeat: ReturnType<typeof setInterval> | undefined;
    if (isHost) {
      heartbeat = setInterval(() => {
        const info = playerRef.current?.getInfo();
        if (!info) return;
        ch.send({
          type: 'broadcast',
          event: 'sync',
          payload: { kind: 'heartbeat', time: info.time, paused: !info.playing, at: Date.now() },
        });
      }, 2500);
    }

    return () => {
      if (heartbeat) clearInterval(heartbeat);
      client.removeChannel(ch);
      chanRef.current = null;
    };
  }, [enabled, roomId, isHost, playerRef]);

  const broadcastControl = useCallback(
    (e: ControlEvent) => {
      if (!isHost) return;
      const ch = chanRef.current;
      if (!ch) return;
      const at = Date.now();
      const payload: SyncEvent =
        e.type === 'seek'
          ? { kind: 'control', action: 'seek', time: e.time, at }
          : { kind: 'control', action: e.type, time: 0, at };
      ch.send({ type: 'broadcast', event: 'sync', payload });
    },
    [isHost]
  );

  return { broadcastControl };
}
