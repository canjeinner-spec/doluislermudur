import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase, type SyncEvent } from '@/backend';
import type { ControlEvent, WebPlayerHandle } from '@/components';

type Args = {
  roomId?: string;
  isHost: boolean;
  enabled: boolean;
  playerRef: RefObject<WebPlayerHandle | null>;
  /** Called on every client when the host kicks someone (with that user's id). */
  onKicked?: (userId: string) => void;
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
export function usePlaybackSync({ roomId, isHost, enabled, playerRef, onKicked }: Args) {
  const chanRef = useRef<RealtimeChannel | null>(null);
  const onKickedRef = useRef(onKicked);
  onKickedRef.current = onKicked;
  // Latest authoritative host state a follower knows about — re-applied every
  // second so the moment the follower's player becomes ready it snaps into sync
  // (a single heartbeat can arrive before the player can accept a seek).
  const lastStateRef = useRef<{ time: number; paused: boolean; at: number } | null>(null);

  useEffect(() => {
    if (!enabled || !roomId || !supabase) return;
    const client = supabase;
    const ch = client.channel(`sync:${roomId}`, { config: { broadcast: { self: false } } });

    const pushState = () => {
      const info = playerRef.current?.getInfo();
      if (!info) return;
      ch.send({
        type: 'broadcast',
        event: 'sync',
        payload: { kind: 'heartbeat', time: info.time, paused: !info.playing, at: Date.now() },
      });
    };

    ch.on('broadcast', { event: 'sync' }, ({ payload }) => {
      const p = payload as SyncEvent;
      // Everyone (including the victim) handles a kick; the victim ejects itself.
      if (p.kind === 'kicked') {
        onKickedRef.current?.(p.userId);
        return;
      }
      if (isHost) {
        // Answer a new joiner immediately with the current position.
        if (p.kind === 'request') pushState();
        return; // the host drives; it doesn't follow
      }
      if (p.kind === 'heartbeat') lastStateRef.current = { time: p.time, paused: p.paused, at: p.at };
      else if (p.kind === 'control' && p.action === 'seek') lastStateRef.current = { time: p.time, paused: false, at: p.at };
      else if (p.kind === 'control') lastStateRef.current = { time: lastStateRef.current?.time ?? 0, paused: p.action === 'pause', at: p.at };
      applyRemote(p, playerRef.current);
    });

    let reqTimer: ReturnType<typeof setInterval> | undefined;
    ch.subscribe((status) => {
      // On joining, a follower asks the host for the current state right away
      // (instead of waiting up to a full heartbeat). We re-ask a few times over
      // the first few seconds because the player often isn't ready to seek on
      // the very first reply, which is what made late joiners start from ~0.
      if (status === 'SUBSCRIBED' && !isHost) {
        const req = () =>
          ch.send({ type: 'broadcast', event: 'sync', payload: { kind: 'request', at: Date.now() } });
        req();
        let tries = 0;
        reqTimer = setInterval(() => {
          req();
          if (++tries >= 4 && reqTimer) {
            clearInterval(reqTimer);
            reqTimer = undefined;
          }
        }, 1200);
      }
    });
    chanRef.current = ch;

    const heartbeat = isHost ? setInterval(pushState, 2500) : undefined;
    // Follower: keep nudging the player toward the last known host state.
    const reconcile = !isHost
      ? setInterval(() => {
          const s = lastStateRef.current;
          if (s && playerRef.current) {
            applyRemote({ kind: 'heartbeat', time: s.time, paused: s.paused, at: s.at }, playerRef.current);
          }
        }, 1000)
      : undefined;

    return () => {
      if (heartbeat) clearInterval(heartbeat);
      if (reconcile) clearInterval(reconcile);
      if (reqTimer) clearInterval(reqTimer);
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

  const broadcastKick = useCallback((userId: string) => {
    const ch = chanRef.current;
    if (!ch) return;
    ch.send({ type: 'broadcast', event: 'sync', payload: { kind: 'kicked', userId, at: Date.now() } });
  }, []);

  return { broadcastControl, broadcastKick };
}
