import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { ProgressRing } from '@/components/ui/ProgressRing';

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

type ExerciseStatus = 'done' | 'current' | 'upcoming';

interface Exercise {
  id: number;
  name: string;
  muscle: string;
  sets: number;
  reps: number;
  restSec: number;
  status: ExerciseStatus;
  setsCompleted: number;
}

const INITIAL_EXERCISES: Exercise[] = [
  { id: 1, name: 'Bench Press', muscle: 'Piept', sets: 4, reps: 8, restSec: 90, status: 'done', setsCompleted: 4 },
  { id: 2, name: 'Incline Dumbbell Press', muscle: 'Piept', sets: 3, reps: 10, restSec: 75, status: 'done', setsCompleted: 3 },
  { id: 3, name: 'Overhead Press', muscle: 'Umeri', sets: 4, reps: 8, restSec: 90, status: 'current', setsCompleted: 2 },
  { id: 4, name: 'Lateral Raises', muscle: 'Umeri', sets: 3, reps: 15, restSec: 60, status: 'upcoming', setsCompleted: 0 },
  { id: 5, name: 'Triceps Pushdowns', muscle: 'Triceps', sets: 3, reps: 12, restSec: 60, status: 'upcoming', setsCompleted: 0 },
  { id: 6, name: 'Skull Crushers', muscle: 'Triceps', sets: 3, reps: 10, restSec: 60, status: 'upcoming', setsCompleted: 0 },
];

export const WorkoutScreen = () => {
  const { t } = useTheme();
  const navigation = useNavigation();
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES);

  const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
  const completedSets = exercises.reduce((sum, e) => sum + e.setsCompleted, 0);
  const progress = totalSets > 0 ? completedSets / totalSets : 0;
  const doneCount = exercises.filter((e) => e.status === 'done').length;
  const currentExercise = exercises.find((e) => e.status === 'current');

  const completeSet = (id: number) => {
    setExercises((prev) => {
      const currentIdx = prev.findIndex((x) => x.id === id);
      if (currentIdx === -1) return prev;
      const e = prev[currentIdx];
      const next = e.setsCompleted + 1;
      return prev.map((x, i) => {
        if (x.id === id) return { ...x, setsCompleted: next, status: next >= x.sets ? 'done' as ExerciseStatus : x.status };
        if (next >= e.sets && i === currentIdx + 1 && x.status === 'upcoming') return { ...x, status: 'current' as ExerciseStatus };
        return x;
      });
    });
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <FpIcon name="left" size={20} color={t.ink}/>
        </TouchableOpacity>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>ANTRENAMENT</Text>
          <Text style={[s.headerTitle, { fontFamily: SERIF, color: t.ink }]}>Push Day</Text>
        </View>
        <FpIcon name="dumbbell" size={20} color={t.muted2}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: 22, paddingTop: 14 }}>
        {/* Hero progress card */}
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <ProgressRing
              size={110} stroke={10}
              value={progress}
              label={`${Math.round(progress * 100)}%`}
              sub="complet"
              color={t.primary}
            />
            <View style={{ flex: 1, gap: 10 }}>
              <View>
                <Text style={[s.heroNum, { fontFamily: SERIF, color: t.ink }]}>{doneCount}/{exercises.length}</Text>
                <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>exerciții</Text>
              </View>
              <View style={[s.divider, { backgroundColor: t.line }]}/>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <FpIcon name="flame" size={13} color={t.accent}/>
                <Text style={[{ fontSize: 12, color: t.ink2 }]}>~45 min · piept, umeri, triceps</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Current exercise highlight */}
        {currentExercise && (
          <View style={[s.card, { backgroundColor: t.primarySoft, borderColor: t.primary + '40', marginTop: 14 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ gap: 4, flex: 1 }}>
                <View style={[s.nowBadge, { backgroundColor: t.primary }]}>
                  <Text style={[s.nowText, { color: t.bg, fontFamily: MONO }]}>ACUM</Text>
                </View>
                <Text style={[s.exerciseName, { fontFamily: SERIF, color: t.ink, marginTop: 4 }]}>
                  {currentExercise.name}
                </Text>
                <Text style={[{ fontSize: 12, color: t.muted }]}>{currentExercise.muscle}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[s.setsBig, { fontFamily: SERIF, color: t.ink }]}>
                  {currentExercise.setsCompleted}/{currentExercise.sets}
                </Text>
                <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>seturi</Text>
                <Text style={[{ fontSize: 11, color: t.muted }]}>× {currentExercise.reps} rep</Text>
              </View>
            </View>
            {/* Set dots */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              {Array.from({ length: currentExercise.sets }).map((_, i) => (
                <View
                  key={i}
                  style={[s.setDot, {
                    backgroundColor: i < currentExercise.setsCompleted ? t.primary : t.surface2,
                    borderColor: i < currentExercise.setsCompleted ? 'transparent' : t.line,
                  }]}
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={() => completeSet(currentExercise.id)}
              activeOpacity={0.85}
              style={[s.completeBtn, { backgroundColor: t.primary }]}
            >
              <FpIcon name="check" size={16} color={t.bg}/>
              <Text style={[{ fontSize: 14, fontWeight: '600', color: t.bg }]}>Setul {currentExercise.setsCompleted + 1} — gata</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Exercise list */}
        <Text style={[s.sectionTitle, { color: t.ink, fontFamily: SERIF, marginTop: 22, marginBottom: 12 }]}>
          Toate exercițiile
        </Text>

        <View style={{ gap: 10 }}>
          {exercises.map((ex) => {
            const isDone = ex.status === 'done';
            const isCurrent = ex.status === 'current';
            return (
              <View
                key={ex.id}
                style={[s.exRow, {
                  backgroundColor: isDone ? t.surface2 : t.surface,
                  borderColor: isCurrent ? t.primary + '50' : t.line,
                  opacity: isDone ? 0.6 : 1,
                }]}
              >
                <View style={[s.exIcon, {
                  backgroundColor: isDone ? t.good + '20' : isCurrent ? t.primarySoft : t.surface2,
                }]}>
                  {isDone
                    ? <FpIcon name="check" size={16} color={t.good}/>
                    : <FpIcon name="dumbbell" size={16} color={isCurrent ? t.primary : t.muted2}/>
                  }
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[s.exName, { color: isDone ? t.muted : t.ink }]}>{ex.name}</Text>
                  <Text style={[{ fontSize: 11, color: t.muted }]}>
                    {ex.muscle} · {ex.sets} × {ex.reps} rep · {ex.restSec}s pauză
                  </Text>
                </View>
                {isCurrent ? (
                  <View style={[s.activePill, { backgroundColor: t.primary }]}>
                    <Text style={[{ fontSize: 10, fontWeight: '700', color: t.bg, fontFamily: MONO }]}>
                      {ex.setsCompleted}/{ex.sets}
                    </Text>
                  </View>
                ) : isDone ? (
                  <Text style={[{ fontSize: 11, color: t.good, fontFamily: MONO }]}>✓</Text>
                ) : (
                  <Text style={[{ fontSize: 11, color: t.muted2, fontFamily: MONO }]}>
                    {ex.sets}×{ex.reps}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Finish workout */}
        {exercises.every((e) => e.status === 'done') && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            style={[s.finishBtn, { backgroundColor: t.good }]}
          >
            <FpIcon name="check" size={18} color="#fff"/>
            <Text style={[{ fontSize: 15, fontWeight: '700', color: '#fff' }]}>Antrenament finalizat!</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 8, paddingBottom: 8,
  },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  headerTitle: { fontSize: 18, letterSpacing: -0.3 },
  card: { borderRadius: 22, borderWidth: 1, padding: 18 },
  heroNum: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  divider: { height: 1 },
  nowBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  nowText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  exerciseName: { fontSize: 22, letterSpacing: -0.4 },
  setsBig: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  setDot: { width: 12, height: 12, borderRadius: 4, borderWidth: 1 },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 16, marginTop: 14,
  },
  sectionTitle: { fontSize: 20, letterSpacing: -0.3, fontWeight: '600' },
  exRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, borderWidth: 1, padding: 14,
  },
  exIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  exName: { fontSize: 14, fontWeight: '500' },
  activePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  finishBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 18, marginTop: 24,
  },
});