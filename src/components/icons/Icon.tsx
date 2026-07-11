import React from 'react';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';

import { palette } from '@/theme';

/**
 * A single stroke-based icon set drawn to feel like SF Symbols: consistent
 * 24px grid, rounded joins, ~1.9 stroke weight. Every glyph inherits `color`
 * and `size` so it composes cleanly with buttons and list rows.
 */

export type IconName =
  | 'menu'
  | 'bell'
  | 'search'
  | 'plus'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'settings'
  | 'edit'
  | 'logout'
  | 'info'
  | 'rooms'
  | 'users'
  | 'person-add'
  | 'share'
  | 'lock'
  | 'globe'
  | 'play'
  | 'pause'
  | 'forward'
  | 'backward'
  | 'shuffle'
  | 'repeat'
  | 'cast'
  | 'close'
  | 'emoji'
  | 'attach'
  | 'send'
  | 'volume'
  | 'fullscreen'
  | 'sliders'
  | 'film'
  | 'check'
  | 'sparkle'
  | 'grid'
  | 'compass'
  | 'crown'
  | 'camera'
  | 'eye';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** For glyphs that read better filled (play/send). */
  filled?: boolean;
};

export function Icon({
  name,
  size = 22,
  color = palette.textPrimary,
  strokeWidth = 1.9,
  filled = false,
}: Props) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderGlyph(name, { stroke, color, filled })}
    </Svg>
  );
}

function renderGlyph(
  name: IconName,
  ctx: { stroke: object; color: string; filled: boolean }
) {
  const { stroke, color, filled } = ctx;
  switch (name) {
    case 'menu':
      return (
        <>
          <Line x1="3.5" y1="6.5" x2="20.5" y2="6.5" {...stroke} />
          <Line x1="3.5" y1="12" x2="20.5" y2="12" {...stroke} />
          <Line x1="3.5" y1="17.5" x2="20.5" y2="17.5" {...stroke} />
        </>
      );
    case 'grid':
      return (
        <>
          <Rect x="3.5" y="3.5" width="7" height="7" rx="2.2" {...stroke} />
          <Rect x="13.5" y="3.5" width="7" height="7" rx="2.2" {...stroke} />
          <Rect x="3.5" y="13.5" width="7" height="7" rx="2.2" {...stroke} />
          <Rect x="13.5" y="13.5" width="7" height="7" rx="2.2" {...stroke} />
        </>
      );
    case 'bell':
      return (
        <>
          <Path
            d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z"
            {...stroke}
          />
          <Path d="M10.3 19a2 2 0 0 0 3.4 0" {...stroke} />
        </>
      );
    case 'search':
      return (
        <>
          <Circle cx="11" cy="11" r="7" {...stroke} />
          <Line x1="16.2" y1="16.2" x2="20.5" y2="20.5" {...stroke} />
        </>
      );
    case 'plus':
      return (
        <>
          <Line x1="12" y1="5" x2="12" y2="19" {...stroke} />
          <Line x1="5" y1="12" x2="19" y2="12" {...stroke} />
        </>
      );
    case 'camera':
      return (
        <>
          <Path d="M4 8.5a2 2 0 0 1 2-2h1.6l1-1.6a1.5 1.5 0 0 1 1.3-.7h4.2a1.5 1.5 0 0 1 1.3.7l1 1.6H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" {...stroke} />
          <Circle cx="12" cy="12.5" r="3.2" {...stroke} />
        </>
      );
    case 'chevron-right':
      return <Polyline points="9,5 16,12 9,19" {...stroke} />;
    case 'chevron-left':
      return <Polyline points="15,5 8,12 15,19" {...stroke} />;
    case 'chevron-down':
      return <Polyline points="5,9 12,16 19,9" {...stroke} />;
    case 'settings':
      return (
        <>
          <Circle cx="12" cy="12" r="3.2" {...stroke} />
          <Path
            d="M12 2.8v2.2M12 19v2.2M21.2 12H19M5 12H2.8M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6M18.5 18.5l-1.6-1.6M7.1 7.1 5.5 5.5"
            {...stroke}
          />
        </>
      );
    case 'edit':
      return (
        <>
          <Path d="M12 20h9" {...stroke} />
          <Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" {...stroke} />
        </>
      );
    case 'logout':
      return (
        <>
          <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...stroke} />
          <Path d="M16 17l5-5-5-5M21 12H9" {...stroke} />
        </>
      );
    case 'info':
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Line x1="12" y1="11" x2="12" y2="16.5" {...stroke} />
          <Circle cx="12" cy="7.7" r="0.4" fill={color} stroke={color} />
        </>
      );
    case 'rooms':
      return (
        <>
          <Rect x="3.5" y="4.5" width="17" height="12" rx="2.4" {...stroke} />
          <Line x1="8" y1="20" x2="16" y2="20" {...stroke} />
          <Line x1="12" y1="16.5" x2="12" y2="20" {...stroke} />
        </>
      );
    case 'users':
      return (
        <>
          <Circle cx="9" cy="8.5" r="3.2" {...stroke} />
          <Path d="M3.8 19.5a5.2 5.2 0 0 1 10.4 0" {...stroke} />
          <Path d="M16 5.6a3.2 3.2 0 0 1 0 5.8" {...stroke} />
          <Path d="M17.2 13.6a5.2 5.2 0 0 1 3 4.9" {...stroke} />
        </>
      );
    case 'person-add':
      return (
        <>
          <Circle cx="9.5" cy="8" r="3.3" {...stroke} />
          <Path d="M3.8 19.5a5.7 5.7 0 0 1 11.4 0" {...stroke} />
          <Line x1="19" y1="7" x2="19" y2="13" {...stroke} />
          <Line x1="16" y1="10" x2="22" y2="10" {...stroke} />
        </>
      );
    case 'share':
      return (
        <>
          <Path d="M12 3v13" {...stroke} />
          <Polyline points="8,6.5 12,3 16,6.5" {...stroke} />
          <Path d="M7 11H5.5A1.5 1.5 0 0 0 4 12.5v6A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18.5 11H17" {...stroke} />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect x="5" y="10.5" width="14" height="9.5" rx="2.4" {...stroke} />
          <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...stroke} />
          <Circle cx="12" cy="15" r="0.4" fill={color} stroke={color} strokeWidth={2.4} />
        </>
      );
    case 'globe':
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" {...stroke} />
        </>
      );
    case 'play':
      return (
        <Path
          d="M8 5.6c0-.9 1-1.5 1.8-1L18 9.6c.8.5.8 1.6 0 2.1L9.8 16.7c-.8.5-1.8-.1-1.8-1V5.6Z"
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={filled ? 0 : 1.9}
          strokeLinejoin="round"
        />
      );
    case 'pause':
      return (
        <>
          <Rect x="7" y="5.5" width="3.4" height="13" rx="1.4" fill={color} />
          <Rect x="13.6" y="5.5" width="3.4" height="13" rx="1.4" fill={color} />
        </>
      );
    case 'forward':
      return (
        <>
          <Path d="M4 6.5v11l8.5-5.5L4 6.5Z" fill={color} stroke={color} strokeLinejoin="round" strokeWidth={0.5} />
          <Path d="M12.5 6.5v11L21 12 12.5 6.5Z" fill={color} stroke={color} strokeLinejoin="round" strokeWidth={0.5} />
        </>
      );
    case 'backward':
      return (
        <>
          <Path d="M20 6.5v11L11.5 12 20 6.5Z" fill={color} stroke={color} strokeLinejoin="round" strokeWidth={0.5} />
          <Path d="M11.5 6.5v11L3 12l8.5-5.5Z" fill={color} stroke={color} strokeLinejoin="round" strokeWidth={0.5} />
        </>
      );
    case 'shuffle':
      return (
        <>
          <Path d="M3.5 6.5h3.2c1 0 1.9.5 2.5 1.3l6 8c.6.8 1.5 1.3 2.5 1.3H21" {...stroke} />
          <Path d="M3.5 17.5h3.2c1 0 1.9-.5 2.5-1.3l1.3-1.7M14 8.5l1.7-2.2c.6-.8 1.5-1.3 2.5-1.3H21" {...stroke} />
          <Polyline points="18.5,3 21,5.2 18.5,7.4" {...stroke} />
          <Polyline points="18.5,15.4 21,17.6 18.5,19.8" {...stroke} />
        </>
      );
    case 'repeat':
      return (
        <>
          <Path d="M4 10V9a3 3 0 0 1 3-3h11" {...stroke} />
          <Polyline points="15.5,3.2 18.6,6 15.5,8.8" {...stroke} />
          <Path d="M20 14v1a3 3 0 0 1-3 3H6" {...stroke} />
          <Polyline points="8.5,20.8 5.4,18 8.5,15.2" {...stroke} />
        </>
      );
    case 'cast':
      return (
        <>
          <Path d="M4 16.5a3.5 3.5 0 0 1 3.5 3.5M4 12.5a7.5 7.5 0 0 1 7.5 7.5M4 8.5A11.5 11.5 0 0 1 15.5 20" {...stroke} />
          <Path d="M4 8V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H18" {...stroke} />
        </>
      );
    case 'close':
      return (
        <>
          <Line x1="6" y1="6" x2="18" y2="18" {...stroke} />
          <Line x1="18" y1="6" x2="6" y2="18" {...stroke} />
        </>
      );
    case 'emoji':
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" {...stroke} />
          <Circle cx="9" cy="9.8" r="0.5" fill={color} stroke={color} strokeWidth={1.6} />
          <Circle cx="15" cy="9.8" r="0.5" fill={color} stroke={color} strokeWidth={1.6} />
        </>
      );
    case 'attach':
      return (
        <Path
          d="M20 11.5 12.4 19a4.5 4.5 0 0 1-6.4-6.4l7.6-7.6a3 3 0 0 1 4.2 4.2l-7.6 7.6a1.5 1.5 0 0 1-2.1-2.1l6.9-6.9"
          {...stroke}
        />
      );
    case 'send':
      return (
        <Path
          d="M4.2 11.6 19 5.2c.7-.3 1.5.4 1.2 1.2l-6.4 14.8c-.3.7-1.4.6-1.6-.1l-1.6-5.4a1 1 0 0 0-.7-.7l-5.4-1.6c-.7-.2-.8-1.3-.1-1.6Z"
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={filled ? 0 : 1.9}
          strokeLinejoin="round"
        />
      );
    case 'volume':
      return (
        <>
          <Path d="M4 9.5v5h3l4.5 3.5V6L7 9.5H4Z" {...stroke} />
          <Path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" {...stroke} />
        </>
      );
    case 'fullscreen':
      return (
        <>
          <Polyline points="4,9 4,4 9,4" {...stroke} />
          <Polyline points="20,9 20,4 15,4" {...stroke} />
          <Polyline points="4,15 4,20 9,20" {...stroke} />
          <Polyline points="20,15 20,20 15,20" {...stroke} />
        </>
      );
    case 'sliders':
      return (
        <>
          <Line x1="4" y1="8" x2="20" y2="8" {...stroke} />
          <Line x1="4" y1="16" x2="20" y2="16" {...stroke} />
          <Circle cx="9" cy="8" r="2.3" fill={palette.background} {...stroke} />
          <Circle cx="15" cy="16" r="2.3" fill={palette.background} {...stroke} />
        </>
      );
    case 'film':
      return (
        <>
          <Rect x="3.5" y="4.5" width="17" height="15" rx="2.6" {...stroke} />
          <Line x1="8" y1="4.5" x2="8" y2="19.5" {...stroke} />
          <Line x1="16" y1="4.5" x2="16" y2="19.5" {...stroke} />
          <Line x1="3.5" y1="12" x2="20.5" y2="12" {...stroke} />
        </>
      );
    case 'check':
      return <Polyline points="5,12.5 10,17.5 19,7" {...stroke} />;
    case 'sparkle':
      return (
        <Path
          d="M12 3.5c.6 3.8 1.7 4.9 5.5 5.5-3.8.6-4.9 1.7-5.5 5.5-.6-3.8-1.7-4.9-5.5-5.5 3.8-.6 4.9-1.7 5.5-5.5Z"
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={filled ? 0 : 1.7}
          strokeLinejoin="round"
        />
      );
    case 'compass':
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z" {...stroke} />
        </>
      );
    case 'crown':
      return (
        <Path
          d="M4 17.5h16M4 17.5 5 8l4 3.5L12 6l3 5.5L19 8l1 9.5"
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={filled ? 0 : 1.8}
          strokeLinejoin="round"
        />
      );
    case 'eye':
      return (
        <>
          <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" {...stroke} />
          <Circle cx="12" cy="12" r="2.8" {...stroke} />
        </>
      );
    default:
      return null;
  }
}
