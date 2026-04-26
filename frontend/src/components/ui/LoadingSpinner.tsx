import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Easing,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing } from '../../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  /** Spinner size */
  size?: Size;
  /** Spinner color — defaults to accent lime */
  color?: string;
  /** If true, render a full-screen dark overlay behind the spinner */
  overlay?: boolean;
  /** Override container style */
  style?: ViewStyle;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, { outer: number; inner: number; stroke: number }> = {
  sm: { outer: 22, inner: 16, stroke: 2 },
  md: { outer: 36, inner: 26, stroke: 3 },
  lg: { outer: 56, inner: 40, stroke: 4 },
};

// ─── Component ────────────────────────────────────────────────────────────────

function Spinner({ size = 'md', color = colors.accent.base }: Pick<LoadingSpinnerProps, 'size' | 'color'>) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const { outer, inner, stroke } = sizeMap[size!];

  return (
    <Animated.View
      style={[
        {
          width:  outer,
          height: outer,
          borderRadius: outer / 2,
          borderWidth:  stroke,
          borderColor:  `${color}30`,    // full ring — muted
          borderTopColor: color,          // active arc
        },
        { transform: [{ rotate }] },
      ]}
    />
  );
}

export default function LoadingSpinner({
  size    = 'md',
  color   = colors.accent.base,
  overlay = false,
  style,
}: LoadingSpinnerProps) {
  if (overlay) {
    return (
      <View style={styles.overlay}>
        <View style={styles.overlayCard}>
          <Spinner size={size} color={color} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.centered, style]}>
      <Spinner size={size} color={color} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  overlayCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
