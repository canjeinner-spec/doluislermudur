import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { palette, radius, spacing, typography } from '@/theme';
import { Icon } from './icons';
import { PressableScale } from './PressableScale';

type Props = {
  uri: string;
  userAgent?: string;
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

/** Vimeo → clean embed; everything else loads as-is. */
function toEmbedUrl(raw: string): string {
  const vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&playsinline=1`;
  return raw;
}

/**
 * A local HTML page hosting the YouTube IFrame Player API. Loading it with a
 * real youtube.com baseUrl gives a valid referer/origin (fixes embed error 153)
 * and lets us drive playback through the official player API rather than a raw
 * <video> element — reliable play/pause/seek/mute and audible autoplay.
 */
function youTubeHtml(id: string): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>*{margin:0;padding:0}html,body{height:100%;background:#000;overflow:hidden}#p{position:absolute;inset:0;width:100%;height:100%}</style>
</head><body><div id="p"></div><script>
var player,ready=false;
function post(o){try{window.ReactNativeWebView.postMessage(JSON.stringify(o))}catch(e){}}
function report(){if(!player||!ready)return;try{var st=player.getPlayerState();
post({t:'state',has:true,time:player.getCurrentTime()||0,dur:player.getDuration()||0,paused:(st!==1&&st!==3),muted:!!(player.isMuted&&player.isMuted())});}catch(e){}}
window.asteraCmd=function(c){if(!player||!ready)return;try{
if(c.type==='play')player.playVideo();
else if(c.type==='pause')player.pauseVideo();
else if(c.type==='seek')player.seekTo(c.time,true);
else if(c.type==='seekBy')player.seekTo(Math.max(0,(player.getCurrentTime()||0)+(c.delta||0)),true);
else if(c.type==='mute'){if(c.value){player.mute()}else{player.unMute();player.setVolume(100)}}
}catch(e){}setTimeout(report,80)};
function onYouTubeIframeAPIReady(){player=new YT.Player('p',{videoId:'${id}',host:'https://www.youtube.com',
playerVars:{autoplay:1,playsinline:1,controls:0,rel:0,modestbranding:1,fs:0,iv_load_policy:3,origin:'https://www.youtube.com'},
events:{onReady:function(){ready=true;try{player.unMute();player.setVolume(100);player.playVideo()}catch(e){}post({t:'ready'})},
onStateChange:function(){report()},onError:function(e){post({t:'error',code:e.data})}}})}
var s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';document.body.appendChild(s);
setInterval(report,800);
</script></body></html>`;
}

/** Generic controller for same-origin <video> pages (Vimeo, direct video, …). */
const CONTROLLER = `
(function () {
  if (window.__astera) { return; } window.__astera = true;
  var RNW = window.ReactNativeWebView;
  function post(o){ try { RNW.postMessage(JSON.stringify(o)); } catch (e) {} }
  function findVideo(){
    var best=null,area=0,list=document.querySelectorAll('video');
    for(var i=0;i<list.length;i++){var v=list[i];var a=(v.clientWidth||0)*(v.clientHeight||0);
      if(a>=area&&(v.src||v.currentSrc||v.readyState>0)){area=a;best=v;}}
    return best||list[0]||null;
  }
  var inited=false;
  function report(){var v=findVideo();if(!v){post({t:'state',has:false});return;}
    if(!inited){inited=true;try{v.muted=false;v.volume=1;v.play();}catch(e){}}
    post({t:'state',has:true,time:v.currentTime||0,dur:isFinite(v.duration)?v.duration:0,paused:!!v.paused,muted:!!v.muted});}
  window.__asteraApply=function(cmd){var v=findVideo();if(!v)return;try{
    if(cmd.type==='play'){v.play();}else if(cmd.type==='pause'){v.pause();}
    else if(cmd.type==='seek'){v.currentTime=cmd.time;}else if(cmd.type==='seekBy'){v.currentTime=Math.max(0,(v.currentTime||0)+cmd.delta);}
    else if(cmd.type==='mute'){v.muted=!!cmd.value;}}catch(e){}setTimeout(report,60);};
  ['play','pause','seeked','ended','loadedmetadata'].forEach(function(ev){document.addEventListener(ev,report,true);});
  setInterval(report,800);report();true;
})();
`;

const YT_ERRORS: Record<number, string> = {
  2: 'Geçersiz video',
  5: 'Oynatıcı bu videoyu açamadı',
  100: 'Video bulunamadı veya kaldırılmış',
  101: 'Video sahibi gömülü oynatmayı kapatmış',
  150: 'Video sahibi gömülü oynatmayı kapatmış',
};

export function WebPlayer({ uri, userAgent, onControl }: Props) {
  const webRef = useRef<WebView>(null);
  const ytId = React.useMemo(() => extractYouTubeId(uri), [uri]);
  const embedUri = React.useMemo(() => toEmbedUrl(uri), [uri]);

  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasVideo, setHasVideo] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const progress = useSharedValue(0);
  const trackW = useSharedValue(0);
  const knobScale = useSharedValue(1);
  const controlsOpacity = useSharedValue(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = useCallback(
    (cmd: object) => {
      const fn = ytId ? 'window.asteraCmd' : 'window.__asteraApply';
      webRef.current?.injectJavaScript(`${fn} && ${fn}(${JSON.stringify(cmd)}); true;`);
    },
    [ytId]
  );

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 160 });
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      controlsOpacity.value = withTiming(0, { duration: 400 }, (f) => {
        if (f) runOnJS(setControlsVisible)(false);
      });
    }, 4200);
  }, [controlsOpacity]);

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [revealControls]);

  useEffect(() => {
    if (!scrubbing) progress.value = duration > 0 ? position / duration : 0;
  }, [position, duration, scrubbing, progress]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data);
        if (msg.t === 'error') {
          setError(YT_ERRORS[msg.code as number] ?? 'Bu video oynatılamadı');
          return;
        }
        if (msg.t === 'ready') setError(null);
        if (msg.t === 'state') {
          setHasVideo(!!msg.has);
          if (msg.has) {
            if (!scrubbing && typeof msg.time === 'number') setPosition(msg.time);
            if (typeof msg.dur === 'number' && msg.dur > 0) setDuration(msg.dur);
            if (typeof msg.paused === 'boolean') setPlaying(!msg.paused);
            if (typeof msg.muted === 'boolean') setMuted(msg.muted);
          }
        }
      } catch {
        /* ignore non-JSON */
      }
    },
    [scrubbing]
  );

  const togglePlay = () => {
    const next = !playing;
    setPlaying(next);
    apply({ type: next ? 'play' : 'pause' });
    onControl?.(next ? { type: 'play' } : { type: 'pause' });
    revealControls();
  };

  const seekBy = (delta: number) => {
    apply({ type: 'seekBy', delta });
    setPosition((p) => Math.max(0, Math.min(duration || Infinity, p + delta)));
    revealControls();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    apply({ type: 'mute', value: next });
    revealControls();
  };

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
    if (duration > 0) {
      const time = clamped * duration;
      apply({ type: 'seek', time });
      onControl?.({ type: 'seek', time });
    }
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
      runOnJS(revealControls)();
    });

  const fillStyle = useAnimatedStyle(() => ({ width: progress.value * trackW.value }));
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * trackW.value }, { scale: knobScale.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: controlsOpacity.value }));

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={ytId ? { html: youTubeHtml(ytId), baseUrl: 'https://www.youtube.com' } : { uri: embedUri }}
        style={styles.web}
        injectedJavaScript={ytId ? 'true;' : CONTROLLER}
        onMessage={onMessage}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={false}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        originWhitelist={['http://*', 'https://*', 'about:*', 'data:*']}
        onShouldStartLoadWithRequest={(r) =>
          r.url.startsWith('http') || r.url.startsWith('about:') || r.url.startsWith('data:')
        }
        setSupportMultipleWindows={false}
        userAgent={userAgent}
        allowsBackForwardNavigationGestures={false}
      />

      <PressableScale
        onPress={revealControls}
        activeScale={1}
        activeOpacity={1}
        style={styles.tapCatcher}
        accessibilityLabel="Kontroller"
      >
        <View />
      </PressableScale>

      {error && (
        <View style={styles.errorWrap} pointerEvents="none">
          <Icon name="info" size={22} color={palette.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Animated.View
        style={[styles.overlay, overlayStyle]}
        pointerEvents={controlsVisible ? 'box-none' : 'none'}
      >
        <View style={styles.topRow} pointerEvents="box-none">
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>CANLI</Text>
          </View>
          <ControlButton icon="volume" label="Ses" active={!muted} onPress={toggleMute} />
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
            {!hasVideo && !error && <Text style={styles.hint}>Yükleniyor…</Text>}
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
  icon: 'backward' | 'forward' | 'volume';
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
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: palette.black,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  web: { ...StyleSheet.absoluteFillObject, backgroundColor: palette.black },
  tapCatcher: { position: 'absolute', left: 0, right: 0, top: 40, bottom: 64 },
  errorWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  errorText: { ...typography.subhead, color: palette.textSecondary, textAlign: 'center' },
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
