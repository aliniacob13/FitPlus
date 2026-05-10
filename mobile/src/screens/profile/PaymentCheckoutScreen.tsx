import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Screen } from "@/components/ui/Screen";
import { colors, spacing, typography } from "@/constants/theme";
import { paymentsApi } from "@/services/paymentsApi";
import { AppStackParamList } from "@/types/navigation";
import { formatApiError } from "@/utils/apiErrors";

const NativeWebView =
  Platform.OS === "web"
    ? null
    : (require("react-native-webview").WebView as typeof import("react-native-webview").WebView);

type RouteProps = RouteProp<AppStackParamList, "PaymentCheckout">;
type NavProp = NativeStackNavigationProp<AppStackParamList, "PaymentCheckout">;

/** Match backend Stripe redirect URLs (STRIPE_CHECKOUT_*). */
const SUCCESS_HINTS = ["payment-success", "session_id=", "checkout/success"];
const CANCEL_HINTS = ["payment-cancel", "checkout/cancel"];

export const PaymentCheckoutScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { checkoutUrl, sessionId } = route.params;

  const [confirming, setConfirming] = useState(false);
  /** Avoid duplicate confirm when WebView fires several navigations on success. */
  const confirmStartedRef = useRef(false);

  const popAfterCheckout = useCallback(() => {
    navigation.pop(2);
  }, [navigation]);

  const finishOk = useCallback(async () => {
    if (confirmStartedRef.current) return;
    confirmStartedRef.current = true;
    setConfirming(true);
    try {
      await paymentsApi.confirmCheckoutSession(sessionId);
      const msg = "Abonamentul a fost inregistrat. Il gasesti la Abonamentele mele.";
      if (Platform.OS === "web") {
        window.alert(msg);
        popAfterCheckout();
      } else {
        Alert.alert("Plata", msg, [{ text: "OK", onPress: popAfterCheckout }]);
      }
    } catch (e) {
      confirmStartedRef.current = false;
      const err = formatApiError(e, "Nu am putut confirma plata.");
      if (Platform.OS === "web") {
        window.alert(err);
      } else {
        Alert.alert("Eroare", err);
      }
    } finally {
      setConfirming(false);
    }
  }, [popAfterCheckout, sessionId]);

  const finishCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onNavChange = (navState: { url: string }) => {
    const u = navState.url.toLowerCase();
    if (SUCCESS_HINTS.some((h) => u.includes(h))) {
      void finishOk();
      return;
    }
    if (CANCEL_HINTS.some((h) => u.includes(h))) {
      finishCancel();
    }
  };

  const openCheckoutExternal = useCallback(() => {
    if (Platform.OS === "web" && typeof globalThis !== "undefined") {
      const w = globalThis as typeof globalThis & { open?: (url: string, target?: string, features?: string) => void };
      if (typeof w.open === "function") {
        w.open(checkoutUrl, "_blank", "noopener,noreferrer");
        return;
      }
    }
    void Linking.openURL(checkoutUrl);
  }, [checkoutUrl]);

  useEffect(() => {
    if (Platform.OS === "web") {
      openCheckoutExternal();
    }
  }, [openCheckoutExternal]);

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
        {Platform.OS === "web" ? (
          <View style={styles.webBody}>
            <Text style={styles.webExplain}>
              In browser, plata Stripe se deschide intr-un tab nou. Finalizeaza acolo, apoi revino aici si apasa „Am
              terminat plata” pentru a inregistra abonamentul (webhook-ul Stripe nu ajunge la localhost).
            </Text>
            <Pressable
              style={[styles.webPrimary, confirming && styles.btnDisabled]}
              onPress={openCheckoutExternal}
              disabled={confirming}
            >
              <Text style={styles.webPrimaryLabel}>Deschide din nou pagina de plata</Text>
            </Pressable>
            <Pressable
              style={[styles.webSecondary, confirming && styles.btnDisabled]}
              onPress={() => void finishOk()}
              disabled={confirming}
            >
              {confirming ? (
                <ActivityIndicator color={colors.accent.base} />
              ) : (
                <Text style={styles.webSecondaryLabel}>Am terminat plata</Text>
              )}
            </Pressable>
            <Pressable style={styles.webSecondary} onPress={finishCancel} disabled={confirming}>
              <Text style={styles.webMuted}>Renunta</Text>
            </Pressable>
          </View>
        ) : NativeWebView ? (
          <NativeWebView
            style={{ flex: 1 }}
            source={{ uri: checkoutUrl }}
            onNavigationStateChange={onNavChange}
            startInLoadingState
            setSupportMultipleWindows={false}
          />
        ) : null}
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
  webBody: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    justifyContent: "center",
  },
  webExplain: {
    ...typography.styles.bodySmall,
    color: colors.textPalette.secondary,
    textAlign: "center",
  },
  webPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  webPrimaryLabel: {
    color: colors.textPalette.inverse,
    fontWeight: "700",
    fontSize: typography.size.base,
  },
  webSecondary: {
    paddingVertical: spacing.sm,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  webSecondaryLabel: {
    color: colors.accent.base,
    fontWeight: "700",
    fontSize: typography.size.base,
  },
  webMuted: {
    color: colors.textPalette.secondary,
    fontSize: typography.size.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
