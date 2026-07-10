import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  GlassSurface,
  Icon,
  IconButton,
  NavBar,
  PlatformWordmark,
  PressableScale,
  ScreenBackground,
} from '@/components';
import { PLATFORMS } from '@/data';
import { palette, radius, spacing, typography } from '@/theme';
import { storage, StorageKeys } from '@/storage/storage';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PlatformSelect'>;

export function PlatformSelectScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { draft } = route.params;

  const onSelect = (platformId: string) => {
    // Always open the provider so the user can start their content; the room
    // opens once playback begins. If already signed in, cookies persist so no
    // credentials are re-entered — the WebView lands straight on the catalog.
    navigation.navigate('WebViewLogin', {
      platformId: platformId as never,
      draft,
      returnToRoom: route.params.returnToRoom,
      roomId: route.params.roomId,
    });
  };

  return (
    <ScreenBackground glow="top">
      <NavBar
        title="Platform Seç"
        left={
          <IconButton
            icon="chevron-left"
            accessibilityLabel="Geri"
            variant="solid"
            onPress={() => navigation.goBack()}
          />
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <Text style={[typography.title2, styles.heading]}>
          Nerede izlemek{'\n'}istiyorsunuz?
        </Text>
        <Text style={[typography.subhead, styles.sub]}>
          Bir platform seçin, içeriği başlatın; oda otomatik olarak açılır. Giriş her zaman
          platformun kendi sayfasında yapılır.
        </Text>

        <View style={styles.list}>
          {PLATFORMS.map((p, i) => {
            const authed = storage
              .getJSON<string[]>(StorageKeys.authedPlatforms, [])
              .includes(p.id);
            return (
              <Animated.View key={p.id} entering={FadeInDown.delay(i * 40).springify().damping(18)}>
                <PressableScale onPress={() => onSelect(p.id)} activeScale={0.98} accessibilityLabel={p.name}>
                  <GlassSurface borderRadius={radius.lg} intensity={24} style={styles.row}>
                    <View style={styles.logoWrap}>
                      <PlatformWordmark id={p.id} />
                    </View>
                    <View style={styles.trailing}>
                      {authed && (
                        <View style={styles.authedChip}>
                          <Icon name="check" size={12} color={palette.online} strokeWidth={2.4} />
                        </View>
                      )}
                      <Icon name="chevron-right" size={18} color={palette.textTertiary} strokeWidth={2.2} />
                    </View>
                  </GlassSurface>
                </PressableScale>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  heading: {
    color: palette.textPrimary,
    marginBottom: spacing.sm,
  },
  sub: {
    color: palette.textSecondary,
    marginBottom: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  logoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authedChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(78,208,138,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
