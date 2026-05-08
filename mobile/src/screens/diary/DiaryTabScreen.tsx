import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { MacroBar } from '@/components/ui/MacroBar';
import { useFoodDiaryStore, todayString } from '@/store/foodDiaryStore';
import type { FoodLogEntry } from '@/services/nutritionApi';
import { AppStackParamList } from '@/types/navigation';

const WATER_TARGET = 8;

const WaterCard = ({ date }: { date: string }) => {
  const { t } = useTheme();
  const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
  const logWater      = useFoodDiaryStore((s) => s.logWater);
  const getWaterGlasses = useFoodDiaryStore((s) => s.getWaterGlasses);
  const glasses = getWaterGlasses(date);
  return (
    <View style={[wt.card, { backgroundColor: t.surface, borderColor: t.line }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <FpIcon name="water" size={16} color={t.accent}/>
          <Text style={[{ fontSize: 14, fontWeight: '600', color: t.ink }]}>Apă</Text>
        </View>
        <Text style={[{ fontFamily: MONO, fontSize: 12, color: t.muted }]}>{(glasses * 0.25).toFixed(2)} / 2.0 L</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
        {Array.from({ length: WATER_TARGET }).map((_, i) => (
          <TouchableOpacity key={i} onPress={() => logWater(date, i < glasses ? -1 : 1)} activeOpacity={0.7}
            style={[wt.glass, { backgroundColor: i < glasses ? t.accent : t.surface2, borderColor: i < glasses ? 'transparent' : t.line }]}>
            <FpIcon name="water" size={13} color={i < glasses ? '#fff' : t.muted2}/>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity onPress={() => logWater(date, -1)} activeOpacity={0.7}
          style={[wt.btn, { borderColor: t.line, flex: 1 }]}>
          <Text style={[{ fontSize: 12, fontWeight: '600', color: t.ink }]}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => logWater(date, 1)} activeOpacity={0.85}
          style={[wt.btn, { backgroundColor: t.accent, borderColor: 'transparent', flex: 2 }]}>
          <FpIcon name="plus" size={12} color="#fff"/>
          <Text style={[{ fontSize: 12, fontWeight: '600', color: '#fff' }]}>+ pahar (250 ml)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const wt = StyleSheet.create({
  card: { borderRadius: 22, borderWidth: 1, padding: 18 },
  glass: { flex: 1, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
});

type NavProp = NativeStackNavigationProp<AppStackParamList>;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const addDays = (dateStr: string, delta: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDate = (dateStr: string): string => {
  const today = todayString();
  if (dateStr === today) return 'Today';
  if (dateStr === addDays(today, -1)) return 'Yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const MEALS = [
  { key: 'Breakfast', label: 'Breakfast', emoji: '☕' },
  { key: 'Lunch', label: 'Lunch', emoji: '🥗' },
  { key: 'Dinner', label: 'Dinner', emoji: '🍽️' },
  { key: 'Snack', label: 'Snack', emoji: '🍎' },
];

function groupByMeal(entries: FoodLogEntry[]): Record<string, FoodLogEntry[]> {
  const groups: Record<string, FoodLogEntry[]> = {};
  for (const e of entries) {
    const meal = e.meal_type || 'Snack';
    if (!groups[meal]) groups[meal] = [];
    groups[meal].push(e);
  }
  return groups;
}

export const DiaryTabScreen = () => {
  const { t } = useTheme();
  const navigation = useNavigation<NavProp>();

  const date = useFoodDiaryStore((s) => s.date);
  const setDate = useFoodDiaryStore((s) => s.setDate);
  const entries = useFoodDiaryStore((s) => s.entries);
  const totals = useFoodDiaryStore((s) => s.totals);
  const dailyKcalTarget = useFoodDiaryStore((s) => s.dailyKcalTarget);
  const hasCalorieTarget = useFoodDiaryStore((s) => s.hasCalorieTarget);
  const fetchDay = useFoodDiaryStore((s) => s.fetchDay);
  const deleteEntry = useFoodDiaryStore((s) => s.deleteEntry);
  const loading = useFoodDiaryStore((s) => s.loading);

  const [activeDay, setActiveDay] = useState(0);
  const dayTabs = [-2, -1, 0, 1, 2].map(d => addDays(todayString(), d));
  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

  const calorieProgress = hasCalorieTarget && dailyKcalTarget
    ? Math.min(totals.kcal / dailyKcalTarget, 1)
    : 0;

  useFocusEffect(useCallback(() => {
    void fetchDay(date);
  }, [date]));

  const groups = groupByMeal(entries);

  const handleDelete = (entry: FoodLogEntry) => {
    Alert.alert('Remove entry', `Remove "${entry.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void deleteEntry(entry.id) },
    ]);
  };

  const today = todayString();
  const yesterday = addDays(today, -1);
  const startDates = [
    addDays(today, -2), addDays(today, -1), today,
    addDays(today, 1), addDays(today, 2),
  ];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>JURNAL ALIMENTAR</Text>
          <Text style={[s.title, { fontFamily: SERIF, color: t.ink }]}>{formatDate(date)}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('AddFood', { date })} activeOpacity={0.7}>
          <FpIcon name="search" size={20} color={t.ink}/>
        </TouchableOpacity>
      </View>

      {/* Day selector */}
      <View style={s.daySelector}>
        <View style={[s.segControl, { backgroundColor: t.surface2, borderColor: t.line }]}>
          {startDates.map((d, i) => {
            const dayNum = new Date(d + 'T00:00:00').getDate();
            const dayLetter = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(new Date(d + 'T00:00:00').getDay() + 6) % 7];
            const isActive = d === date;
            return (
              <TouchableOpacity
                key={d} onPress={() => setDate(d)} activeOpacity={0.7}
                style={[s.dayBtn, isActive && { backgroundColor: t.ink }]}
              >
                <Text style={[s.dayBtnText, { color: isActive ? t.bg : t.muted }]}>
                  {d === today ? 'Thu' : dayLetter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Summary card */}
        <View style={s.section}>
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
              <ProgressRing
                size={120} stroke={11}
                value={calorieProgress}
                label={`${Math.round(calorieProgress * 100)}%`}
                sub="of goal"
                color={t.accent}
              />
              <View style={{ flex: 1, gap: 8 }}>
                <View>
                  <Text style={[s.bigNum, { fontFamily: SERIF, color: t.ink }]}>{Math.round(totals.kcal)}</Text>
                  <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>consumed</Text>
                </View>
                <View style={[s.divider, { backgroundColor: t.line }]}/>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ gap: 2 }}>
                    <Text style={[s.statNum, { fontFamily: MONO, color: t.ink2 }]}>{dailyKcalTarget ?? 2000}</Text>
                    <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 8 }]}>goal</Text>
                  </View>
                  <View style={{ gap: 2 }}>
                    <Text style={[s.statNum, { fontFamily: MONO, color: t.good }]}>
                      {Math.max((dailyKcalTarget ?? 2000) - Math.round(totals.kcal), 0)}
                    </Text>
                    <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 8 }]}>left</Text>
                  </View>
                </View>
              </View>
            </View>
            {/* Macro bars */}
            <View style={{ marginTop: 18, flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <MacroBar label="Protein" value={Math.round(totals.protein_g)} target={100} color={t.macroProtein}/>
              </View>
              <View style={{ flex: 1 }}>
                <MacroBar label="Carbs" value={Math.round(totals.carbs_g)} target={250} color={t.macroCarbs}/>
              </View>
              <View style={{ flex: 1 }}>
                <MacroBar label="Fat" value={Math.round(totals.fat_g)} target={67} color={t.macroFat}/>
              </View>
            </View>
          </View>
        </View>

        {/* Meal sections */}
        <View style={[s.section, { paddingTop: 8, gap: 14 }]}>
          {MEALS.map(meal => {
            const mealEntries = groups[meal.key] ?? [];
            const mealKcal = mealEntries.reduce((sum, e) => sum + e.kcal, 0);
            return (
              <View key={meal.key} style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: mealEntries.length > 0 ? 10 : 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 18 }}>{meal.emoji}</Text>
                    <Text style={[s.cardTitle, { color: t.ink }]}>{meal.label}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[{ fontFamily: MONO, fontSize: 13, color: t.ink2 }]}>{Math.round(mealKcal)}</Text>
                    <Text style={[{ fontSize: 11, color: t.muted }]}>kcal</Text>
                  </View>
                </View>
                {mealEntries.map((entry) => (
                  <View key={entry.id} style={[s.entryRow, { borderTopColor: t.lineSoft }]}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[s.entryName, { color: t.ink }]} numberOfLines={1}>{entry.name}</Text>
                      <Text style={[s.entrySub, { color: t.muted }]}>
                        {entry.grams}g · P {Math.round(entry.protein_g)}g · C {Math.round(entry.carbs_g)}g
                      </Text>
                    </View>
                    <Text style={[{ fontFamily: MONO, fontSize: 12, color: t.muted }]}>{Math.round(entry.kcal)}</Text>
                    <TouchableOpacity onPress={() => handleDelete(entry)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <FpIcon name="close" size={14} color={t.muted2}/>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })}

          {/* Water tracking */}
          <WaterCard date={date}/>

          {/* Action buttons */}
          <TouchableOpacity
            onPress={() => navigation.navigate('AddFood', { date })}
            activeOpacity={0.8}
            style={[s.ghostBtn, { borderColor: t.line }]}
          >
            <FpIcon name="plus" size={16} color={t.ink}/>
            <Text style={[s.ghostBtnText, { color: t.ink }]}>Adaugă masă</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('PlateCoach', { date })}
            activeOpacity={0.85}
            style={[s.accentBtn, { backgroundColor: t.accent }]}
          >
            <FpIcon name="camera" size={16} color={t.primaryInk}/>
            <Text style={[s.accentBtnText, { color: t.primaryInk }]}>Plate Coach — Scan farfurie</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 8, paddingBottom: 0,
  },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  title: { fontSize: 28, letterSpacing: -0.5, marginTop: 4 },
  daySelector: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 2 },
  segControl: {
    flexDirection: 'row', borderRadius: 999, padding: 3, gap: 2, borderWidth: 1,
  },
  dayBtn: { flex: 1, padding: 6, borderRadius: 999, alignItems: 'center' },
  dayBtnText: { fontSize: 11, fontWeight: '600' },
  section: { paddingHorizontal: 22, paddingTop: 14 },
  card: { borderRadius: 22, borderWidth: 1, padding: 18 },
  bigNum: { fontSize: 36, lineHeight: 36, letterSpacing: -1, fontWeight: '700' },
  divider: { height: 1, marginVertical: 4 },
  statNum: { fontSize: 13, fontWeight: '600' },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  entryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 10, marginTop: 4, borderTopWidth: 1,
  },
  entryName: { fontSize: 13 },
  entrySub: { fontSize: 11 },
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 18, borderWidth: 1,
  },
  ghostBtnText: { fontSize: 14, fontWeight: '500' },
  accentBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 18,
  },
  accentBtnText: { fontSize: 14, fontWeight: '600' },
});