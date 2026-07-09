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

import { Avatar, Icon, IconButton, PressableScale } from '@/components';
import { CHAT_SEED, CURRENT_USER, type ChatMessage } from '@/data';
import { palette, radius, spacing, typography } from '@/theme';

const QUICK_EMOJI = ['🔥', '😂', '❤️', '👏', '🍿', '😮', '💯', '👀'];

/** Compact chat: small avatars, tight bubbles, timestamps, and a composer. */
export function ChatView({ bottomInset }: { bottomInset: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_SEED);
  const [draft, setDraft] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
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
    setEmojiOpen(false);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [draft]);

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <MessageRow message={item} prev={messages[index - 1]} />
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        {emojiOpen && (
          <Animated.View entering={FadeIn.duration(160)} style={styles.emojiRow}>
            {QUICK_EMOJI.map((e) => (
              <PressableScale
                key={e}
                onPress={() => setDraft((d) => d + e)}
                activeScale={0.85}
                accessibilityLabel={`Emoji ${e}`}
              >
                <View style={styles.emojiChip}>
                  <Text style={styles.emoji}>{e}</Text>
                </View>
              </PressableScale>
            ))}
          </Animated.View>
        )}

        <View style={[styles.composer, { paddingBottom: bottomInset + spacing.sm }]}>
          <IconButton
            icon="emoji"
            size={38}
            iconSize={20}
            variant="plain"
            color={emojiOpen ? palette.amber : palette.textSecondary}
            accessibilityLabel="Emoji"
            onPress={() => setEmojiOpen((o) => !o)}
          />
          <View style={styles.inputWrap}>
            <TextInputRow value={draft} onChange={setDraft} onSubmit={send} />
            <IconButton
              icon="attach"
              size={30}
              iconSize={18}
              variant="plain"
              color={palette.textTertiary}
              accessibilityLabel="Dosya ekle"
            />
          </View>
          <PressableScale
            onPress={send}
            activeScale={0.88}
            disabled={!draft.trim()}
            accessibilityLabel="Gönder"
          >
            <View style={[styles.send, !draft.trim() && styles.sendDisabled]}>
              <Icon name="send" size={19} color={palette.white} filled />
            </View>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function TextInputRow({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (t: string) => void;
  onSubmit: () => void;
}) {
  return (
    <TextInput
      style={[typography.body, styles.input]}
      value={value}
      onChangeText={onChange}
      placeholder="Mesaj yaz…"
      placeholderTextColor={palette.textTertiary}
      selectionColor={palette.amber}
      cursorColor={palette.amber}
      keyboardAppearance="dark"
      multiline
      onSubmitEditing={onSubmit}
      blurOnSubmit={false}
      returnKeyType="send"
    />
  );
}

function MessageRow({ message, prev }: { message: ChatMessage; prev?: ChatMessage }) {
  const grouped = prev?.authorId === message.authorId;
  if (message.mine) {
    return (
      <Animated.View entering={FadeIn.duration(180)} style={[styles.rowMine, grouped && styles.grouped]}>
        <View style={styles.mineCol}>
          <View style={[styles.bubble, styles.bubbleMine]}>
            <Text style={[typography.subhead, styles.mineText]}>{message.text}</Text>
          </View>
          <Text style={[typography.caption2, styles.timeMine]}>{message.time}</Text>
        </View>
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={FadeIn.duration(180)} style={[styles.row, grouped && styles.grouped]}>
      <View style={styles.avatarCol}>
        {!grouped ? (
          <Avatar name={message.authorName} tint={message.tint} size={30} />
        ) : (
          <View style={{ width: 30 }} />
        )}
      </View>
      <View style={styles.col}>
        {!grouped && (
          <View style={styles.nameRow}>
            <Text style={[typography.footnoteEmphasized, { color: message.tint }]}>
              {message.authorName}
            </Text>
            <Text style={[typography.caption2, styles.time]}>{message.time}</Text>
          </View>
        )}
        <View style={[styles.bubble, styles.bubbleTheirs]}>
          <Text style={[typography.subhead, styles.text]}>{message.text}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  rowMine: {
    alignItems: 'flex-end',
  },
  grouped: {
    marginTop: -spacing.xs,
  },
  avatarCol: {
    width: 30,
    justifyContent: 'flex-end',
  },
  col: {
    flex: 1,
    gap: 3,
    alignItems: 'flex-start',
  },
  mineCol: {
    maxWidth: '82%',
    alignItems: 'flex-end',
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    maxWidth: '92%',
  },
  bubbleTheirs: {
    backgroundColor: palette.surfaceSecondary,
    borderTopLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  bubbleMine: {
    backgroundColor: palette.ember,
    borderTopRightRadius: 4,
  },
  text: {
    color: palette.textPrimary,
  },
  mineText: {
    color: palette.white,
  },
  time: {
    color: palette.textTertiary,
  },
  timeMine: {
    color: palette.textTertiary,
    marginRight: spacing.xs,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  emojiChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.separator,
    backgroundColor: 'rgba(9,9,9,0.85)',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: radius.xl,
    backgroundColor: palette.surfaceSecondary,
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
  sendDisabled: {
    backgroundColor: palette.surfaceElevated,
    opacity: 0.7,
  },
});
