import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  LinearTransition,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  BottomSheet,
  Icon,
  IconButton,
  NavBar,
  PressableScale,
  RoomCard,
  ScreenBackground,
  TextField,
} from '@/components';
import { ROOMS } from '@/data';
import { isBackendConfigured, useRooms } from '@/backend';
import { accentGradient, palette, shadow, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';
import {
  AboutSheet,
  HowItWorksSheet,
  InviteFriendsSheet,
  PlatformsSheet,
  SettingsSheet,
} from './sheets';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type SheetKey = 'platforms' | 'howitworks' | 'invite' | 'settings' | 'about';

const SHEET_TITLES: Record<SheetKey, string> = {
  platforms: 'Platformlar',
  howitworks: 'Nasıl Çalışır?',
  invite: 'Arkadaş Davet Et',
  settings: 'Ayarlar',
  about: 'Hakkında',
};

const AnimatedCard = Animated.createAnimatedComponent(View);

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [sheet, setSheet] = useState<SheetKey | null>(null);

  const { rooms: liveRooms } = useRooms();
  const source = isBackendConfigured ? liveRooms : ROOMS;

  const rooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        r.platformLabel.toLowerCase().includes(q)
    );
  }, [query, source]);

  const activeCount = source.filter((r) => r.status === 'watching').length;

  return (
    <ScreenBackground>
      <NavBar
        left={
          <IconButton
            icon="info"
            iconSize={24}
            variant="plain"
            accessibilityLabel="Hakkında"
            onPress={() => setSheet('about')}
          />
        }
        titleNode={<Text style={styles.brand}>ASTERA</Text>}
        right={
          <IconButton
            icon="users"
            iconSize={24}
            variant="plain"
            accessibilityLabel="Profil"
            onPress={() => navigation.navigate('Profile')}
          />
        }
      />

      <Animated.FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 96 },
        ]}
        itemLayoutAnimation={LinearTransition.springify().damping(24)}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={[typography.largeTitle, styles.pageTitle]}>Odalar</Text>
              <View style={styles.countPill}>
                <View style={styles.livePulse} />
                <Text style={[typography.footnoteEmphasized, styles.countText]}>
                  {activeCount} aktif oda
                </Text>
              </View>
            </View>
            <TextField
              value={query}
              onChangeText={setQuery}
              placeholder="Oda, film veya platform ara"
              icon="search"
              style={styles.search}
              trailing={
                <IconButton
                  icon="sliders"
                  size={30}
                  iconSize={16}
                  variant="plain"
                  color={palette.textTertiary}
                  accessibilityLabel="Filtrele"
                />
              }
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedCard entering={FadeInDown.delay(index * 55).springify().damping(18)}>
            <RoomCard
              room={item}
              onPress={() => navigation.navigate('Room', { roomId: item.id })}
              onLongPress={() => setSheet('invite')}
            />
          </AnimatedCard>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name={query ? 'search' : 'rooms'} size={30} color={palette.textTertiary} />
            <Text style={[typography.body, styles.emptyText]}>
              {query ? `“${query}” için oda bulunamadı` : 'Henüz açık oda yok — ilk odayı sen kur!'}
            </Text>
          </View>
        }
      />

      {/* Round create FAB, bottom-right (Rave-style). */}
      <View style={[styles.fabWrap, { paddingBottom: insets.bottom + spacing.lg }]} pointerEvents="box-none">
        <PressableScale
          onPress={() => navigation.navigate('CreateRoom')}
          activeScale={0.9}
          accessibilityLabel="Oda oluştur"
          style={[styles.fab, shadow.accentGlow]}
        >
          <LinearGradient
            colors={accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Icon name="plus" size={30} color={palette.white} strokeWidth={2.4} />
          </LinearGradient>
        </PressableScale>
      </View>

      <BottomSheet
        visible={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet ? SHEET_TITLES[sheet] : ''}
        height={sheet === 'about' ? 0.72 : 0.68}
      >
        {sheet === 'platforms' && <PlatformsSheet />}
        {sheet === 'howitworks' && <HowItWorksSheet />}
        {sheet === 'invite' && <InviteFriendsSheet />}
        {sheet === 'settings' && <SettingsSheet />}
        {sheet === 'about' && <AboutSheet />}
      </BottomSheet>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoDot: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: palette.accentTintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    ...typography.title3,
    fontSize: 21,
    color: palette.textPrimary,
    letterSpacing: 3.5,
    fontWeight: '800',
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    color: palette.textPrimary,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.accentTintSoft,
  },
  livePulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.amberBright,
  },
  countText: {
    color: palette.amber,
  },
  search: {
    marginTop: -spacing.xs,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.huge,
  },
  emptyText: {
    color: palette.textSecondary,
  },
  fabWrap: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 0,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
