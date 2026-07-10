import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';

import { palette, radius, spacing, typography } from '@/theme';
import { Icon } from './icons';
import { PressableScale } from './PressableScale';

type Props = {
  uri: string;
  userAgent?: string;
  /** Provider id (netflix, prime, gdrive, …) — tailors the injected controller. */
  platform?: string;
  /** Fill the parent (fullscreen) instead of a fixed 16:9 frame. */
  fill?: boolean;
  /** Fullscreen toggle shown in the controls. */
  onToggleFullscreen?: () => void;
  fullscreen?: boolean;
  /** Called with play/pause/seek intents so a sync layer can broadcast them. */
  onControl?: (event: ControlEvent) => void;
};

export type ControlEvent =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'seek'; time: number };

function extractYouTubeId(raw: string): string | null {
  const m = raw.match(
    /(?:youtube\.com\/(?:watch\?[^#]*\bv=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

function toVimeo(raw: string): string {
  const vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&playsinline=1`;
  return raw;
}

/**
 * CSS that hides a provider's own player chrome (bottom scrubber, top bar) so
 * only ASTERA's overlay drives playback — "the controller is ours, the embed is
 * theirs". Selectors are best-effort; anything unmatched just stays visible.
 */
const CHROME_CSS: Record<string, string> = {
  netflix:
    '.watch-video--bottom-controls-container,.PlayerControlsNeo__bottom-controls,.PlayerControlsNeo__button-control-row,.watch-video--back-container,.watch-video--evidence-overlay-container{opacity:0!important;pointer-events:none!important;}',
  prime:
    '.atvwebplayersdk-bottompanel-container,.atvwebplayersdk-hideabletopbuttons-container,.atvwebplayersdk-timeindicator-text,.atvwebplayersdk-fastseekback-button,.atvwebplayersdk-fastseekforward-button,.atvwebplayersdk-playpause-button{opacity:0!important;pointer-events:none!important;}',
};

/**
 * Injected into every WebView provider page (Netflix, Prime, Drive, …). It:
 *   • finds the real content <video> (largest with a live source),
 *   • reports playback state so our overlay stays in sync,
 *   • exposes window.__asteraApply so our controls drive play/pause/seek/mute,
 *   • hides the provider's native chrome (per CHROME_CSS),
 *   • flags a sign-in gate so the room shows a hint instead of fake controls.
 */
function buildController(platform: string): string {
  const hideCss = CHROME_CSS[platform] ?? '';
  return `
(function () {
  if (window.__astera) { return; } window.__astera = true;
  var RNW = window.ReactNativeWebView;
  var HIDE_CSS = ${JSON.stringify(hideCss)};
  function post(o){ try { RNW.postMessage(JSON.stringify(o)); } catch (e) {} }
  function ensureStyle(){ if(!HIDE_CSS) return; if(document.getElementById('__astera_css')) return;
    try{var s=document.createElement('style');s.id='__astera_css';s.innerHTML=HIDE_CSS;(document.head||document.documentElement).appendChild(s);}catch(e){} }
  function findVideo(){
    var best=null,area=-1,list=document.querySelectorAll('video');
    for(var i=0;i<list.length;i++){var v=list[i];var r=v.getBoundingClientRect();var a=r.width*r.height;
      if((v.src||v.currentSrc||v.readyState>0)&&a>=area){area=a;best=v;}}
    return best;
  }
  function isSignin(){
    var p=document.querySelector('input[type=password]');
    if(p){var r=p.getBoundingClientRect();if(r.width>0&&r.height>0)return true;}
    return false;
  }
  var unmuted=false;
  function report(){
    ensureStyle();
    var v=findVideo();
    if(!v||v.readyState<1){ post({t:'state',has:false,signin:isSignin()}); return; }
    // Only take over the sound once the main content is genuinely rolling —
    // avoids hijacking a muted hero/preview clip on a browse page.
    var big=(v.clientWidth*v.clientHeight)>(window.innerWidth*window.innerHeight*0.35);
    if(!unmuted&&big&&!v.paused){unmuted=true;try{v.muted=false;v.volume=1;}catch(e){}}
    post({t:'state',has:true,signin:false,time:v.currentTime||0,dur:isFinite(v.duration)?v.duration:0,paused:!!v.paused,muted:!!v.muted});
  }
  window.__asteraApply=function(cmd){var v=findVideo();if(!v)return;try{
    if(cmd.type==='play'){v.muted=false;var p=v.play();if(p&&p.catch)p.catch(function(){});}
    else if(cmd.type==='pause'){v.pause();}
    else if(cmd.type==='seek'){v.currentTime=cmd.time;}
    else if(cmd.type==='seekBy'){v.currentTime=Math.max(0,(v.currentTime||0)+cmd.delta);}
    else if(cmd.type==='mute'){v.muted=!!cmd.value;}}catch(e){}setTimeout(report,60);};
  ['play','pause','seeked','ended','loadedmetadata','canplay','timeupdate'].forEach(function(ev){document.addEventListener(ev,report,true);});
  setInterval(report,800);ensureStyle();report();true;
})();
`;
}

export function WebPlayer({ uri, userAgent, platform, fill, onToggleFullscreen, fullscreen, onControl }: Props) {
  const webRef = useRef<WebView>(null);
  const ytRef = useRef<YoutubeIframeRef>(null);
  const ytId = React.useMemo(() => extractYouTubeId(uri), [uri]);
  const vimeoUri = React.useMemo(() => toVimeo(uri), [uri]);
  const controller = React.useMemo(() => buildController(platform ?? ''), [platform]);

  const [playing, setPlaying] = useState(true);
  // YouTube starts muted so autoplay isn't blocked, then we unmute on play.
  const [muted, setMuted] = useState<boolean>(!!extractYouTubeId(uri));
  const didUnmute = useRef(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasVideo, setHasVideo] = useState(false);
  const [signin, setSignin] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [controlsVisible, setControlsVisible] = useState(true);

  const progress = useSharedValue(0);
  const trackW = useSharedValue(0);
  const knobScale = useSharedValue(1);
  const controlsOpacity = useSharedValue(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 150 });
    if (hideTimer.current) clearTimeout(hideTimer.current);
    // Only the (non-interactive) YouTube player auto-hides; WebView pages keep
    // controls up so the site underneath stays reachable.
    if (ytId) {
      hideTimer.current = setTimeout(() => {
        controlsOpacity.value = withTiming(0, { duration: 350 }, (f) => {
          if (f) runOnJS(setControlsVisible)(false);
        });
      }, 3200);
    }
  }, [controlsOpacity, ytId]);

  const toggleControls = useCallback(() => {
    if (controlsVisible) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      controlsOpacity.value = withTiming(0, { duration: 220 }, (f) => {
        if (f) runOnJS(setControlsVisible)(false);
      });
    } else {
      showControls();
    }
  }, [controlsVisible, controlsOpacity, showControls]);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showControls]);

  // ── Command dispatch ────────────────────────────────────────────────
  const applyWeb = useCallback((cmd: object) => {
    webRef.current?.injectJavaScript(`window.__asteraApply && window.__asteraApply(${JSON.stringify(cmd)}); true;`);
  }, []);

  const togglePlay = () => {
    const next = !playing;
    setPlaying(next);
    if (!ytId) applyWeb({ type: next ? 'play' : 'pause' });
    onControl?.(next ? { type: 'play' } : { type: 'pause' });
    showControls();
  };

  const seekBy = (delta: number) => {
    const next = Math.max(0, Math.min(duration || Infinity, position + delta));
    if (ytId) ytRef.current?.seekTo(next, true);
    else applyWeb({ type: 'seekBy', delta });
    setPosition(next);
    showControls();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    didUnmute.current = true;
    if (!ytId) applyWeb({ type: 'mute', value: next });
    showControls();
  };

  // ── YouTube state polling ───────────────────────────────────────────
  useEffect(() => {
    if (!ytId) return;
    const iv = setInterval(async () => {
      try {
        if (scrubbing) return;
        const t = await ytRef.current?.getCurrentTime();
        if (typeof t === 'number') setPosition(t);
      } catch {
        /* ignore */
      }
    }, 700);
    return () => clearInterval(iv);
  }, [ytId, scrubbing]);

  useEffect(() => {
    if (!scrubbing) progress.value = duration > 0 ? position / duration : 0;
  }, [position, duration, scrubbing, progress]);

  const onWebMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data);
        if (msg.t === 'state') {
          setHasVideo(!!msg.has);
          setSignin(!!msg.signin);
          if (msg.has) {
            if (!scrubbing && typeof msg.time === 'number') setPosition(msg.time);
            if (typeof msg.dur === 'number' && msg.dur > 0) setDuration(msg.dur);
            if (typeof msg.paused === 'boolean') setPlaying(!msg.paused);
            if (typeof msg.muted === 'boolean') setMuted(msg.muted);
          }
        }
      } catch {
        /* ignore */
      }
    },
    [scrubbing]
  );

  // ── Timeline scrub ──────────────────────────────────────────────────
  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
    trackW.value = w;
  };

  const commitSeekPreview = (ratio: number) => {
    const clamped = Math.min(1, Math.max(0, ratio));
    progress.value = clamped;
    if (duration > 0) setPosition(clamped * duration);
  };

  const commitSeek = (ratio: number) => {
    const clamped = Math.min(1, Math.max(0, ratio));
    if (duration <= 0) return;
    const time = clamped * duration;
    if (ytId) ytRef.current?.seekTo(time, true);
    else applyWeb({ type: 'seek', time });
    onControl?.({ type: 'seek', time });
  };

  const scrub = Gesture.Pan()
    .onBegin((e) => {
      knobScale.value = withTiming(1.35, { duration: 120 });
      runOnJS(setScrubbing)(true);
      if (trackWidth > 0) runOnJS(commitSeekPreview)(e.x / trackWidth);
    })
    .onUpdate((e) => {
      if (trackWidth > 0) runOnJS(commitSeekPreview)(e.x / trackWidth);
    })
    .onFinalize((e) => {
      knobScale.value = withTiming(1, { duration: 160 });
      if (trackWidth > 0) runOnJS(commitSeek)(Math.min(1, Math.max(0, e.x / trackWidth)));
      runOnJS(setScrubbing)(false);
    });

  const fillStyle = useAnimatedStyle(() => ({ width: progress.value * trackW.value }));
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * trackW.value }, { scale: knobScale.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: controlsOpacity.value }));

  // Fit a 16:9 video inside the frame (works for both 16:9 and fullscreen).
  let ytW = box.w;
  let ytH = Math.ceil(box.w * (9 / 16));
  if (box.h > 0 && ytH > box.h) {
    ytH = box.h;
    ytW = Math.ceil(box.h * (16 / 9));
  }

  return (
    <View
      style={[styles.container, fill && styles.containerFill]}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {/* Media layer */}
      {ytId ? (
        <View style={styles.ytLayer} pointerEvents="none">
          {box.w > 0 && (
            <YoutubePlayer
              ref={ytRef}
              width={ytW}
              height={ytH}
              play={playing}
              mute={muted}
              videoId={ytId}
              forceAndroidAutoplay={Platform.OS === 'android'}
              initialPlayerParams={{ controls: false, rel: false, preventFullScreen: true, iv_load_policy: 3 }}
              onReady={async () => {
                try {
                  const d = await ytRef.current?.getDuration();
                  if (d) setDuration(d);
                } catch {
                  /* ignore */
                }
                setHasVideo(true);
                // Nudge playback — the `play` prop alone often won't autostart on
                // mobile; a seek kicks it off (muted, so the browser allows it).
                setTimeout(() => ytRef.current?.seekTo(0, true), 250);
                // Android frequently ignores the initial autoplay and sits paused.
                // Re-assert play once the player is live so the (patched) play
                // effect injects playVideo again.
                if (Platform.OS === 'android') {
                  setPlaying(false);
                  setTimeout(() => setPlaying(true), 350);
                }
              }}
              onChangeState={(s: string) => {
                if (s === 'playing') {
                  setPlaying(true);
                  setHasVideo(true);
                  // Bring the sound up once playback has begun — iOS only. On
                  // Android, auto-unmuting a programmatically-started video trips
                  // the autoplay policy and PAUSES it, so we stay muted and let
                  // the user tap "Ses" (a gesture) to unmute.
                  if (!didUnmute.current && Platform.OS === 'ios') {
                    didUnmute.current = true;
                    setTimeout(() => setMuted(false), 350);
                  }
                } else if (s === 'paused' || s === 'ended') {
                  setPlaying(false);
                }
              }}
              webViewStyle={styles.ytWeb}
              webViewProps={{ allowsInlineMediaPlayback: true, androidLayerType: 'hardware' }}
            />
          )}
        </View>
      ) : (
        <WebView
          ref={webRef}
          source={{ uri: vimeoUri }}
          style={styles.web}
          injectedJavaScript={controller}
          onMessage={onWebMessage}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={false}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          domStorageEnabled
          cacheEnabled
          javaScriptEnabled
          allowsProtectedMedia
          androidLayerType="hardware"
          mixedContentMode="always"
          originWhitelist={['http://*', 'https://*', 'about:*', 'data:*']}
          onShouldStartLoadWithRequest={(r) => r.url.startsWith('http') || r.url.startsWith('about:') || r.url.startsWith('data:')}
          setSupportMultipleWindows={false}
          userAgent={userAgent}
          allowsBackForwardNavigationGestures={false}
        />
      )}

      {/* Tap the video to toggle controls. Plain RN Pressable so it doesn't
          fight the Gesture-Handler control buttons layered above it. */}
      {ytId && (
        <Pressable
          onPress={toggleControls}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Kontroller"
        />
      )}

      {/* A provider sign-in gate is showing inside the embed — step aside so the
          user can log in on the page itself, with just a hint at the top. */}
      {signin && !ytId && (
        <View style={styles.signinHint} pointerEvents="none">
          <Icon name="lock" size={13} color={palette.white} strokeWidth={2} />
          <Text style={styles.signinText}>Bu cihazda hesabınızla giriş yapın</Text>
        </View>
      )}

      {/* Controls float over the video (auto-hide on YouTube). Hidden while a
          sign-in gate is up so it doesn't overlap the login form. */}
      <Animated.View
        style={[styles.overlay, overlayStyle]}
        pointerEvents={controlsVisible && !(signin && !ytId) ? 'box-none' : 'none'}
      >
        {signin && !ytId ? null : (
        <>
        <View style={styles.topRow} pointerEvents="box-none">
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>CANLI</Text>
          </View>
          <View style={styles.topRight}>
            <ControlButton icon="volume" label="Ses" active={!muted} onPress={toggleMute} />
            {onToggleFullscreen && (
              <ControlButton
                icon="fullscreen"
                label={fullscreen ? 'Küçült' : 'Tam ekran'}
                onPress={onToggleFullscreen}
              />
            )}
          </View>
        </View>

        <View style={styles.center} pointerEvents="box-none">
          <ControlButton icon="backward" label="10 sn geri" onPress={() => seekBy(-10)} big />
          <PressableScale onPress={togglePlay} activeScale={0.9} accessibilityLabel={playing ? 'Duraklat' : 'Oynat'}>
            <View style={styles.playBtn}>
              <Icon name={playing ? 'pause' : 'play'} size={28} color={palette.white} filled />
            </View>
          </PressableScale>
          <ControlButton icon="forward" label="10 sn ileri" onPress={() => seekBy(10)} big />
        </View>

        <View style={styles.bottom} pointerEvents="box-none">
          <View style={styles.timeRow}>
            <Text style={styles.time}>{fmt(position)}</Text>
            {!hasVideo && <Text style={styles.hint}>Yükleniyor…</Text>}
            <Text style={styles.time}>{duration > 0 ? fmt(duration) : '—:—'}</Text>
          </View>
          <GestureDetector gesture={scrub}>
            <View style={styles.trackHit}>
              <View style={styles.track} onLayout={onTrackLayout}>
                <Animated.View style={[styles.fill, fillStyle]} />
                <Animated.View style={[styles.knob, knobStyle]} />
              </View>
            </View>
          </GestureDetector>
        </View>
        </>
        )}
      </Animated.View>
    </View>
  );
}

function ControlButton({
  icon,
  label,
  onPress,
  big,
  active = true,
}: {
  icon: 'backward' | 'forward' | 'volume' | 'fullscreen';
  label: string;
  onPress: () => void;
  big?: boolean;
  active?: boolean;
}) {
  return (
    <PressableScale onPress={onPress} activeScale={0.86} accessibilityLabel={label}>
      <View style={[styles.ctrl, big && styles.ctrlBig]}>
        <Icon name={icon} size={big ? 22 : 17} color={active ? palette.white : palette.textTertiary} />
      </View>
    </PressableScale>
  );
}

function fmt(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    backgroundColor: palette.black,
  },
  containerFill: {
    aspectRatio: undefined,
    flex: 1,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  web: { ...StyleSheet.absoluteFillObject, backgroundColor: palette.black },
  ytLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.black,
  },
  ytWeb: { backgroundColor: palette.black },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.danger },
  liveText: { ...typography.caption2, color: palette.white, fontWeight: '800', letterSpacing: 0.8 },
  center: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xxl },
  playBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrl: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  ctrlBig: { width: 46, height: 46, borderRadius: 23 },
  signinHint: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 5,
  },
  signinText: { ...typography.caption1, color: palette.white, fontWeight: '600' },
  bottom: { gap: spacing.xs },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: {
    ...typography.caption1,
    color: palette.white,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  hint: { ...typography.caption2, color: 'rgba(255,255,255,0.7)' },
  trackHit: { paddingVertical: spacing.sm },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.24)', justifyContent: 'center' },
  fill: { height: 4, borderRadius: 2, backgroundColor: palette.copper },
  knob: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: palette.white,
    marginLeft: -7,
  },
});
