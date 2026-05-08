import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon, type FpIconName } from '@/components/ui/FpIcon';
import { FpAvatar } from '@/components/ui/FpAvatar';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { userApi } from '@/services/userApi';
import { AppStackParamList } from '@/types/navigation';

type NavProp = NativeStackNavigationProp<AppStackParamList, 'MainTabs'>;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const WEIGHT_DATA = [80.7, 80.4, 80.6, 80.1, 79.8, 79.9, 79.4, 79.2, 79.0, 79.1, 78.7, 78.5, 78.6, 78.4];

function WeightChart({
  color,
  lineColor,
  series,
}: {
  color: string;
  lineColor: string;
  series: number[];
}) {
  const data = series.length >= 2 ? series : WEIGHT_DATA;
  const max = Math.max(...data) + 0.3;
  const min = Math.min(...data) - 0.3;
  const span = max - min;
  const W = 280, H = 80;
  const step = W / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${H - ((v - min) / span) * H}`);
  const path = 'M' + pts.join(' L');
  const fill = path + ` L${W},${H} L0,${H} Z`;
  return (
    <Svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 14, display: 'flex' }}>
      <Defs>
        <LinearGradient id="wg" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0%" stopColor={lineColor} stopOpacity="0.2"/>
          <Stop offset="100%" stopColor={lineColor} stopOpacity="0"/>
        </LinearGradient>
      </Defs>
      <Path d={fill} fill="url(#wg)"/>
      <Path d={path} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export const ProfileScreen = () => {
  const { t } = useTheme();
  const navigation = useNavigation<NavProp>();
  const profile = useUserStore((s) => s.profile);
  const dietPreferences = useUserStore((s) => s.dietPreferences);
  const logout = useAuthStore((s) => s.logout);

  const [weightSeries, setWeightSeries] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          const logs = await userApi.getWeightLogs();
          const byDay = new Map<string, number>();
          const sorted = [...logs].sort(
            (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
          );
          for (const w of sorted) {
            const d = new Date(w.logged_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            byDay.set(key, w.weight_kg);
          }
          const vals = Array.from(byDay.values());
          if (vals.length >= 2) setWeightSeries(vals.slice(-14));
          else if (vals.length === 1) setWeightSeries([vals[0], vals[0]]);
          else setWeightSeries([]);
        } catch {
          setWeightSeries([]);
        }
      })();
    }, []),
  );

  const weightDeltaLabel = useMemo(() => {
    if (weightSeries.length < 2) return null;
    const delta = weightSeries[weightSeries.length - 1] - weightSeries[0];
    const arrow = delta <= 0 ? '↓' : '↑';
    return { text: `${arrow} ${Math.abs(delta).toFixed(1)} kg`, delta };
  }, [weightSeries]);

  const displayName = profile?.name || profile?.email?.split('@')[0] || 'Athlete';
  const initials = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const dietRestrictionsCount = (dietPreferences?.restrictions?.length ?? 0) + (dietPreferences?.allergies?.length ?? 0);
  const dietDesc = dietPreferences?.goals ?? (dietRestrictionsCount > 0 ? `${dietRestrictionsCount} restriction(s)` : 'No preferences set');

  const handleLogout = () => {
    Alert.alert('Log out', 'Ești sigur că vrei să ieși?', [
      { text: 'Anulează', style: 'cancel' },
      { text: 'Ieși', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const Stat = ({ n, u }: { n: string; u: string }) => (
    <View style={{ alignItems: 'center', flex: 1, gap: 2 }}>
      <Text style={[s.statNum, { fontFamily: SERIF, color: t.ink }]}>{n}</Text>
      <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 9 }]}>{u}</Text>
    </View>
  );

  type SettingRowProps = {
    icon: FpIconName;
    label: string;
    sub: string;
    onPress: () => void;
  };
  const SettingRow = ({ icon, label, sub, onPress }: SettingRowProps) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={s.settingRow}>
      <View style={[s.settingIcon, { backgroundColor: t.surface2 }]}>
        <FpIcon name={icon} size={16} color={t.ink}/>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.settingLabel, { color: t.ink }]}>{label}</Text>
        <Text style={[s.settingSub, { color: t.muted }]} numberOfLines={1}>{sub}</Text>
      </View>
      <FpIcon name="right" size={16} color={t.muted2}/>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Header */}
        <View style={s.header}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>PROFIL</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UpdateProfile')} activeOpacity={0.7}>
            <FpIcon name="gear" size={20} color={t.ink}/>
          </TouchableOpacity>
        </View>

        {/* Hero card */}
        <View style={s.section}>
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <FpAvatar name={initials} size={64} tint={t.primarySoft}/>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[s.displayName, { fontFamily: SERIF, color: t.ink }]}>{displayName}</Text>
                <Text style={[{ fontSize: 12, color: t.muted }]}>
                  {profile?.fitness_level ?? 'Intermediate'} · obiectiv {profile?.goals ?? 'slăbit'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                  <View style={[s.badge, { backgroundColor: t.primarySoft }]}>
                    <Text style={[s.badgeText, { color: t.primary }]}>PRO</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: t.accentSoft }]}>
                    <Text style={[s.badgeText, { color: t.accent }]}>5 zile streak</Text>
                  </View>
                </View>
              </View>
            </View>
            {/* Body stats */}
            <View style={[s.statsRow, { borderTopColor: t.line }]}>
              <Stat n={profile?.weight_kg?.toString() ?? '—'} u="kg"/>
              <View style={[s.statDivider, { backgroundColor: t.line }]}/>
              <Stat n={profile?.height_cm?.toString() ?? '—'} u="cm"/>
              <View style={[s.statDivider, { backgroundColor: t.line }]}/>
              <Stat n={profile?.age?.toString() ?? '—'} u="ani"/>
            </View>
          </View>
        </View>

        {/* Weight chart */}
        <View style={[s.section, { paddingTop: 0 }]}>
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View style={{ gap: 2 }}>
                <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>GREUTATE · 30 ZILE</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={[s.weightBig, { fontFamily: SERIF, color: t.ink }]}>
                    {profile?.weight_kg != null ? String(profile.weight_kg) : '—'}
                  </Text>
                  {weightDeltaLabel ? (
                    <Text style={[{
                      fontSize: 12,
                      color: weightDeltaLabel.delta <= 0 ? t.good : t.bad,
                      fontWeight: '600',
                    }]}>{weightDeltaLabel.text}</Text>
                  ) : (
                    <Text style={[{ fontSize: 12, color: t.muted, fontWeight: '600' }]}>—</Text>
                  )}
                </View>
              </View>
              <View style={[s.segControl, { backgroundColor: t.surface2, borderColor: t.line }]}>
                {['7d', '30d', '90d'].map((l, i) => (
                  <View key={l} style={[s.segBtn, i === 1 && { backgroundColor: t.ink }]}>
                    <Text style={[s.segText, { color: i === 1 ? t.bg : t.muted }]}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
            <WeightChart color={t.primarySoft} lineColor={t.primary} series={weightSeries}/>
          </View>
        </View>

        {/* Settings list */}
        <View style={[s.section, { paddingTop: 0, gap: 2 }]}>
          <SettingRow
            icon="leaf" label="Diet preferences" sub={dietDesc}
            onPress={() => navigation.navigate('DietPreferences')}
          />
          <SettingRow
            icon="dumbbell" label="Fitness goals" sub={`${profile?.fitness_level ?? 'Beginner'} · obiectiv`}
            onPress={() => navigation.navigate('UpdateProfile')}
          />
          <SettingRow
            icon="heart" label="Săli favorite" sub="Saved gyms and locations"
            onPress={() => navigation.navigate('FavoriteGyms')}
          />
          <SettingRow
            icon="chart" label="Calorie Calculator" sub="Calculate your TDEE"
            onPress={() => navigation.navigate('CalorieTarget')}
          />
          <SettingRow
            icon="dumbbell" label="Workout AI History" sub="Browse and continue workout chats"
            onPress={() => navigation.navigate('ConversationHistory', { agentType: 'workout' })}
          />
          <SettingRow
            icon="leaf" label="Diet AI History" sub="Browse and continue diet chats"
            onPress={() => navigation.navigate('ConversationHistory', { agentType: 'diet' })}
          />
        </View>

        {/* Logout */}
        <View style={[s.section, { paddingTop: 0 }]}>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={[s.logoutBtn, { borderColor: t.bad + '40', backgroundColor: t.bad + '10' }]}
          >
            <Text style={[s.logoutText, { color: t.bad }]}>Log out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={[s.version, { color: t.muted2 }]}>FitPlus · Wellness Daily</Text>
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
  section: { paddingHorizontal: 22, paddingTop: 14 },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  card: { borderRadius: 22, borderWidth: 1, padding: 20 },
  displayName: { fontSize: 20, letterSpacing: -0.3 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  statsRow: {
    flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1,
  },
  statNum: { fontSize: 22, letterSpacing: -0.5, fontWeight: '700' },
  statDivider: { width: 1, height: 36, alignSelf: 'center' },
  weightBig: { fontSize: 28, letterSpacing: -0.5, fontWeight: '700' },
  segControl: { flexDirection: 'row', borderRadius: 999, padding: 3, borderWidth: 1, gap: 2 },
  segBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  segText: { fontSize: 11, fontWeight: '500' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 4,
  },
  settingIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '500' },
  settingSub: { fontSize: 11 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 14, borderRadius: 999, borderWidth: 1,
  },
  logoutText: { fontSize: 14, fontWeight: '600' },
  version: { fontSize: 11, letterSpacing: 0.5 },
});