import React, { useState } from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { useUserStore } from '@/store/userStore';
import { AppStackParamList } from '@/types/navigation';

type NavProp = NativeStackNavigationProp<AppStackParamList, 'UpdateProfile'>;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO  = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'];

const parseOptionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const UpdateProfileScreen = () => {
  const { t } = useTheme();
  const navigation = useNavigation<NavProp>();
  const profile       = useUserStore((s) => s.profile);
  const saving        = useUserStore((s) => s.saving);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [name,         setName]         = useState(profile?.name ?? '');
  const [age,          setAge]          = useState(profile?.age?.toString() ?? '');
  const [weightKg,     setWeightKg]     = useState(profile?.weight_kg?.toString() ?? '');
  const [heightCm,     setHeightCm]     = useState(profile?.height_cm?.toString() ?? '');
  const [fitnessLevel, setFitnessLevel] = useState(profile?.fitness_level ?? '');
  const [goals,        setGoals]        = useState(profile?.goals ?? '');
  const [error,        setError]        = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    const ok = await updateProfile({
      name:          name.trim() || undefined,
      age:           parseOptionalNumber(age),
      weight_kg:     parseOptionalNumber(weightKg),
      height_cm:     parseOptionalNumber(heightCm),
      fitness_level: fitnessLevel.trim() || undefined,
      goals:         goals.trim() || undefined,
    });
    if (ok) { navigation.goBack(); return; }
    setError('Nu am putut salva modificările.');
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: t.lineSoft }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={s.backBtn}>
          <FpIcon name="left" size={20} color={t.ink}/>
        </TouchableOpacity>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>PROFIL</Text>
          <Text style={[s.headerTitle, { fontFamily: SERIF, color: t.ink }]}>Editează profilul</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[{ fontSize: 13, color: t.muted, marginBottom: 8 }]}>
          Actualizează datele tale pentru recomandări mai bune din partea AI.
        </Text>

        {/* Name + age row */}
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
          <Text style={[s.sectionEyebrow, { color: t.muted, fontFamily: MONO }]}>DATE PERSONALE</Text>
          <FieldRow label="Nume complet">
            <TextInput
              value={name} onChangeText={setName}
              placeholder="ex: Miruna Dragunoi"
              autoCapitalize="words"
              style={[s.field, { color: t.ink, backgroundColor: t.surface2, borderColor: t.line }]}
            />
          </FieldRow>
          <View style={[s.hr, { backgroundColor: t.lineSoft }]}/>
          <FieldRow label="Vârstă (ani)">
            <TextInput
              value={age} onChangeText={setAge}
              placeholder="24" keyboardType="numeric"
              style={[s.field, { color: t.ink, backgroundColor: t.surface2, borderColor: t.line }]}
            />
          </FieldRow>
        </View>

        {/* Body stats */}
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
          <Text style={[s.sectionEyebrow, { color: t.muted, fontFamily: MONO }]}>DATE CORPORALE</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[s.fieldLabel, { color: t.muted, fontFamily: MONO }]}>GREUTATE (KG)</Text>
              <TextInput
                value={weightKg} onChangeText={setWeightKg}
                placeholder="60.5" keyboardType="numeric"
                style={[s.field, { color: t.ink, backgroundColor: t.surface2, borderColor: t.line }]}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[s.fieldLabel, { color: t.muted, fontFamily: MONO }]}>ÎNĂLȚIME (CM)</Text>
              <TextInput
                value={heightCm} onChangeText={setHeightCm}
                placeholder="168" keyboardType="numeric"
                style={[s.field, { color: t.ink, backgroundColor: t.surface2, borderColor: t.line }]}
              />
            </View>
          </View>
        </View>

        {/* Fitness level */}
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
          <Text style={[s.sectionEyebrow, { color: t.muted, fontFamily: MONO }]}>NIVEL FITNESS</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            {FITNESS_LEVELS.map((lvl) => {
              const active = fitnessLevel === lvl;
              return (
                <TouchableOpacity key={lvl} onPress={() => setFitnessLevel(lvl)} activeOpacity={0.7}
                  style={[s.levelChip, { backgroundColor: active ? t.ink : t.surface2, borderColor: active ? 'transparent' : t.line }]}>
                  <Text style={[{ fontSize: 12, fontWeight: '600', color: active ? t.bg : t.muted }]}>
                    {lvl === 'beginner' ? 'Începător' : lvl === 'intermediate' ? 'Intermediar' : 'Avansat'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Goals */}
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
          <Text style={[s.sectionEyebrow, { color: t.muted, fontFamily: MONO }]}>OBIECTIVE</Text>
          <TextInput
            value={goals} onChangeText={setGoals}
            placeholder="ex: slăbire, tonifiere, masă musculară…"
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
            style={[s.textarea, { color: t.ink, backgroundColor: t.surface2, borderColor: t.line }]}
          />
        </View>

        {error ? (
          <View style={[s.errorBanner, { backgroundColor: t.bad + '18', borderColor: t.bad + '40' }]}>
            <FpIcon name="close" size={14} color={t.bad}/>
            <Text style={[{ fontSize: 13, color: t.bad }]}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={() => void handleSave()}
          disabled={saving}
          activeOpacity={0.85}
          style={[s.saveBtn, { backgroundColor: t.primary, opacity: saving ? 0.7 : 1 }]}
        >
          {saving
            ? <ActivityIndicator color={t.primaryInk} size="small"/>
            : <>
                <FpIcon name="check" size={16} color={t.primaryInk}/>
                <Text style={[{ fontSize: 15, fontWeight: '700', color: t.primaryInk }]}>Salvează modificările</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const { t } = useTheme();
  const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
  return (
    <View style={{ gap: 6, marginTop: 12 }}>
      <Text style={[{ fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500', color: t.muted, fontFamily: MONO }]}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  eyebrow:       { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  headerTitle:   { fontSize: 26, letterSpacing: -0.5, lineHeight: 30 },
  content:       { padding: 20, gap: 14, paddingBottom: 80 },
  card:          { borderRadius: 20, borderWidth: 1, padding: 18 },
  sectionEyebrow:{ fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  fieldLabel:    { fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  field: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, outlineWidth: 0,
  } as any,
  textarea: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12,
    fontSize: 14, minHeight: 80, textAlignVertical: 'top', outlineWidth: 0,
  } as any,
  hr: { height: 1, marginTop: 14 },
  levelChip: { flex: 1, paddingVertical: 10, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 12,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 18,
  },
});
