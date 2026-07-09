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

/**
 * Present a normal mobile browser UA to every provider — this loads their mobile
 * site, so sign-in pages render cleanly in the WebView (as in Turtle) rather
 * than a giant desktop layout.
 */
export function userAgentFor(_platformId: string, os: 'ios' | 'android' | string): string {
  return os === 'android' ? MOBILE_UA_ANDROID : MOBILE_UA_IOS;
}
