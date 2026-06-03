import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, typography } from "@/constants/theme";

type Props = {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
};

export const PageHeader = ({ title, onBack, rightElement }: Props) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={10}>
        <Ionicons name="chevron-back" size={24} color={colors.textPalette.primary} />
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.brand}>
          <Text style={styles.brandFit}>Fit</Text>
          <Text style={styles.brandPlus}>Plus</Text>
        </Text>
        <View style={styles.sep} />
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.right}>{rightElement ?? null}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPalette.default,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
  },
  right: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  brand: {},
  brandFit: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPalette.primary,
    letterSpacing: -0.3,
  },
  brandPlus: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.accent.base,
    letterSpacing: -0.3,
  },
  sep: {
    width: 1,
    height: 14,
    backgroundColor: colors.borderPalette.default,
  },
  title: {
    ...typography.styles.bodySmall,
    fontWeight: "600",
    color: colors.textPalette.primary,
    maxWidth: 180,
  },
});
