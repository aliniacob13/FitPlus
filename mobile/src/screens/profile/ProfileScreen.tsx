import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";

export const ProfileScreen = () => {
  const profile = useUserStore((state) => state.profile);
  const logout = useAuthStore((state) => state.logout);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.value}>Email: {profile?.email ?? "N/A"}</Text>
        <Text style={styles.value}>Nume: {profile?.name ?? "N/A"}</Text>
        <Button label="Logout" onPress={() => void logout()} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  value: {
    color: colors.mutedText,
  },
});
