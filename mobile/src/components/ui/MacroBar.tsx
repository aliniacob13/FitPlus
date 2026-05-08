import React from 'react';
import { View, Text, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  label: string;
  value: number;
  target: number;
  color: string;
};

export const MacroBar = ({ label, value, target, color }: Props) => {
  const { t } = useTheme();
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Text style={{
          fontSize: 10,
          color: t.muted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: '500',
        }}>
          {label}
        </Text>
        <Text style={{ fontFamily: MONO, fontSize: 10, color: t.ink2 }}>
          {value}
          <Text style={{ color: t.muted }}>/{target}g</Text>
        </Text>
      </View>
      <View style={{ height: 5, backgroundColor: t.line, borderRadius: 999 }}>
        <View style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: 999,
        }}/>
      </View>
    </View>
  );
};