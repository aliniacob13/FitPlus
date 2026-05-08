import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { AuthStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

type Goal = 'lose' | 'maintain' | 'gain' | 'health';
type Level = 'beginner' | 'intermediate' | 'advanced';

const GOALS: { k: Goal; title: string; sub: string; icon: any; flip?: boolean }[] = [
  { k: 'lose', title: 'Slăbesc', sub: 'Deficit caloric moderat', icon: 'arrow-up', flip: true },
  { k: 'maintain', title: 'Mențin', sub: 'Calorii echilibrate, formă bună', icon: 'check' },
  { k: 'gain', title: 'Cresc masă', sub: 'Surplus + protein focus', icon: 'arrow-up' },
  { k: 'health', title: 'Sănătate', sub: 'Mai energic, mai puțin stres', icon: 'leaf' },
];

const DIET_TAGS = [
  'vegetarian', 'vegan', 'gluten-free', 'lactose-free',
  'low-sugar', 'keto', 'high-protein', 'mediterranean',
];

const LEVELS: { k: Level; title: string; sub: string }[] = [
  { k: 'beginner', title: 'Începător', sub: '0–3 luni de antrenament' },
  { k: 'intermediate', title: 'Intermediar', sub: '3–18 luni · cunosc bazele' },
  { k: 'advanced', title: 'Avansat', sub: '1.5+ ani · știu ce fac' },
];

function calcKcal(weightKg: number, heightCm: number, age: number, goal: Goal): number {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const tdee = bmr * 1.55;
  if (goal === 'lose') return Math.round(tdee * 0.85);
  if (goal === 'gain') return Math.round(tdee * 1.1);
  return Math.round(tdee);
}

export const OnboardingScreen = ({ navigation }: Props) => {
  const { t } = useTheme();
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>('lose');
  const [sex, setSex] = useState(0);
  const [age, setAge] = useState(28);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(75);
  const [diet, setDiet] = useState<Set<string>>(new Set());
  const [level, setLevel] = useState<Level>('intermediate');

  const kcal = calcKcal(weight, height, age, goal);
  const protein = Math.round(weight * 1.6);

  const toggleDiet = (tag: string) =>
    setDiet(prev => { const n = new Set(prev); n.has(tag) ? n.delete(tag) : n.add(tag); return n; });

  const handleFinish = async () => {
    await updateProfile({
      fitness_level: level,
      goals: goal,
      weight_kg: weight,
      height_cm: height,
      age,
    });
    useAuthStore.getState().setAccessToken(useAuthStore.getState().accessToken!);
    navigation.getParent()?.navigate('MainTabs' as any);
  };

  const Card = ({ children, selected, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[s.card, {
        backgroundColor: selected ? t.primarySoft : t.surface,
        borderColor: selected ? t.primary : t.line,
      }]}
    >
      {children}
    </TouchableOpacity>
  );

  const Radio = ({ on }: { on: boolean }) => (
    <View style={[s.radio, { borderColor: on ? t.primary : t.line }]}>
      {on && <View style={[s.radioDot, { backgroundColor: t.primary }]}/>}
    </View>
  );

  const StepGoal = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={[s.stepTitle, { fontFamily: SERIF, color: t.ink }]}>
        {'Care e '}
        <Text style={{ fontStyle: 'italic', color: t.primary }}>obiectivul</Text>
        {' tău?'}
      </Text>
      <Text style={[s.stepSub, { color: t.muted }]}>Poți schimba oricând în Profil.</Text>
      <View style={{ gap: 10, marginTop: 18 }}>
        {GOALS.map(g => (
          <Card key={g.k} selected={goal === g.k} onPress={() => setGoal(g.k)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }}>
              <View style={[s.goalIcon, {
                backgroundColor: goal === g.k ? t.primary : t.surface2,
                transform: g.flip ? [{ rotate: '180deg' }] : [],
              }]}>
                <FpIcon name={g.icon} size={16} color={goal === g.k ? t.primaryInk : t.muted}/>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[s.goalTitle, { color: t.ink }]}>{g.title}</Text>
                <Text style={[s.goalSub, { color: t.muted }]}>{g.sub}</Text>
              </View>
              <Radio on={goal === g.k}/>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );

  const StepStats = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={[s.stepTitle, { fontFamily: SERIF, color: t.ink }]}>
        {'Câteva '}
        <Text style={{ fontStyle: 'italic', color: t.primary }}>date</Text>
        {' despre tine.'}
      </Text>
      <Text style={[s.stepSub, { color: t.muted }]}>Folosim doar pentru calcularea kcal & macro.</Text>
      <View style={{ gap: 18, marginTop: 22 }}>
        {/* Sex */}
        <View style={{ gap: 8 }}>
          <Text style={[s.label, { color: t.muted, fontFamily: MONO }]}>SEX</Text>
          <View style={[s.segControl, { backgroundColor: t.surface2, borderColor: t.line }]}>
            {['Masculin', 'Feminin', 'Altceva'].map((opt, i) => (
              <TouchableOpacity
                key={opt} onPress={() => setSex(i)} activeOpacity={0.7}
                style={[s.segBtn, sex === i && { backgroundColor: t.ink }]}
              >
                <Text style={[s.segBtnText, { color: sex === i ? t.bg : t.muted }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Numeric stats */}
        {[
          { label: 'VÂRSTĂ', unit: 'ani', value: age, min: 13, max: 80, set: setAge },
          { label: 'ÎNĂLȚIME', unit: 'cm', value: height, min: 120, max: 230, set: setHeight },
          { label: 'GREUTATE', unit: 'kg', value: weight, min: 30, max: 200, set: setWeight },
        ].map(item => (
          <View key={item.label} style={[s.bigStatCard, { backgroundColor: t.surface, borderColor: t.line }]}>
            <Text style={[s.bigStatLabel, { color: t.muted }]}>{item.label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => item.set(v => Math.max(item.min, v - 1))}
                style={[s.adjBtn, { backgroundColor: t.surface2, borderColor: t.line }]}
              >
                <Text style={[{ color: t.ink, fontSize: 18, fontWeight: '300' }]}>−</Text>
              </TouchableOpacity>
              <View style={{ alignItems: 'center', minWidth: 70 }}>
                <Text style={[s.bigStatVal, { fontFamily: SERIF, color: t.ink }]}>{item.value}</Text>
                <Text style={[s.bigStatUnit, { color: t.muted, fontFamily: MONO }]}>{item.unit}</Text>
              </View>
              <TouchableOpacity
                onPress={() => item.set(v => Math.min(item.max, v + 1))}
                style={[s.adjBtn, { backgroundColor: t.surface2, borderColor: t.line }]}
              >
                <Text style={[{ color: t.ink, fontSize: 18, fontWeight: '300' }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const StepDiet = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={[s.stepTitle, { fontFamily: SERIF, color: t.ink }]}>
        {'Preferințe '}
        <Text style={{ fontStyle: 'italic', color: t.primary }}>alimentare</Text>
        {'?'}
      </Text>
      <Text style={[s.stepSub, { color: t.muted }]}>Selectează tot ce se aplică.</Text>
      <View style={s.tagWrap}>
        {DIET_TAGS.map(tag => {
          const on = diet.has(tag);
          return (
            <TouchableOpacity
              key={tag} onPress={() => toggleDiet(tag)} activeOpacity={0.8}
              style={[s.tag, {
                backgroundColor: on ? t.primary : t.surface,
                borderColor: on ? t.primary : t.line,
              }]}
            >
              <Text style={[s.tagText, { color: on ? t.primaryInk : t.ink2 }]}>
                {on ? '✓ ' : ''}{tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={[s.aiHint, { backgroundColor: t.surface2, borderColor: t.line }]}>
        <FpIcon name="spark" size={16} color={t.accent}/>
        <Text style={[s.aiHintText, { color: t.muted }]}>
          AI-ul va sugera doar rețete care respectă aceste preferințe.
        </Text>
      </View>
    </ScrollView>
  );

  const StepLevel = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={[s.stepTitle, { fontFamily: SERIF, color: t.ink }]}>
        {'Ce '}
        <Text style={{ fontStyle: 'italic', color: t.primary }}>nivel</Text>
        {' ai?'}
      </Text>
      <Text style={[s.stepSub, { color: t.muted }]}>Adaptăm volumul și intensitatea.</Text>
      <View style={{ gap: 10, marginTop: 22 }}>
        {LEVELS.map(l => (
          <Card key={l.k} selected={level === l.k} onPress={() => setLevel(l.k)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
              <View style={[s.goalIcon, { backgroundColor: level === l.k ? t.primary : t.surface2 }]}>
                <FpIcon name="dumbbell" size={16} color={level === l.k ? t.primaryInk : t.muted}/>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[s.goalTitle, { color: t.ink }]}>{l.title}</Text>
                <Text style={[s.goalSub, { color: t.muted }]}>{l.sub}</Text>
              </View>
              <Radio on={level === l.k}/>
            </View>
          </Card>
        ))}
      </View>

      {/* Calculated plan preview */}
      <View style={[s.planCard, { backgroundColor: t.primarySoft, borderColor: 'transparent' }]}>
        <Text style={[s.label, { color: t.muted, fontFamily: MONO }]}>PLANUL TĂU CALCULAT</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          {[
            { val: String(kcal), unit: 'kcal/zi' },
            { val: `${protein}g`, unit: 'proteină' },
            { val: '4×/spt', unit: 'training' },
          ].map(item => (
            <View key={item.unit} style={{ alignItems: 'center', gap: 2 }}>
              <Text style={[s.planVal, { fontFamily: SERIF, color: t.ink }]}>{item.val}</Text>
              <Text style={[s.label, { color: t.muted, fontFamily: MONO }]}>{item.unit}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const steps = [StepGoal, StepStats, StepDiet, StepLevel];
  const STEP_LABELS = ['OBIECTIV', 'DATE', 'DIETĂ', 'NIVEL'];
  const StepContent = steps[step];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, padding: 24, paddingBottom: 20 }}>
          {/* Top nav */}
          <View style={s.topRow}>
            <TouchableOpacity
              onPress={() => step === 0 ? navigation.navigate('Register') : setStep(s => s - 1)}
              activeOpacity={0.7}
            >
              <FpIcon name="left" size={22} color={t.ink}/>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[s.skipBtn, { color: t.muted }]}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Progress dots */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 22 }}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[s.progDot, { backgroundColor: i <= step ? t.primary : t.line }]}/>
            ))}
          </View>

          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, marginTop: 18 }]}>
            STEP {step + 1} / 4 · {STEP_LABELS[step]}
          </Text>

          {/* Step content */}
          <View style={{ flex: 1, marginTop: 8 }}>
            <StepContent/>
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={() => step < 3 ? setStep(s => s + 1) : handleFinish()}
            activeOpacity={0.85}
            style={[s.btnPrimary, { backgroundColor: t.primary }]}
          >
            <Text style={[s.btnText, { color: t.primaryInk }]}>
              {step < 3 ? 'Continuă' : 'Hai să începem'}
            </Text>
            <FpIcon name="arrow" size={14} color={t.primaryInk}/>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipBtn: { fontSize: 12, fontWeight: '500' },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  progDot: { flex: 1, height: 4, borderRadius: 999 },
  stepTitle: { fontSize: 28, lineHeight: 33, letterSpacing: -0.5 },
  stepSub: { fontSize: 13, marginTop: 6 },
  label: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },

  card: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  goalIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goalTitle: { fontSize: 14, fontWeight: '600' },
  goalSub: { fontSize: 12 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },

  segControl: {
    flexDirection: 'row', borderRadius: 999, padding: 3, gap: 2, borderWidth: 1,
  },
  segBtn: { flex: 1, padding: 7, borderRadius: 999, alignItems: 'center' },
  segBtnText: { fontSize: 12, fontWeight: '500' },

  bigStatCard: {
    borderRadius: 14, borderWidth: 1, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  bigStatLabel: { fontSize: 13 },
  bigStatVal: { fontSize: 26, letterSpacing: -0.5, fontWeight: '700' },
  bigStatUnit: { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 },
  adjBtn: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22 },
  tag: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  tagText: { fontSize: 13, fontWeight: '500' },
  aiHint: {
    flexDirection: 'row', gap: 10, marginTop: 20,
    borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'flex-start',
  },
  aiHintText: { flex: 1, fontSize: 12, lineHeight: 18 },

  planCard: { marginTop: 18, borderRadius: 16, padding: 16, borderWidth: 1 },
  planVal: { fontSize: 22, letterSpacing: -0.5, fontWeight: '700' },

  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16, borderRadius: 999,
  },
  btnText: { fontSize: 15, fontWeight: '600' },
});