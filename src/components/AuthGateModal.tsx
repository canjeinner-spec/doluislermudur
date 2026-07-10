import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { accentGradient, palette, radius, spacing, typography } from '@/theme';
import { Icon } from './icons';
import { PressableScale } from './PressableScale';

type Props = {
  visible: boolean;
  onLogin: () => void;
  onClose: () => void;
  title?: string;
  message?: string;
};

/** Centered gate shown when an anonymous ("Başlayalım") user tries to interact. */
export function AuthGateModal({
  visible,
  onLogin,
  onClose,
  title = 'Etkileşim için giriş yap',
  message = 'Sohbet etmek ve odalarla etkileşmek için bir hesabın olmalı. Giriş yapmadan izlemeye devam edebilirsin.',
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
      <View style={styles.backdrop}>
        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Icon name="lock" size={24} color={palette.amber} strokeWidth={2} />
          </View>
          <Text style={[typography.title3, styles.title]}>{title}</Text>
          <Text style={[typography.subhead, styles.message]}>{message}</Text>

          <PressableScale onPress={onLogin} activeScale={0.96} accessibilityLabel="Giriş yap" style={styles.primaryWrap}>
            <LinearGradient colors={accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
              <Text style={[typography.headline, styles.primaryText]}>Giriş Yap</Text>
            </LinearGradient>
          </PressableScale>

          <PressableScale onPress={onClose} activeScale={0.96} accessibilityLabel="Kapat">
            <View style={styles.secondary}>
              <Text style={[typography.subheadEmphasized, styles.secondaryText]}>Kapat</Text>
            </View>
          </PressableScale>
        </View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    borderRadius: radius.xxl,
    backgroundColor: palette.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.accentTintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { color: palette.textPrimary, textAlign: 'center' },
  message: { color: palette.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  primaryWrap: { width: '100%' },
  primary: {
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: palette.white, fontWeight: '700' },
  secondary: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  secondaryText: { color: palette.textTertiary },
});
