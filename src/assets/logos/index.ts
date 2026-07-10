import type { PlatformId } from '@/components/icons';

/**
 * Official platform wordmark assets (transparent PNGs supplied for the picker).
 * Only the providers we offer in the "start a watch party" flow have a full
 * wordmark; everything else falls back to the drawn SVG symbol (PlatformLogo).
 */
export const PLATFORM_LOGOS: Partial<Record<PlatformId, number>> = {
  netflix: require('./netflix.png'),
  youtube: require('./youtube.png'),
  prime: require('./primevideo.png'),
  gdrive: require('./gdrive.png'),
};

/** Intrinsic width/height of each trimmed asset, and a tuned display height so
 * wide wordmarks and the near-square Drive mark carry similar optical weight. */
export const PLATFORM_LOGO_META: Partial<Record<PlatformId, { aspect: number; height: number }>> = {
  netflix: { aspect: 3.675, height: 23 },
  youtube: { aspect: 4.465, height: 26 },
  prime: { aspect: 3.222, height: 24 },
  gdrive: { aspect: 1.135, height: 34 },
};
