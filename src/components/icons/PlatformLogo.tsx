import React from 'react';
import Svg, { Path, Rect, Circle, Polygon, G, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Icon } from './Icon';

/**
 * Simplified, recognizable platform marks drawn as SVG so they stay crisp at
 * any size and never require bundling third-party trademark assets. Each mark
 * sits on its own rounded "app tile" background for the platform picker.
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
  if (id === 'max') return <MaxMark size={size} />;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x="0" y="0" width="100" height="100" rx="26" fill={tileColor(id)} />
      {renderMark(id)}
    </Svg>
  );
}

function tileColor(id: PlatformId): string {
  switch (id) {
    case 'netflix':
      return '#0A0A0A';
    case 'youtube':
      return '#0F0F0F';
    case 'prime':
      return '#0B1620';
    case 'disney':
      return '#0B1633';
    case 'max':
      return '#0A0A0F';
    case 'appletv':
      return '#0A0A0A';
    case 'vimeo':
      return '#0A1620';
    case 'gdrive':
      return '#101214';
    case 'web':
      return '#171310';
    default:
      return '#141414';
  }
}

function renderMark(id: PlatformId) {
  switch (id) {
    case 'netflix':
      return (
        <G>
          <Rect x="34" y="24" width="9" height="52" fill="#E50914" />
          <Rect x="57" y="24" width="9" height="52" fill="#E50914" />
          <Polygon points="34,24 43,24 66,76 57,76" fill="#B20710" />
        </G>
      );
    case 'youtube':
      return (
        <G>
          <Rect x="20" y="30" width="60" height="40" rx="11" fill="#FF0033" />
          <Polygon points="44,42 44,58 60,50" fill="#FFFFFF" />
        </G>
      );
    case 'prime':
      return (
        <G>
          <Path
            d="M22 40c0-2 1.5-4 4-4h48c2.5 0 4 2 4 4s-1.5 4-4 4H26c-2.5 0-4-2-4-4Z"
            fill="#00A8E1"
          />
          <Path
            d="M24 58c11 8 41 8 52 0"
            stroke="#00A8E1"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M70 55l9 2-3 8Z" fill="#00A8E1" />
        </G>
      );
    case 'disney':
      return (
        <G>
          <Path
            d="M26 60c0-14 11-24 24-24s24 8 24 20c0 6-4 10-9 10-4 0-7-2-9-6"
            stroke="#1AA0E8"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <Path d="M31 44c8-2 20-2 30 3" stroke="#1AA0E8" strokeWidth="5" fill="none" strokeLinecap="round" />
          <Path d="M74 40v10M69 45h10" stroke="#1AA0E8" strokeWidth="4.5" strokeLinecap="round" />
        </G>
      );
    case 'max':
      return null; // handled by MaxMark in PlatformLogo
    case 'appletv':
      return (
        <G>
          <Path
            d="M40 34c0 3-2.4 5.4-5 5.4 0-3 2.4-5.4 5-5.4Zm4.6 9.5c2.2 0 3.6 1.3 4.8 1.3 1.1 0 2.9-1.4 5.3-1.2 2.7.2 4.4 1.4 5.4 3.2-3.8 2.4-3.2 7.9.8 9.5-.9 2.5-2.9 5.7-4.9 5.7-1.8 0-2.5-1.2-4.6-1.2s-2.9 1.2-4.6 1.2c-2.4.1-5.6-4.8-6.4-9.4-.9-5.5 2-9.2 4.8-9.3Z"
            fill="#FFFFFF"
          />
          <Path d="M40 66h6l-3 6-3-6Z" fill="#FFFFFF" opacity={0} />
        </G>
      );
    case 'vimeo':
      return (
        <Path
          d="M78 40c-.4 8-6 19-16.7 33-11 14.6-20.4 21.9-28 21.9-4.8 0-8.8-4.4-12.1-13.2-2.2-8-4.4-16-6.6-24-2.4-8.8-5-13.2-7.8-13.2-.6 0-2.7 1.3-6.3 3.8l-3.8-4.9c4-3.5 7.9-7 11.8-10.5 5.3-4.6 9.3-7 12-7.3 6.3-.6 10.2 3.7 11.6 12.9.5 3.2 1 6.4 1.4 9.6 1.4 9.7 2.9 14.5 4.4 14.5 1.2 0 3-1.9 5.4-5.6 2.4-3.8 3.7-6.6 3.9-8.6.4-3.6-1-5.4-4.2-5.4-1.5 0-3 .3-4.6 1C42.8 27 51.3 20.9 63.4 21c9 .1 13.2 6.4 12.9 18.9Z"
          fill="#1AB7EA"
          transform="scale(0.62) translate(28,20)"
        />
      );
    case 'gdrive':
      // Classic three-panel Drive triangle: blue (left), green (base), amber (right).
      return (
        <G transform="translate(22,26)">
          <Polygon points="18,0 38,0 20,32 0,32" fill="#2684FC" />
          <Polygon points="0,32 20,32 10,50 -10,50" fill="#00AC47" />
          <Polygon points="20,32 38,0 56,32 36,50 10,50" fill="#FFBA00" />
        </G>
      );
    case 'web':
      return (
        <G transform="translate(28,28)">
          <IconGlobe />
        </G>
      );
    default:
      return null;
  }
}

// Max wordmark drawn separately because it needs a gradient fill.
export function MaxMark({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x="0" y="0" width="100" height="100" rx="26" fill="#0A0A0F" />
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

function IconGlobe() {
  return (
    <Svg width={44} height={44} viewBox="0 0 24 24">
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

/** Fallback used if a mark fails to draw. */
export function GenericPlatformGlyph() {
  return <Icon name="film" />;
}
