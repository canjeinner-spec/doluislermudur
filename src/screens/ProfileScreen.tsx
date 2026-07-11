import React, { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Avatar, GlassSurface, Icon, IconButton, NavBar, PressableScale, ScreenBackground } from '@/components';
import type { IconName } from '@/components';
import { CURRENT_USER } from '@/data';
import { deleteAccount, signOut, useAuth, useMyProfile } from '@/backend';
import { palette, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function formatWatch(minutes: number): string {
  if (minutes >= 60) return `${Math.floor(minutes / 60)}s ${minutes % 60}dk`;
  return `${minutes} dk`;
}

function memberSince(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, refresh } = useMyProfile();
  const { email } = useAuth();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const name = profile?.display_name ?? CURRENT_USER.name;
  const handle = profile?.handle ?? CURRENT_USER.handle;
  const tint = profile?.avatar_tint ?? CURRENT_USER.tint;

  const stats: { label: string; value: string; icon: IconName }[] = [
    { label: 'İzleme Süresi', value: formatWatch(profile?.minutes_watched ?? 0), icon: 'eye' },
    { label: 'Kurulan Oda', value: String(profile?.rooms_hosted ?? 0), icon: 'rooms' },
  ];

  const logout = () => {
    Alert.alert('Çıkış yap', 'Hesabından çıkış yapmak istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ]);
  };

  const remove = () => {
    Alert.alert('Hesabı sil', 'Hesabın ve tüm verilerin kalıcı olarak silinecek. Bu işlem geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Hesabı Sil',
        style: 'destructive',
        onPress: async () => {
          const err = await deleteAccount();
          if (err) {
            Alert.alert('Silinemedi', err);
            return;
          }
          navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
        },
      },
    ]);
  };

  return (
    <ScreenBackground glow="top">
      <NavBar
        title="Profil"
        left={
          <IconButton icon="chevron-left" variant="glass" accessibilityLabel="Geri" onPress={() => navigation.goBack()} />
        }
        right={
          <IconButton
            icon="edit"
            variant="glass"
            accessibilityLabel="Profili düzenle"
            onPress={() => navigation.navigate('ProfileEdit')}
          />
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {/* Hero */}
        <GlassSurface borderRadius={radius.xxl} intensity={28} style={styles.hero}>
          <Avatar name={name} tint={tint} size={82} online imageUrl={profile?.avatar_url} />
          <Text style={[typography.title2, styles.name]}>{name}</Text>
          <Text style={[typography.subhead, styles.handle]}>{handle}</Text>
          <View style={styles.memberChip}>
            <Icon name="sparkle" size={12} color={palette.amber} filled />
            <Text style={[typography.caption1, styles.memberText]}>Üye · {memberSince(profile?.created_at)}</Text>
          </View>
        </GlassSurface>

        {/* Stat tiles (real) */}
        <View style={styles.statRow}>
          {stats.map((s) => (
            <GlassSurface key={s.label} borderRadius={radius.lg} intensity={24} style={styles.statCard}>
              <Icon name={s.icon} size={18} color={palette.amber} />
              <Text style={[typography.title2, styles.statValue]}>{s.value}</Text>
              <Text style={[typography.caption1, styles.statLabel]}>{s.label}</Text>
            </GlassSurface>
          ))}
        </View>

        {/* Account (real) */}
        <Text style={styles.section}>HESAP BİLGİLERİ</Text>
        <GlassSurface borderRadius={radius.lg} intensity={24} style={styles.block}>
          <Row icon="globe" label="E-posta" value={email ?? 'Anonim hesap'} />
          <View style={styles.divider} />
          <Row icon="sparkle" label="Üyelik" value={memberSince(profile?.created_at)} />
          <View style={styles.divider} />
          <Row icon="eye" label="Geçirilen süre" value={formatWatch(profile?.minutes_watched ?? 0)} />
        </GlassSurface>

        {/* Quick actions (moved from the edit screen) */}
        <Text style={styles.section}>HIZLI İŞLEMLER</Text>
        <GlassSurface borderRadius={radius.lg} intensity={24} style={styles.block}>
          <ActionRow icon="logout" label="Çıkış Yap" onPress={logout} />
          <View style={styles.divider} />
          <ActionRow icon="close" label="Hesabı Sil" onPress={remove} danger />
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
      <Text style={[typography.bodyEmphasized, styles.rowValue]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const tint = danger ? palette.danger : palette.amber;
  return (
    <PressableScale onPress={onPress} activeScale={0.98} accessibilityLabel={label}>
      <View style={styles.row}>
        <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
          <Icon name={icon} size={17} color={tint} />
        </View>
        <Text style={[typography.body, styles.rowLabel, { color: danger ? palette.danger : palette.textPrimary }]}>
          {label}
        </Text>
        <Icon name="chevron-right" size={18} color={palette.textTertiary} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, gap: spacing.md },
  hero: { alignItems: 'center', paddingVertical: spacing.xl, gap: 3 },
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
  rowIconDanger: { backgroundColor: 'rgba(229,72,77,0.14)' },
  rowLabel: { flex: 1, color: palette.textPrimary },
  rowValue: { color: palette.textSecondary, maxWidth: 190 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.separator, marginLeft: 46 },
});
