import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, TextInput, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Defs, LinearGradient, Stop, Path, Circle } from 'react-native-svg';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { MacroBar } from '@/components/ui/MacroBar';
import { nutritionApi } from '@/services/nutritionApi';
import { userApi } from '@/services/userApi';
import { todayString, useFoodDiaryStore } from '@/store/foodDiaryStore';
import { useUserStore } from '@/store/userStore';
import { AppStackParamList } from '@/types/navigation';
import { useActivityStore, ActivityType, activityTypeLabel, estimateCalories } from '@/store/activityStore';

type Nav = NativeStackNavigationProp<AppStackParamList>;

const SERIF = 'Georgia';
const MONO  = 'monospace';

const DAYS = ['L','M','M','J','V','S','D'];
const WEIGHT_DATA = [80.7, 80.4, 80.6, 80.1, 79.8, 79.9, 79.4, 79.2, 79.0, 79.1, 78.7, 78.5, 78.6, 78.4];

function WeightChartWeb({ primary, data: dataProp }: { primary: string; data?: number[] }) {
  const data = (dataProp && dataProp.length >= 2) ? dataProp : WEIGHT_DATA;
  const max = Math.max(...data) + 0.3, min = Math.min(...data) - 0.3;
  const span = max - min;
  const W = 360, H = 120, step = W / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${H - ((v - min) / span) * H}`);
  const path = 'M' + pts.join(' L');
  const fill = path + ` L${W},${H} L0,${H} Z`;
  const lastX = (data.length - 1) * step;
  const lastY = H - ((data[data.length - 1] - min) / span) * H;
  return (
    <Svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 14, display: 'flex' }}>
      <Defs>
        <LinearGradient id="wg_web" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0%" stopColor={primary} stopOpacity="0.22"/>
          <Stop offset="100%" stopColor={primary} stopOpacity="0"/>
        </LinearGradient>
      </Defs>
      <Path d={fill} fill="url(#wg_web)"/>
      <Path d={path} fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx={lastX} cy={lastY} r="4" fill={primary}/>
    </Svg>
  );
}

function getDateLabel() {
  const now = new Date();
  const days = ['DUMINICĂ','LUNI','MARȚI','MIERCURI','JOI','VINERI','SÂMBĂTĂ'];
  const months = ['IAN','FEB','MAR','APR','MAI','IUN','IUL','AUG','SEP','OCT','NOV','DEC'];
  return `${days[now.getDay()]} · ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

const ACTIVITY_TYPES: ActivityType[] = ['walking', 'running', 'cycling', 'gym', 'swimming', 'yoga', 'other'];

export const HomeScreen = () => {
  const { t } = useTheme();
  const navigation = useNavigation<Nav>();
  const profile          = useUserStore((s) => s.profile);
  const fetchMe          = useUserStore((s) => s.fetchMe);
  const dailyKcalTarget  = useFoodDiaryStore((s) => s.dailyKcalTarget);
  const hasCalorieTarget = useFoodDiaryStore((s) => s.hasCalorieTarget);
  const diaryDate        = useFoodDiaryStore((s) => s.date);
  const diaryKcal        = useFoodDiaryStore((s) => s.totals.kcal);
  const totals           = useFoodDiaryStore((s) => s.totals);
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

  const [todayKcal,          setTodayKcal]          = useState(0);
  const [showWeightModal,    setShowWeightModal]    = useState(false);
  const [weightInput,        setWeightInput]        = useState('');
  const [showActivityModal,  setShowActivityModal]  = useState(false);
  const [actType,            setActType]            = useState<ActivityType>('gym');
  const [actDuration,        setActDuration]        = useState('');
  const [actDistance,        setActDistance]        = useState('');
  const [actNotes,           setActNotes]           = useState('');

  const displayName     = profile?.name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Andrei';
  const latestWeight    = getLatestWeight() ?? profile?.weight_kg ?? null;
  const baseTarget      = dailyKcalTarget ?? 2000;
  const effectiveTarget = baseTarget + burnedToday;
  const calorieProgress = useMemo(() => {
    if (!hasCalorieTarget || !dailyKcalTarget) return 0;
    if (effectiveTarget <= 0) return 0;
    return Math.min(todayKcal / effectiveTarget, 1);
  }, [hasCalorieTarget, dailyKcalTarget, todayKcal, effectiveTarget]);
  const remaining = Math.max(effectiveTarget - todayKcal, 0);

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
    if (!isNaN(kg) && kg > 0) {
      try {
        await userApi.postWeightLog({ weight_kg: kg });
        logWeight(kg);
        await fetchMe();
        await hydrateWeightLogsFromServer();
        setShowWeightModal(false);
        setWeightInput('');
      } catch {
        /* eslint-disable no-alert -- web fallback */
        window.alert('Nu am putut salva greutatea pe server.');
      }
    }
  };

  const handleLogActivity = async () => {
    const dur = parseInt(actDuration, 10);
    if (!dur || dur <= 0) return;
    const ok = await addActivity({
      date: todayString(), type: actType, title: activityTypeLabel(actType),
      duration_min: dur,
      distance_km: actDistance.trim() ? parseFloat(actDistance) : undefined,
      calories_burned: estimateCalories(actType, dur),
      notes: actNotes.trim() || undefined,
    });
    if (!ok) {
      window.alert('Nu am putut salva activitatea.');
      return;
    }
    setActDuration(''); setActDistance(''); setActNotes('');
    setShowActivityModal(false);
  };

  // Build chart data from real weight log (last 14 entries) or fallback to demo
  const chartData: number[] = weightLog.length >= 2
    ? weightLog.slice(-14).map((e) => e.weight_kg)
    : weightLog.length === 1
      ? [weightLog[0].weight_kg, weightLog[0].weight_kg]
      : latestWeight != null
        ? [latestWeight, latestWeight]
        : WEIGHT_DATA;

  const weightDelta = chartData.length >= 2
    ? (chartData[chartData.length - 1] - chartData[0]).toFixed(1)
    : null;

  const SUGG = [
    {
      icon: 'bowl' as const,
      title: remaining > 300 ? `Mai ai ${remaining} kcal disponibile` : 'Aproape de target caloric!',
      body: remaining > 300 ? 'Loggează masa de seară sau un snack nutritiv.' : 'Excelent! Încearcă să menții consistența.',
      tag: 'Calorii', kcal: String(remaining), tint: t.primarySoft, fg: t.primary,
      onPress: () => navigation.navigate('AddFood', { date: todayString() }),
    },
    {
      icon: 'dumbbell' as const,
      title: todayActivities.length > 0 ? `${todayActivities.length} activitate înregistrată azi` : 'Înregistrează activitatea de azi',
      body: todayActivities.length > 0
        ? todayActivities.map((a) => `${a.title} ${a.duration_min} min`).join(' · ')
        : 'Adaugă mersul, sala sau orice altă activitate fizică.',
      tag: 'Activitate', kcal: '', tint: t.accentSoft, fg: t.accent,
      onPress: () => setShowActivityModal(true),
    },
    {
      icon: 'spark' as const, title: 'Cere sfat — Diet Coach',
      body: 'Întreabă despre planuri de masă, macros sau restricții alimentare.',
      tag: 'AI', kcal: '', tint: t.surface2, fg: t.good,
      onPress: () => navigation.navigate('Chat', { agentType: 'diet' }),
    },
  ];

  return (
    <ScrollView style={[s.root, { backgroundColor: t.bg }]} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ gap: 6 }}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>{getDateLabel()}</Text>
          <Text style={[s.greeting, { fontFamily: SERIF, color: t.ink }]}>
            {'Bună, '}
            <Text style={{ fontStyle: 'italic', color: t.primary }}>{displayName}.</Text>
          </Text>
          <Text style={[{ fontSize: 14, color: t.muted }]}>
            Mai ai {remaining} kcal & un Push day pentru azi.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddFood', { date: todayString() })}
            activeOpacity={0.7}
            style={[s.searchBar, { backgroundColor: t.surface, borderColor: t.line }]}
          >
            <FpIcon name="search" size={14} color={t.muted}/>
            <Text style={[{ fontSize: 12, color: t.muted }]}>Caută și adaugă alimente…</Text>
            <View style={[s.kbdChip, { backgroundColor: t.surface2 }]}>
              <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 10 }]}>Add</Text>
            </View>
          </TouchableOpacity>
          <View style={[s.iconBtn, { backgroundColor: t.surface, borderColor: t.line }]}>
            <FpIcon name="bell" size={16} color={t.ink}/>
          </View>
        </View>
      </View>

      {/* Top cards row: calorie hero | streak | workout */}
      <View style={s.topRow}>
        {/* Calorie hero */}
        <View style={[s.heroCard, { flex: 1.4, backgroundColor: t.surface, borderColor: t.line }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
            <ProgressRing size={170} stroke={14} value={calorieProgress}
              label={String(todayKcal)} sub={`kcal · ${Math.round(calorieProgress * 100)}%`}
              color={t.primary}/>
            <View style={{ flex: 1, gap: 12 }}>
              <View>
                <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>remaining for today</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={[s.bigNum, { fontFamily: SERIF, color: t.ink }]}>{remaining}</Text>
                  <Text style={[{ fontSize: 14, color: t.muted }]}>kcal</Text>
                </View>
              </View>
              <View style={[{ height: 1, backgroundColor: t.line }]}/>
              <Text style={[{ fontSize: 12, color: t.muted }]}>
                Bază {Math.round(baseTarget)} kcal
                {burnedToday > 0 ? ` · +${Math.round(burnedToday)} din activitate` : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: 20 }}>
                {[
                  { val: `${Math.round(totals.protein_g)}g`, label: 'protein', color: t.macroProtein },
                  { val: `${Math.round(totals.carbs_g)}g`, label: 'carbs', color: t.macroCarbs },
                  { val: `${Math.round(totals.fat_g)}g`, label: 'fat', color: t.macroFat },
                ].map((m) => (
                  <View key={m.label} style={{ gap: 2 }}>
                    <Text style={[s.macroVal, { fontFamily: MONO, color: m.color }]}>{m.val}</Text>
                    <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 9 }]}>{m.label}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('AddFood', { date: todayString() })}
                activeOpacity={0.85}
                style={[s.addBtn, { backgroundColor: t.primary }]}
              >
                <FpIcon name="plus" size={14} color={t.primaryInk}/>
                <Text style={[{ fontSize: 13, fontWeight: '600', color: t.primaryInk }]}>Add meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Streak */}
        <View style={[s.smCard, { flex: 1, backgroundColor: t.surface, borderColor: t.line }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>streak</Text>
            <FpIcon name="flame" size={16} color={t.accent}/>
          </View>
          <Text style={[s.streakNum, { fontFamily: SERIF, color: t.ink }]}>5</Text>
          <Text style={[{ fontSize: 12, color: t.muted }]}>zile la rând cu target atins</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 16 }}>
            {DAYS.map((d, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                <View style={[s.streakDot, { backgroundColor: i < 5 ? t.primary : t.lineSoft, borderColor: i < 5 ? 'transparent' : t.line }]}/>
                <Text style={[{ fontSize: 9, color: t.muted }]}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Activity */}
        <View style={[s.smCard, { flex: 1, backgroundColor: t.surface, borderColor: t.line }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>activitate · azi</Text>
            <FpIcon name="dumbbell" size={16} color={t.primary}/>
          </View>
          {todayActivities.length > 0 ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                <Text style={[s.workoutNum, { fontFamily: SERIF, color: t.ink }]}>
                  {todayActivities.reduce((s, a) => s + a.duration_min, 0)}
                </Text>
                <Text style={[{ fontSize: 14, color: t.muted }]}>min</Text>
              </View>
              <View style={{ gap: 4, marginTop: 4 }}>
                {todayActivities.slice(0, 3).map((a) => (
                  <Text key={a.id} style={[{ fontSize: 11, color: t.muted }]}>
                    · {a.title} {a.duration_min} min{a.distance_km ? ` · ${a.distance_km} km` : ''}
                  </Text>
                ))}
              </View>
            </>
          ) : (
            <Text style={[{ fontSize: 13, color: t.muted2, marginTop: 12 }]}>Nicio activitate logată azi</Text>
          )}
          <TouchableOpacity onPress={() => setShowActivityModal(true)} activeOpacity={0.7}
            style={[s.addBtn, { backgroundColor: t.primarySoft, marginTop: 14 }]}>
            <FpIcon name="plus" size={14} color={t.primary}/>
            <Text style={[{ fontSize: 12, fontWeight: '600', color: t.primary }]}>Log activitate</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom row: AI suggestions | Weight chart */}
      <View style={s.bottomRow}>
        {/* AI suggestions */}
        <View style={[s.aiCard, { flex: 1.5, backgroundColor: t.surface, borderColor: t.line }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[s.aiIcon, { backgroundColor: t.primarySoft }]}>
                <FpIcon name="leaf" size={16} color={t.primary}/>
              </View>
              <View style={{ gap: 2 }}>
                <Text style={[s.cardTitle, { fontFamily: SERIF, color: t.ink }]}>Diet Coach</Text>
                <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>sugestii pentru azi</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Chat', { agentType: 'diet' })}
              activeOpacity={0.7}
              style={[s.ghostBtn, { borderColor: t.line }]}
            >
              <Text style={[{ fontSize: 12, fontWeight: '500', color: t.ink }]}>Open chat →</Text>
            </TouchableOpacity>
          </View>
          <View style={{ gap: 10 }}>
            {SUGG.map((item) => (
              <View key={item.title} style={[s.suggCard, { backgroundColor: t.surface2, borderColor: t.line }]}>
                <View style={[s.suggIcon, { backgroundColor: item.tint }]}>
                  <FpIcon name={item.icon} size={18} color={item.fg}/>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[s.tagChip, { backgroundColor: item.tint }]}>
                      <Text style={[s.eyebrow, { color: item.fg, fontSize: 9, fontFamily: MONO }]}>
                        {item.tag.toUpperCase()}
                      </Text>
                    </View>
                    {!!item.kcal && <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 11 }]}>{item.kcal} kcal</Text>}
                  </View>
                  <Text style={[{ fontSize: 13, fontWeight: '600', color: t.ink }]}>{item.title}</Text>
                  <Text style={[{ fontSize: 12, color: t.muted, lineHeight: 18 }]}>{item.body}</Text>
                </View>
                <FpIcon name="right" size={16} color={t.muted}/>
              </View>
            ))}
          </View>
        </View>

        {/* Weight chart */}
        <View style={[s.weightCard, { flex: 1, backgroundColor: t.surface, borderColor: t.line }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ gap: 2 }}>
              <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>greutate</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
                <Text style={[s.weightNum, { fontFamily: SERIF, color: t.ink }]}>
                  {latestWeight != null ? latestWeight.toFixed(1) : '—'}
                </Text>
                {weightDelta !== null && (
                  <Text style={[{ fontSize: 12, color: parseFloat(weightDelta) <= 0 ? t.good : t.bad, fontWeight: '600' }]}>
                    {parseFloat(weightDelta) <= 0 ? '↓' : '↑'} {Math.abs(parseFloat(weightDelta))} kg
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => { setWeightInput(latestWeight?.toFixed(1) ?? ''); setShowWeightModal(true); }}
              activeOpacity={0.7} style={[s.addBtn, { backgroundColor: t.primarySoft }]}>
              <FpIcon name="plus" size={13} color={t.primary}/>
              <Text style={[{ fontSize: 12, fontWeight: '600', color: t.primary }]}>Log</Text>
            </TouchableOpacity>
          </View>
          <WeightChartWeb primary={t.primary} data={chartData}/>
          <View style={[s.statRowW, { borderTopColor: t.lineSoft }]}>
            {[
              { val: profile?.weight_kg && profile?.height_cm ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1) : '—', label: 'BMI' },
              { val: dailyKcalTarget ? String(Math.round(effectiveTarget)) : '—', label: burnedToday > 0 ? 'Țintă azi (activ.)' : 'Target kcal' },
              { val: String(todayKcal), label: 'Consumate' },
              { val: String(remaining), label: 'Rămase', color: remaining > 0 ? t.good : t.bad },
            ].map((item) => (
              <View key={item.label} style={{ gap: 2 }}>
                <Text style={[s.eyebrow, { fontFamily: MONO, fontSize: 13, color: (item as any).color ?? t.ink2, fontWeight: '600', textTransform: 'none', letterSpacing: 0 }]}>
                  {item.val}
                </Text>
                <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 9 }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Weight modal */}
      <Modal visible={showWeightModal} transparent animationType="fade" onRequestClose={() => setShowWeightModal(false)}>
        <View style={wm.backdrop}>
          <View style={[wm.card, { backgroundColor: t.surface, borderColor: t.line }]}>
            <Text style={[wm.title, { fontFamily: SERIF, color: t.ink }]}>Înregistrează greutatea</Text>
            <TextInput
              value={weightInput} onChangeText={setWeightInput}
              keyboardType="numeric" placeholder="ex: 72.5"
              placeholderTextColor={t.muted2} autoFocus
              style={[wm.input, { backgroundColor: t.surface2, borderColor: t.line, color: t.ink }]}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity onPress={() => setShowWeightModal(false)} activeOpacity={0.7}
                style={[wm.btn, { borderColor: t.line, borderWidth: 1 }]}>
                <Text style={[{ fontSize: 13, fontWeight: '600', color: t.ink }]}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogWeight} activeOpacity={0.85}
                style={[wm.btn, { backgroundColor: t.primary, flex: 1.5 }]}>
                <Text style={[{ fontSize: 13, fontWeight: '700', color: t.primaryInk }]}>Salvează</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Activity modal */}
      <Modal visible={showActivityModal} transparent animationType="fade" onRequestClose={() => setShowActivityModal(false)}>
        <View style={wm.backdrop}>
          <View style={[wm.actCard, { backgroundColor: t.surface, borderColor: t.line }]}>
            <Text style={[wm.title, { fontFamily: SERIF, color: t.ink }]}>Activitate fizică</Text>
            <Text style={[{ fontSize: 11, color: t.muted, letterSpacing: 1.5, textTransform: 'uppercase' as const, fontFamily: MONO, marginBottom: 8 }]}>TIP</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' as any, gap: 8, marginBottom: 16 }}>
              {ACTIVITY_TYPES.map((type) => {
                const active = actType === type;
                return (
                  <TouchableOpacity key={type} onPress={() => setActType(type)} activeOpacity={0.7}
                    style={[wm.typeChip, { backgroundColor: active ? t.ink : t.surface2, borderColor: active ? 'transparent' : t.line }]}>
                    <Text style={[{ fontSize: 12, fontWeight: '600', color: active ? t.bg : t.muted }]}>{activityTypeLabel(type)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[{ fontSize: 9, color: t.muted, letterSpacing: 1.5, textTransform: 'uppercase' as const, fontFamily: MONO }]}>DURATĂ (MIN)</Text>
                <TextInput value={actDuration} onChangeText={setActDuration} keyboardType="numeric"
                  placeholder="45" placeholderTextColor={t.muted2}
                  style={[wm.input, { backgroundColor: t.surface2, borderColor: t.line, color: t.ink }]}/>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[{ fontSize: 9, color: t.muted, letterSpacing: 1.5, textTransform: 'uppercase' as const, fontFamily: MONO }]}>DISTANȚĂ (KM)</Text>
                <TextInput value={actDistance} onChangeText={setActDistance} keyboardType="numeric"
                  placeholder="7.5" placeholderTextColor={t.muted2}
                  style={[wm.input, { backgroundColor: t.surface2, borderColor: t.line, color: t.ink }]}/>
              </View>
            </View>
            <View style={{ gap: 6, marginBottom: 16 }}>
              <Text style={[{ fontSize: 9, color: t.muted, letterSpacing: 1.5, textTransform: 'uppercase' as const, fontFamily: MONO }]}>NOTE</Text>
              <TextInput value={actNotes} onChangeText={setActNotes}
                placeholder="ex: piept + umeri + triceps" placeholderTextColor={t.muted2}
                style={[wm.input, { backgroundColor: t.surface2, borderColor: t.line, color: t.ink }]}/>
            </View>
            {actDuration.trim() ? (
              <View style={[{ backgroundColor: t.primarySoft, borderRadius: 12, padding: 10, marginBottom: 14 }]}>
                <Text style={[{ fontSize: 12, color: t.primary }]}>
                  ≈ {estimateCalories(actType, parseInt(actDuration, 10) || 0)} kcal arse (estimare)
                </Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowActivityModal(false)} activeOpacity={0.7}
                style={[wm.btn, { borderColor: t.line, borderWidth: 1 }]}>
                <Text style={[{ fontSize: 13, fontWeight: '600', color: t.ink }]}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogActivity} activeOpacity={0.85}
                style={[wm.btn, { backgroundColor: t.primary, flex: 1.5 }]}>
                <Text style={[{ fontSize: 13, fontWeight: '700', color: t.primaryInk }]}>Salvează</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 32, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  greeting: { fontSize: 40, letterSpacing: -0.8, lineHeight: 44 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1,
  },
  kbdChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', gap: 16 },
  heroCard: { borderRadius: 22, borderWidth: 1, padding: 24 },
  bigNum: { fontSize: 48, fontWeight: '700', letterSpacing: -1.2, lineHeight: 52 },
  macroVal: { fontSize: 14, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, alignSelf: 'flex-start' },
  smCard: { borderRadius: 22, borderWidth: 1, padding: 22 },
  streakNum: { fontSize: 56, letterSpacing: -1.5, lineHeight: 60, marginTop: 6, fontWeight: '700' },
  streakDot: { width: 14, height: 14, borderRadius: 4, borderWidth: 1 },
  workoutNum: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  progressTrack: { height: 6, borderRadius: 999, marginTop: 14 },
  progressFill: { height: '100%', borderRadius: 999 },
  bottomRow: { flexDirection: 'row', gap: 16 },
  aiCard: { borderRadius: 22, borderWidth: 1, padding: 22 },
  aiIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 18, letterSpacing: -0.3 },
  ghostBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  suggCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  suggIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tagChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  weightCard: { borderRadius: 22, borderWidth: 1, padding: 22 },
  weightNum: { fontSize: 36, fontWeight: '700', letterSpacing: -0.8 },
  segControl: { flexDirection: 'row', borderRadius: 999, padding: 3, borderWidth: 1, gap: 2 },
  segBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statRowW: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, borderTopWidth: 1, marginTop: 14 },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
});

const wm = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  card: { width: 400, borderRadius: 22, borderWidth: 1, padding: 28 },
  actCard: { width: 520, borderRadius: 22, borderWidth: 1, padding: 28 },
  title: { fontSize: 22, letterSpacing: -0.4, marginBottom: 16 },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, outlineWidth: 0,
  } as any,
  btn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
});
