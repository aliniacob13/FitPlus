import React, { useState } from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { MacroBar } from '@/components/ui/MacroBar';
import {
  type ActivityLevel, type Goal, type NutritionTargetResponse, type Sex,
  nutritionApi,
} from '@/services/nutritionApi';
import { useFoodDiaryStore } from '@/store/foodDiaryStore';
import { useUserStore } from '@/store/userStore';
import { AppStackParamList } from '@/types/navigation';
import { formatApiError } from '@/utils/apiErrors';

type NavProp = NativeStackNavigationProp<AppStackParamList, 'CalorieTarget'>;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO  = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const SEX_OPTIONS:      { value: Sex;           label: string }[] = [{ value: 'male', label: 'Bărbat' }, { value: 'female', label: 'Femeie' }];
const GOAL_OPTIONS:     { value: Goal;          label: string; sub: string }[] = [
  { value: 'lose',     label: 'Slăbire',    sub: 'Deficit caloric' },
  { value: 'maintain', label: 'Menținere',  sub: 'Echilibru caloric' },
  { value: 'gain',     label: 'Creștere',   sub: 'Surplus caloric' },
];
const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; sub: string }[] = [
  { value: 'sedentary',         label: 'Sedentar',     sub: 'Fără sport' },
  { value: 'lightly_active',    label: 'Ușor activ',   sub: '1–3 zile/săpt.' },
  { value: 'moderately_active', label: 'Moderat activ',sub: '3–5 zile/săpt.' },
  { value: 'very_active',       label: 'Foarte activ', sub: '6–7 zile/săpt.' },
  { value: 'extra_active',      label: 'Extrem activ', sub: 'Atlet / muncă fizică' },
];

export const CalorieTargetScreen = () => {
  const { t } = useTheme();
  const navigation = useNavigation<NavProp>();
  const profile    = useUserStore((s) => s.profile);
  const setDailyKcalTarget = useFoodDiaryStore((s) => s.setDailyKcalTarget);

  const [sex,           setSex]           = useState<Sex | null>(null);
  const [age,           setAge]           = useState(profile?.age?.toString() ?? '');
  const [weightKg,      setWeightKg]      = useState(profile?.weight_kg?.toString() ?? '');
  const [heightCm,      setHeightCm]      = useState(profile?.height_cm?.toString() ?? '');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [goal,          setGoal]          = useState<Goal | null>(null);
  const [weeklyRate,    setWeeklyRate]    = useState('');
  const [result,        setResult]        = useState<NutritionTargetResponse | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const isFormValid = sex !== null && age.trim() !== '' && weightKg.trim() !== '' &&
    heightCm.trim() !== '' && activityLevel !== null && goal !== null;

  const handleCompute = async () => {
    if (!isFormValid || !sex || !activityLevel || !goal) return;
    setError(null); setLoading(true);
    try {
      const { data } = await nutritionApi.computeTargets({
        sex, age: Number(age), weight_kg: Number(weightKg), height_cm: Number(heightCm),
        activity_level: activityLevel, goal,
        weekly_rate_kg: weeklyRate.trim() ? Number(weeklyRate) : undefined,
      });
      setResult(data);
      setDailyKcalTarget(data.target_calories);
    } catch (err) {
      setError(formatApiError(err, 'Nu am putut calcula ținta.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: t.lineSoft }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={s.backBtn}>
          <FpIcon name="left" size={20} color={t.ink}/>
        </TouchableOpacity>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>NUTRIȚIE</Text>
          <Text style={[s.headerTitle, { fontFamily: SERIF, color: t.ink }]}>Calculator calorii</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[{ fontSize: 13, color: t.muted }]}>
          Calculează ținta zilnică de calorii bazată pe ecuația Mifflin–St Jeor și obiectivul tău.
        </Text>

        {/* Sex */}
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
          <Text style={[s.sectionLabel, { color: t.muted, fontFamily: MONO }]}>SEX</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {SEX_OPTIONS.map((opt) => {
              const active = sex === opt.value;
              return (
                <TouchableOpacity key={opt.value} onPress={() => setSex(opt.value)} activeOpacity={0.7}
                  style={[s.chip, { flex: 1, backgroundColor: active ? t.ink : t.surface2, borderColor: active ? 'transparent' : t.line }]}>
                  <Text style={[{ fontSize: 13, fontWeight: '600', color: active ? t.bg : t.muted }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Body stats */}
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
          <Text style={[s.sectionLabel, { color: t.muted, fontFamily: MONO }]}>DATE CORPORALE</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {[
              { label: 'VÂRSTĂ', value: age, set: setAge, ph: '24' },
              { label: 'GREUTATE (KG)', value: weightKg, set: setWeightKg, ph: '65' },
              { label: 'ÎNĂLȚIME (CM)', value: heightCm, set: setHeightCm, ph: '170' },
            ].map((f) => (
              <View key={f.label} style={{ flex: 1, gap: 4 }}>
                <Text style={[s.fieldLabel, { color: t.muted, fontFamily: MONO }]}>{f.label}</Text>
                <TextInput
                  value={f.value} onChangeText={f.set}
                  placeholder={f.ph} keyboardType="numeric"
                  style={[s.field, { color: t.ink, backgroundColor: t.surface2, borderColor: t.line }]}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Activity */}
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
          <Text style={[s.sectionLabel, { color: t.muted, fontFamily: MONO }]}>NIVEL DE ACTIVITATE</Text>
          <View style={{ gap: 8, marginTop: 10 }}>
            {ACTIVITY_OPTIONS.map((opt) => {
              const active = activityLevel === opt.value;
              return (
                <TouchableOpacity key={opt.value} onPress={() => setActivityLevel(opt.value)} activeOpacity={0.7}
                  style={[s.activityChip, { backgroundColor: active ? t.ink : t.surface2, borderColor: active ? 'transparent' : t.line }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 13, fontWeight: '600', color: active ? t.bg : t.ink }]}>{opt.label}</Text>
                    <Text style={[{ fontSize: 11, color: active ? t.bg + 'cc' : t.muted, marginTop: 2 }]}>{opt.sub}</Text>
                  </View>
                  {active && <FpIcon name="check" size={16} color={t.bg}/>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Goal */}
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
          <Text style={[s.sectionLabel, { color: t.muted, fontFamily: MONO }]}>OBIECTIV</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {GOAL_OPTIONS.map((opt) => {
              const active = goal === opt.value;
              return (
                <TouchableOpacity key={opt.value} onPress={() => setGoal(opt.value)} activeOpacity={0.7}
                  style={[s.chip, { flex: 1, backgroundColor: active ? t.primary : t.surface2, borderColor: active ? 'transparent' : t.line }]}>
                  <Text style={[{ fontSize: 12, fontWeight: '700', color: active ? t.primaryInk : t.ink }]}>{opt.label}</Text>
                  <Text style={[{ fontSize: 10, color: active ? t.primaryInk + 'cc' : t.muted, marginTop: 2 }]}>{opt.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {(goal === 'lose' || goal === 'gain') ? (
            <View style={{ marginTop: 14, gap: 6 }}>
              <Text style={[s.fieldLabel, { color: t.muted, fontFamily: MONO }]}>
                {goal === 'lose' ? 'KG DE SLĂBIT/SĂPTĂMÂNĂ (OPT.)' : 'KG DE CÂȘTIGAT/SĂPTĂMÂNĂ (OPT.)'}
              </Text>
              <TextInput
                value={weeklyRate} onChangeText={setWeeklyRate}
                placeholder="ex: 0.5" keyboardType="numeric"
                style={[s.field, { color: t.ink, backgroundColor: t.surface2, borderColor: t.line }]}
              />
              <Text style={[{ fontSize: 11, color: t.muted }]}>
                {goal === 'lose' ? '0.25–0.75 kg/săpt. este sustenabil.' : '0.25–0.5 kg/săpt. este sustenabil.'}
              </Text>
            </View>
          ) : null}
        </View>

        {error ? (
          <View style={[s.errorBanner, { backgroundColor: t.bad + '18', borderColor: t.bad + '40' }]}>
            <Text style={[{ fontSize: 13, color: t.bad }]}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={() => void handleCompute()}
          disabled={loading || !isFormValid}
          activeOpacity={0.85}
          style={[s.calcBtn, { backgroundColor: t.primary, opacity: !isFormValid || loading ? 0.5 : 1 }]}
        >
          {loading
            ? <ActivityIndicator color={t.primaryInk} size="small"/>
            : <>
                <FpIcon name="spark" size={16} color={t.primaryInk}/>
                <Text style={[{ fontSize: 15, fontWeight: '700', color: t.primaryInk }]}>Calculează</Text>
              </>
          }
        </TouchableOpacity>

        {result ? (
          <>
            {/* BMR / TDEE */}
            <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
              <Text style={[s.sectionLabel, { color: t.muted, fontFamily: MONO }]}>REZULTATE</Text>
              {[
                { label: 'BMR (metabolism bazal)', val: result.bmr,  unit: 'kcal/zi' },
                { label: 'TDEE (cu activitate)',   val: result.tdee, unit: 'kcal/zi' },
              ].map((row, i) => (
                <View key={row.label}>
                  {i > 0 && <View style={[{ height: 1, backgroundColor: t.lineSoft, marginVertical: 10 }]}/>}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: i === 0 ? 12 : 0 }}>
                    <Text style={[{ fontSize: 13, color: t.ink2, flex: 1 }]}>{row.label}</Text>
                    <Text style={[{ fontSize: 15, fontWeight: '700', color: t.ink, fontFamily: MONO }]}>{row.val} {row.unit}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Target card */}
            <View style={[s.targetCard, { backgroundColor: t.primarySoft, borderColor: t.primary + '40' }]}>
              <Text style={[s.eyebrow, { color: t.primary, fontFamily: MONO }]}>ȚINTA TA ZILNICĂ</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                <Text style={[{ fontSize: 52, fontWeight: '800', color: t.primary, fontFamily: SERIF, letterSpacing: -1 }]}>
                  {result.target_calories}
                </Text>
                <Text style={[{ fontSize: 18, color: t.primary, fontWeight: '600' }]}>kcal/zi</Text>
              </View>
              <Text style={[{ fontSize: 12, color: t.primary, marginTop: 6, opacity: 0.75 }]}>
                Salvat automat în jurnalul alimentar ✓
              </Text>
            </View>

            {/* Macros */}
            <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
              <Text style={[s.sectionLabel, { color: t.muted, fontFamily: MONO }]}>MACRONUTRIENȚI SUGERAȚI</Text>
              <View style={{ gap: 14, marginTop: 14 }}>
                <MacroBar label="Proteine" value={result.macros_suggestion.protein_g} target={result.macros_suggestion.protein_g} color={t.macroProtein}/>
                <MacroBar label="Glucide"  value={result.macros_suggestion.carbs_g}   target={result.macros_suggestion.carbs_g}   color={t.macroCarbs}/>
                <MacroBar label="Grăsimi" value={result.macros_suggestion.fat_g}     target={result.macros_suggestion.fat_g}     color={t.macroFat}/>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 18 }}>
                {[
                  { label: 'Proteine', val: result.macros_suggestion.protein_g, color: t.macroProtein },
                  { label: 'Glucide',  val: result.macros_suggestion.carbs_g,   color: t.macroCarbs },
                  { label: 'Grăsimi', val: result.macros_suggestion.fat_g,     color: t.macroFat },
                ].map((m) => (
                  <View key={m.label} style={{ alignItems: 'center' }}>
                    <Text style={[{ fontSize: 22, fontWeight: '800', color: m.color, fontFamily: MONO }]}>{m.val}g</Text>
                    <Text style={[{ fontSize: 10, color: t.muted, marginTop: 2 }]}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={[{ fontSize: 11, color: t.muted, textAlign: 'center', lineHeight: 16, paddingHorizontal: 10 }]}>
              Acestea sunt estimări și nu constituie sfat medical. Consultați un specialist înainte de a face modificări semnificative ale dietei.
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('FoodDiary')}
              activeOpacity={0.85}
              style={[s.ghostBtn, { borderColor: t.line }]}
            >
              <FpIcon name="bowl" size={16} color={t.ink}/>
              <Text style={[{ fontSize: 14, fontWeight: '600', color: t.ink }]}>Deschide jurnalul alimentar</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1,
  },
  backBtn:      { padding: 4 },
  eyebrow:      { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  headerTitle:  { fontSize: 26, letterSpacing: -0.5, lineHeight: 30 },
  content:      { padding: 20, gap: 14, paddingBottom: 80 },
  card:         { borderRadius: 20, borderWidth: 1, padding: 18 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  fieldLabel:   { fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: '500' },
  field: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, outlineWidth: 0,
  } as any,
  chip: { paddingVertical: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 2 },
  activityChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1,
  },
  calcBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 18,
  },
  errorBanner: { borderWidth: 1, borderRadius: 12, padding: 12 },
  targetCard: { borderRadius: 20, borderWidth: 1, padding: 22 },
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 18, borderWidth: 1,
  },
});
