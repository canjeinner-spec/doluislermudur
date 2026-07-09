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
