import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { Avatar, Icon, PressableScale } from '@/components';
import { CHAT_SEED, CURRENT_USER, type ChatMessage, type Participant } from '@/data';
import {
  isBackendConfigured,
  openRoomPresence,
  sendMessage,
  subscribeMessages,
  type MessageRow,
  type PresenceUser,
} from '@/backend';
import { palette, radius, spacing, typography } from '@/theme';

type Props = {
  bottomInset: number;
  nowPlaying: string;
  inviteCode?: string;
  onChangeContent?: () => void;
  /** Distance from the top of the screen to the chat — keeps the composer above
   *  the keyboard on both platforms. */
  keyboardOffset?: number;
  /** Backend room id — when set (and backend configured), chat is live. */
  roomId?: string;
  myId?: string | null;
  participants?: Participant[];
  /** Only load history once we've actually joined (RLS needs membership). */
  ready?: boolean;
  /** Ids that left via a kick (vs. a voluntary leave) — for the presence notice. */
  kickedIdsRef?: React.RefObject<Set<string>>;
  /** Anonymous users can watch but not chat — false shows the auth gate. */
  canInteract?: boolean;
  onRequireAuth?: () => void;
};

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

// Note: authorName always carries the real display name (used for the avatar
// monogram); "mine" rows just don't render the name text.
function rowToChat(m: MessageRow, myId?: string | null, participants?: Participant[]): ChatMessage {
  const p = participants?.find((x) => x.id === m.author_id);
  return {
    id: m.id,
    authorId: m.author_id,
    authorName: p?.name ?? 'İzleyici',
    tint: p?.tint ?? palette.copper,
    avatarUrl: p?.avatarUrl ?? null,
    text: m.text,
    time: fmtTime(m.created_at),
    mine: m.author_id === myId,
  };
}

type Row = { message: ChatMessage; grouped: boolean };

function SendArrow() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19V6M6 12l6-6 6 6"
        stroke={palette.white}
        strokeWidth={2.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Rave-style chat: bubble-less messages floating on a warm gradient, anchored to
 * the bottom (newest at the bottom, growing upward) via an inverted list. The
 * whole thing lifts above the keyboard.
 */
export function ChatView({
  bottomInset,
  nowPlaying,
  inviteCode = '8F3K2Q',
  onChangeContent,
  keyboardOffset = 0,
  roomId,
  myId,
  participants,
  ready = true,
  kickedIdsRef,
  canInteract = true,
  onRequireAuth,
}: Props) {
  const backend = isBackendConfigured && !!roomId;
  const [messages, setMessages] = useState<ChatMessage[]>(backend ? [] : CHAT_SEED);
  const [draft, setDraft] = useState('');

  // Keep the latest roster available to the realtime handler without making it
  // a dependency (which would tear down/rebuild the subscription constantly).
  const participantsRef = useRef(participants);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // Keep already-rendered messages in sync with live profile edits: when a
  // present member changes their name/photo, re-flow their past bubbles too.
  // Authors who have left keep their last-known identity (not in the roster).
  useEffect(() => {
    if (!participants || participants.length === 0) return;
    setMessages((prev) => {
      let changed = false;
      const next = prev.map((m) => {
        const p = participants.find((x) => x.id === m.authorId);
        if (!p) return m;
        if (p.name === m.authorName && p.tint === m.tint && (p.avatarUrl ?? null) === (m.avatarUrl ?? null)) {
          return m;
        }
        changed = true;
        return { ...m, authorName: p.name, tint: p.tint, avatarUrl: p.avatarUrl ?? null };
      });
      return changed ? next : prev;
    });
  }, [participants]);

  // Presence notices. You see your OWN "joined" line (a confirmation), plus every
  // *other* member's join/leave/kick — instant and reliable on iOS + Android via
  // a Realtime Presence channel, surviving any number of leave/rejoin cycles.
  // Leaving/being kicked only shows to the people who stay (you're gone by then).
  // My own identity for the channel comes from my row in the live roster.
  const meParticipant = participants?.find((p) => p.id === myId);
  const meName = meParticipant?.name;
  const meAvatar = meParticipant?.avatarUrl ?? null;
  const meTint = meParticipant?.tint;
  const identityReady = !!(myId && meName);

  const pushNotice = useCallback((u: PresenceUser, kind: 'join' | 'leave' | 'kick') => {
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${kind}-${u.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        authorId: u.id,
        authorName: u.name,
        tint: u.tint,
        avatarUrl: u.avatarUrl ?? null,
        text: '',
        time: '',
        system: kind,
      },
    ]);
  }, []);

  const presenceRef = useRef<{ update: (m: PresenceUser) => void; close: () => void } | null>(null);
  const selfJoinedRef = useRef(false);
  useEffect(() => {
    if (!backend || !roomId || !identityReady || !myId || !meName) return;
    // Your own join confirmation ("Odaya katıldın") — once per room session.
    if (!selfJoinedRef.current) {
      selfJoinedRef.current = true;
      pushNotice({ id: myId, name: meName, avatarUrl: meAvatar, tint: meTint ?? palette.copper }, 'join');
    }
    const handle = openRoomPresence(
      roomId,
      { id: myId, name: meName, avatarUrl: meAvatar, tint: meTint ?? palette.copper },
      {
        onJoin: (u) => pushNotice(u, 'join'),
        onLeave: (u) => {
          const kicked = kickedIdsRef?.current?.has(u.id) ?? false;
          if (kicked) kickedIdsRef?.current?.delete(u.id);
          pushNotice(u, kicked ? 'kick' : 'leave');
        },
      }
    );
    presenceRef.current = handle;
    return () => {
      handle.close();
      presenceRef.current = null;
    };
    // Only (re)subscribe when the room or *whether* we have an identity changes —
    // NOT on every name/photo edit (that would read as a leave+rejoin to others).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend, roomId, identityReady, pushNotice, kickedIdsRef]);

  // Push name/photo edits into the live presence state without re-subscribing.
  useEffect(() => {
    if (!identityReady || !myId || !meName) return;
    presenceRef.current?.update({ id: myId, name: meName, avatarUrl: meAvatar, tint: meTint ?? palette.copper });
  }, [identityReady, myId, meName, meAvatar, meTint]);

  // Chat is ephemeral: no history is loaded. You only see messages posted while
  // you're in the room, so anyone who left (or left and rejoined) starts clean.
  // We just subscribe to realtime inserts once we've joined (RLS needs
  // membership), deduping our own echoed insert.
  useEffect(() => {
    if (!backend || !roomId || !ready) return;
    const unsub = subscribeMessages(roomId, (row) => {
      setMessages((prev) =>
        prev.some((x) => x.id === row.id) ? prev : [...prev, rowToChat(row, myId, participantsRef.current)]
      );
    });
    return () => {
      unsub();
    };
  }, [backend, roomId, myId, ready]);

  const send = useCallback(() => {
    if (!canInteract) {
      onRequireAuth?.();
      return;
    }
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    if (backend && roomId) {
      sendMessage(roomId, text).then((row) => {
        if (row) {
          setMessages((prev) =>
            prev.some((x) => x.id === row.id) ? prev : [...prev, rowToChat(row, myId, participants)]
          );
        }
      });
      return;
    }
    const msg: ChatMessage = {
      id: `m${Date.now()}`,
      authorId: CURRENT_USER.id,
      authorName: 'Sen',
      tint: CURRENT_USER.tint,
      text,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      mine: true,
    };
    setMessages((prev) => [...prev, msg]);
  }, [draft, backend, roomId, myId, participants, canInteract, onRequireAuth]);

  // Inverted list wants newest first; precompute grouping in chronological order.
  const data = useMemo<Row[]>(() => {
    const rows = messages.map((m, i) => ({
      message: m,
      grouped:
        !m.system &&
        !messages[i - 1]?.system &&
        messages[i - 1]?.authorId === m.authorId &&
        messages[i - 1]?.mine === m.mine,
    }));
    return rows.reverse();
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior="padding"
      keyboardVerticalOffset={keyboardOffset}
    >
      {/* Warm cinematic wash behind the chat, like Rave's album-art bleed. */}
      <LinearGradient
        colors={['rgba(122,74,44,0.28)', 'rgba(60,37,23,0.16)', 'rgba(9,9,9,0)']}
        start={{ x: 0.2, y: 1 }}
        end={{ x: 0.9, y: 0 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Now-playing + invite: pinned directly under the player (doesn't scroll). */}
      <View style={styles.pinnedHeader}>
        <View style={styles.systemRow}>
          <Icon name="sparkle" size={14} color={palette.amber} filled />
          <Text style={styles.systemText}>
            Şimdi <Text style={styles.systemStrong}>{nowPlaying}</Text> oynatılıyor
          </Text>
          {onChangeContent && (
            <PressableScale onPress={onChangeContent} activeScale={0.9} accessibilityLabel="İçeriği değiştir">
              <View style={styles.changeBtn}>
                <Icon name="repeat" size={13} color={palette.amberBright} strokeWidth={2.2} />
                <Text style={styles.changeText}>Değiştir</Text>
              </View>
            </PressableScale>
          )}
        </View>
        <View style={styles.systemRow}>
          <Icon name="share" size={13} color={palette.textTertiary} />
          <Text style={styles.inviteText}>
            Davet linki: <Text style={styles.inviteLink}>astera.app/join/{inviteCode}</Text>
          </Text>
        </View>
      </View>

      <FlatList
        data={data}
        inverted
        style={styles.listFlex}
        keyExtractor={(r) => r.message.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) =>
          item.message.system ? (
            <SystemNotice message={item.message} myId={myId} />
          ) : (
            <MessageRow message={item.message} grouped={item.grouped} />
          )
        }
      />

      <View style={[styles.composer, { paddingBottom: bottomInset + spacing.sm }]}>
        {canInteract ? (
          <>
            <View style={styles.inputPill}>
              <TextInput
                style={[typography.body, styles.input]}
                value={draft}
                onChangeText={setDraft}
                placeholder="Mesaj yaz…"
                placeholderTextColor={palette.textTertiary}
                selectionColor={palette.amber}
                cursorColor={palette.amber}
                keyboardAppearance="dark"
                multiline
                onSubmitEditing={send}
                blurOnSubmit={false}
                returnKeyType="send"
              />
            </View>
            <PressableScale onPress={send} activeScale={0.88} disabled={!draft.trim()} accessibilityLabel="Gönder">
              <View style={[styles.send, !draft.trim() && styles.sendDisabled]}>
                <SendArrow />
              </View>
            </PressableScale>
          </>
        ) : (
          <PressableScale onPress={onRequireAuth} activeScale={0.98} style={styles.lockedWrap} accessibilityLabel="Sohbet için giriş yap">
            <View style={styles.lockedPill}>
              <Icon name="lock" size={15} color={palette.textTertiary} strokeWidth={2} />
              <Text style={styles.lockedText}>Sohbet etmek için giriş yap</Text>
            </View>
          </PressableScale>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const AVATAR = 36;
const SYS_AVATAR = 30;

const SYS_LABEL: Record<'join' | 'leave' | 'kick', string> = {
  join: 'katıldı',
  leave: 'ayrıldı',
  kick: 'atıldı',
};

/** Ephemeral presence line. Other members' join/leave/kick render like an
 *  *incoming* message (avatar left) so it reads as the system announcing them,
 *  not as something you typed. Your OWN join is the one thing that belongs to
 *  you, so it sits on your side (right) as "Odaya katıldın". */
function SystemNotice({ message, myId }: { message: ChatMessage; myId?: string | null }) {
  const kind = message.system ?? 'join';
  const isSelfJoin = kind === 'join' && !!myId && message.authorId === myId;

  if (isSelfJoin) {
    return (
      <Animated.View entering={FadeIn.duration(160)} style={styles.systemNoticeRowSelf}>
        <Text style={[styles.systemNoticeText, styles.systemNoticeName]}>Odaya katıldın</Text>
        <Avatar name={message.authorName} tint={message.tint} size={SYS_AVATAR} imageUrl={message.avatarUrl} />
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(160)} style={styles.systemNoticeRow}>
      <Avatar name={message.authorName} tint={message.tint} size={SYS_AVATAR} imageUrl={message.avatarUrl} />
      <Text style={styles.systemNoticeText} numberOfLines={1}>
        <Text style={styles.systemNoticeName}>{message.authorName}</Text>{' '}
        <Text style={kind === 'kick' ? styles.systemNoticeKick : undefined}>{SYS_LABEL[kind]}</Text>
      </Text>
    </Animated.View>
  );
}

function MessageRow({ message, grouped }: { message: ChatMessage; grouped: boolean }) {
  if (message.mine) {
    return (
      <Animated.View entering={FadeIn.duration(160)} style={[styles.mineRow, grouped && styles.grouped]}>
        <Text style={[typography.body, styles.mineText]}>{message.text}</Text>
        {!grouped ? (
          <Avatar name={message.authorName} tint={message.tint} size={AVATAR} imageUrl={message.avatarUrl} ringColor={palette.white} ringWidth={2} />
        ) : (
          <View style={{ width: AVATAR }} />
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(160)} style={[styles.otherRow, grouped && styles.grouped]}>
      {!grouped ? (
        <Avatar name={message.authorName} tint={message.tint} size={AVATAR} imageUrl={message.avatarUrl} ringColor="rgba(255,255,255,0.55)" ringWidth={2} />
      ) : (
        <View style={{ width: AVATAR }} />
      )}
      <Text style={[typography.body, styles.otherText]}>
        {!grouped && <Text style={styles.otherName}>{message.authorName}: </Text>}
        {message.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listFlex: { flex: 1 },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  pinnedHeader: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  systemText: { ...typography.footnote, color: palette.textSecondary, flex: 1 },
  systemStrong: { color: palette.textPrimary, fontWeight: '700' },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.accentTintSoft,
  },
  changeText: { ...typography.caption1, color: palette.amberBright, fontWeight: '700' },
  inviteText: { ...typography.footnote, color: palette.textTertiary, flex: 1 },
  inviteLink: { color: palette.amber, fontWeight: '600', textDecorationLine: 'underline' },
  otherRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    paddingRight: 44,
  },
  grouped: { marginTop: -spacing.sm + 1 },
  systemNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: 44,
  },
  systemNoticeRowSelf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingLeft: 44,
  },
  systemNoticeText: { ...typography.footnote, color: palette.textSecondary, flexShrink: 1 },
  systemNoticeName: { color: palette.textPrimary, fontWeight: '800' },
  systemNoticeKick: { color: palette.danger, fontWeight: '700' },
  otherText: { flex: 1, color: palette.textPrimary, fontSize: 16, lineHeight: 22, paddingTop: 6 },
  otherName: { fontWeight: '800', color: palette.white },
  mineRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingLeft: 44,
  },
  mineText: {
    color: palette.white,
    textAlign: 'right',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    paddingTop: 6,
    flexShrink: 1,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  input: {
    flex: 1,
    color: palette.textPrimary,
    maxHeight: 100,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.copper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: palette.surfaceElevated, opacity: 0.6 },
  lockedWrap: { flex: 1 },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  lockedText: { ...typography.subhead, color: palette.textTertiary },
});
