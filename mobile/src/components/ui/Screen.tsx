import { PropsWithChildren } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { spacing } from "@/constants/theme";

type ScreenProps = PropsWithChildren<{
  padded?: boolean;
  scrollable?: boolean;
}>;

export const Screen = ({ children, padded = true, scrollable = true }: ScreenProps) => {
  const { t } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.bg }]}>
      {scrollable ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, padded && styles.padded]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padded && styles.padded]}>{children}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
