import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/constants/theme";

type ErrorStateProps = {
  message: string;
};

export const ErrorState = ({ message }: ErrorStateProps) => (
  <View style={styles.container}>
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    backgroundColor: "#2A1116",
    padding: spacing.sm,
  },
  text: {
    color: "#FCA5A5",
  },
});
