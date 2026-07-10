import React, { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { FRIENDS } from '@/data';
import { inviteByHandle, isBackendConfigured } from '@/backend';
import { Avatar, GradientButton, Icon, PressableScale, TextField } from '@/components';
import { palette, radius, spacing, typography } from '@/theme';

/**
 * Room invitations — by @handle (host-only, also lifts a prior kick/ban) or by
 * sharing the link. The friends list is a convenience shortcut.
 */
export function InviteFriendsSheet({ roomName, roomId }: { roomName?: string; roomId?: string }) {
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [handle, setHandle] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sending, setSending] = useState(false);

  const canInviteByHandle = isBackendConfigured && !!roomId;

  const inviteHandle = async () => {
    const h = handle.trim();
    if (!h || !roomId || sending) return;
    setSending(true);
    setStatus(null);
    const id = await inviteByHandle(roomId, h);
    setSending(false);
    if (id) {
      setStatus({ ok: true, msg: `${h.startsWith('@') ? h : '@' + h} davet edildi` });
      setHandle('');
    } else {
      setStatus({ ok: false, msg: 'Bu kullanıcı adı bulunamadı' });
    }
  };

  const toggle = (id: string) => {
    setInvited((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const shareLink = () => {
    Share.share({
      message: `${roomName ? `"${roomName}" odasına katıl! ` : ''}ASTERA'da birlikte izleyelim: https://astera.app/join/8F3K2Q`,
    }).catch(() => {});
  };

  const filtered = FRIENDS.filter(
    (f) =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.handle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.root}>
      {canInviteByHandle && (
        <View style={styles.handleBox}>
          <View style={styles.handleRow}>
            <TextField
              value={handle}
              onChangeText={setHandle}
              placeholder="@kullanici_adi"
              icon="person-add"
              style={styles.handleField}
              onSubmitEditing={inviteHandle}
            />
            <PressableScale onPress={inviteHandle} activeScale={0.94} disabled={!handle.trim() || sending} accessibilityLabel="Davet et">
              <View style={[styles.handleBtn, (!handle.trim() || sending) && styles.handleBtnOff]}>
                <Text style={styles.handleBtnText}>Davet</Text>
              </View>
            </PressableScale>
          </View>
          {status && (
            <Text style={[styles.handleStatus, { color: status.ok ? palette.online : palette.danger }]}>
              {status.msg}
            </Text>
          )}
        </View>
      )}

      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Arkadaş ara"
        icon="search"
        style={styles.search}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {filtered.map((f) => {
          const isInvited = invited.has(f.id);
          return (
            <View key={f.id} style={styles.row}>
              <Avatar name={f.name} tint={f.tint} size={40} online={f.online} />
              <View style={styles.text}>
                <Text style={[typography.subheadEmphasized, styles.name]}>{f.name}</Text>
                <Text style={[typography.caption1, styles.handle]}>
                  {f.online ? 'Çevrimiçi' : 'Çevrimdışı'} · {f.handle}
                </Text>
              </View>
              <PressableScale
                onPress={() => toggle(f.id)}
                activeScale={0.94}
                accessibilityLabel={isInvited ? `${f.name} davet edildi` : `${f.name} davet et`}
              >
                <View style={[styles.invite, isInvited && styles.invited]}>
                  <Icon
                    name={isInvited ? 'check' : 'person-add'}
                    size={15}
                    color={isInvited ? palette.online : palette.amberBright}
                    strokeWidth={2.2}
                  />
                  <Text
                    style={[
                      typography.footnoteEmphasized,
                      { color: isInvited ? palette.online : palette.amberBright },
                    ]}
                  >
                    {isInvited ? 'Davet edildi' : 'Davet et'}
                  </Text>
                </View>
              </PressableScale>
            </View>
          );
        })}
      </ScrollView>
      <GradientButton label="Davet Linki Paylaş" icon="share" onPress={shareLink} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  search: {
    marginBottom: spacing.md,
  },
  list: {
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    flex: 1,
    gap: 1,
  },
  name: {
    color: palette.textPrimary,
  },
  handle: {
    color: palette.textTertiary,
  },
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: palette.accentTintSoft,
  },
  invited: {
    backgroundColor: 'rgba(78,208,138,0.14)',
  },
  cta: {
    marginTop: spacing.sm,
  },
  handleBox: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  handleField: { flex: 1 },
  handleBtn: {
    height: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: palette.copper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleBtnOff: { opacity: 0.5 },
  handleBtnText: { ...typography.subheadEmphasized, color: palette.white },
  handleStatus: { ...typography.footnote, marginLeft: spacing.xs, fontWeight: '600' },
});
