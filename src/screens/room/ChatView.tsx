import React, { useCallback, useRef, useState } from 'react';
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

import { Avatar, Icon, IconButton, PressableScale } from '@/components';
import { CHAT_SEED, CURRENT_USER, type ChatMessage } from '@/data';
import { palette, radius, spacing, typography } from '@/theme';

type Props = {
  bottomInset: number;
  nowPlaying: string;
  inviteCode?: string;
};

/**
 * Rave-style chat: bubble-less messages floating on a warm gradient. Other
 * people sit on the left with an avatar + name; the local user's lines are
 * right-aligned plain text. System notices (now-playing, invite, joins) are
 * woven into the stream.
 */
export function ChatView({ bottomInset, nowPlaying, inviteCode = '8F3K2Q' }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_SEED);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
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
    setDraft('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [draft]);

  return (
    <View style={styles.root}>
      {/* Warm cinematic wash behind the chat, like Rave's album-art bleed. */}
      <LinearGradient
        colors={['rgba(122,74,44,0.28)', 'rgba(60,37,23,0.16)', 'rgba(9,9,9,0)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.systemRow}>
              <Icon name="sparkle" size={14} color={palette.amber} filled />
              <Text style={styles.systemText}>
                Şimdi <Text style={styles.systemStrong}>{nowPlaying}</Text> oynatılıyor
              </Text>
            </View>
            <View style={styles.systemRow}>
              <Icon name="share" size={13} color={palette.textTertiary} />
              <Text style={styles.inviteText}>
                Davet linki: <Text style={styles.inviteLink}>astera.app/join/{inviteCode}</Text>
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <MessageRow message={item} prev={messages[index - 1]} />
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={[styles.composer, { paddingBottom: bottomInset + spacing.sm }]}>
          <View style={styles.micBtn}>
            <Icon name="volume" size={19} color={palette.background} />
          </View>
          <View style={styles.inputPill}>
            <TextInput
              style={[typography.body, styles.input]}
              value={draft}
              onChangeText={setDraft}
              placeholder="Sohbet"
              placeholderTextColor={palette.textTertiary}
              selectionColor={palette.amber}
              cursorColor={palette.amber}
              keyboardAppearance="dark"
              multiline
              onSubmitEditing={send}
              blurOnSubmit={false}
              returnKeyType="send"
            />
            <IconButton icon="emoji" size={30} iconSize={19} variant="plain" color={palette.textTertiary} accessibilityLabel="Emoji" />
            <IconButton icon="attach" size={30} iconSize={18} variant="plain" color={palette.textTertiary} accessibilityLabel="Ekle" />
          </View>
          <PressableScale onPress={send} activeScale={0.88} disabled={!draft.trim()} accessibilityLabel="Gönder">
            <View style={[styles.send, !draft.trim() && styles.sendDisabled]}>
              <Icon name="send" size={19} color={palette.white} filled />
            </View>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function MessageRow({ message, prev }: { message: ChatMessage; prev?: ChatMessage }) {
  const grouped = prev?.authorId === message.authorId && prev?.mine === message.mine;

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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  systemText: { ...typography.footnote, color: palette.textSecondary, flex: 1 },
  systemStrong: { color: palette.textPrimary, fontWeight: '700' },
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
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
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
