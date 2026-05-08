import React from 'react';
import Svg, { Path, Circle, Rect, Ellipse } from 'react-native-svg';

export type FpIconName =
  | 'home' | 'bowl' | 'spark' | 'pin' | 'user' | 'plus'
  | 'arrow' | 'arrow-up' | 'left' | 'right' | 'flame' | 'dumbbell'
  | 'leaf' | 'camera' | 'mic' | 'send' | 'search' | 'heart'
  | 'check' | 'bell' | 'gear' | 'chart' | 'play' | 'pause'
  | 'close' | 'menu' | 'star' | 'water' | 'key';

type Props = {
  name: FpIconName;
  size?: number;
  color?: string;
  stroke?: number;
};

export const FpIcon = ({ name, size = 18, color = 'currentColor', stroke = 1.6 }: Props) => {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'home':
      return (
        <Svg {...props}>
          <Path d="M3 11l9-7 9 7" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <Path d="M5 10v10h14V10" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'bowl':
      return (
        <Svg {...props}>
          <Path d="M3 11h18l-2 8H5z" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <Path d="M8 7c0-2 1-3 4-3s4 1 4 3" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'spark':
      return (
        <Svg {...props}>
          <Path d="M12 3l1.8 5L19 10l-5.2 2L12 17l-1.8-5L5 10l5.2-2z" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'pin':
      return (
        <Svg {...props}>
          <Path d="M12 21s7-7.5 7-12a7 7 0 10-14 0c0 4.5 7 12 7 12z" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <Circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth={stroke} fill="none"/>
        </Svg>
      );
    case 'user':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={stroke} fill="none"/>
          <Path d="M4 21c1.5-4.5 5-7 8-7s6.5 2.5 8 7" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...props}>
          <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'arrow':
      return (
        <Svg {...props}>
          <Path d="M5 12h14M13 5l7 7-7 7" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'arrow-up':
      return (
        <Svg {...props}>
          <Path d="M12 19V5M5 12l7-7 7 7" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'left':
      return (
        <Svg {...props}>
          <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'right':
      return (
        <Svg {...props}>
          <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'flame':
      return (
        <Svg {...props}>
          <Path d="M12 3c2 4 6 6 6 11a6 6 0 11-12 0c0-3 2-4 2-7 0 3 2 4 4 4 0-3-1-5 0-8z" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'dumbbell':
      return (
        <Svg {...props}>
          <Path d="M3 9v6M21 9v6M6 7v10M18 7v10M6 12h12" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'leaf':
      return (
        <Svg {...props}>
          <Path d="M5 19c0-9 7-14 16-14-1 9-6 14-14 14a3 3 0 01-2-2z" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <Path d="M5 19c4-4 8-7 12-9" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'camera':
      return (
        <Svg {...props}>
          <Path d="M4 8h3l2-2h6l2 2h3v11H4z" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <Circle cx="12" cy="13" r="3.5" stroke={color} strokeWidth={stroke} fill="none"/>
        </Svg>
      );
    case 'mic':
      return (
        <Svg {...props}>
          <Rect x="9" y="3" width="6" height="12" rx="3" stroke={color} strokeWidth={stroke} fill="none"/>
          <Path d="M5 11a7 7 0 0014 0M12 18v3" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'send':
      return (
        <Svg {...props}>
          <Path d="M4 12l16-8-6 18-3-7z" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'search':
      return (
        <Svg {...props}>
          <Circle cx="11" cy="11" r="6" stroke={color} strokeWidth={stroke} fill="none"/>
          <Path d="M20 20l-4-4" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'heart':
      return (
        <Svg {...props}>
          <Path d="M12 21s-7-4.5-9-10a5 5 0 019-3 5 5 0 019 3c-2 5.5-9 10-9 10z" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'check':
      return (
        <Svg {...props}>
          <Path d="M5 12l5 5L20 7" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...props}>
          <Path d="M6 16V11a6 6 0 1112 0v5l1.5 2H4.5z" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <Path d="M10 21h4" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'gear':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={stroke} fill="none"/>
          <Path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3h0a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v0a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'chart':
      return (
        <Svg {...props}>
          <Path d="M3 20h18M7 16V9m5 7V5m5 11v-7" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'play':
      return (
        <Svg {...props}>
          <Path d="M7 4l13 8-13 8z" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'pause':
      return (
        <Svg {...props}>
          <Path d="M7 4v16M17 4v16" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'close':
      return (
        <Svg {...props}>
          <Path d="M6 6l12 12M18 6l-12 12" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'menu':
      return (
        <Svg {...props}>
          <Path d="M4 6h16M4 12h16M4 18h16" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'star':
      return (
        <Svg {...props}>
          <Path d="M12 3l2.7 6.3L21 10l-5 4.4L17.5 21 12 17.6 6.5 21 8 14.4 3 10l6.3-.7z" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'water':
      return (
        <Svg {...props}>
          <Path d="M12 3c4 5 7 8 7 12a7 7 0 11-14 0c0-4 3-7 7-12z" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    case 'key':
      return (
        <Svg {...props}>
          <Circle cx="8" cy="14" r="4" stroke={color} strokeWidth={stroke} fill="none"/>
          <Path d="M11 14h10M17 14v4M21 14v3" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      );
    default:
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={stroke} fill="none"/>
        </Svg>
      );
  }
};