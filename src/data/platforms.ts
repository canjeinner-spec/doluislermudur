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
    id: 'disney',
    name: 'Disney+',
    description: 'Disney, Pixar, Marvel ve Star Wars',
    domain: 'disneyplus.com',
    loginUrl: 'https://www.disneyplus.com/login',
  },
  {
    id: 'prime',
    name: 'Prime Video',
    description: 'Amazon Prime film ve dizileri',
    domain: 'primevideo.com',
    loginUrl: 'https://www.primevideo.com',
  },
  {
    id: 'appletv',
    name: 'Apple TV+',
    description: 'Apple orijinal yapımları',
    domain: 'tv.apple.com',
    loginUrl: 'https://tv.apple.com',
  },
  {
    id: 'max',
    name: 'Max',
    description: 'HBO, Warner Bros. ve daha fazlası',
    domain: 'max.com',
    loginUrl: 'https://play.max.com',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Videolar, canlı yayınlar ve müzik',
    domain: 'youtube.com',
    loginUrl: 'https://www.youtube.com',
  },
  {
    id: 'vimeo',
    name: 'Vimeo',
    description: 'Yüksek kaliteli bağımsız içerikler',
    domain: 'vimeo.com',
    loginUrl: 'https://vimeo.com/log_in',
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    description: 'Kişisel video dosyalarınız',
    domain: 'drive.google.com',
    loginUrl: 'https://drive.google.com',
  },
  {
    id: 'web',
    name: 'Diğer (Web)',
    description: 'Herhangi bir web adresini birlikte izleyin',
    domain: 'astera.app',
    loginUrl: 'https://www.example.com',
  },
];

export function getPlatform(id: string): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

/**
 * Providers that block playback on mobile browsers ("use the app"). For these
 * we spoof a desktop Safari UA so their web player loads and actually plays —
 * the same trick Rave-style apps use. The rest keep a normal mobile UA.
 */
const DESKTOP_ONLY = new Set(['netflix', 'disney', 'prime', 'max', 'appletv']);

const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const MOBILE_UA_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const MOBILE_UA_ANDROID =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

/** Pick the User-Agent a given provider should see. */
export function userAgentFor(platformId: string, os: 'ios' | 'android' | string): string {
  if (DESKTOP_ONLY.has(platformId)) return DESKTOP_UA;
  return os === 'android' ? MOBILE_UA_ANDROID : MOBILE_UA_IOS;
}

export function needsDesktop(platformId: string): boolean {
  return DESKTOP_ONLY.has(platformId);
}
