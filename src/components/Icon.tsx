import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { color as palette } from '../theme/tokens';

/**
 * Inline SVG icon set. Emoji are never used in this UI — they render
 * inconsistently across platforms and cheapen the look.
 */
export type IconName =
  | 'contact'
  | 'calendar'
  | 'wifi'
  | 'place'
  | 'link'
  | 'message'
  | 'check'
  | 'trash'
  | 'alert'
  | 'share';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, color = palette.ink, strokeWidth = 1.8 }: Props) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'contact' && (
        <>
          <Circle cx={12} cy={8} r={3.4} {...common} />
          <Path d="M4.6 20c.9-3.6 3.8-5.6 7.4-5.6s6.5 2 7.4 5.6" {...common} />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Rect x={3.4} y={5} width={17.2} height={15.4} rx={3} {...common} />
          <Line x1={3.4} y1={9.6} x2={20.6} y2={9.6} {...common} />
          <Line x1={8.2} y1={3} x2={8.2} y2={6.4} {...common} />
          <Line x1={15.8} y1={3} x2={15.8} y2={6.4} {...common} />
        </>
      )}
      {name === 'wifi' && (
        <>
          <Path d="M2.6 9.2a14 14 0 0 1 18.8 0" {...common} />
          <Path d="M6 12.7a9 9 0 0 1 12 0" {...common} />
          <Path d="M9.3 16.2a4.2 4.2 0 0 1 5.4 0" {...common} />
          <Circle cx={12} cy={19.6} r={0.9} fill={color} stroke="none" />
        </>
      )}
      {name === 'place' && (
        <>
          <Path d="M12 21c4-4.2 6-7.4 6-10a6 6 0 1 0-12 0c0 2.6 2 5.8 6 10Z" {...common} />
          <Circle cx={12} cy={10.6} r={2.2} {...common} />
        </>
      )}
      {name === 'link' && (
        <>
          <Path d="M10.4 13.6a3.6 3.6 0 0 0 5.1 0l2.9-2.9a3.6 3.6 0 0 0-5.1-5.1l-1.2 1.2" {...common} />
          <Path d="M13.6 10.4a3.6 3.6 0 0 0-5.1 0l-2.9 2.9a3.6 3.6 0 0 0 5.1 5.1l1.2-1.2" {...common} />
        </>
      )}
      {name === 'message' && (
        <Path
          d="M20.4 12.2c0 3.9-3.6 7-8.1 7a9.4 9.4 0 0 1-2.7-.4L4.6 20.4l1.3-3.7a6.7 6.7 0 0 1-2.3-4.9c0-3.9 3.6-7 8.1-7s8.7 3.1 8.7 7Z"
          {...common}
        />
      )}
      {name === 'check' && <Path d="M5 12.8 9.6 17.4 19 7.6" {...common} strokeWidth={2.4} />}
      {name === 'trash' && (
        <>
          <Path d="M4.6 6.8h14.8" {...common} />
          <Path d="M9.2 6.8V5.2a1.6 1.6 0 0 1 1.6-1.6h2.4a1.6 1.6 0 0 1 1.6 1.6v1.6" {...common} />
          <Path d="M6.6 6.8 7.5 19a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5l.9-12.2" {...common} />
        </>
      )}
      {name === 'alert' && (
        <>
          <Circle cx={12} cy={12} r={8.6} {...common} />
          <Line x1={12} y1={7.8} x2={12} y2={12.8} {...common} />
          <Circle cx={12} cy={16.2} r={0.9} fill={color} stroke="none" />
        </>
      )}
      {name === 'share' && (
        <>
          <Path d="M12 15.4V4.2" {...common} />
          <Path d="M8.2 7.8 12 4l3.8 3.8" {...common} />
          <Path d="M5.6 13.4v5.2a1.8 1.8 0 0 0 1.8 1.8h9.2a1.8 1.8 0 0 0 1.8-1.8v-5.2" {...common} />
        </>
      )}
    </Svg>
  );
}
