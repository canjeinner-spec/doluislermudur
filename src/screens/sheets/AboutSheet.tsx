import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon, PressableScale, Wordmark } from '@/components';
import { palette, radius, spacing, typography } from '@/theme';

/** App identity, a short note, and where to follow along. Kept intentionally
 *  light — the product speaks for itself. */
export function AboutSheet() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.emblem}>
          <Icon name="sparkle" size={26} color={palette.amberBright} filled />
        </View>
        <Wordmark size={30} />
        <Text style={[typography.subhead, styles.tagline]}>Birlikte izleyin, her yerde.</Text>
        <Text style={[typography.caption1, styles.version]}>Sürüm 1.0.0</Text>
      </View>

      <Text style={[typography.body, styles.desc]}>
        ASTERA, arkadaşlarınla ve sevdiklerinle aynı anı paylaşman için. Bir oda aç, davet et,
        birlikte izleyin — kilometreler önemli olmasın.
      </Text>

      <View style={styles.note}>
        <Icon name="sparkle" size={16} color={palette.amber} />
        <Text style={[typography.footnote, styles.noteText]}>
          Her geçen gün büyüyoruz. Yeni platform desteği ve özellikler yolda.
        </Text>
      </View>

      <PressableScale
        onPress={() => Linking.openURL('https://instagram.com/ardaowski')}
        activeScale={0.98}
        accessibilityLabel="Instagram: ardaowski"
      >
        <View style={styles.linkRow}>
          <Text style={[typography.body, styles.linkText]}>Instagram</Text>
          <Text style={[typography.bodyEmphasized, styles.handle]}>@ardaowski</Text>
          <Icon name="chevron-right" size={17} color={palette.textTertiary} />
        </View>
      </PressableScale>

      <Text style={[typography.footnote, styles.thanks]}>Denediğin için teşekkürler. 🤍</Text>
      <Text style={[typography.caption1, styles.credit]}>© 2026 ASTERA</Text>
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
    gap: 6,
    marginBottom: spacing.xl,
  },
  emblem: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: palette.accentTintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  tagline: { color: palette.amber, marginTop: 2 },
  version: { color: palette.textTertiary, marginTop: 2 },
  desc: {
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.accentTintSoft,
    marginBottom: spacing.md,
  },
  noteText: { flex: 1, color: palette.textSecondary },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  linkText: { flex: 1, color: palette.textPrimary },
  handle: { color: palette.amber },
  thanks: { color: palette.textSecondary, marginTop: spacing.xl },
  credit: { color: palette.textTertiary, marginTop: spacing.sm },
});
