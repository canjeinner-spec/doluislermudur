import React from 'react';
import { Image } from 'react-native';

import { PLATFORM_LOGOS, PLATFORM_LOGO_META } from '@/assets/logos';
import { PlatformLogo, type PlatformId } from './PlatformLogo';

type Props = { id: PlatformId; height?: number };

/**
 * Renders the official transparent wordmark for a provider (used in the picker,
 * where there's room for the full logo). Falls back to the drawn SVG symbol for
 * providers without a supplied wordmark.
 */
export function PlatformWordmark({ id, height }: Props) {
  const src = PLATFORM_LOGOS[id];
  const meta = PLATFORM_LOGO_META[id];
  if (!src || !meta) return <PlatformLogo id={id} size={height ?? 40} />;
  const h = height ?? meta.height;
  return <Image source={src} style={{ width: h * meta.aspect, height: h }} resizeMode="contain" />;
}
