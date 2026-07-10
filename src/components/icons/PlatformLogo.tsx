import React from 'react';
import Svg, { Path, Circle, Polygon, G, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Icon } from './Icon';

/**
 * Recognizable platform marks, drawn as SVG on a *transparent* background so
 * they sit directly on the page (no dark "app tile"). The colored brand logos
 * (Netflix, YouTube, Vimeo, Apple TV, Drive, Max) use the real official mark
 * geometry; Prime Video and Disney+ are drawn as clean brand-colored glyphs.
 */

export type PlatformId =
  | 'netflix'
  | 'youtube'
  | 'prime'
  | 'disney'
  | 'max'
  | 'appletv'
  | 'vimeo'
  | 'gdrive'
  | 'web';

type Props = { id: PlatformId; size?: number };

export function PlatformLogo({ id, size = 44 }: Props) {
  switch (id) {
    case 'netflix':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="m5.398 0 8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398zm8.489 0v9.172l4.715 13.33V0h-4.715zM5.398 1.5V24c1.873-.225 2.81-.312 4.715-.398V14.83L5.398 1.5z"
            fill="#E50914"
          />
        </Svg>
      );
    case 'youtube':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
            fill="#FF0000"
          />
          <Polygon points="9.545,15.568 9.545,8.432 15.818,12" fill="#FFFFFF" />
        </Svg>
      );
    case 'vimeo':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M23.9765 6.4168c-.105 2.338-1.739 5.5429-4.894 9.6088-3.2679 4.247-6.0258 6.3699-8.2898 6.3699-1.409 0-2.578-1.294-3.553-3.881l-1.9179-7.1138c-.719-2.584-1.488-3.878-2.312-3.878-.179 0-.806.378-1.8809 1.132l-1.129-1.457a315.06 315.06 0 003.501-3.1279c1.579-1.368 2.765-2.085 3.5539-2.159 1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.5069.5389 2.45 1.1309 3.674 1.7759 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.8679 3.434-5.7568 6.7619-5.6368 2.4729.06 3.6279 1.664 3.4929 4.7969z"
            fill="#1AB7EA"
          />
        </Svg>
      );
    case 'appletv':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M20.57 17.735h-1.815l-3.34-9.203h1.633l2.02 5.987c.075.231.273.9.586 2.012l.297-.997.33-1.006 2.094-6.004H24zm-5.344-.066a5.76 5.76 0 0 1-1.55.207c-1.23 0-1.84-.693-1.84-2.087V9.646h-1.063V8.532h1.121V7.081l1.476-.602v2.062h1.707v1.113H13.38v5.805c0 .446.074.75.214.932.14.182.396.264.75.264.207 0 .495-.041.883-.115zm-7.29-5.343c.017 1.764 1.55 2.358 1.567 2.366-.017.042-.248.842-.808 1.658-.487.71-.99 1.418-1.79 1.435-.783.016-1.03-.462-1.93-.462-.89 0-1.17.445-1.913.478-.758.025-1.344-.775-1.838-1.484-.998-1.451-1.765-4.098-.734-5.88.51-.89 1.426-1.451 2.416-1.46.75-.016 1.468.512 1.93.512.461 0 1.327-.627 2.234-.536.38.016 1.452.157 2.136 1.154-.058.033-1.278.743-1.27 2.219M6.468 7.988c.404-.495.685-1.18.61-1.864-.585.025-1.294.388-1.723.883-.38.437-.71 1.138-.619 1.806.64.05 1.328-.331 1.732-.825z"
            fill="#FFFFFF"
          />
        </Svg>
      );
    case 'max':
      return <MaxMark size={size} />;
    case 'prime':
      // Prime Video signature: cyan play glyph over the smile swoosh.
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="42" r="24" fill="none" stroke="#1FA9E6" strokeWidth="7" />
          <Polygon points="43,31 43,53 63,42" fill="#1FA9E6" />
          <Path
            d="M20 68c12 12 48 12 60 0"
            stroke="#1FA9E6"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M74 62l10 3-4 10Z" fill="#1FA9E6" />
        </Svg>
      );
    case 'disney':
      // Disney+ style: rounded "D" with a plus.
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path
            d="M24 26h20c15 0 26 10 26 24S59 74 44 74H24V26Zm12 11v26h8c8 0 14-5 14-13s-6-13-14-13h-8Z"
            fill="#1AA0E8"
          />
          <Path d="M78 40v18M69 49h18" stroke="#1AA0E8" strokeWidth="6" strokeLinecap="round" />
        </Svg>
      );
    case 'gdrive':
      // Classic three-panel Drive triangle: blue (left), green (base), amber (right).
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <G transform="translate(22,26)">
            <Polygon points="18,0 38,0 20,32 0,32" fill="#2684FC" />
            <Polygon points="0,32 20,32 10,50 -10,50" fill="#00AC47" />
            <Polygon points="20,32 38,0 56,32 36,50 10,50" fill="#FFBA00" />
          </G>
        </Svg>
      );
    case 'web':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="9" stroke="#E3A366" strokeWidth={1.8} fill="none" />
          <Path
            d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"
            stroke="#E3A366"
            strokeWidth={1.8}
            fill="none"
          />
        </Svg>
      );
  }
}

// Max mark: overlapping rings, brand-blue gradient, transparent background.
export function MaxMark({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="maxg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#8AA6FF" />
          <Stop offset="1" stopColor="#4E63FF" />
        </LinearGradient>
      </Defs>
      <Path
        d="M18 62V42l7 14 7-14v20M40 62l6-20 6 20M43 55h6M60 42l14 20M74 42 60 62"
        stroke="url(#maxg)"
        strokeWidth="5.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Fallback used if a mark fails to draw. */
export function GenericPlatformGlyph() {
  return <Icon name="film" />;
}
