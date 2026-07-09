import type { Platform } from './types';

/**
 * Supported streaming providers. Login always happens on the provider's own
 * page inside a WebView — ASTERA never handles credentials.
 */
export const PLATFORMS: Platform[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    description: 'Filmler, diziler ve Netflix orijinalleri',
    domain: 'netflix.com',
    loginUrl: 'https://www.netflix.com/login',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Videolar, canlı yayınlar ve müzik',
    domain: 'youtube.com',
    loginUrl: 'https://www.youtube.com',
  },
  {
    id: 'prime',
    name: 'Prime Video',
    description: 'Amazon Prime film ve dizileri',
    domain: 'primevideo.com',
    loginUrl: 'https://www.primevideo.com',
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    description: 'Kişisel video dosyalarınız',
    domain: 'drive.google.com',
    loginUrl: 'https://drive.google.com',
  },
];

export function getPlatform(id: string): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

const MOBILE_UA_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const MOBILE_UA_ANDROID =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/** Providers that only serve a playable web player to a desktop browser. */
const DESKTOP_ONLY = new Set(['netflix', 'prime']);

/**
 * Netflix (and Prime) refuse video playback under a mobile UA — mobile web just
 * shows "use the app". They only serve the real Widevine/FairPlay web player to
 * a desktop browser, so we present a desktop UA for them, exactly as
 * Rave/Turtle/Hearo do. YouTube and Drive play fine on mobile.
 */
export function userAgentFor(platformId: string, os: 'ios' | 'android' | string): string {
  if (DESKTOP_ONLY.has(platformId)) return DESKTOP_UA;
  return os === 'android' ? MOBILE_UA_ANDROID : MOBILE_UA_IOS;
}
