import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Icon,
  IconButton,
  ListRow,
  NavBar,
  PlatformLogo,
  ScreenBackground,
} from '@/components';
import { PLATFORMS } from '@/data';
import { palette, spacing, typography } from '@/theme';
import { storage, StorageKeys } from '@/storage/storage';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PlatformSelect'>;

export function PlatformSelectScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { draft } = route.params;

  const onSelect = (platformId: string) => {
    const authed = storage.getJSON<string[]>(StorageKeys.authedPlatforms, []);
    if (authed.includes(platformId)) {
      // Already signed in on this provider — skip the login WebView entirely.
      navigation.replace('Room', { draft, platformId: platformId as never });
    } else {
      navigation.navigate('WebViewLogin', { platformId: platformId as never, draft });
    }
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
          “{draft.name}” için bir platform seçin. Giriş her zaman platformun kendi sayfasında yapılır.
        </Text>

        <View style={styles.list}>
          {PLATFORMS.map((p, i) => {
            const authed = storage
              .getJSON<string[]>(StorageKeys.authedPlatforms, [])
              .includes(p.id);
            return (
              <Animated.View key={p.id} entering={FadeInDown.delay(i * 40).springify().damping(18)}>
                <ListRow
                  size="lg"
                  title={p.name}
                  subtitle={p.description}
                  leading={<PlatformLogo id={p.id} size={46} />}
                  onPress={() => onSelect(p.id)}
                  trailing={
                    <View style={styles.trailing}>
                      {authed && (
                        <View style={styles.authedChip}>
                          <Icon name="check" size={12} color={palette.online} strokeWidth={2.4} />
                        </View>
                      )}
                      <Icon name="chevron-right" size={18} color={palette.textTertiary} strokeWidth={2.2} />
                    </View>
                  }
                />
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
