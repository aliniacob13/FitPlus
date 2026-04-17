import { PropsWithChildren } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/constants/theme";

type ScreenProps = PropsWithChildren<{
  padded?: boolean;
}>;

export const Screen = ({ children, padded = true }: ScreenProps) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={[styles.content, padded && styles.padded]}>{children}</View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  padded: {
    padding: spacing.md,
  },
});
