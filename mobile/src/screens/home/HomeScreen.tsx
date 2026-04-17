import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/constants/theme";

export const HomeScreen = () => (
  <Screen>
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.text}>Dashboard placeholder. Urmatorul pas: carduri cu sumar activitate.</Text>
    </View>
  </Screen>
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  text: {
    color: colors.mutedText,
  },
});
