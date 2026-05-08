import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  size?: number;
  stroke?: number;
  value?: number;
  label?: string;
  sub?: string;
  color?: string;
};

export const ProgressRing = ({ size = 160, stroke = 12, value = 0, label, sub, color }: Props) => {
  const { t } = useTheme();
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clampedValue = Math.max(0, Math.min(1, value));
  const offset = circumference * (1 - clampedValue);

  const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={t.line}
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color || t.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {label && (
          <Text style={{
            fontFamily: SERIF,
            fontSize: size * 0.26,
            lineHeight: size * 0.28,
            color: t.ink,
            letterSpacing: -1,
            fontWeight: '700',
          }}>
            {label}
          </Text>
        )}
        {sub && (
          <Text style={{
            fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
            fontSize: 10,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            color: t.muted,
            marginTop: 4,
          }}>
            {sub}
          </Text>
        )}
      </View>
    </View>
  );
};