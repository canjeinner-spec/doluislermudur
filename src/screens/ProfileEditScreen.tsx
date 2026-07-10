import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Icon, IconButton, NavBar, PressableScale, ScreenBackground, TextField } from '@/components';
import { deleteAccount, setHandle, signOut, updateDisplayName, useAuth, useMyProfile } from '@/backend';
import { accentGradient, palette, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileEdit'>;

const WEEK = 7 * 24 * 60 * 60 * 1000;
const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export function ProfileEditScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile } = useMyProfile();
  const { isAnonymous } = useAuth();

  const [name, setName] = useState('');
  const [handle, setHandleText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.display_name);
      setHandleText(profile.handle);
    }
  }, [profile]);

  const nextHandleChange = profile?.handle_updated_at
    ? new Date(new Date(profile.handle_updated_at).getTime() + WEEK)
    : null;
  const handleLocked = !!nextHandleChange && nextHandleChange.getTime() > Date.now();

  const save = async () => {
    setMsg(null);
    setBusy(true);
    if (name.trim() && name.trim() !== profile?.display_name) {
      await updateDisplayName(name.trim());
    }
    const h = handle.trim();
    if (!isAnonymous && !handleLocked && h && h !== profile?.handle) {
      const res = await setHandle(h);
      if (!res.ok) {
        setBusy(false);
        setMsg({ ok: false, text: res.error ?? 'Kullanıcı adı güncellenemedi' });
        return;
      }
    }
    setBusy(false);
    setMsg({ ok: true, text: 'Değişiklikler kaydedildi' });
  };

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
        title="Profili Düzenle"
        left={<IconButton icon="chevron-left" variant="glass" accessibilityLabel="Geri" onPress={() => navigation.goBack()} />}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex} keyboardVerticalOffset={80}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
          <Text style={styles.label}>Görünen ad</Text>
          <TextField value={name} onChangeText={setName} placeholder="Görünen ad" icon="users" maxLength={30} />

          <Text style={styles.label}>Kullanıcı adı</Text>
          {isAnonymous ? (
            <Text style={styles.info}>Kullanıcı adı belirlemek için giriş yapman gerekiyor.</Text>
          ) : (
            <>
              <TextField
                value={handle}
                onChangeText={setHandleText}
                placeholder="@kullanici_adi"
                icon="person-add"
                autoCapitalize="none"
                editable={!handleLocked}
                maxLength={20}
              />
              <Text style={styles.info}>
                {handleLocked && nextHandleChange
                  ? `Kullanıcı adını 7 günde bir değiştirebilirsin. Sonraki değişiklik: ${nextHandleChange.getDate()} ${TR_MONTHS[nextHandleChange.getMonth()]}.`
                  : 'Kullanıcı adını 7 günde bir değiştirebilirsin.'}
              </Text>
            </>
          )}

          {msg && (
            <Text style={[styles.status, { color: msg.ok ? palette.online : palette.danger }]}>{msg.text}</Text>
          )}

          <PressableScale onPress={save} activeScale={0.97} disabled={busy} accessibilityLabel="Kaydet" style={styles.saveWrap}>
            <LinearGradient colors={accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.save}>
              {busy ? <ActivityIndicator color={palette.white} /> : <Text style={[typography.headline, styles.saveText]}>Kaydet</Text>}
            </LinearGradient>
          </PressableScale>

          <View style={styles.dangerZone}>
            <PressableScale onPress={logout} activeScale={0.97} accessibilityLabel="Çıkış yap">
              <View style={styles.dangerRow}>
                <Icon name="logout" size={18} color={palette.textSecondary} />
                <Text style={[typography.bodyEmphasized, styles.logoutText]}>Çıkış Yap</Text>
              </View>
            </PressableScale>
            <View style={styles.dangerDivider} />
            <PressableScale onPress={remove} activeScale={0.97} accessibilityLabel="Hesabı sil">
              <View style={styles.dangerRow}>
                <Icon name="close" size={18} color={palette.danger} />
                <Text style={[typography.bodyEmphasized, styles.deleteText]}>Hesabı Sil</Text>
              </View>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  label: {
    ...typography.footnoteEmphasized,
    color: palette.textTertiary,
    marginTop: spacing.md,
    marginLeft: spacing.xs,
  },
  info: { ...typography.caption1, color: palette.textTertiary, marginLeft: spacing.xs, marginTop: 2 },
  status: { ...typography.footnoteEmphasized, marginLeft: spacing.xs, marginTop: spacing.sm },
  saveWrap: { marginTop: spacing.lg },
  save: { height: 54, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: palette.white, fontWeight: '700' },
  dangerZone: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
    overflow: 'hidden',
  },
  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  dangerDivider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.separator },
  logoutText: { color: palette.textPrimary },
  deleteText: { color: palette.danger },
});
