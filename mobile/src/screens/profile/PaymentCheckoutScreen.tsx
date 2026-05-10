import { useCallback, useRef } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { WebView } from "react-native-webview";

import { Screen } from "@/components/ui/Screen";
import { colors, spacing, typography } from "@/constants/theme";
import { AppStackParamList } from "@/types/navigation";

type RouteProps = RouteProp<AppStackParamList, "PaymentCheckout">;
type NavProp = NativeStackNavigationProp<AppStackParamList, "PaymentCheckout">;

/** Match backend default Stripe redirect URLs (configurable via STRIPE_CHECKOUT_*). */
const SUCCESS_HINTS = ["payment-success", "session_id=", "checkout/success"];
const CANCEL_HINTS = ["payment-cancel", "checkout/cancel"];

export const PaymentCheckoutScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { checkoutUrl } = route.params;

  const doneRef = useRef(false);

  const finishOk = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    Alert.alert(
      "Payment",
      "If your payment completed, your subscription will appear under My subscriptions shortly.",
      [{ text: "OK", onPress: () => navigation.pop(2) }],
    );
  }, [navigation]);

  const finishCancel = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    navigation.goBack();
  }, [navigation]);

  const onNavChange = (navState: { url: string }) => {
    const u = navState.url.toLowerCase();
    if (SUCCESS_HINTS.some((h) => u.includes(h))) {
      finishOk();
      return;
    }
    if (CANCEL_HINTS.some((h) => u.includes(h))) {
      finishCancel();
    }
  };

  return (
    <Screen scrollable={false}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
        <Text style={styles.toolbarTitle}>Secure checkout</Text>
        <View style={{ width: 48 }} />
      </View>
      <View style={{ flex: 1 }}>
        <WebView
          style={{ flex: 1 }}
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={onNavChange}
          startInLoadingState
          setSupportMultipleWindows={false}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  close: {
    color: colors.accent.base,
    fontWeight: "700",
    fontSize: typography.size.base,
    width: 72,
  },
  toolbarTitle: {
    ...typography.styles.bodySmall,
    fontWeight: "600",
    color: colors.text,
    fontSize: typography.size.base,
  },
});
