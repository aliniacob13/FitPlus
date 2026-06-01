import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

import { ProgressRing } from "@/components/ui/ProgressRing";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { aiApi, Conversation } from "@/services/aiApi";
import { nutritionApi } from "@/services/nutritionApi";
import { todayString, useFoodDiaryStore } from "@/store/foodDiaryStore";
import { useUserStore } from "@/store/userStore";
import { AppStackParamList, MainTabParamList } from "@/types/navigation";

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Home">,
  NativeStackNavigationProp<AppStackParamList>
>;

// ── Small macro dot row ───────────────────────────────────────────────────────

const MacroRow = ({
  label, value, target, color,
}: { label: string; value: number; target: number; color: string }) => {
  const pct = Math.min(1, target > 0 ? value / target : 0);
  return (
    <View style={macro.wrap}>
      <View style={macro.header}>
        <Text style={macro.label}>{label}</Text>
        <Text style={macro.value}>{Math.round(value)}<Text style={macro.target}>/{target}g</Text></Text>
      </View>
      <View style={macro.track}>
        <View style={[macro.fill, { width: `${Math.round(pct * 100)}%` as `${number}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const macro = StyleSheet.create({
  wrap: { gap: 5 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  label: { fontSize: 11, color: colors.mutedColor, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "500" },
  value: { fontFamily: "JetBrainsMono_500Medium", fontSize: 11, color: colors.ink2 },
  target: { color: colors.mutedColor },
  track: { height: 5, backgroundColor: colors.lineColor, borderRadius: 999 },
  fill: { height: "100%", borderRadius: 999 },
});

// ── Triple macro ring ─────────────────────────────────────────────────────────

const TripleRing = ({ size = 100, values = [0.7, 0.5, 0.4] }: { size?: number; values?: number[] }) => {
  const stroke = 7;
  const rings = [
    { color: colors.macroProtein, idx: 0 },
    { color: colors.macroCarbs,   idx: 1 },
    { color: colors.macroFat,     idx: 2 },
  ];
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      {rings.map(({ color, idx }) => {
        const r = (size - stroke) / 2 - idx * (stroke + 2);
        const c = 2 * Math.PI * r;
        const v = Math.max(0, Math.min(1, values[idx] ?? 0));
        return (
          <React.Fragment key={idx}>
            <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity={0.15} strokeWidth={stroke} />
            <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
              strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} />
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

// ── Streak dots ───────────────────────────────────────────────────────────────

const StreakDots = ({ streak }: { streak: boolean[] }) => (
  <View style={{ flexDirection: "row", gap: 6 }}>
    {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
      <View key={i} style={{ alignItems: "center", gap: 5 }}>
        <View style={[streakS.dot, streak[i] && streakS.dotOn]} />
        <Text style={streakS.day}>{d}</Text>
      </View>
    ))}
  </View>
);

const streakS = StyleSheet.create({
  dot: {
    width: 14, height: 14, borderRadius: 4,
    backgroundColor: colors.lineColor,
    borderWidth: 1, borderColor: colors.lineSoft,
  },
  dotOn: { backgroundColor: colors.primaryBase, borderColor: "transparent" },
  day: { fontSize: 10, color: colors.mutedColor, fontFamily: "JetBrainsMono_500Medium" },
});

// ── Suggestion card row ───────────────────────────────────────────────────────

const SuggestionRow = ({
  icon, title, sub, label, tint, iconColor, onPress,
}: { icon: React.ComponentProps<typeof Ionicons>["name"]; title: string; sub: string; label: string; tint: string; iconColor: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [suggS.row, pressed && { opacity: 0.88 }]}>
    <View style={[suggS.icon, { backgroundColor: tint }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={suggS.title}>{title}</Text>
      <Text style={suggS.sub}>{sub}</Text>
    </View>
    <View style={suggS.cta}>
      <Text style={suggS.ctaText}>{label}</Text>
    </View>
  </Pressable>
);

const suggS = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 14, backgroundColor: colors.surfaceBase,
    borderRadius: radius.card, borderWidth: 1, borderColor: colors.lineColor,
  },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 14, fontWeight: "600", color: colors.ink },
  sub:   { fontSize: 12, color: colors.mutedColor },
  cta: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999,
    backgroundColor: colors.ink,
  },
  ctaText: { fontSize: 11, fontWeight: "600", color: colors.bgBase, letterSpacing: 0.3 },
});

// ── HomeScreen ────────────────────────────────────────────────────────────────

export const HomeScreen = () => {
  const navigation = useNavigation<HomeNav>();
  const profile = useUserStore((s) => s.profile);
  const dailyKcalTarget = useFoodDiaryStore((s) => s.dailyKcalTarget);
  const diaryDate = useFoodDiaryStore((s) => s.date);
  const diaryKcal = useFoodDiaryStore((s) => s.totals.kcal);

  const [todayKcal, setTodayKcal] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const displayName = profile?.name || profile?.email?.split("@")[0] || "Athlete";
  const initials = displayName[0]?.toUpperCase() ?? "A";
  const today = new Date();
  const dayLabels = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
  const monthLabels = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "nov", "dec"];
  const dateLabel = `${dayLabels[today.getDay()]} · ${today.getDate()} ${monthLabels[today.getMonth()]}`;

  const kcalTarget = dailyKcalTarget ?? 2000;
  const remaining = Math.max(0, kcalTarget - todayKcal);
  const kcalProgress = kcalTarget > 0 ? Math.min(1, todayKcal / kcalTarget) : 0;

  // Fake streak for demo
  const streak = [true, true, true, true, true, false, false];

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const { data } = await nutritionApi.getFoodLog(todayString());
          setTodayKcal(Math.round(data.totals.kcal));
        } catch { setTodayKcal(0); }
        try {
          const convs = await aiApi.getConversations();
          setConversations(convs);
        } catch { /* keep previous */ }
      };
      void load();
    }, []),
  );

  useEffect(() => {
    if (diaryDate === todayString()) {
      setTodayKcal(Math.round(diaryKcal));
    }
  }, [diaryDate, diaryKcal]);

  const workoutConvs = conversations.filter((c) => c.agent_type === "workout");
  const dietConvs    = conversations.filter((c) => c.agent_type === "diet");

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerDate}>{dateLabel}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <Text style={styles.greeting}>Bună, </Text>
            <Text style={[styles.greeting, styles.greetingAccent]}>{displayName}.</Text>
          </View>
        </View>
        <Pressable
          onPress={() => navigation.navigate("Profile")}
          style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
      </View>

      {/* ── Hero ring card ── */}
      <View style={[styles.heroCard, styles.heroBg]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
          <ProgressRing
            size={138}
            stroke={11}
            value={kcalProgress}
            label={String(todayKcal)}
            sub="kcal"
            color={kcalProgress >= 1 ? colors.error : colors.primaryBase}
          />
          <View style={{ flex: 1, gap: 12 }}>
            <View>
              <Text style={styles.ringEyebrow}>remaining</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                <Text style={styles.ringRemaining}>{remaining}</Text>
                <Text style={styles.ringUnit}>kcal</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="flame" size={14} color={colors.accentBase} />
              <Text style={styles.goalText}>Goal · {kcalTarget} kcal</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Streak ── */}
      <View style={styles.card}>
        <View style={styles.streakHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="flame" size={16} color={colors.accentBase} />
            <Text style={styles.cardTitle}>5 zile la rând</Text>
          </View>
          <Text style={styles.streakLabel}>STREAK</Text>
        </View>
        <StreakDots streak={streak} />
      </View>

      {/* ── Macros card ── */}
      <View style={styles.card}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <TripleRing size={92} values={[0.74, 0.55, 0.42]} />
          <View style={{ flex: 1, gap: 10 }}>
            <Text style={styles.eyebrow}>MACROS TODAY</Text>
            <MacroRow label="Proteine" value={74}  target={100} color={colors.macroProtein} />
            <MacroRow label="Carbohidrați" value={138} target={250} color={colors.macroCarbs} />
            <MacroRow label="Grăsimi" value={28}  target={67}  color={colors.macroFat} />
          </View>
        </View>
      </View>

      {/* ── Pentru azi ── */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.sectionTitle}>Pentru azi</Text>
          <Text style={styles.eyebrow}>3 sugestii</Text>
        </View>
        <SuggestionRow
          icon="restaurant-outline" tint={colors.accentSoft} iconColor={colors.accentBase}
          title="Plate Coach" sub="Foto la prânzul de azi"
          label="Scan"
          onPress={() => navigation.navigate("PlateCoach", { date: todayString() })}
        />
        <SuggestionRow
          icon="barbell-outline" tint={colors.primarySoft} iconColor={colors.primaryBase}
          title="AI Workout Coach" sub="Personalizat pe profilul tău"
          label="Start"
          onPress={() => navigation.navigate("Workout")}
        />
        <SuggestionRow
          icon="nutrition-outline" tint={colors.surface2} iconColor={colors.good}
          title="AI Diet Coach" sub="Ce mănânc pre-workout?"
          label="Chat"
          onPress={() => navigation.navigate("Diet")}
        />
      </View>

      {/* ── Body stats ── */}
      <View style={{ gap: 10 }}>
        <Text style={styles.sectionTitle}>Statistici</Text>
        <View style={{ flexDirection: "row", gap: spacing[3] }}>
          {[
            { emoji: "⚖️", value: profile?.weight_kg ?? "—", label: "kg" },
            { emoji: "📏", value: profile?.height_cm ?? "—", label: "cm" },
            { emoji: "🎯", value: profile?.fitness_level ?? "—", label: "level" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { flex: 1 }]}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</Text>
              <Text style={styles.statValue} numberOfLines={1}>{String(s.value)}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* AI stats */}
      <View style={[styles.card, { flexDirection: "row", justifyContent: "space-around", paddingVertical: spacing.md }]}>
        {[
          { v: conversations.length, l: "Chats" },
          { v: workoutConvs.length,  l: "Workout" },
          { v: dietConvs.length,     l: "Diet" },
        ].map(({ v, l }) => (
          <View key={l} style={{ alignItems: "center" }}>
            <Text style={styles.aiStatVal}>{v}</Text>
            <Text style={styles.eyebrow}>{l}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  content: { paddingHorizontal: spacing.screen, paddingTop: 48, paddingBottom: 100, gap: spacing.md },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: spacing[2],
  },
  headerDate: { ...typography.styles.eyebrow, marginBottom: 6 },
  greeting: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 36, letterSpacing: -0.72, lineHeight: 40, color: colors.ink,
  },
  greetingAccent: {
    fontFamily: "InstrumentSerif_400Regular_Italic",
    color: colors.primaryBase,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primarySoft, borderWidth: 1.5, borderColor: colors.primaryBase,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.primaryBase, fontSize: 16, fontWeight: "700" },

  heroCard: {
    borderRadius: radius.card, padding: spacing.md + 4,
    borderWidth: 1, borderColor: "transparent",
  },
  heroBg: { backgroundColor: colors.surface2 },

  ringEyebrow: { ...typography.styles.eyebrow, marginBottom: 4 },
  ringRemaining: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 30, letterSpacing: -0.6, color: colors.ink,
  },
  ringUnit: { fontSize: 14, color: colors.mutedColor },
  divider: { height: 1, backgroundColor: colors.lineColor },
  goalText: { fontSize: 12, color: colors.ink2 },

  card: {
    backgroundColor: colors.surfaceBase,
    borderRadius: radius.card, borderWidth: 1, borderColor: colors.lineColor,
    padding: spacing.md,
  },
  streakHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", color: colors.ink },
  streakLabel: { fontFamily: "JetBrainsMono_500Medium", fontSize: 10, color: colors.mutedColor },

  eyebrow: { ...typography.styles.eyebrow },
  sectionTitle: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 22, letterSpacing: -0.44, color: colors.ink,
  },

  statCard: {
    backgroundColor: colors.surface2,
    borderRadius: radius.card, padding: spacing.md, alignItems: "center",
    borderWidth: 1, borderColor: colors.lineColor,
  },
  statValue: { fontSize: 18, fontWeight: "700", color: colors.ink },
  statLabel: { ...typography.styles.caption, marginTop: 2 },

  aiStatVal: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 28, letterSpacing: -0.56, color: colors.primaryBase,
  },
});