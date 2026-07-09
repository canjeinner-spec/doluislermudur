import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PLATFORMS } from '@/data';
import { PlatformLogo } from '@/components/icons';
import { palette, radius, spacing, typography } from '@/theme';

/** Read-only list of supported streaming services. */
export function PlatformsSheet() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={[typography.subhead, styles.intro]}>
        ASTERA aşağıdaki servislerdeki içerikleri senkronize izlemenizi sağlar. Giriş her zaman
        platformun kendi sayfasında yapılır.
      </Text>
      <View style={styles.grid}>
        {PLATFORMS.map((p) => (
          <View key={p.id} style={styles.row}>
            <PlatformLogo id={p.id} size={40} />
            <View style={styles.text}>
              <Text style={[typography.subheadEmphasized, styles.name]}>{p.name}</Text>
              <Text style={[typography.caption1, styles.desc]} numberOfLines={1}>
                {p.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  intro: {
    color: palette.textSecondary,
    marginBottom: spacing.lg,
  },
  grid: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  text: {
    flex: 1,
    gap: 1,
  },
  name: {
    color: palette.textPrimary,
  },
  desc: {
    color: palette.textTertiary,
  },
});
