import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { FpAvatar } from '@/components/ui/FpAvatar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { TripleRing } from '@/components/ui/TripleRing';
import { nutritionApi } from '@/services/nutritionApi';
import { todayString, useFoodDiaryStore } from '@/store/foodDiaryStore';
import { useUserStore } from '@/store/userStore';
import { AppStackParamList, MainTabParamList } from '@/types/navigation';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function getDayOfWeek(): number {
  return (new Date().getDay() + 6) % 7;
}

function buildStreak(dayOfWeek: number, streakCount: number): number[] {
  return DAYS.map((_, i) => (i < streakCount && i <= dayOfWeek ? 1 : 0));
}

function getDateLabel(): string {
  const now = new Date();
  const dayNames = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const monthNames = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  return `${dayNames[now.getDay()]} · ${now.getDate()} ${monthNames[now.getMonth()]}`;
}

export const HomeScreen = () => {
  const { t } = useTheme();
  const navigation = useNavigation<HomeNav>();
  const profile = useUserStore((s) => s.profile);
  const dailyKcalTarget = useFoodDiaryStore((s) => s.dailyKcalTarget);
  const hasCalorieTarget = useFoodDiaryStore((s) => s.hasCalorieTarget);
  const diaryDate = useFoodDiaryStore((s) => s.date);
  const diaryKcal = useFoodDiaryStore((s) => s.totals.kcal);
  const totals = useFoodDiaryStore((s) => s.totals);

  const [todayKcal, setTodayKcal] = useState(0);

  const displayName = profile?.name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Andrei';
  const initials = (profile?.name || displayName).split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'A';

  const calorieProgress = useMemo(() => {
    if (!hasCalorieTarget || !dailyKcalTarget) return 0;
    return Math.min(todayKcal / dailyKcalTarget, 1);
  }, [hasCalorieTarget, dailyKcalTarget, todayKcal]);

  const remaining = Math.max((dailyKcalTarget ?? 0) - todayKcal, 0);

  const proteinTarget = Math.round((profile?.weight_kg ?? 70) * 1.6);
  const carbsTarget = 250;
  const fatTarget = 67;
  const macroValues: [number, number, number] = [
    Math.min(totals.protein_g / proteinTarget, 1),
    Math.min(totals.carbs_g / carbsTarget, 1),
    Math.min(totals.fat_g / fatTarget, 1),
  ];

  const dayOfWeek = getDayOfWeek();
  const streakDots = buildStreak(dayOfWeek, 5);

  useFocusEffect(useCallback(() => {
    nutritionApi.getFoodLog(todayString()).then(({ data }) => {
      setTodayKcal(Math.round(data.totals.kcal));
    }).catch(() => {});
  }, []));

  useEffect(() => {
    if (diaryDate === todayString()) setTodayKcal(Math.round(diaryKcal));
  }, [diaryDate, diaryKcal]);

  const suggestions = [
    {
      icon: 'bowl' as const, title: 'Plate Coach', sub: 'Foto la prânzul de azi',
      cta: 'Scan', tint: t.accentSoft, iconColor: t.accent,
      onPress: () => navigation.navigate('PlateCoach', { date: todayString() }),
    },
    {
      icon: 'dumbbell' as const, title: 'Antrenament Push', sub: '45 min · piept, umeri, triceps',
      cta: 'Start', tint: t.primarySoft, iconColor: t.primary,
      onPress: () => navigation.navigate('Workout'),
    },
    {
      icon: 'leaf' as const, title: 'Cere sfat — Diet AI', sub: '"Ce mănânc pre-workout?"',
      cta: 'Chat', tint: t.surface2, iconColor: t.good,
      onPress: () => navigation.navigate('Chat', { agentType: 'diet' }),
    },
  ];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>{getDateLabel()}</Text>
            <Text style={[s.greeting, { fontFamily: SERIF, color: t.ink }]}>
              {'Bună,\n'}
              <Text style={{ fontStyle: 'italic', color: t.primary }}>{displayName}.</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
            <FpAvatar name={initials} size={42} tint={t.primarySoft}/>
          </TouchableOpacity>
        </View>

        {/* Hero ring card */}
        <View style={s.section}>
          <View style={[s.heroCard, { backgroundColor: t.surface2, borderColor: 'transparent' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              <ProgressRing
                size={146} stroke={12}
                value={calorieProgress}
                label={String(todayKcal)}
                sub="kcal"
                color={t.primary}
              />
              <View style={{ flex: 1, gap: 10 }}>
                <View>
                  <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>remaining</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={[s.heroNum, { fontFamily: SERIF, color: t.ink }]}>{remaining}</Text>
                    <Text style={[{ fontSize: 14, color: t.muted }]}>kcal</Text>
                  </View>
                </View>
                <View style={[s.divider, { backgroundColor: t.line }]}/>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FpIcon name="flame" size={14} color={t.accent}/>
                  <Text style={[{ fontSize: 12, color: t.ink2 }]}>
                    Goal · {dailyKcalTarget ?? 2000} kcal
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Streak card */}
        <View style={[s.section, { paddingTop: 0 }]}>
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FpIcon name="flame" size={16} color={t.accent}/>
                <Text style={[s.cardTitle, { color: t.ink }]}>5 zile la rând</Text>
              </View>
              <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>STREAK</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {DAYS.map((d, i) => (
                <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                  <View style={[s.streakDot, {
                    backgroundColor: streakDots[i] ? t.primary : t.lineSoft,
                    borderColor: streakDots[i] ? 'transparent' : t.line,
                  }]}/>
                  <Text style={[{ fontSize: 10, color: t.muted }]}>{d}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Macros card */}
        <View style={[s.section, { paddingTop: 0 }]}>
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TripleRing size={92} stroke={6} values={macroValues}/>
              <View style={{ flex: 1, gap: 10 }}>
                <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>MACROS TODAY</Text>
                <View style={{ gap: 8 }}>
                  {[
                    { label: 'Proteine', val: Math.round(totals.protein_g), target: proteinTarget, color: t.macroProtein },
                    { label: 'Carbohidrați', val: Math.round(totals.carbs_g), target: carbsTarget, color: t.macroCarbs },
                    { label: 'Grăsimi', val: Math.round(totals.fat_g), target: fatTarget, color: t.macroFat },
                  ].map(m => (
                    <View key={m.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: m.color }}/>
                      <Text style={[{ fontSize: 12, color: t.ink2, flex: 1 }]}>{m.label}</Text>
                      <Text style={[{ fontFamily: MONO, fontSize: 11, color: t.muted }]}>
                        {m.val} / {m.target}g
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Today suggestions */}
        <View style={[s.section, { paddingTop: 4 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[s.sectionTitle, { fontFamily: SERIF, color: t.ink }]}>Pentru azi</Text>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>3 sugestii</Text>
          </View>
          <View style={{ gap: 10 }}>
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.title}
                onPress={item.onPress}
                activeOpacity={0.8}
                style={[s.suggestionRow, { backgroundColor: t.surface, borderColor: t.line }]}
              >
                <View style={[s.suggIcon, { backgroundColor: item.tint }]}>
                  <FpIcon name={item.icon} size={20} color={item.iconColor}/>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[s.cardTitle, { color: t.ink }]}>{item.title}</Text>
                  <Text style={[{ fontSize: 12, color: t.muted }]}>{item.sub}</Text>
                </View>
                <View style={[s.ctaChip, { backgroundColor: t.ink }]}>
                  <Text style={[s.ctaChipText, { color: t.bg }]}>{item.cta}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 22, paddingBottom: 0,
  },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  greeting: { fontSize: 36, lineHeight: 40, letterSpacing: -0.8, marginTop: 6 },
  section: { paddingHorizontal: 22, paddingTop: 14 },
  heroCard: { borderRadius: 22, padding: 22, borderWidth: 1 },
  heroNum: { fontSize: 28, letterSpacing: -0.5, fontWeight: '700' },
  card: { borderRadius: 22, borderWidth: 1, padding: 18 },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1 },
  streakDot: { width: 14, height: 14, borderRadius: 4, borderWidth: 1 },
  sectionTitle: { fontSize: 22, letterSpacing: -0.3 },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 22, borderWidth: 1, padding: 14,
  },
  suggIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ctaChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  ctaChipText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
});