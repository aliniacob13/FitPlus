import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  size?: number;
  stroke?: number;
  values?: [number, number, number];
};

export const TripleRing = ({ size = 120, stroke = 7, values = [0.7, 0.5, 0.8] }: Props) => {
  const { t } = useTheme();
  const colors = [t.macroProtein, t.macroCarbs, t.macroFat];

  const rings = values.map((val, idx) => {
    const r = (size - stroke) / 2 - idx * (stroke + 3);
    const c = 2 * Math.PI * r;
    const v = Math.max(0, Math.min(1, val));
    const offset = c * (1 - v);
    return { r, c, v, offset, color: colors[idx] };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {rings.map((ring, idx) => (
          <React.Fragment key={idx}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeOpacity={0.18}
              strokeWidth={stroke}
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${ring.c} ${ring.c}`}
              strokeDashoffset={ring.offset}
            />
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};