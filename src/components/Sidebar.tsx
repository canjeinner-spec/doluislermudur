import React, { useEffect } from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, radius, spacing, typography } from '@/theme';
import { CURRENT_USER } from '@/data';
import { Avatar } from './Avatar';
import { Icon, IconName } from './icons';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';

const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = Math.min(320, SCREEN_W * 0.84);

export type SidebarDestination =
  | 'rooms'
  | 'create'
  | 'platforms'
  | 'howitworks'
  | 'invite'
  | 'settings'
  | 'about';

type Item = {
  key: SidebarDestination;
  icon: IconName;
  title: string;
  subtitle: string;
};

const ITEMS: Item[] = [
  { key: 'rooms', icon: 'rooms', title: 'Odalar', subtitle: 'Aktif odaları görüntüle' },
  { key: 'create', icon: 'plus', title: 'Oda Oluştur', subtitle: 'Yeni bir izleme odası aç' },
  { key: 'platforms', icon: 'grid', title: 'Platformlar', subtitle: 'Desteklenen servisler' },
  { key: 'howitworks', icon: 'sparkle', title: 'Nasıl Çalışır?', subtitle: 'Adım adım rehber' },
  { key: 'invite', icon: 'person-add', title: 'Arkadaş Davet Et', subtitle: 'Odaya davet gönder' },
  { key: 'settings', icon: 'settings', title: 'Ayarlar', subtitle: 'Tercihlerini yönet' },
  { key: 'about', icon: 'info', title: 'Hakkında', subtitle: 'ASTERA hakkında' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (dest: SidebarDestination) => void;
  active?: SidebarDestination;
};

/** Left slide-over navigation drawer with a blurred scrim and edge dismiss. */
export function Sidebar({ open, onClose, onSelect, active = 'rooms' }: Props) {
  const insets = useSafeAreaInsets();
  const x = useSharedValue(-DRAWER_W);
  const progress = useSharedValue(0);
  const [mounted, setMounted] = React.useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      x.value = withTiming(0, { duration: 300 });
      progress.value = withTiming(1, { duration: 300 });
    } else if (mounted) {
      x.value = withTiming(-DRAWER_W, { duration: 240 });
      progress.value = withTiming(0, { duration: 240 }, (f) => {
        if (f) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onUpdate((e) => {
      x.value = Math.min(0, Math.max(-DRAWER_W, e.translationX));
    })
    .onEnd((e) => {
      if (e.translationX < -DRAWER_W * 0.3 || e.velocityX < -600) {
        x.value = withTiming(-DRAWER_W, { duration: 200 });
        progress.value = withTiming(0, { duration: 200 }, (f) => {
          if (f) runOnJS(onClose)();
        });
      } else {
        x.value = withTiming(0, { duration: 180 });
      }
    });

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));
  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  const select = (dest: SidebarDestination) => {
    onSelect(dest);
  };

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, scrimStyle]}>
        <BlurView intensity={Platform.OS === 'ios' ? 18 : 34} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.scrimTint} onTouchEnd={onClose} />
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.drawer,
            { width: DRAWER_W, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg },
            drawerStyle,
          ]}
        >
          <View style={styles.profile}>
            <Avatar name={CURRENT_USER.name} tint={CURRENT_USER.tint} size={46} online />
            <View style={styles.profileText}>
              <Text style={[typography.headline, styles.name]}>{CURRENT_USER.name}</Text>
              <Text style={[typography.footnote, styles.handle]}>{CURRENT_USER.handle}</Text>
            </View>
            <IconButton
              icon="close"
              size={32}
              iconSize={16}
              variant="solid"
              accessibilityLabel="Menüyü kapat"
              onPress={onClose}
            />
          </View>

          <View style={styles.items}>
            {ITEMS.map((item) => {
              const isActive = item.key === active;
              return (
                <PressableScale
                  key={item.key}
                  onPress={() => select(item.key)}
                  activeScale={0.98}
                  activeOpacity={0.75}
                  accessibilityLabel={item.title}
                >
                  <View style={[styles.item, isActive && styles.itemActive]}>
                    <View style={[styles.itemIcon, isActive && styles.itemIconActive]}>
                      <Icon
                        name={item.icon}
                        size={20}
                        color={isActive ? palette.amberBright : palette.textSecondary}
                      />
                    </View>
                    <View style={styles.itemText}>
                      <Text
                        style={[
                          typography.subheadEmphasized,
                          { color: isActive ? palette.textPrimary : palette.textPrimary },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={[typography.caption1, styles.itemSub]}>{item.subtitle}</Text>
                    </View>
                    {isActive && <View style={styles.activeBar} />}
                  </View>
                </PressableScale>
              );
            })}
          </View>

          <View style={styles.footer}>
            <View style={styles.wordmarkRow}>
              <Icon name="film" size={16} color={palette.copper} />
              <Text style={[typography.footnoteEmphasized, styles.brand]}>ASTERA</Text>
            </View>
            <Text style={[typography.caption2, styles.version]}>v1.0.0 · Watch Together. Anywhere.</Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  scrimTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(16,15,14,0.96)',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: palette.separatorStrong,
    paddingHorizontal: spacing.md,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
    marginBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.separator,
  },
  profileText: {
    flex: 1,
    gap: 1,
  },
  name: {
    color: palette.textPrimary,
  },
  handle: {
    color: palette.textSecondary,
  },
  items: {
    flex: 1,
    gap: spacing.xxs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  itemActive: {
    backgroundColor: palette.accentTintSoft,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconActive: {
    backgroundColor: palette.accentTintMed,
  },
  itemText: {
    flex: 1,
    gap: 1,
  },
  itemSub: {
    color: palette.textTertiary,
  },
  activeBar: {
    width: 4,
    height: 26,
    borderRadius: 2,
    backgroundColor: palette.copper,
  },
  footer: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.separator,
    gap: 4,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brand: {
    color: palette.textPrimary,
    letterSpacing: 2,
  },
  version: {
    color: palette.textTertiary,
  },
});
