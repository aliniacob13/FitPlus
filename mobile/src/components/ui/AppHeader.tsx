import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { colors, radius, spacing } from "@/constants/theme";
import { AppStackParamList } from "@/types/navigation";

type NavProp = NativeStackNavigationProp<AppStackParamList>;

type QuickLink = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  screen: keyof AppStackParamList;
};

const QUICK_LINKS: QuickLink[] = [
  { icon: "restaurant-outline", label: "Food", screen: "FoodDiary" },
  { icon: "analytics-outline", label: "Weight", screen: "WeightTracker" },
  { icon: "calculator-outline", label: "Calories", screen: "CalorieTarget" },
];

export const AppHeader = () => {
  const navigation = useNavigation<NavProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        <Text style={styles.logoFit}>Fit</Text>
        <Text style={styles.logoPlus}>Plus</Text>
      </Text>

      <View style={styles.actions}>
        {QUICK_LINKS.map((link) => (
          <Pressable
            key={link.screen}
            onPress={() => navigation.navigate(link.screen as any)}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            hitSlop={6}
          >
            <Ionicons name={link.icon} size={18} color={colors.textPalette.secondary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPalette.default,
  },
  logo: {},
  logoFit: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPalette.primary,
    letterSpacing: -0.5,
  },
  logoPlus: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.accent.base,
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.65 },
});
