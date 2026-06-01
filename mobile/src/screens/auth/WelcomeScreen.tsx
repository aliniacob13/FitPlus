import { View, Text, StyleSheet, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Svg, { Defs, RadialGradient, Stop, Rect, Circle, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { AuthStackParamList } from "@/types/navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export const WelcomeScreen = ({ navigation }: Props) => (
  <View style={styles.root}>
    {/* Decorative background */}
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 400 812" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="18%" r="55%">
            <Stop offset="0%" stopColor={colors.primaryBase} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={colors.primaryBase} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="400" height="812" fill="url(#glow)" />
        <Circle cx="320" cy="120" r="120" fill="none" stroke={colors.primaryBase} strokeWidth="1" opacity="0.2" />
        <Circle cx="320" cy="120" r="75"  fill="none" stroke={colors.primaryBase} strokeWidth="1" opacity="0.35" />
        <Circle cx="320" cy="120" r="36"  fill={colors.primaryBase} opacity="0.12" />
        <Path d="M-20,620 C100,590 200,660 420,600" fill="none" stroke={colors.lineColor} strokeWidth="1" />
        <Path d="M-20,660 C140,630 240,700 420,640" fill="none" stroke={colors.lineColor} strokeWidth="1" />
      </Svg>
    </View>

    {/* Brand mark */}
    <View style={styles.brand}>
      <View style={styles.logoBox}>
        <Ionicons name="leaf-outline" size={26} color={colors.primaryInk} />
      </View>
      <View style={{ gap: 2 }}>
        <Text style={styles.appName}>FitPlus</Text>
        <Text style={styles.appTagline}>WELLNESS · DAILY</Text>
      </View>
    </View>

    {/* Hero copy */}
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>your daily wellness · 2026</Text>
      <View style={styles.heroTitle}>
        <Text style={styles.heroText}>Mănâncă bine.</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Text style={styles.heroText}>Antrenează-te </Text>
          <Text style={[styles.heroText, styles.heroAccent]}>smart.</Text>
        </View>
      </View>
      <Text style={styles.heroSub}>
        Plate Coach AI, antrenamente personalizate și 1 200+ săli aproape de tine.
      </Text>
    </View>

    {/* CTAs */}
    <View style={styles.ctas}>
      <Pressable
        style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.88 }]}
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={styles.btnPrimaryText}>Începe gratuit · 7 zile</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.primaryInk} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.88 }]}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.btnGhostText}>Am deja cont</Text>
      </Pressable>

      <Text style={styles.legal}>
        Continuând accepți{" "}
        <Text style={styles.legalLink}>Termenii</Text>
        {" "}și{" "}
        <Text style={styles.legalLink}>Politica de confidențialitate</Text>.
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
    paddingHorizontal: spacing.screen,
    paddingTop: 48,
    paddingBottom: 36,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 44 * 0.28,
    backgroundColor: colors.primaryBase,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryBase,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 24,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  appTagline: {
    ...typography.styles.eyebrow,
    fontSize: 9,
  },
  hero: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 32,
  },
  eyebrow: {
    ...typography.styles.eyebrow,
    marginBottom: 14,
  },
  heroTitle: { gap: 0 },
  heroText: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 46,
    letterSpacing: -1.15,
    lineHeight: 50,
    color: colors.ink,
  },
  heroAccent: {
    fontFamily: "InstrumentSerif_400Regular_Italic",
    color: colors.primaryBase,
  },
  heroSub: {
    fontSize: 14,
    color: colors.mutedColor,
    lineHeight: 22,
    maxWidth: 300,
    marginTop: 16,
  },
  ctas: { gap: 10 },
  btnPrimary: {
    backgroundColor: colors.primaryBase,
    borderRadius: radius.button,
    paddingVertical: 16,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnPrimaryText: {
    color: colors.primaryInk,
    fontSize: 15,
    fontWeight: "600",
  },
  btnGhost: {
    borderRadius: radius.button,
    paddingVertical: 16,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.lineColor,
  },
  btnGhostText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "500",
  },
  legal: {
    fontSize: 11,
    color: colors.mutedColor,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 8,
  },
  legalLink: {
    textDecorationLine: "underline",
  },
});