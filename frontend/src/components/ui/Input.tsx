import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  Animated,
} from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Field label rendered above the input */
  label?: string;
  /** Error message rendered below the input */
  error?: string;
  /** Helper text rendered below the input (hidden when error is present) */
  hint?: string;
  /** Render a toggle to show/hide the value — use for password fields */
  isPassword?: boolean;
  /** Icon rendered on the left inside the input */
  leftIcon?: React.ReactNode;
  /** Icon rendered on the right inside the input (ignored when isPassword=true) */
  rightIcon?: React.ReactNode;
  /** Override outer container style */
  containerStyle?: ViewStyle;
  /** Override label style */
  labelStyle?: TextStyle;
  /** Override input text style */
  inputStyle?: TextStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Input({
  label,
  error,
  hint,
  isPassword = false,
  leftIcon,
  rightIcon,
  containerStyle,
  labelStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [isFocused,  setIsFocused]  = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Animated border color
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  const animatedBorderColor = borderAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [
      error ? colors.error : colors.border.default,
      error ? colors.error : colors.border.focus,
    ],
  });

  const hasRightSlot = isPassword || rightIcon;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}

      {/* Input row */}
      <Animated.View
        style={[
          styles.inputRow,
          { borderColor: animatedBorderColor },
          error && styles.inputRowError,
        ]}
      >
        {/* Left icon */}
        {leftIcon && (
          <View style={styles.leftIconContainer}>{leftIcon}</View>
        )}

        {/* Text input */}
        <TextInput
          style={[
            styles.input,
            leftIcon  && styles.inputWithLeft,
            hasRightSlot && styles.inputWithRight,
            inputStyle,
          ]}
          placeholderTextColor={colors.text.muted}
          selectionColor={colors.accent.base}
          cursorColor={colors.accent.base}
          secureTextEntry={isPassword && !showSecret}
          autoCapitalize={isPassword ? 'none' : rest.autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />

        {/* Right slot */}
        {isPassword ? (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={() => setShowSecret((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.showHideText}>
              {showSecret ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIconContainer}>{rightIcon}</View>
        ) : null}
      </Animated.View>

      {/* Error / hint */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    ...typography.styles.label,
    marginBottom: spacing[2],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    minHeight: 52,
    overflow: 'hidden',
  },
  inputRowError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.size.base,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    // prevent default android underline
    includeFontPadding: false,
  },
  inputWithLeft: {
    paddingLeft: spacing[2],
  },
  inputWithRight: {
    paddingRight: spacing[2],
  },
  leftIconContainer: {
    paddingLeft: spacing[4],
    paddingRight: spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconContainer: {
    paddingRight: spacing[4],
    paddingLeft: spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  showHideText: {
    color: colors.accent.text,
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.size.xs,
    marginTop: spacing[1],
    marginLeft: spacing[1],
  },
  hintText: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
    marginTop: spacing[1],
    marginLeft: spacing[1],
  },
});
