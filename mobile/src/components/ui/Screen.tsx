import { PropsWithChildren, ReactNode } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

import { AppHeader } from "@/components/ui/AppHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import { colors, spacing } from "@/constants/theme";

type ScreenProps = PropsWithChildren<{
  padded?: boolean;
  scrollable?: boolean;
  /** Render the FitPlus brand header — use on tab root screens */
  appHeader?: boolean;
  /** Render a back-button page header with this title — use on stack screens */
  title?: string;
  /** Custom back handler for PageHeader */
  onBack?: () => void;
  /** Element placed on the right side of PageHeader */
  headerRight?: ReactNode;
}>;

export const Screen = ({
  children,
  padded = true,
  scrollable = true,
  appHeader = false,
  title,
  onBack,
  headerRight,
}: ScreenProps) => (
  <SafeAreaView style={styles.safeArea}>
    {appHeader && <AppHeader />}
    {title !== undefined && (
      <PageHeader title={title} onBack={onBack} rightElement={headerRight} />
    )}
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
