import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon, IconName } from '@/components/icons';
import { palette, radius, spacing, typography } from '@/theme';

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'plus',
    title: 'Bir oda oluştur',
    body: 'Odana bir isim ver, gizliliğini ayarla ve katılımcı sınırını belirle.',
  },
  {
    icon: 'grid',
    title: 'Platform seç',
    body: 'Netflix, Disney+, Prime Video ve daha fazlasından birini seç.',
  },
  {
    icon: 'lock',
    title: 'Güvenle giriş yap',
    body: 'Giriş her zaman platformun kendi sayfasında yapılır. ASTERA şifreni asla görmez.',
  },
  {
    icon: 'person-add',
    title: 'Arkadaşlarını davet et',
    body: 'Bir davet linki paylaş; arkadaşların tek dokunuşla odana katılsın.',
  },
  {
    icon: 'play',
    title: 'Birlikte izle',
    body: 'Oynatma herkes için senkronizedir. Sohbet et, tepki ver, anı paylaş.',
  },
];

/** Step-by-step explainer for new users. */
export function HowItWorksSheet() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {STEPS.map((s, i) => (
        <View key={s.title} style={styles.step}>
          <View style={styles.railCol}>
            <View style={styles.bubble}>
              <Icon name={s.icon} size={18} color={palette.amberBright} />
            </View>
            {i < STEPS.length - 1 && <View style={styles.rail} />}
          </View>
          <View style={styles.text}>
            <Text style={[typography.subheadEmphasized, styles.title]}>
              {i + 1}. {s.title}
            </Text>
            <Text style={[typography.footnote, styles.body]}>{s.body}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  railCol: {
    alignItems: 'center',
    width: 40,
  },
  bubble: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: palette.accentTintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rail: {
    flex: 1,
    width: 2,
    backgroundColor: palette.separator,
    marginVertical: 4,
    minHeight: 18,
  },
  text: {
    flex: 1,
    paddingBottom: spacing.lg,
    gap: 3,
  },
  title: {
    color: palette.textPrimary,
  },
  body: {
    color: palette.textSecondary,
  },
});
