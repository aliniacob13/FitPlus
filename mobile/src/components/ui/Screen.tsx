import { PropsWithChildren } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/constants/theme";

type ScreenProps = PropsWithChildren<{
  padded?: boolean;
  /**
   * When false, children provide their own scroll (ScrollView / FlatList / map).
   * Default true so simple pages (e.g. Home) scroll on web inside flex layouts.
   */
  scrollable?: boolean;
}>;

export const Screen = ({ children, padded = true, scrollable = true }: ScreenProps) => (
  <SafeAreaView style={styles.safeArea}>
    {scrollable ? (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, padded && styles.padded]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        {children}
      </ScrollView>
    ) : (
      <View style={[styles.flex, padded && styles.padded]}>{children}</View>
    )}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    padding: spacing.md,
  },
});
