import React from 'react';
import { View, Text, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  name?: string;
  size?: number;
  tint?: string;
};

export const FpAvatar = ({ name = 'AM', size = 36, tint }: Props) => {
  const { t } = useTheme();
  const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: tint || t.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: t.line,
    }}>
      <Text style={{
        fontFamily: SERIF,
        fontSize: size * 0.36,
        color: t.primary,
        fontWeight: '600',
        letterSpacing: 0.5,
      }}>
        {name}
      </Text>
    </View>
  );
};