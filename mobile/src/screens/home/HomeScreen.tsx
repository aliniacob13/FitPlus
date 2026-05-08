import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Modal, TextInput, View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
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
import { userApi } from '@/services/userApi';
import { todayString, useFoodDiaryStore } from '@/store/foodDiaryStore';
import { useUserStore } from '@/store/userStore';
import { AppStackParamList, MainTabParamList } from '@/types/navigation';
import { useActivityStore, ActivityType, activityTypeLabel, estimateCalories } from '@/store/activityStore';

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

const ACTIVITY_TYPES: ActivityType[] = ['walking', 'running', 'cycling', 'gym', 'swimming', 'yoga', 'other'];

export const HomeScreen = () => {
  const { t } = useTheme();
  const navigation = useNavigation<HomeNav>();
  const profile = useUserStore((s) => s.profile);
  const fetchMe = useUserStore((s) => s.fetchMe);
  const dailyKcalTarget = useFoodDiaryStore((s) => s.dailyKcalTarget);
  const hasCalorieTarget = useFoodDiaryStore((s) => s.hasCalorieTarget);
  const diaryDate = useFoodDiaryStore((s) => s.date);
  const diaryKcal = useFoodDiaryStore((s) => s.totals.kcal);
  const totals = useFoodDiaryStore((s) => s.totals);
  const logWeight        = useFoodDiaryStore((s) => s.logWeight);
  const hydrateWeightLogsFromServer = useFoodDiaryStore((s) => s.hydrateWeightLogsFromServer);
  const getLatestWeight  = useFoodDiaryStore((s) => s.getLatestWeight);
  const weightLog        = useFoodDiaryStore((s) => s.weightLog);
  const fetchActivities  = useActivityStore((s) => s.fetchActivities);
  const addActivity      = useActivityStore((s) => s.addActivity);
  const getEntriesForDate= useActivityStore((s) => s.getEntriesForDate);
  const burnedToday = useActivityStore((s) =>
    s.entries
      .filter((e) => e.date === todayString())
      .reduce((sum, e) => sum + (e.calories_burned ?? 0), 0),
  );
  const todayActivities  = getEntriesForDate(todayString());

  const [todayKcal, setTodayKcal] = useState(0);

  const [showWeightModal,   setShowWeightModal]   = useState(false);
  const [weightInput,       setWeightInput]       = useState(
    (profile?.weight_kg ?? getLatestWeight() ?? '')?.toString(),
  );

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [actType,           setActType]           = useState<ActivityType>('gym');
  const [actDuration,       setActDuration]       = useState('');
  const [actDistance,       setActDistance]       = useState('');
  const [actNotes,          setActNotes]          = useState('');

  const displayName = profile?.name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Andrei';
  const initials = (profile?.name || displayName).split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'A';

  const baseTarget = dailyKcalTarget ?? 2000;
  const effectiveTarget = baseTarget + burnedToday;

  const calorieProgress = useMemo(() => {
    if (!hasCalorieTarget || !dailyKcalTarget) return 0;
    if (effectiveTarget <= 0) return 0;
    return Math.min(todayKcal / effectiveTarget, 1);
  }, [hasCalorieTarget, dailyKcalTarget, todayKcal, effectiveTarget]);

  const remaining = Math.max(effectiveTarget - todayKcal, 0);

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
    void fetchActivities();
  }, [fetchActivities]));

  useEffect(() => {
    if (diaryDate === todayString()) setTodayKcal(Math.round(diaryKcal));
  }, [diaryDate, diaryKcal]);

  const handleLogWeight = async () => {
    const kg = parseFloat(weightInput);
    if (isNaN(kg) || kg <= 0) {
      Alert.alert('Valoare invalidă', 'Introdu o greutate validă în kg.');
      return;
    }
    try {
      await userApi.postWeightLog({ weight_kg: kg });
      logWeight(kg);
      await fetchMe();
      await hydrateWeightLogsFromServer();
      setShowWeightModal(false);
    } catch {
      Alert.alert('Eroare', 'Nu am putut salva greutatea pe server.');
    }
  };

  const handleLogActivity = async () => {
    const dur = parseInt(actDuration, 10);
    if (!dur || dur <= 0) { Alert.alert('Durată invalidă', 'Introdu durata în minute.'); return; }
    const ok = await addActivity({
      date: todayString(), type: actType,
      title: activityTypeLabel(actType),
      duration_min: dur,
      distance_km: actDistance.trim() ? parseFloat(actDistance) : undefined,
      calories_burned: estimateCalories(actType, dur),
      notes: actNotes.trim() || undefined,
    });
    if (!ok) {
      Alert.alert('Eroare', 'Nu am putut salva activitatea.');
      return;
    }
    setActDuration(''); setActDistance(''); setActNotes('');
    setShowActivityModal(false);
  };

  const latestWeight = getLatestWeight() ?? profile?.weight_kg ?? null;

  const suggestions = [
    {
      icon: 'bowl' as const, title: 'Plate Coach', sub: 'Foto la prânzul de azi',
      cta: 'Scan', tint: t.accentSoft, iconColor: t.accent,
      onPress: () => navigation.navigate('PlateCoach', { date: todayString() }),
    },
    {
      icon: 'dumbbell' as const, title: 'Activitate fizică',
      sub: todayActivities.length > 0 ? `${todayActivities.length} activitate logată azi` : 'Înregistrează antrenamentul',
      cta: 'Log', tint: t.primarySoft, iconColor: t.primary,
      onPress: () => setShowActivityModal(true),
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
                    Țintă bază · {Math.round(baseTarget)} kcal
                    {burnedToday > 0 ? ` · +${Math.round(burnedToday)} din activitate` : ''}
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

        {/* Weight card */}
        <View style={[s.section, { paddingTop: 0 }]}>
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FpIcon name="chart" size={16} color={t.primary}/>
                <Text style={[s.cardTitle, { color: t.ink }]}>Greutate</Text>
              </View>
              <TouchableOpacity onPress={() => { setWeightInput(latestWeight?.toString() ?? ''); setShowWeightModal(true); }}
                activeOpacity={0.7} style={[s.ctaChip, { backgroundColor: t.primarySoft }]}>
                <Text style={[s.ctaChipText, { color: t.primary }]}>Log</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 10 }}>
              <Text style={[{ fontSize: 32, fontWeight: '800', color: t.ink, fontFamily: SERIF, letterSpacing: -0.5 }]}>
                {latestWeight != null ? latestWeight.toFixed(1) : '—'}
              </Text>
              <Text style={[{ fontSize: 14, color: t.muted }]}>kg</Text>
            </View>
            {weightLog.length > 1 && (
              <Text style={[{ fontSize: 11, color: t.muted, marginTop: 4 }]}>
                {weightLog.length} înregistrări · ultimul: {weightLog[weightLog.length - 1].date}
              </Text>
            )}
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

      {/* Weight modal */}
      <Modal visible={showWeightModal} transparent animationType="fade" onRequestClose={() => setShowWeightModal(false)}>
        <View style={m.backdrop}>
          <View style={[m.sheet, { backgroundColor: t.surface, borderColor: t.line }]}>
            <Text style={[m.title, { fontFamily: SERIF, color: t.ink }]}>Înregistrează greutatea</Text>
            <Text style={[{ fontSize: 13, color: t.muted, marginBottom: 16 }]}>Greutate actuală (kg)</Text>
            <TextInput
              value={weightInput} onChangeText={setWeightInput}
              keyboardType="numeric" placeholder="ex: 72.5"
              placeholderTextColor={t.muted2}
              style={[m.input, { backgroundColor: t.surface2, borderColor: t.line, color: t.ink }]}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity onPress={() => setShowWeightModal(false)} activeOpacity={0.7}
                style={[m.btn, { borderColor: t.line, borderWidth: 1 }]}>
                <Text style={[{ fontSize: 14, fontWeight: '600', color: t.ink }]}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogWeight} activeOpacity={0.85}
                style={[m.btn, { backgroundColor: t.primary, flex: 1.5 }]}>
                <Text style={[{ fontSize: 14, fontWeight: '700', color: t.primaryInk }]}>Salvează</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Activity modal */}
      <Modal visible={showActivityModal} transparent animationType="slide" onRequestClose={() => setShowActivityModal(false)}>
        <View style={m.backdrop}>
          <View style={[m.actSheet, { backgroundColor: t.surface, borderColor: t.line }]}>
            <ScrollView contentContainerStyle={{ gap: 14 }} showsVerticalScrollIndicator={false}>
              <Text style={[m.title, { fontFamily: SERIF, color: t.ink }]}>Activitate fizică</Text>

              <Text style={[{ fontSize: 11, color: t.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: MONO }]}>TIP</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ACTIVITY_TYPES.map((type) => {
                  const active = actType === type;
                  return (
                    <TouchableOpacity key={type} onPress={() => setActType(type)} activeOpacity={0.7}
                      style={[m.typeChip, { backgroundColor: active ? t.ink : t.surface2, borderColor: active ? 'transparent' : t.line }]}>
                      <Text style={[{ fontSize: 12, fontWeight: '600', color: active ? t.bg : t.muted }]}>{activityTypeLabel(type)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ gap: 6 }}>
                <Text style={[{ fontSize: 9, color: t.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: MONO }]}>DURATĂ (MINUTE)</Text>
                <TextInput value={actDuration} onChangeText={setActDuration} keyboardType="numeric"
                  placeholder="ex: 45" placeholderTextColor={t.muted2}
                  style={[m.input, { backgroundColor: t.surface2, borderColor: t.line, color: t.ink }]}/>
              </View>
              <View style={{ gap: 6 }}>
                <Text style={[{ fontSize: 9, color: t.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: MONO }]}>DISTANȚĂ KM (OPȚIONAL)</Text>
                <TextInput value={actDistance} onChangeText={setActDistance} keyboardType="numeric"
                  placeholder="ex: 7.5" placeholderTextColor={t.muted2}
                  style={[m.input, { backgroundColor: t.surface2, borderColor: t.line, color: t.ink }]}/>
              </View>
              <View style={{ gap: 6 }}>
                <Text style={[{ fontSize: 9, color: t.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: MONO }]}>NOTE (OPȚIONAL)</Text>
                <TextInput value={actNotes} onChangeText={setActNotes}
                  placeholder="ex: piept + umeri + triceps" placeholderTextColor={t.muted2}
                  multiline numberOfLines={2}
                  style={[m.input, { backgroundColor: t.surface2, borderColor: t.line, color: t.ink, minHeight: 60, textAlignVertical: 'top' }]}/>
              </View>

              {actDuration.trim() ? (
                <View style={[{ backgroundColor: t.primarySoft, borderRadius: 12, padding: 12 }]}>
                  <Text style={[{ fontSize: 12, color: t.primary }]}>
                    ≈ {estimateCalories(actType, parseInt(actDuration, 10) || 0)} kcal arse (estimare)
                  </Text>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => setShowActivityModal(false)} activeOpacity={0.7}
                  style={[m.btn, { borderColor: t.line, borderWidth: 1 }]}>
                  <Text style={[{ fontSize: 14, fontWeight: '600', color: t.ink }]}>Anulează</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogActivity} activeOpacity={0.85}
                  style={[m.btn, { backgroundColor: t.primary, flex: 1.5 }]}>
                  <Text style={[{ fontSize: 14, fontWeight: '700', color: t.primaryInk }]}>Salvează activitatea</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, padding: 24, paddingBottom: 40 },
  actSheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  title: { fontSize: 22, letterSpacing: -0.4, marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, outlineWidth: 0,
  } as any,
  btn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
});

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