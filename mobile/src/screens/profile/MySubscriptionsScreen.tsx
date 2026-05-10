import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { paymentsApi, UserSubscription } from "@/services/paymentsApi";
import { AppStackParamList } from "@/types/navigation";
import { formatApiError } from "@/utils/apiErrors";

type NavProp = NativeStackNavigationProp<AppStackParamList, "MySubscriptions">;

const statusLabel = (s: string): string => {
  const x = s.toLowerCase();
  if (x === "active") return "Active";
  if (x === "canceled" || x === "cancelled") return "Canceled";
  if (x === "pending") return "Pending";
  return s;
};

export const MySubscriptionsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [items, setItems] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentsApi.getMySubscriptions();
      setItems(data);
    } catch (e) {
      setError(formatApiError(e, "Could not load subscriptions."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const renderRow = ({ item }: { item: UserSubscription }) => (
    <View style={styles.card}>
      <Text style={styles.gym}>{item.gym_name}</Text>
      <Text style={styles.plan}>{item.plan_name}</Text>
      <View style={styles.row}>
        <Text style={[styles.badge, item.status === "active" ? styles.badgeOn : styles.badgeOff]}>
          {statusLabel(item.status)}
        </Text>
        {item.expires_at ? (
          <Text style={styles.meta}>
            Renews / ends: {new Date(item.expires_at).toLocaleDateString()}
          </Text>
        ) : (
          <Text style={styles.meta}>—</Text>
        )}
      </View>
    </View>
  );

  return (
    <Screen scrollable={false}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>My subscriptions</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent.base} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.err}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.retry}>
            <Text style={styles.retryTxt}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => String(x.id)}
          renderItem={renderRow}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No gym subscriptions yet. Subscribe from your favourite gym.</Text>
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  back: {
    color: colors.accent.base,
    fontWeight: "700",
    fontSize: typography.size.base,
  },
  title: {
    ...typography.styles.h2,
    flex: 1,
  },
  list: { gap: spacing.sm, paddingBottom: spacing["2xl"] },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    backgroundColor: colors.card,
    gap: 4,
  },
  gym: {
    fontWeight: "700",
    fontSize: typography.size.base,
    color: colors.text,
  },
  plan: {
    ...typography.styles.bodySmall,
    color: colors.textPalette.secondary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  badgeOn: {
    backgroundColor: colors.success + "28",
    color: colors.success,
  },
  badgeOff: {
    backgroundColor: colors.textPalette.muted + "35",
    color: colors.textPalette.secondary,
  },
  meta: {
    flex: 1,
    ...typography.styles.caption,
    textAlign: "right",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  err: { ...typography.styles.bodySmall, textAlign: "center", color: colors.error },
  retry: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.accent.base,
  },
  retryTxt: { color: colors.accent.base, fontWeight: "700" },
  empty: {
    ...typography.styles.bodySmall,
    color: colors.textPalette.secondary,
    textAlign: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
