import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  fetchMessages,
  isBackendConfigured,
  sendMessage,
  subscribeMessages,
  type MessageRow,
  type MessageWithAuthor,
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
};

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function joinedToChat(m: MessageWithAuthor, myId?: string | null): ChatMessage {
  return {
    id: m.id,
    authorId: m.author_id,
    authorName: m.author_id === myId ? 'Sen' : m.author?.display_name ?? 'İzleyici',
    tint: m.author?.avatar_tint ?? palette.copper,
    text: m.text,
    time: fmtTime(m.created_at),
    mine: m.author_id === myId,
  };
}

function rowToChat(m: MessageRow, myId?: string | null, participants?: Participant[]): ChatMessage {
  const p = participants?.find((x) => x.id === m.author_id);
  return {
    id: m.id,
    authorId: m.author_id,
    authorName: m.author_id === myId ? 'Sen' : p?.name ?? 'İzleyici',
    tint: p?.tint ?? palette.copper,
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
}: Props) {
  const backend = isBackendConfigured && !!roomId;
  const [messages, setMessages] = useState<ChatMessage[]>(backend ? [] : CHAT_SEED);
  const [draft, setDraft] = useState('');

  // Live messages from the backend: initial load + realtime inserts (deduped,
  // so our own echoed insert doesn't appear twice).
  useEffect(() => {
    if (!backend || !roomId) return;
    let alive = true;
    fetchMessages(roomId).then((rows) => {
      if (alive) setMessages(rows.map((m) => joinedToChat(m, myId)));
    });
    const unsub = subscribeMessages(roomId, (row) => {
      setMessages((prev) =>
        prev.some((x) => x.id === row.id) ? prev : [...prev, rowToChat(row, myId, participants)]
      );
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [backend, roomId, myId, participants]);

  const send = useCallback(() => {
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
  }, [draft, backend, roomId, myId, participants]);

  // Inverted list wants newest first; precompute grouping in chronological order.
  const data = useMemo<Row[]>(() => {
    const rows = messages.map((m, i) => ({
      message: m,
      grouped: messages[i - 1]?.authorId === m.authorId && messages[i - 1]?.mine === m.mine,
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

      <FlatList
        data={data}
        inverted
        keyExtractor={(r) => r.message.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <MessageRow message={item.message} grouped={item.grouped} />}
        ListFooterComponent={
          <View style={styles.header}>
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
        }
      />

      <View style={[styles.composer, { paddingBottom: bottomInset + spacing.sm }]}>
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
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageRow({ message, grouped }: { message: ChatMessage; grouped: boolean }) {
  if (message.mine) {
    return (
      <Animated.View entering={FadeIn.duration(160)} style={styles.mineRow}>
        <Text style={[typography.body, styles.mineText]}>{message.text}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(160)} style={[styles.otherRow, grouped && styles.grouped]}>
      <View style={styles.avatarCol}>
        {!grouped ? <Avatar name={message.authorName} tint={message.tint} size={30} /> : <View style={{ width: 30 }} />}
      </View>
      <Text style={[typography.body, styles.otherText]}>
        {!grouped && <Text style={[styles.otherName, { color: message.tint }]}>{message.authorName}  </Text>}
        {message.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
  },
  grouped: { marginTop: -spacing.sm + 2 },
  avatarCol: { width: 30, paddingTop: 1 },
  otherText: { flex: 1, color: palette.textPrimary },
  otherName: { fontWeight: '800' },
  mineRow: {
    alignItems: 'flex-end',
    paddingLeft: 48,
  },
  mineText: { color: palette.amberBright, textAlign: 'right', fontWeight: '500' },
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
});
