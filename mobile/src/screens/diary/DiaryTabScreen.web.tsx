import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { MacroBar } from '@/components/ui/MacroBar';
import { useFoodDiaryStore, todayString } from '@/store/foodDiaryStore';
import type { FoodLogEntry } from '@/services/nutritionApi';
import { AppStackParamList } from '@/types/navigation';
import { useUserStore } from '@/store/userStore';

const recommendedWaterMl = (weightKg: number | undefined): number => {
  const w = weightKg ?? 70;
  return Math.round(Math.min(Math.max(w * 35, 1800), 4000));
};

type Nav = NativeStackNavigationProp<AppStackParamList>;

const SERIF = 'Georgia';
const MONO  = 'monospace';

const MEALS = [
  { key: 'Breakfast', label: 'Breakfast', emoji: '☕' },
  { key: 'Lunch',     label: 'Lunch',     emoji: '🥗' },
  { key: 'Snack',     label: 'Snack',     emoji: '🍎' },
  { key: 'Dinner',    label: 'Dinner',    emoji: '🌙' },
];

function groupByMeal(entries: FoodLogEntry[]): Record<string, FoodLogEntry[]> {
  const g: Record<string, FoodLogEntry[]> = {};
  for (const e of entries) {
    const m = e.meal_type || 'Snack';
    if (!g[m]) g[m] = [];
    g[m].push(e);
  }
  return g;
}

function formatDate(dateStr: string): string {
  const today = todayString();
  if (dateStr === today) return `Today · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export const DiaryTabScreen = () => {
  const { t } = useTheme();
  const navigation = useNavigation<Nav>();

  const date            = useFoodDiaryStore((s) => s.date);
  const setDate         = useFoodDiaryStore((s) => s.setDate);
  const entries         = useFoodDiaryStore((s) => s.entries);
  const totals          = useFoodDiaryStore((s) => s.totals);
  const dailyKcalTarget = useFoodDiaryStore((s) => s.dailyKcalTarget);
  const hasCalorieTarget= useFoodDiaryStore((s) => s.hasCalorieTarget);
  const fetchDay        = useFoodDiaryStore((s) => s.fetchDay);
  const fetchWaterMl    = useFoodDiaryStore((s) => s.fetchWaterMl);
  const deleteEntry     = useFoodDiaryStore((s) => s.deleteEntry);
  const getWaterMl      = useFoodDiaryStore((s) => s.getWaterMl);
  const setWaterMl      = useFoodDiaryStore((s) => s.setWaterMl);
  const bumpWaterMl     = useFoodDiaryStore((s) => s.bumpWaterMl);
  const profile         = useUserStore((s) => s.profile);

  const waterMl = getWaterMl(date);
  const [waterDraft, setWaterDraft] = useState(String(waterMl));

  useEffect(() => {
    setWaterDraft(String(waterMl));
  }, [date, waterMl]);

  const applyWaterDraft = () => {
    const n = parseInt(waterDraft.replace(/\D/g, ''), 10);
    if (Number.isNaN(n) || n < 0) {
      setWaterDraft(String(waterMl));
      return;
    }
    void setWaterMl(date, n);
  };

  const calorieProgress = hasCalorieTarget && dailyKcalTarget
    ? Math.min(totals.kcal / dailyKcalTarget, 1) : 0;

  useFocusEffect(useCallback(() => {
    void fetchDay(date);
    void fetchWaterMl(date);
  }, [date, fetchDay, fetchWaterMl]));

  const groups = groupByMeal(entries);

  const todayIso = todayString();
  const canGoForward = date < todayIso;

  const goYesterday = () => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
  };
  const goTomorrow = () => {
    if (!canGoForward) return;
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
  };
  const goToday = () => {
    setDate(todayIso);
  };

  const recWater = recommendedWaterMl(profile?.weight_kg);

  return (
    <ScrollView style={[s.root, { backgroundColor: t.bg }]} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ gap: 6 }}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>FOOD DIARY</Text>
          <Text style={[s.title, { fontFamily: SERIF, color: t.ink }]}>{formatDate(date)}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <TouchableOpacity onPress={goYesterday} activeOpacity={0.7}
            style={[s.ghostBtn, { borderColor: t.line }]}>
            <FpIcon name="left" size={14} color={t.ink}/>
            <Text style={[{ fontSize: 12, fontWeight: '500', color: t.ink }]}>Yesterday</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToday} activeOpacity={0.7}
            style={[s.ghostBtn, { borderColor: date === todayIso ? t.primary : t.line }]}>
            <Text style={[{ fontSize: 12, fontWeight: '600', color: date === todayIso ? t.primary : t.ink }]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goTomorrow} disabled={!canGoForward} activeOpacity={0.7}
            style={[s.ghostBtn, { borderColor: t.line, opacity: canGoForward ? 1 : 0.35 }]}>
            <Text style={[{ fontSize: 12, fontWeight: '500', color: t.ink }]}>Tomorrow</Text>
            <FpIcon name="right" size={14} color={t.ink}/>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AddFood', { date })} activeOpacity={0.85}
            style={[s.primaryBtn, { backgroundColor: t.primary }]}>
            <FpIcon name="plus" size={14} color={t.primaryInk}/>
            <Text style={[{ fontSize: 12, fontWeight: '600', color: t.primaryInk }]}>Add food</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('PlateCoach', { date })} activeOpacity={0.85}
            style={[s.accentBtn, { backgroundColor: t.accent }]}>
            <FpIcon name="camera" size={14} color="#fff"/>
            <Text style={[{ fontSize: 12, fontWeight: '600', color: '#fff' }]}>Plate Coach</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2-column layout */}
      <View style={s.columns}>
        {/* Left – summary */}
        <View style={{ gap: 16, width: 300 }}>
          {/* Calorie card */}
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
              <ProgressRing size={130} stroke={12} value={calorieProgress}
                label={`${Math.round(calorieProgress * 100)}%`} sub="of goal" color={t.accent}/>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[s.bigNum, { fontFamily: SERIF, color: t.ink }]}>
                  {Math.round(totals.kcal)}
                </Text>
                <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>
                  consumed of {dailyKcalTarget ?? 2000}
                </Text>
                <Text style={[{ fontSize: 12, color: t.good, fontWeight: '600', marginTop: 4 }]}>
                  + {Math.max((dailyKcalTarget ?? 2000) - Math.round(totals.kcal), 0)} kcal left
                </Text>
              </View>
            </View>
            <View style={[{ height: 1, backgroundColor: t.lineSoft, marginTop: 18, marginBottom: 18 }]}/>
            <View style={{ gap: 14 }}>
              <MacroBar label="Protein" value={Math.round(totals.protein_g)} target={100} color={t.macroProtein}/>
              <MacroBar label="Carbs"   value={Math.round(totals.carbs_g)}   target={250} color={t.macroCarbs}/>
              <MacroBar label="Fat"     value={Math.round(totals.fat_g)}     target={67}  color={t.macroFat}/>
            </View>
          </View>

          {/* Water card */}
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>apă · ziua selectată</Text>
              <FpIcon name="water" size={14} color={t.accent}/>
            </View>
            <Text style={[{ fontFamily: MONO, fontSize: 12, color: t.muted, marginBottom: 6 }]}>
              recomandat ~{recWater} ml (~{(recWater / 1000).toFixed(1)} L) · ai băut {waterMl} ml
            </Text>
            <TextInput
              value={waterDraft}
              onChangeText={setWaterDraft}
              onBlur={applyWaterDraft}
              onSubmitEditing={applyWaterDraft}
              keyboardType="number-pad"
              placeholder="Introdu total ml pentru această zi"
              placeholderTextColor={t.muted2}
              style={[s.waterInput, { color: t.ink, borderColor: t.line, backgroundColor: t.surface2 }]}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity onPress={() => void bumpWaterMl(date, -250)} activeOpacity={0.7}
                style={[s.ghostBtn, { borderColor: t.line, paddingVertical: 8, flex: 1 }]}>
                <Text style={[{ fontSize: 11, fontWeight: '600', color: t.ink }]}>−250 ml</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => void bumpWaterMl(date, 250)} activeOpacity={0.7}
                style={[s.ghostBtn, { borderColor: t.line, paddingVertical: 8, flex: 1 }]}>
                <Text style={[{ fontSize: 11, fontWeight: '600', color: t.ink }]}>+250 ml</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Right – meals */}
        <View style={{ flex: 1, gap: 12 }}>
          {MEALS.map((meal) => {
            const items = groups[meal.key] ?? [];
            const mealKcal = items.reduce((sum, e) => sum + e.kcal, 0);
            const empty = items.length === 0;
            return (
              <View key={meal.key} style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 18 }}>{meal.emoji}</Text>
                    <Text style={[s.mealTitle, { fontFamily: SERIF, color: t.ink }]}>{meal.label}</Text>
                    {!empty && (
                      <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 11, textTransform: 'none', letterSpacing: 0 }]}>
                        —
                      </Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    {!empty && <Text style={[{ fontFamily: MONO, fontSize: 14, color: t.ink }]}>{Math.round(mealKcal)}</Text>}
                    <Text style={[{ fontSize: 11, color: t.muted }]}>{empty ? 'no entries yet' : 'kcal'}</Text>
                  </View>
                </View>

                {!empty && (
                  <View style={{ marginTop: 12, gap: 0 }}>
                    {items.map((entry, idx) => (
                      <View key={entry.id} style={[s.entryRow, { borderTopColor: t.lineSoft, borderTopWidth: idx ? 1 : 0, paddingTop: idx ? 6 : 0 }]}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={[{ fontSize: 13, color: t.ink }]}>{entry.name}</Text>
                          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 10, textTransform: 'none', letterSpacing: 0 }]}>
                            P {Math.round(entry.protein_g)} · C {Math.round(entry.carbs_g)} · F {Math.round(entry.fat_g)}
                          </Text>
                        </View>
                        <Text style={[{ fontFamily: MONO, fontSize: 12, color: t.ink2 }]}>{Math.round(entry.kcal)} kcal</Text>
                        <TouchableOpacity onPress={() => void deleteEntry(entry.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <FpIcon name="close" size={14} color={t.muted2}/>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {empty && (
                  <View style={[s.emptyRow, { backgroundColor: t.surface2 }]}>
                    <Text style={[{ fontSize: 12, color: t.muted, flex: 1 }]}>
                      {meal.key === 'Dinner' ? 'Plan-uit: somon cu sparanghel · ~520 kcal' : `Add ${meal.label.toLowerCase()} items`}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('AddFood', { date })}
                      activeOpacity={0.7}
                      style={[s.ghostBtn, { borderColor: t.line, paddingHorizontal: 10, paddingVertical: 6 }]}
                    >
                      <Text style={[{ fontSize: 11, fontWeight: '500', color: t.ink }]}>Log meal</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 32, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  title: { fontSize: 40, letterSpacing: -0.8, lineHeight: 44 },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  accentBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  columns: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  card: { borderRadius: 22, borderWidth: 1, padding: 22 },
  bigNum: { fontSize: 36, fontWeight: '700', letterSpacing: -0.8, lineHeight: 38 },
  waterInput: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, outlineWidth: 0,
  } as Record<string, unknown>,
  mealTitle: { fontSize: 18, letterSpacing: -0.3 },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 6 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, padding: 14, borderRadius: 14 },
});
