import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Avatar,
  GlassSurface,
  Icon,
  IconButton,
  NavBar,
  PlatformLogo,
  ScreenBackground,
} from '@/components';
import type { IconName, PlatformId } from '@/components';
import { CURRENT_USER, ROOMS } from '@/data';
import { palette, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const STATS: { label: string; value: string; icon: IconName }[] = [
  { label: 'İzleme', value: '48s', icon: 'eye' },
  { label: 'Oda', value: '24', icon: 'rooms' },
  { label: 'Arkadaş', value: '18', icon: 'users' },
];

const PLATFORM_USAGE: { id: PlatformId; label: string; pct: number }[] = [
  { id: 'netflix', label: 'Netflix', pct: 0.62 },
  { id: 'youtube', label: 'YouTube', pct: 0.24 },
  { id: 'prime', label: 'Prime Video', pct: 0.14 },
];

const BADGES: { icon: IconName; label: string }[] = [
  { icon: 'sparkle', label: 'İlk Oda' },
  { icon: 'crown', label: 'Sunucu' },
  { icon: 'eye', label: 'Sinefil' },
  { icon: 'users', label: 'Sosyal' },
  { icon: 'play', label: 'Gece Kuşu' },
];

export function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ScreenBackground glow="top">
      <NavBar
        title="Profil"
        left={
          <IconButton icon="chevron-left" variant="glass" accessibilityLabel="Geri" onPress={() => navigation.goBack()} />
        }
        right={<IconButton icon="settings" variant="glass" accessibilityLabel="Ayarlar" />}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {/* Hero */}
        <GlassSurface borderRadius={radius.xxl} intensity={28} style={styles.hero}>
          <Avatar name={CURRENT_USER.name} tint={CURRENT_USER.tint} size={78} online />
          <Text style={[typography.title2, styles.name]}>{CURRENT_USER.name}</Text>
          <Text style={[typography.subhead, styles.handle]}>{CURRENT_USER.handle}</Text>
          <View style={styles.memberChip}>
            <Icon name="sparkle" size={12} color={palette.amber} filled />
            <Text style={[typography.caption1, styles.memberText]}>Üye · Ocak 2026</Text>
          </View>
        </GlassSurface>

        {/* Stat tiles */}
        <View style={styles.statRow}>
          {STATS.map((s) => (
            <GlassSurface key={s.label} borderRadius={radius.lg} intensity={24} style={styles.statCard}>
              <Icon name={s.icon} size={18} color={palette.amber} />
              <Text style={[typography.title2, styles.statValue]}>{s.value}</Text>
              <Text style={[typography.caption1, styles.statLabel]}>{s.label}</Text>
            </GlassSurface>
          ))}
        </View>

        {/* This month */}
        <Text style={styles.section}>BU AY</Text>
        <GlassSurface borderRadius={radius.lg} intensity={24} style={styles.block}>
          <Row icon="eye" label="İzleme süresi" value="12s 40dk" />
          <View style={styles.divider} />
          <Row icon="rooms" label="Katıldığın oda" value="9" />
          <View style={styles.divider} />
          <Row icon="person-add" label="Gönderilen davet" value="14" />
        </GlassSurface>

        {/* Favorite platforms */}
        <Text style={styles.section}>FAVORİ PLATFORMLAR</Text>
        <GlassSurface borderRadius={radius.lg} intensity={24} style={styles.block}>
          {PLATFORM_USAGE.map((p, i) => (
            <View key={p.id}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.platformRow}>
                <PlatformLogo id={p.id} size={30} />
                <View style={styles.platformText}>
                  <Text style={[typography.subheadEmphasized, styles.platformName]}>{p.label}</Text>
                  <View style={styles.bar}>
                    <View style={[styles.barFill, { width: `${Math.round(p.pct * 100)}%` }]} />
                  </View>
                </View>
                <Text style={[typography.footnoteEmphasized, styles.pct]}>%{Math.round(p.pct * 100)}</Text>
              </View>
            </View>
          ))}
        </GlassSurface>

        {/* Badges */}
        <Text style={styles.section}>ROZETLER</Text>
        <View style={styles.badges}>
          {BADGES.map((b) => (
            <GlassSurface key={b.label} borderRadius={radius.pill} intensity={22} style={styles.badge}>
              <Icon name={b.icon} size={14} color={palette.amberBright} filled />
              <Text style={[typography.footnoteEmphasized, styles.badgeText]}>{b.label}</Text>
            </GlassSurface>
          ))}
        </View>

        {/* Recently watched */}
        <Text style={styles.section}>SON İZLENENLER</Text>
        <GlassSurface borderRadius={radius.lg} intensity={24} style={styles.block}>
          {ROOMS.slice(0, 3).map((r, i) => (
            <View key={r.id}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.recentRow}>
                <PlatformLogo id={r.platform} size={30} />
                <View style={styles.recentText}>
                  <Text style={[typography.subheadEmphasized, styles.recentTitle]} numberOfLines={1}>{r.title}</Text>
                  <Text style={[typography.caption1, styles.recentSub]}>{r.platformLabel}</Text>
                </View>
                <Text style={[typography.caption1, styles.recentAgo]}>{i === 0 ? 'Dün' : `${i + 1} gün önce`}</Text>
              </View>
            </View>
          ))}
        </GlassSurface>
      </ScrollView>
    </ScreenBackground>
  );
}

function Row({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={17} color={palette.amber} />
      </View>
      <Text style={[typography.body, styles.rowLabel]}>{label}</Text>
      <Text style={[typography.bodyEmphasized, styles.rowValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, gap: spacing.md },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: 3,
  },
  name: { color: palette.textPrimary, marginTop: spacing.sm },
  handle: { color: palette.textSecondary },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.accentTintSoft,
  },
  memberText: { color: palette.amber, fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg, gap: 4 },
  statValue: { color: palette.textPrimary },
  statLabel: { color: palette.textTertiary },
  section: {
    ...typography.caption2,
    color: palette.textTertiary,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: spacing.md,
    marginBottom: -spacing.xs,
    marginLeft: spacing.xs,
  },
  block: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: palette.accentTintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, color: palette.textPrimary },
  rowValue: { color: palette.textPrimary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.separator, marginLeft: 46 },
  platformRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  platformText: { flex: 1, gap: 6 },
  platformName: { color: palette.textPrimary },
  bar: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3, backgroundColor: palette.copper },
  pct: { color: palette.textSecondary },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgeText: { color: palette.textPrimary },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  recentText: { flex: 1, gap: 1 },
  recentTitle: { color: palette.textPrimary },
  recentSub: { color: palette.textTertiary },
  recentAgo: { color: palette.textTertiary },
});
