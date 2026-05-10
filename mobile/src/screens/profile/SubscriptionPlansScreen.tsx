import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { GymPricingPlan, paymentsApi } from "@/services/paymentsApi";
import { AppStackParamList } from "@/types/navigation";
import { formatApiError } from "@/utils/apiErrors";

type RouteProps = RouteProp<AppStackParamList, "SubscriptionPlans">;
type NavProp = NativeStackNavigationProp<AppStackParamList, "SubscriptionPlans">;

const formatMoney = (cents: number, currency: string): string => {
  const major = cents / 100;
  const sym = currency.toLowerCase() === "ron" ? "RON" : currency.toUpperCase();
  return `${major.toFixed(2)} ${sym}`;
};

export const SubscriptionPlansScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { gymId, gymName } = route.params;

  const [plans, setPlans] = useState<GymPricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentsApi.getGymPricing(gymId);
      setPlans(data);
      if (!data.length) {
        setError("This gym has no subscription plans yet.");
      }
    } catch (e) {
      setError(formatApiError(e, "Could not load plans."));
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    void load();
  }, [load]);

  const startCheckout = async (planIndex: number) => {
    setCheckoutLoading(planIndex);
    try {
      const res = await paymentsApi.createCheckoutSession(gymId, planIndex);
      navigation.navigate("PaymentCheckout", {
        checkoutUrl: res.checkout_url,
        sessionId: res.session_id,
      });
    } catch (e) {
      Alert.alert("Checkout", formatApiError(e, "Could not start checkout."));
    } finally {
      setCheckoutLoading(null);
    }
  };

  const renderPlan = ({ item, index }: { item: GymPricingPlan; index: number }) => (
    <View style={styles.planCard}>
      <Text style={styles.planName}>{item.name}</Text>
      <Text style={styles.planPrice}>{formatMoney(item.amount_cents, item.currency)}</Text>
      <Text style={styles.planPeriod}>per {item.period}</Text>
      {item.features?.length ? (
        <View style={styles.features}>
          {item.features.map((f) => (
            <Text key={f} style={styles.featureLine}>
              • {f}
            </Text>
          ))}
        </View>
      ) : null}
      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={() => void startCheckout(index)}
        disabled={checkoutLoading !== null}
      >
        {checkoutLoading === index ? (
          <ActivityIndicator color={colors.textPalette.inverse} />
        ) : (
          <Text style={styles.ctaLabel}>Subscribe with card</Text>
        )}
      </Pressable>
    </View>
  );

  return (
    <Screen scrollable={false}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Plans</Text>
      </View>
      <Text style={styles.subtitle} numberOfLines={2}>
        {gymName ?? `Gym #${gymId}`}
      </Text>

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
          data={plans}
          keyExtractor={(item) => item.key}
          renderItem={renderPlan}
          contentContainerStyle={styles.list}
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
    paddingBottom: spacing.sm,
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
  subtitle: {
    ...typography.styles.bodySmall,
    marginBottom: spacing.md,
    color: colors.textPalette.secondary,
  },
  list: { gap: spacing.md, paddingBottom: spacing["2xl"] },
  planCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    backgroundColor: colors.card,
    gap: spacing.xs,
  },
  planName: {
    fontWeight: "700",
    fontSize: typography.size.lg,
    color: colors.text,
  },
  planPrice: {
    fontWeight: "700",
    fontSize: typography.size.xl,
    color: colors.accent.base,
  },
  planPeriod: {
    ...typography.styles.caption,
    textTransform: "lowercase",
  },
  features: { marginTop: spacing.xs, gap: 2 },
  featureLine: { ...typography.styles.bodySmall, color: colors.textPalette.secondary },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  ctaPressed: { opacity: 0.85 },
  ctaLabel: {
    color: colors.textPalette.inverse,
    fontWeight: "700",
    fontSize: typography.size.base,
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
});
