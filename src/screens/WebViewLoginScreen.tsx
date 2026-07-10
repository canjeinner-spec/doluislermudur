import React, { useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { LinearGradient } from 'expo-linear-gradient';

import { Icon, IconButton, NavBar, PressableScale, ScreenBackground } from '@/components';
import { getPlatform, userAgentFor } from '@/data';
import { accentGradient, palette, radius, spacing, typography } from '@/theme';
import { storage, StorageKeys } from '@/storage/storage';
import { createRoom, isBackendConfigured, updateRoomContent } from '@/backend';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WebViewLogin'>;

/** URL patterns that mean the user opened actual content (→ open the room).
 *  Kept to real playback paths (YouTube/Netflix `/watch`) — Prime browse/detail
 *  URLs are intentionally excluded so it doesn't jump before playback; Prime
 *  relies on the video-element probe instead. */
const PLAYBACK_HINTS = ['/watch', '/play', '/viewer', '/stream'];

/**
 * Injected into the login WebView: fires the moment a real, large <video> is
 * chosen — as soon as it has content data (readyState >= 2), even if Android
 * hasn't started rendering it yet. We deliberately do NOT wait for `!paused`,
 * because Android blocks autoplay and the video would sit paused forever, so
 * the probe never triggered and the room never opened.
 */
const PLAYBACK_PROBE = `
(function(){
  if(window.__asteraProbe){return;} window.__asteraProbe=true;
  var RNW=window.ReactNativeWebView;
  var fired=false;
  function announce(){
    if(fired)return;
    var list=document.querySelectorAll('video');
    for(var i=0;i<list.length;i++){var v=list[i];
      var r=v.getBoundingClientRect();
      var big=(r.width*r.height)>(window.innerWidth*window.innerHeight*0.30);
      // Real, user-chosen content plays with sound; homepage hero/preview loops
      // are muted, so requiring !muted keeps us from jumping while browsing.
      var live=(v.src||v.currentSrc)&&!v.paused&&!v.muted&&v.currentTime>0.2;
      if(big&&live){
        fired=true;
        try{RNW.postMessage(JSON.stringify({t:'playing',url:location.href,title:document.title}));}catch(e){}
        return;
      }
    }
  }
  // Grab the page's Open Graph image/title (Netflix/Prime/Drive) so the room
  // card can show a real banner + name, like YouTube's.
  var lastMeta='';
  function grabMeta(){
    try{
      var g=function(p){var e=document.querySelector('meta[property="'+p+'"]')||document.querySelector('meta[name="'+p+'"]');return e?e.getAttribute('content')||'':'';};
      var img=g('og:image'); var ttl=g('og:title');
      var key=img+'|'+ttl;
      if((img||ttl)&&key!==lastMeta){ lastMeta=key; RNW.postMessage(JSON.stringify({t:'meta',image:img,title:ttl})); }
    }catch(e){}
  }
  document.addEventListener('play',announce,true);
  document.addEventListener('playing',announce,true);
  document.addEventListener('loadeddata',announce,true);
  setInterval(announce,700);
  setInterval(grabMeta,900); grabMeta();
})();
true;
`;

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
  return s.trim().slice(0, 80);
}

function isYouTubeUrl(u: string): boolean {
  return /youtube\.com\/(watch|embed|shorts|v)|youtu\.be\//.test(u);
}

/** The reliable video title (and it's fetched fresh, unlike the page title which
 *  is often still "YouTube" the moment we hand off). */
async function youtubeTitle(url: string): Promise<string | null> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!r.ok) return null;
    const j = await r.json();
    return typeof j.title === 'string' ? j.title.trim() : null;
  } catch {
    return null;
  }
}

export function WebViewLoginScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { platformId, draft } = route.params;
  // Login-only: a room viewer signing in to their own account. We don't capture
  // content or create a room — the user just logs in and taps "Girişi Tamamla"
  // to go back, where their now-authenticated session plays their own copy.
  const loginOnly = !!route.params.loginOnly;
  const platform = getPlatform(platformId);
  const webRef = useRef<WebView>(null);

  // Blocking spinner only for the very first page — SPA sites (Netflix, YouTube)
  // fire onLoadStart on every internal navigation, which would otherwise re-show
  // it and feel stuck.
  const [initialLoading, setInitialLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [domain, setDomain] = useState(platform?.domain ?? '');
  const [secure, setSecure] = useState(true);
  const progress = useSharedValue(0);
  const pageTitleRef = useRef('');
  const pageUrlRef = useRef(platform?.loginUrl ?? '');
  const ogImageRef = useRef('');
  const ogTitleRef = useRef('');
  const finishedRef = useRef(false);

  const finish = async (url?: string, title?: string) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const authed = storage.getJSON<string[]>(StorageKeys.authedPlatforms, []);
    if (!authed.includes(platformId)) {
      storage.setJSON(StorageKeys.authedPlatforms, [...authed, platformId]);
    }
    let cleaned = cleanTitle(title ?? pageTitleRef.current, platform?.name) || platform?.name || 'Oda';
    const contentUrl = url ?? pageUrlRef.current;
    let thumbnailUrl: string | null = null;
    if (isYouTubeUrl(contentUrl)) {
      // Page title is often still "YouTube" at hand-off → use oEmbed; thumbnail
      // is derived from the video id on the card side.
      const yt = await youtubeTitle(contentUrl);
      if (yt) cleaned = yt.slice(0, 80);
    } else {
      // Netflix/Prime/Drive: use the page's og:title / og:image.
      if (ogTitleRef.current) cleaned = cleanTitle(ogTitleRef.current, platform?.name) || cleaned;
      if (ogImageRef.current) thumbnailUrl = ogImageRef.current;
    }
    const localParams = { draft, platformId, title: cleaned, contentUrl };

    // Changing content in an existing room: update it and pop back.
    if (route.params.returnToRoom) {
      if (isBackendConfigured && route.params.roomId) {
        await updateRoomContent(route.params.roomId, contentUrl, cleaned, thumbnailUrl);
        navigation.navigate('Room', { roomId: route.params.roomId });
      } else {
        navigation.navigate('Room', localParams);
      }
      return;
    }

    // New room: persist it, then open it with a clean stack so leaving the room
    // returns to the room list — not back through platform-select / sign-in.
    const openFresh = (params: RootStackParamList['Room']) =>
      navigation.reset({ index: 1, routes: [{ name: 'Home' }, { name: 'Room', params }] });

    if (isBackendConfigured) {
      const room = await createRoom({
        title: cleaned,
        platform: platformId,
        platformLabel: platform?.name ?? '',
        contentUrl,
        thumbnailUrl,
        isPublic: draft.isPublic,
      });
      if (room) {
        openFresh({ roomId: room.id });
        return;
      }
    }
    openFresh(localParams);
  };

  // The probe tells us content is actually playing → hand off to the room with
  // the exact URL/title it saw. No more guessing from the URL and jumping early.
  const onProbeMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.t === 'meta') {
        if (typeof msg.image === 'string' && msg.image) ogImageRef.current = msg.image;
        if (typeof msg.title === 'string' && msg.title) ogTitleRef.current = msg.title;
      } else if (msg.t === 'playing' && typeof msg.url === 'string' && !loginOnly) {
        finish(msg.url, msg.title);
      }
    } catch {
      /* ignore */
    }
  };

  const onNavState = (nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
    setCanGoForward(nav.canGoForward);
    if (nav.title) pageTitleRef.current = nav.title;
    pageUrlRef.current = nav.url;
    // Parse with a regex rather than `new URL` (Hermes' URL is incomplete).
    const match = /^(\w+):\/\/([^/?#]+)([^?#]*)(\?[^#]*)?/.exec(nav.url);
    if (!match) return;
    const [, scheme, host, pathname = '', search = ''] = match;
    setDomain(host.replace(/^www\./, ''));
    setSecure(scheme === 'https');
    // Open the room the moment the URL lands on a real content/watch page. This
    // is platform-independent — it does not depend on Android actually starting
    // playback (the probe is a secondary, event-based trigger).
    const path = (pathname + search).toLowerCase();
    if (!loginOnly && !nav.loading && PLAYBACK_HINTS.some((h) => path.includes(h))) {
      finish(nav.url, nav.title);
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

  // Numeric width off a measured track — no transformOrigin (which Fabric on
  // Android can't cast) and no string-percentage animated layout.
  const barW = useSharedValue(0);
  const barStyle = useAnimatedStyle(() => ({
    width: progress.value * barW.value,
    opacity: progress.value > 0 && progress.value < 1 ? 1 : 0,
  }));

  return (
    <ScreenBackground glow="none">
      <NavBar
        left={
          <IconButton icon="close" size={38} variant="glass" accessibilityLabel="Kapat" onPress={() => navigation.goBack()} />
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
      />

      <View
        style={styles.progressTrack}
        onLayout={(e) => {
          barW.value = e.nativeEvent.layout.width;
        }}
      >
        <Animated.View style={[styles.progressBar, barStyle]} />
      </View>

      <View style={styles.webWrap}>
        {platform && (
          <WebView
            ref={webRef}
            source={{ uri: platform.loginUrl }}
            style={styles.web}
            injectedJavaScript={PLAYBACK_PROBE}
            onMessage={onProbeMessage}
            onNavigationStateChange={onNavState}
            onLoadStart={() => {
              progress.value = withTiming(0.15, { duration: 120 });
            }}
            onLoadProgress={({ nativeEvent }) => {
              progress.value = withTiming(nativeEvent.progress, { duration: 120 });
              if (nativeEvent.progress > 0.7) setInitialLoading(false);
            }}
            onLoadEnd={() => {
              setInitialLoading(false);
              progress.value = withTiming(1, { duration: 160 });
            }}
            startInLoadingState
            renderLoading={() => <View />}
            allowsBackForwardNavigationGestures
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            domStorageEnabled
            cacheEnabled
            javaScriptEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsProtectedMedia
            androidLayerType="hardware"
            mixedContentMode="always"
            originWhitelist={['http://*', 'https://*', 'about:*', 'data:*']}
            onShouldStartLoadWithRequest={onShouldStartLoad}
            setSupportMultipleWindows={false}
            javaScriptCanOpenWindowsAutomatically={false}
            userAgent={userAgentFor(platformId, Platform.OS)}
          />
        )}
        {initialLoading && (
          <View style={styles.loader} pointerEvents="none">
            <ActivityIndicator color={palette.amber} />
          </View>
        )}
      </View>

      {/* Login-only: the viewer signs in, then confirms to return to the room. */}
      {loginOnly && (
        <PressableScale onPress={() => navigation.goBack()} activeScale={0.97} accessibilityLabel="Girişi tamamla" style={styles.doneWrap}>
          <LinearGradient colors={accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.done}>
            <Text style={[typography.headline, styles.doneText]}>Girişi tamamla → odaya dön</Text>
          </LinearGradient>
        </PressableScale>
      )}

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
  doneWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: palette.background,
  },
  done: { height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  doneText: { color: palette.white, fontWeight: '700' },
});
