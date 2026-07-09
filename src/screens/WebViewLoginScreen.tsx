import React, { useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Icon, IconButton, NavBar, PressableScale, ScreenBackground } from '@/components';
import { getPlatform } from '@/data';
import { palette, spacing, typography } from '@/theme';
import { storage, StorageKeys } from '@/storage/storage';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WebViewLogin'>;

/** URL fragments that indicate content playback has started (→ open the room). */
const PLAYBACK_HINTS = ['/watch', 'watch?', '/play', '/video/', '/viewer', '/stream'];

/** Strip a provider suffix from the page title to name the room after content. */
function cleanTitle(raw: string, providerName?: string): string {
  let s = (raw || '').trim();
  // Cut trailing " - Netflix", " | Prime Video", " • YouTube", etc.
  s = s.replace(
    /\s*[-|•·—]\s*(Netflix|YouTube|Prime\s*Video|Amazon.*|Disney\+?|Max|HBO[^-|]*|Apple\s*TV\+?|Vimeo|Google\s*Drive)[^-|•·—]*$/i,
    ''
  );
  s = s.replace(/^(Watch|İzle)\s+/i, '');
  if (providerName) s = s.replace(new RegExp(`\\s*[-|•·—]?\\s*${providerName}\\s*$`, 'i'), '');
  return s.trim().slice(0, 42);
}

export function WebViewLoginScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { platformId, draft } = route.params;
  const platform = getPlatform(platformId);
  const webRef = useRef<WebView>(null);

  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [domain, setDomain] = useState(platform?.domain ?? '');
  const [secure, setSecure] = useState(true);
  const progress = useSharedValue(0);
  const pageTitleRef = useRef('');
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const authed = storage.getJSON<string[]>(StorageKeys.authedPlatforms, []);
    if (!authed.includes(platformId)) {
      storage.setJSON(StorageKeys.authedPlatforms, [...authed, platformId]);
    }
    const title = cleanTitle(pageTitleRef.current, platform?.name) || platform?.name || 'Oda';
    navigation.replace('Room', { draft, platformId, title });
  };

  const onNavState = (nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
    setCanGoForward(nav.canGoForward);
    if (nav.title) pageTitleRef.current = nav.title;
    // Parse with a regex rather than `new URL` (Hermes' URL is incomplete).
    const match = /^(\w+):\/\/([^/?#]+)([^?#]*)(\?[^#]*)?/.exec(nav.url);
    if (!match) return;
    const [, scheme, host, pathname = '', search = ''] = match;
    setDomain(host.replace(/^www\./, ''));
    setSecure(scheme === 'https');
    // Move to the room the moment real playback starts.
    const path = (pathname + search).toLowerCase();
    if (!nav.loading && PLAYBACK_HINTS.some((h) => path.includes(h))) {
      finish();
    }
  };

  // Keep everything inside the WebView: allow web + about/data, block deep
  // links (nflx://, netflix://, itms-apps://) that would trigger an iOS
  // "Open in app?" prompt and bounce the user out of the login flow.
  const onShouldStartLoad = (request: { url: string }): boolean => {
    const url = request.url;
    return (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('about:') ||
      url.startsWith('data:')
    );
  };

  // scaleX from the left edge — numeric transform, no string-percentage layout.
  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
    opacity: progress.value > 0 && progress.value < 1 ? 1 : 0,
  }));

  return (
    <ScreenBackground glow="none">
      <NavBar
        compact
        left={
          <PressableScale onPress={() => navigation.goBack()} accessibilityLabel="Kapat">
            <Text style={[typography.body, styles.close]}>Kapat</Text>
          </PressableScale>
        }
        titleNode={
          <View style={styles.addressBar}>
            <Icon
              name={secure ? 'lock' : 'globe'}
              size={12}
              color={secure ? palette.textSecondary : palette.textTertiary}
              strokeWidth={2}
            />
            <Text style={[typography.footnoteEmphasized, styles.domain]} numberOfLines={1}>
              {domain}
            </Text>
          </View>
        }
        right={
          <PressableScale onPress={finish} accessibilityLabel="Odaya geç">
            <Text style={[typography.bodyEmphasized, styles.done]}>Odaya Geç</Text>
          </PressableScale>
        }
      />

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, barStyle]} />
      </View>

      <View style={styles.webWrap}>
        {platform && (
          <WebView
            ref={webRef}
            source={{ uri: platform.loginUrl }}
            style={styles.web}
            onNavigationStateChange={onNavState}
            onLoadStart={() => {
              setLoading(true);
              progress.value = withTiming(0.15, { duration: 120 });
            }}
            onLoadProgress={({ nativeEvent }) => {
              progress.value = withTiming(nativeEvent.progress, { duration: 120 });
            }}
            onLoadEnd={() => {
              setLoading(false);
              progress.value = withTiming(1, { duration: 160 });
            }}
            startInLoadingState
            renderLoading={() => <View />}
            decelerationRate="normal"
            allowsBackForwardNavigationGestures
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            originWhitelist={['http://*', 'https://*', 'about:*', 'data:*']}
            onShouldStartLoadWithRequest={onShouldStartLoad}
            setSupportMultipleWindows={false}
            javaScriptCanOpenWindowsAutomatically={false}
            userAgent={
              Platform.OS === 'ios'
                ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
                : 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
            }
          />
        )}
        {loading && (
          <View style={styles.loader} pointerEvents="none">
            <ActivityIndicator color={palette.amber} />
          </View>
        )}
      </View>

      <View style={styles.notice}>
        <Icon name="play" size={12} color={palette.amber} filled />
        <Text style={[typography.caption1, styles.noticeText]}>
          İçeriği başlat — oda otomatik açılır. Giriş {platform?.name} sayfasında yapılır, ASTERA
          şifreni görmez.
        </Text>
      </View>

      {/* Browser toolbar */}
      <View style={[styles.toolbar, { paddingBottom: insets.bottom + spacing.xs }]}>
        <IconButton
          icon="chevron-left"
          variant="plain"
          color={canGoBack ? palette.textPrimary : palette.textQuaternary}
          accessibilityLabel="Geri"
          onPress={() => canGoBack && webRef.current?.goBack()}
        />
        <IconButton
          icon="chevron-right"
          variant="plain"
          color={canGoForward ? palette.textPrimary : palette.textQuaternary}
          accessibilityLabel="İleri"
          onPress={() => canGoForward && webRef.current?.goForward()}
        />
        <IconButton
          icon="repeat"
          variant="plain"
          accessibilityLabel="Yenile"
          onPress={() => webRef.current?.reload()}
        />
        <IconButton icon="share" variant="plain" accessibilityLabel="Paylaş" />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  close: {
    color: palette.amber,
  },
  done: {
    color: palette.amber,
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: 10,
    backgroundColor: palette.surfaceSecondary,
    maxWidth: 200,
  },
  domain: {
    color: palette.textPrimary,
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'transparent',
  },
  progressBar: {
    height: 2,
    width: '100%',
    transformOrigin: 'left',
    backgroundColor: palette.copper,
  },
  webWrap: {
    flex: 1,
    backgroundColor: palette.white,
  },
  web: {
    flex: 1,
    backgroundColor: palette.white,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d0d0d',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: palette.background,
  },
  noticeText: {
    color: palette.textTertiary,
    textAlign: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xl,
    backgroundColor: palette.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.separator,
  },
});
