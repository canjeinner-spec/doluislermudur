import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Icon, IconName, SectionHeader } from '@/components';
import { palette, radius, spacing, typography } from '@/theme';
import { storage, StorageKeys } from '@/storage/storage';

type ToggleKey = 'sync' | 'notifs' | 'sounds' | 'reduceMotion' | 'autoplay' | 'dataSaver';

const DEFAULTS: Record<ToggleKey, boolean> = {
  sync: true,
  notifs: true,
  sounds: true,
  reduceMotion: false,
  autoplay: true,
  dataSaver: false,
};

type Group = {
  header: string;
  rows: { key: ToggleKey; icon: IconName; title: string; subtitle: string }[];
};

const GROUPS: Group[] = [
  {
    header: 'Oynatma',
    rows: [
      { key: 'sync', icon: 'repeat', title: 'Otomatik Senkronizasyon', subtitle: 'Oynatmayı herkesle eşitle' },
      { key: 'autoplay', icon: 'play', title: 'Otomatik Oynat', subtitle: 'Odaya girince başlat' },
      { key: 'dataSaver', icon: 'eye', title: 'Veri Tasarrufu', subtitle: 'Daha düşük çözünürlük' },
    ],
  },
  {
    header: 'Bildirimler',
    rows: [
      { key: 'notifs', icon: 'bell', title: 'Davet Bildirimleri', subtitle: 'Yeni davetlerde uyar' },
      { key: 'sounds', icon: 'volume', title: 'Sohbet Sesleri', subtitle: 'Yeni mesaj tonu' },
    ],
  },
  {
    header: 'Erişilebilirlik',
    rows: [
      { key: 'reduceMotion', icon: 'sparkle', title: 'Hareketi Azalt', subtitle: 'Animasyonları sadeleştir' },
    ],
  },
];

/** Native-switch preferences, persisted through the storage layer. */
export function SettingsSheet() {
  const [values, setValues] = useState<Record<ToggleKey, boolean>>(() =>
    storage.getJSON<Record<ToggleKey, boolean>>(StorageKeys.settings, DEFAULTS)
  );

  const setValue = (key: ToggleKey, v: boolean) => {
    const next = { ...values, [key]: v };
    setValues(next);
    storage.setJSON(StorageKeys.settings, next);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {GROUPS.map((group) => (
        <View key={group.header} style={styles.group}>
          <SectionHeader title={group.header} />
          <View style={styles.card}>
            {group.rows.map((row, i) => (
              <View key={row.key}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.row}>
                  <View style={styles.iconBox}>
                    <Icon name={row.icon} size={18} color={palette.amber} />
                  </View>
                  <View style={styles.text}>
                    <Text style={[typography.body, styles.title]}>{row.title}</Text>
                    <Text style={[typography.caption1, styles.subtitle]}>{row.subtitle}</Text>
                  </View>
                  <Switch
                    value={values[row.key]}
                    onValueChange={(v) => setValue(row.key, v)}
                    trackColor={{ false: 'rgba(255,255,255,0.12)', true: palette.copper }}
                    thumbColor={palette.white}
                    ios_backgroundColor="rgba(255,255,255,0.12)"
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  group: {
    gap: 0,
  },
  card: {
    backgroundColor: palette.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.separator,
    marginLeft: 60,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: palette.accentTintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 1,
  },
  title: {
    color: palette.textPrimary,
  },
  subtitle: {
    color: palette.textTertiary,
  },
});
