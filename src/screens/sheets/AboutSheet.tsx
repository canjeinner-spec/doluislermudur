import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon, IconName } from '@/components/icons';
import { palette, radius, spacing, typography } from '@/theme';

const VALUES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'lock', title: 'Gizlilik önce', body: 'Kimlik bilgilerin asla ASTERA’dan geçmez.' },
  { icon: 'sparkle', title: 'Sinematik deneyim', body: 'Apple kalitesinde, sade ve premium tasarım.' },
  { icon: 'users', title: 'Birlikte, her yerde', body: 'Arkadaşlarınla senkronize izleme keyfi.' },
];

/** App identity, tagline and guiding principles. */
export function AboutSheet() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Icon name="film" size={34} color={palette.amberBright} />
        </View>
        <Text style={[typography.title2, styles.brand]}>ASTERA</Text>
        <Text style={[typography.subhead, styles.tagline]}>Watch Together. Anywhere.</Text>
        <Text style={[typography.caption1, styles.version]}>Sürüm 1.0.0 (MVP)</Text>
      </View>

      <Text style={[typography.body, styles.desc]}>
        ASTERA, arkadaşlarınla senkronize izleme deneyimi sunar. Film, dizi ve video içeriklerini
        birlikte izle, sohbet et ve anları paylaş — tıpkı aynı odadaymışsınız gibi.
      </Text>

      <View style={styles.values}>
        {VALUES.map((v) => (
          <View key={v.title} style={styles.value}>
            <View style={styles.valueIcon}>
              <Icon name={v.icon} size={18} color={palette.amber} />
            </View>
            <View style={styles.valueText}>
              <Text style={[typography.subheadEmphasized, styles.valueTitle]}>{v.title}</Text>
              <Text style={[typography.footnote, styles.valueBody]}>{v.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={[typography.caption1, styles.credit]}>Made with ♥ · © 2026 ASTERA</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xl,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    backgroundColor: palette.accentTintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  brand: {
    color: palette.textPrimary,
    letterSpacing: 3,
  },
  tagline: {
    color: palette.amber,
  },
  version: {
    color: palette.textTertiary,
    marginTop: 2,
  },
  desc: {
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  values: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  valueIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: palette.accentTintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    flex: 1,
    gap: 1,
  },
  valueTitle: {
    color: palette.textPrimary,
  },
  valueBody: {
    color: palette.textSecondary,
  },
  credit: {
    color: palette.textTertiary,
    marginTop: spacing.xl,
  },
});
