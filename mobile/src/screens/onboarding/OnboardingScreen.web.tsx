import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon, type FpIconName } from '@/components/ui/FpIcon';
import { useUserStore } from '@/store/userStore';
import { AuthStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const SERIF = 'Georgia';
const MONO = 'monospace';

type Goal = 'lose' | 'maintain' | 'gain' | 'health';
type Sex  = 'male' | 'female' | 'other';
type Level = 'beginner' | 'intermediate' | 'advanced';

const GOALS: { k: Goal; title: string; sub: string; icon: FpIconName; flip?: boolean }[] = [
  { k: 'lose',     title: 'Slăbesc',    sub: 'Deficit calorificat moderat · -0.5 kg / săpt.', icon: 'arrow', flip: true },
  { k: 'maintain', title: 'Mențin',     sub: 'Echilibru caloric · păstrez forma actuală',       icon: 'check' },
  { k: 'gain',     title: 'Cresc masă', sub: 'Surplus moderat · accent pe proteine & forță',    icon: 'arrow' },
  { k: 'health',   title: 'Sănătate',   sub: 'Mai energic, somn mai bun, mai puțin stres',      icon: 'leaf'  },
];

const DIET_TAGS = ['vegetarian','vegan','gluten-free','lactose-free','low-sugar','keto','high-protein','mediterranean'];

const LEVELS: { k: Level; title: string; sub: string }[] = [
  { k: 'beginner',     title: 'Începător',    sub: '0–3 luni de antrenament' },
  { k: 'intermediate', title: 'Intermediar',  sub: '3–18 luni · cunosc bazele' },
  { k: 'advanced',     title: 'Avansat',      sub: '1.5+ ani · știu ce fac' },
];

export const OnboardingScreen = ({ navigation }: Props) => {
  const { t } = useTheme();
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [step, setStep] = useState(0);
  const [goal, setGoal]   = useState<Goal>('lose');
  const [sex, setSex]     = useState<Sex>('male');
  const [age, setAge]     = useState(28);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(75);
  const [diet, setDiet]   = useState<Set<string>>(new Set());
  const [level, setLevel] = useState<Level>('intermediate');

  const bmr = sex === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  const tdee = bmr * (level === 'beginner' ? 1.375 : level === 'intermediate' ? 1.55 : 1.725);
  const kcalTarget = Math.round(goal === 'lose' ? tdee * 0.85 : goal === 'gain' ? tdee * 1.1 : tdee);
  const proteinTarget = Math.round(weight * 1.6);
  const trainingFreq = level === 'beginner' ? '3×/spt' : level === 'intermediate' ? '4×/spt' : '5×/spt';

  const handleFinish = async () => {
    await updateProfile({
      goals: goal,
      fitness_level: level,
      age,
      height_cm: height,
      weight_kg: weight,
    });
    navigation.getParent()?.navigate('MainTabs' as any);
  };

  const toggleDiet = (tag: string) => {
    setDiet((prev) => {
      const n = new Set(prev);
      n.has(tag) ? n.delete(tag) : n.add(tag);
      return n;
    });
  };

  const Adj = ({ value, onDec, onInc, unit }: { value: number; onDec: () => void; onInc: () => void; unit: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <TouchableOpacity onPress={onDec} activeOpacity={0.7}
        style={[s.adjBtn, { backgroundColor: t.surface2, borderColor: t.line }]}>
        <Text style={[{ fontSize: 18, color: t.ink }]}>−</Text>
      </TouchableOpacity>
      <View style={[s.adjVal, { backgroundColor: t.surface, borderColor: t.line }]}>
        <Text style={[s.adjNum, { fontFamily: SERIF, color: t.ink }]}>{value}</Text>
        <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 9 }]}>{unit}</Text>
      </View>
      <TouchableOpacity onPress={onInc} activeOpacity={0.7}
        style={[s.adjBtn, { backgroundColor: t.surface2, borderColor: t.line }]}>
        <Text style={[{ fontSize: 18, color: t.ink }]}>+</Text>
      </TouchableOpacity>
    </View>
  );

  const stepLabels = ['Obiectiv', 'Date', 'Dietă', 'Nivel'];

  return (
    <ScrollView style={[s.root, { backgroundColor: t.bg }]} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.topBar}>
        <View style={s.brandMark}>
          <View style={[s.brandIcon, { backgroundColor: t.primary }]}>
            <FpIcon name="leaf" size={18} color={t.primaryInk}/>
          </View>
          <Text style={[s.brandName, { fontFamily: SERIF, color: t.ink }]}>FitPlus</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          {/* Progress bars */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {stepLabels.map((_, i) => (
              <View key={i} style={[s.progBar, {
                backgroundColor: i <= step ? t.primary : t.line,
                width: 28,
              }]}/>
            ))}
          </View>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>STEP {step + 1} / 4</Text>
          <TouchableOpacity onPress={() => void handleFinish()}
            style={[s.skipBtn, { borderColor: t.line }]}>
            <Text style={[{ fontSize: 12, color: t.muted, fontWeight: '500' }]}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card */}
      <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
        {/* Step 0: Goal */}
        {step === 0 && (
          <View style={{ gap: 0 }}>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>PASUL 1 · OBIECTIV</Text>
            <Text style={[s.stepTitle, { fontFamily: SERIF, color: t.ink }]}>
              {'Care e '}
              <Text style={{ fontStyle: 'italic', color: t.primary }}>obiectivul</Text>
              {' tău principal?'}
            </Text>
            <Text style={[{ fontSize: 14, color: t.muted, marginTop: 8 }]}>Poți schimba oricând în Profil.</Text>
            <View style={[s.goalGrid, { marginTop: 28 }]}>
              {GOALS.map((g) => {
                const on = goal === g.k;
                return (
                  <TouchableOpacity key={g.k} onPress={() => setGoal(g.k)} activeOpacity={0.8}
                    style={[s.goalCard, {
                      borderColor: on ? t.primary : t.line,
                      backgroundColor: on ? t.primarySoft : t.surface,
                    }]}>
                    <View style={[s.goalIcon, {
                      backgroundColor: on ? t.primary : t.surface2,
                      transform: g.flip ? [{ rotate: '180deg' }] : undefined,
                    }]}>
                      <FpIcon name={g.icon} size={18} color={on ? t.primaryInk : t.muted}/>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[s.goalTitle, { fontFamily: SERIF, color: t.ink }]}>{g.title}</Text>
                      <Text style={[{ fontSize: 12, color: t.muted, lineHeight: 18 }]}>{g.sub}</Text>
                    </View>
                    <View style={[s.radio, { borderColor: on ? t.primary : t.line }]}>
                      {on && <View style={[s.radioDot, { backgroundColor: t.primary }]}/>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 1: Stats */}
        {step === 1 && (
          <View style={{ gap: 0 }}>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>PASUL 2 · DATE</Text>
            <Text style={[s.stepTitle, { fontFamily: SERIF, color: t.ink }]}>
              {'Câteva '}
              <Text style={{ fontStyle: 'italic', color: t.primary }}>date</Text>
              {' despre tine.'}
            </Text>
            <Text style={[{ fontSize: 14, color: t.muted, marginTop: 8 }]}>Folosim doar pentru calcularea kcal & macro.</Text>
            <View style={{ marginTop: 28, gap: 20 }}>
              {/* Sex */}
              <View style={{ gap: 8 }}>
                <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 9 }]}>SEX</Text>
                <View style={[s.segControl, { backgroundColor: t.surface2, borderColor: t.line }]}>
                  {(['male', 'female', 'other'] as Sex[]).map((v, i) => {
                    const labels = ['Masculin', 'Feminin', 'Altceva'];
                    const on = sex === v;
                    return (
                      <TouchableOpacity key={v} onPress={() => setSex(v)} activeOpacity={0.7}
                        style={[s.segBtn, on && { backgroundColor: t.ink }]}>
                        <Text style={[s.segBtnText, { color: on ? t.bg : t.muted }]}>{labels[i]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              {/* Stats */}
              {[
                { label: 'Vârstă', unit: 'ani',  value: age,    onDec: () => setAge(a => Math.max(13, a - 1)),   onInc: () => setAge(a => Math.min(80, a + 1)) },
                { label: 'Înălțime', unit: 'cm', value: height, onDec: () => setHeight(h => Math.max(120, h - 1)), onInc: () => setHeight(h => Math.min(230, h + 1)) },
                { label: 'Greutate', unit: 'kg', value: weight, onDec: () => setWeight(w => Math.max(30, w - 1)),  onInc: () => setWeight(w => Math.min(200, w + 1)) },
              ].map((row) => (
                <View key={row.label} style={[s.statRow2, { backgroundColor: t.surface2, borderColor: t.line }]}>
                  <Text style={[{ fontSize: 13, color: t.muted, flex: 1 }]}>{row.label}</Text>
                  <Adj value={row.value} unit={row.unit} onDec={row.onDec} onInc={row.onInc}/>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Diet */}
        {step === 2 && (
          <View style={{ gap: 0 }}>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>PASUL 3 · DIETĂ</Text>
            <Text style={[s.stepTitle, { fontFamily: SERIF, color: t.ink }]}>
              {'Preferințe '}
              <Text style={{ fontStyle: 'italic', color: t.primary }}>alimentare</Text>?
            </Text>
            <Text style={[{ fontSize: 14, color: t.muted, marginTop: 8 }]}>Selectează tot ce se aplică.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
              {DIET_TAGS.map((tag) => {
                const on = diet.has(tag);
                return (
                  <TouchableOpacity key={tag} onPress={() => toggleDiet(tag)} activeOpacity={0.7}
                    style={[s.dietTag, {
                      backgroundColor: on ? t.primary : t.surface,
                      borderColor: on ? t.primary : t.line,
                    }]}>
                    <Text style={[{ fontSize: 13, fontWeight: '500', color: on ? t.primaryInk : t.ink2 }]}>
                      {on ? '✓ ' : ''}{tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[s.aiHint, { backgroundColor: t.surface2, marginTop: 24 }]}>
              <FpIcon name="spark" size={16} color={t.accent}/>
              <Text style={[{ fontSize: 12, color: t.muted, lineHeight: 18, flex: 1 }]}>
                AI-ul va sugera doar rețete care respectă aceste preferințe.
              </Text>
            </View>
          </View>
        )}

        {/* Step 3: Level */}
        {step === 3 && (
          <View style={{ gap: 0 }}>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>PASUL 4 · NIVEL</Text>
            <Text style={[s.stepTitle, { fontFamily: SERIF, color: t.ink }]}>
              {'Ce '}
              <Text style={{ fontStyle: 'italic', color: t.primary }}>nivel</Text>
              {' ai?'}
            </Text>
            <Text style={[{ fontSize: 14, color: t.muted, marginTop: 8 }]}>Adaptăm volumul și intensitatea.</Text>
            <View style={{ gap: 12, marginTop: 28 }}>
              {LEVELS.map((l) => {
                const on = level === l.k;
                return (
                  <TouchableOpacity key={l.k} onPress={() => setLevel(l.k)} activeOpacity={0.8}
                    style={[s.levelCard, {
                      borderColor: on ? t.primary : t.line,
                      backgroundColor: on ? t.primarySoft : t.surface,
                    }]}>
                    <View style={[s.goalIcon, { backgroundColor: on ? t.primary : t.surface2 }]}>
                      <FpIcon name="dumbbell" size={16} color={on ? t.primaryInk : t.muted}/>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[{ fontSize: 15, fontWeight: '600', color: t.ink }]}>{l.title}</Text>
                      <Text style={[{ fontSize: 12, color: t.muted }]}>{l.sub}</Text>
                    </View>
                    <View style={[s.radio, { borderColor: on ? t.primary : t.line }]}>
                      {on && <View style={[s.radioDot, { backgroundColor: t.primary }]}/>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Plan preview */}
            <View style={[s.planCard, { backgroundColor: t.primarySoft, borderColor: t.primary + '40', marginTop: 18 }]}>
              <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>PLANUL TĂU CALCULAT</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                {[
                  { val: kcalTarget.toString(), unit: 'kcal/zi' },
                  { val: `${proteinTarget}g`, unit: 'protein' },
                  { val: trainingFreq, unit: 'training' },
                ].map((item) => (
                  <View key={item.unit} style={{ alignItems: 'center', gap: 2 }}>
                    <Text style={[s.planNum, { fontFamily: SERIF, color: t.ink }]}>{item.val}</Text>
                    <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 9 }]}>{item.unit}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={[s.actions, { marginTop: 32 }]}>
          <TouchableOpacity
            onPress={() => step > 0 ? setStep(s => s - 1) : navigation.goBack()}
            activeOpacity={0.7}
            style={[s.backBtn, { borderColor: t.line }]}
          >
            <FpIcon name="left" size={14} color={t.ink}/>
            <Text style={[{ fontSize: 13, color: t.ink }]}>Înapoi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => step < 3 ? setStep(s => s + 1) : void handleFinish()}
            activeOpacity={0.85}
            style={[s.nextBtn, { backgroundColor: t.primary }]}
          >
            <Text style={[{ fontSize: 14, fontWeight: '600', color: t.primaryInk }]}>
              {step < 3 ? 'Continuă' : 'Hai să începem'}
            </Text>
            <FpIcon name="arrow" size={14} color={t.primaryInk}/>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 32 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  brandMark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 20, letterSpacing: -0.4 },
  progBar: { height: 4, borderRadius: 999 },
  skipBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  card: { borderRadius: 22, borderWidth: 1, padding: 40, maxWidth: 720, alignSelf: 'center' as any, width: '100%' as any },
  stepTitle: { fontSize: 38, letterSpacing: -0.8, lineHeight: 44, marginTop: 8 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  goalCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    padding: 20, borderRadius: 18, borderWidth: 1,
    width: '47%' as any,
  },
  goalIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  goalTitle: { fontSize: 20, letterSpacing: -0.3 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  segControl: { flexDirection: 'row', borderRadius: 999, padding: 3, gap: 2, borderWidth: 1 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  segBtnText: { fontSize: 13, fontWeight: '600' },
  statRow2: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  adjBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  adjVal: { alignItems: 'center', gap: 2, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  adjNum: { fontSize: 28, letterSpacing: -0.5, fontWeight: '700' },
  dietTag: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  aiHint: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 14 },
  levelCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1 },
  planCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  planNum: { fontSize: 22, letterSpacing: -0.4, fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999 },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
});
