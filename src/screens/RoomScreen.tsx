import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  AvatarStack,
  BottomSheet,
  Icon,
  IconButton,
  ListRow,
  NavBar,
  PlatformLogo,
  ScreenBackground,
  SegmentedControl,
  VideoPlayer,
} from '@/components';
import { CURRENT_USER, ROOMS, getPlatform, type Participant, type Room } from '@/data';
import { palette, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';
import { InviteFriendsSheet } from './sheets';
import { ChatView } from './room/ChatView';
import { UsersPanel } from './room/UsersPanel';

type Props = NativeStackScreenProps<RootStackParamList, 'Room'>;

type Tab = 'chat' | 'users';

/** Build a Room from an existing id, or synthesize one from the create draft. */
function useRoom(params: Props['route']['params']): Room {
  return useMemo(() => {
    if (params.roomId) {
      const found = ROOMS.find((r) => r.id === params.roomId);
      if (found) return found;
    }
    const platform = getPlatform(params.platformId ?? 'netflix');
    const base = ROOMS[0];
    const participants: Participant[] = [
      { id: 'me', name: CURRENT_USER.name, handle: CURRENT_USER.handle, role: 'host', online: true, watching: true, tint: CURRENT_USER.tint },
      ...base.participants.slice(1, 4),
    ];
    return {
      id: 'new',
      title: params.draft?.name ?? 'Yeni Oda',
      subtitle: params.draft?.description || 'Az önce oluşturuldu',
      platform: platform?.id ?? 'netflix',
      platformLabel: platform?.name ?? 'Netflix',
      status: 'watching',
      isPublic: params.draft?.isPublic ?? true,
      hostName: CURRENT_USER.name,
      participantCount: participants.length,
      maxParticipants: params.draft?.maxParticipants ?? 10,
      posterIndex: base.posterIndex,
      participants,
    };
  }, [params]);
}

export function RoomScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const room = useRoom(route.params);
  const [tab, setTab] = useState<Tab>('chat');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Slide-over: Users panel rides in from the right over the chat.
  const panelProgress = useSharedValue(0);
  const setTabAnimated = (next: string) => {
    const t = next as Tab;
    setTab(t);
    panelProgress.value = withTiming(t === 'users' ? 1 : 0, { duration: 280 });
  };

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - panelProgress.value) * 40 }],
    opacity: panelProgress.value,
  }));
  const chatStyle = useAnimatedStyle(() => ({
    opacity: 1 - panelProgress.value,
  }));

  const onlineCount = room.participants.filter((p) => p.online).length;

  return (
    <ScreenBackground glow="none">
      <NavBar
        left={
          <IconButton
            icon="chevron-down"
            accessibilityLabel="Odadan çık"
            variant="glass"
            onPress={() => navigation.goBack()}
          />
        }
        titleNode={
          <View style={styles.titleWrap}>
            <View style={styles.titleRow}>
              <Text style={[typography.headline, styles.title]} numberOfLines={1}>
                {room.title}
              </Text>
              <Icon name="crown" size={13} color={palette.amber} filled />
            </View>
            <View style={styles.subRow}>
              <PlatformLogo id={room.platform} size={12} />
              <Text style={[typography.caption2, styles.sub]} numberOfLines={1}>
                {room.platformLabel} · {room.hostName}
              </Text>
            </View>
          </View>
        }
        right={
          <>
            <IconButton
              icon="cast"
              size={38}
              accessibilityLabel="Yayınla"
              variant="glass"
            />
            <IconButton
              icon="settings"
              size={38}
              accessibilityLabel="Oda ayarları"
              variant="glass"
              onPress={() => setSettingsOpen(true)}
            />
          </>
        }
      />

      {/* Participant strip */}
      <View style={styles.participantsRow}>
        <AvatarStack
          participants={room.participants}
          max={6}
          size={34}
          overflowCount={Math.max(0, room.participantCount - 6)}
          ringColor={palette.background}
        />
        <View style={styles.spacer} />
        <View style={styles.onlinePill}>
          <View style={styles.onlineDot} />
          <Text style={[typography.caption1, styles.onlineText]}>{onlineCount} çevrimiçi</Text>
        </View>
      </View>

      {/* Player */}
      <View style={styles.playerWrap}>
        <VideoPlayer posterIndex={room.posterIndex} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <SegmentedControl
          value={tab}
          onChange={setTabAnimated}
          segments={[
            { key: 'chat', label: 'Sohbet', badge: 12 },
            { key: 'users', label: 'Kullanıcılar', badge: room.participantCount },
          ]}
        />
      </View>

      {/* Content region: chat with a users slide-over above it */}
      <View style={styles.content}>
        <Animated.View style={[StyleSheet.absoluteFill, chatStyle]} pointerEvents={tab === 'chat' ? 'auto' : 'none'}>
          <ChatView bottomInset={insets.bottom} />
        </Animated.View>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.panel, panelStyle]}
          pointerEvents={tab === 'users' ? 'auto' : 'none'}
        >
          <UsersPanel
            participants={room.participants}
            bottomInset={insets.bottom}
            onInvite={() => setInviteOpen(true)}
          />
        </Animated.View>
      </View>

      <BottomSheet
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Arkadaş Davet Et"
        height={0.7}
      >
        <InviteFriendsSheet roomName={room.title} />
      </BottomSheet>

      <BottomSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Oda"
        height={0.42}
      >
        <View style={styles.actions}>
          <ListRow
            title="Arkadaş Davet Et"
            subtitle="Bu odaya davet linki gönder"
            leadingIcon="person-add"
            showChevron
            onPress={() => {
              setSettingsOpen(false);
              setTimeout(() => setInviteOpen(true), 220);
            }}
          />
          <ListRow
            title="Davet Linkini Kopyala"
            subtitle="astera.app/join/8F3K2Q"
            leadingIcon="share"
            showChevron
            onPress={() => setSettingsOpen(false)}
          />
          <ListRow
            title="Odadan Ayrıl"
            leadingIcon="chevron-left"
            leadingTint={palette.danger}
            destructive
            onPress={() => {
              setSettingsOpen(false);
              setTimeout(() => navigation.goBack(), 200);
            }}
          />
        </View>
      </BottomSheet>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  titleWrap: {
    alignItems: 'center',
    gap: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  title: {
    color: palette.textPrimary,
    maxWidth: 180,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sub: {
    color: palette.textSecondary,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  spacer: {
    flex: 1,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(78,208,138,0.12)',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.online,
  },
  onlineText: {
    color: palette.online,
    fontWeight: '600',
  },
  playerWrap: {
    paddingHorizontal: spacing.lg,
  },
  tabsWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  content: {
    flex: 1,
  },
  panel: {
    backgroundColor: palette.background,
  },
  actions: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
});
