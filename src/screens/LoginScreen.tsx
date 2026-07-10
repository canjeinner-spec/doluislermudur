import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Icon, IconButton, NavBar, PressableScale, ScreenBackground, TextField } from '@/components';
import { checkEmailPolicy, emailExists, register, signIn } from '@/backend';
import { accentGradient, palette, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type Step = 'email' | 'password' | 'register';

export function LoginScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const returnRoomId = route.params?.returnRoomId;
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the stack to a single Home so we never end up with two Home screens
  // (each opening the same realtime channel and colliding). When we arrived from
  // a room, re-enter that room on top of Home so the anonymous "viewer" is now
  // replaced by the freshly signed-in account (which re-joins the roster).
  const done = () =>
    navigation.reset(
      returnRoomId
        ? { index: 1, routes: [{ name: 'Home' }, { name: 'Room', params: { roomId: returnRoomId } }] }
        : { index: 0, routes: [{ name: 'Home' }] }
    );

  const checkEmail = async () => {
    setError(null);
    const policy = checkEmailPolicy(email);
    if (!policy.ok) {
      setError(policy.reason ?? 'Geçerli bir e-posta gir');
      return;
    }
    setBusy(true);
    const exists = await emailExists(email);
    setBusy(false);
    setStep(exists ? 'password' : 'register');
  };

  const doSignIn = async () => {
    setError(null);
    if (!password) return;
    setBusy(true);
    const err = await signIn(email, password);
    setBusy(false);
    if (err) setError('E-posta veya şifre hatalı');
    else done();
  };

  const doRegister = async () => {
    setError(null);
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return;
    }
    if (!name.trim()) {
      setError('Bir görünen ad gir');
      return;
    }
    setBusy(true);
    const err = await register(email, password, name);
    setBusy(false);
    if (err) setError('Kayıt olunamadı: ' + err);
    else done();
  };

  const back = () => {
    setError(null);
    if (step !== 'email') {
      setStep('email');
      return;
    }
    // Reached login straight from onboarding (which was replaced) → nothing to
    // go back to, so drop into the app as an anonymous viewer.
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <ScreenBackground glow="top">
      <NavBar
        left={<IconButton icon="chevron-left" variant="glass" accessibilityLabel="Geri" onPress={back} />}
        title={step === 'register' ? 'Kayıt Ol' : 'Giriş Yap'}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={80}
      >
        <View style={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
          <Text style={[typography.title1, styles.heading]}>
            {step === 'email'
              ? 'ASTERA hesabın'
              : step === 'password'
                ? 'Tekrar hoş geldin'
                : 'Hesabını oluştur'}
          </Text>
          <Text style={[typography.subhead, styles.sub]}>
            {step === 'email'
              ? 'E-postanı gir; hesabın varsa giriş yaparsın, yoksa hızlıca kayıt oluruz.'
              : step === 'password'
                ? email
                : `${email} için yeni bir hesap`}
          </Text>

          <View style={styles.form}>
            <TextField
              value={email}
              onChangeText={setEmail}
              placeholder="E-posta"
              icon="globe"
              editable={step === 'email'}
              keyboardType="email-address"
              autoCapitalize="none"
              onSubmitEditing={step === 'email' ? checkEmail : undefined}
            />

            {step !== 'email' && (
              <Animated.View entering={FadeIn.duration(200)}>
                <TextField
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Şifre"
                  icon="lock"
                  secureTextEntry
                  autoCapitalize="none"
                  onSubmitEditing={step === 'password' ? doSignIn : undefined}
                />
              </Animated.View>
            )}

            {step === 'register' && (
              <Animated.View entering={FadeIn.duration(200)}>
                <TextField value={name} onChangeText={setName} placeholder="Görünen ad" icon="users" />
                <Text style={styles.notice}>Bu e-postaya kayıtlı hesap bulunamadı — hemen oluşturalım.</Text>
              </Animated.View>
            )}

            {error && <Text style={styles.error}>{error}</Text>}
          </View>

          <PressableScale
            onPress={step === 'email' ? checkEmail : step === 'password' ? doSignIn : doRegister}
            activeScale={0.97}
            disabled={busy}
            accessibilityLabel="Devam"
          >
            <LinearGradient colors={accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              {busy ? (
                <ActivityIndicator color={palette.white} />
              ) : (
                <Text style={[typography.headline, styles.ctaText]}>
                  {step === 'email' ? 'Devam' : step === 'password' ? 'Giriş Yap' : 'Kayıt Ol'}
                </Text>
              )}
            </LinearGradient>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  heading: { color: palette.textPrimary },
  sub: { color: palette.textSecondary },
  form: { gap: spacing.md, marginTop: spacing.lg, flex: 1 },
  notice: { ...typography.footnote, color: palette.textTertiary, marginTop: spacing.sm, marginLeft: spacing.xs },
  error: { ...typography.footnoteEmphasized, color: palette.danger, marginLeft: spacing.xs },
  cta: { height: 54, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: palette.white, fontWeight: '700' },
});
