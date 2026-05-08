import React, { useState } from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import type { FoodSearchResultItem, MealType } from '@/services/nutritionApi';
import { nutritionApi } from '@/services/nutritionApi';
import { useFoodDiaryStore, todayString } from '@/store/foodDiaryStore';
import { formatApiError } from '@/utils/apiErrors';
import { AppStackParamList } from '@/types/navigation';

type NavProp = NativeStackNavigationProp<AppStackParamList, 'AddFood'>;
type RoutePropType = RouteProp<AppStackParamList, 'AddFood'>;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO  = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

type Mode = 'search' | 'manual';

const MEALS: { key: MealType; label: string; emoji: string }[] = [
  { key: 'Breakfast', label: 'Mic dejun', emoji: '☕' },
  { key: 'Lunch',     label: 'Prânz',     emoji: '🥗' },
  { key: 'Dinner',    label: 'Cină',       emoji: '🌙' },
  { key: 'Snack',     label: 'Gustare',   emoji: '🍎' },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

const computeFromPer100g = (per100g: FoodSearchResultItem['per_100g'], grams: number) => ({
  kcal:      round2((per100g.kcal      * grams) / 100),
  protein_g: round2((per100g.protein_g * grams) / 100),
  carbs_g:   round2((per100g.carbs_g   * grams) / 100),
  fat_g:     round2((per100g.fat_g     * grams) / 100),
});

function guessMeal(): MealType {
  const h = new Date().getHours();
  if (h < 10) return 'Breakfast';
  if (h < 14) return 'Lunch';
  if (h < 18) return 'Snack';
  return 'Dinner';
}

export const AddFoodScreen = () => {
  const { t } = useTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { date } = route.params;

  const saving   = useFoodDiaryStore((s) => s.saving);
  const addEntry = useFoodDiaryStore((s) => s.addEntry);

  const [mode,         setMode]         = useState<Mode>('search');
  const [mealType,     setMealType]     = useState<MealType>(guessMeal());

  const [query,        setQuery]        = useState('');
  const [searching,    setSearching]    = useState(false);
  const [results,      setResults]      = useState<FoodSearchResultItem[]>([]);
  const [searchError,  setSearchError]  = useState<string | null>(null);
  const [selected,     setSelected]     = useState<FoodSearchResultItem | null>(null);
  const [grams,        setGrams]        = useState('100');

  const [manualName,    setManualName]    = useState('');
  const [manualGrams,   setManualGrams]   = useState('');
  const [manualKcal,    setManualKcal]    = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs,   setManualCarbs]   = useState('');
  const [manualFat,     setManualFat]     = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setSearchError(null); setSelected(null);
    try {
      const { data } = await nutritionApi.searchFoods(query.trim());
      setResults(data);
      if (data.length === 0) setSearchError('Niciun rezultat. Încearcă alt termen.');
    } catch (err) {
      setSearchError(formatApiError(err, 'Căutarea a eșuat.'));
    } finally {
      setSearching(false);
    }
  };

  const handleAddFromSearch = async () => {
    if (!selected) return;
    const g = Number(grams);
    if (!g || g <= 0) return;
    const macros = computeFromPer100g(selected.per_100g, g);
    const ok = await addEntry({ date, name: selected.name, grams: g, ...macros, source: 'search', external_id: selected.external_id, meal_type: mealType });
    if (ok) navigation.goBack();
  };

  const handleAddManual = async () => {
    const g = Number(manualGrams);
    if (!manualName.trim() || !g || g <= 0) return;
    const ok = await addEntry({
      date, name: manualName.trim(), grams: g,
      kcal: Number(manualKcal) || 0,
      protein_g: Number(manualProtein) || 0,
      carbs_g: Number(manualCarbs) || 0,
      fat_g: Number(manualFat) || 0,
      source: 'manual', meal_type: mealType,
    });
    if (ok) navigation.goBack();
  };

  const selectedGrams = Number(grams) || 0;
  const preview = selected ? computeFromPer100g(selected.per_100g, selectedGrams) : null;

  const dateLabel = date === todayString() ? 'Azi' :
    new Date(date + 'T00:00:00').toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: t.lineSoft }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={s.backBtn}>
          <FpIcon name="left" size={20} color={t.ink}/>
        </TouchableOpacity>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>ADAUGĂ MASĂ</Text>
          <Text style={[s.headerTitle, { fontFamily: SERIF, color: t.ink }]}>{dateLabel}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('LabelScan', { date })}
          activeOpacity={0.7}
          style={[s.scanBtn, { backgroundColor: t.surface2, borderColor: t.line }]}
        >
          <FpIcon name="camera" size={16} color={t.accent}/>
          <Text style={[{ fontSize: 12, fontWeight: '600', color: t.accent }]}>Scan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Meal type selector */}
        <View style={{ gap: 8 }}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>TIP MASĂ</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {MEALS.map((m) => {
              const active = mealType === m.key;
              return (
                <TouchableOpacity
                  key={m.key} onPress={() => setMealType(m.key)} activeOpacity={0.7}
                  style={[s.mealChip, { backgroundColor: active ? t.ink : t.surface2, borderColor: active ? 'transparent' : t.line }]}
                >
                  <Text style={{ fontSize: 14 }}>{m.emoji}</Text>
                  <Text style={[{ fontSize: 11, fontWeight: '600', color: active ? t.bg : t.muted }]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Mode switcher */}
        <View style={[s.modeSeg, { backgroundColor: t.surface2, borderColor: t.line }]}>
          {(['search', 'manual'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m} onPress={() => setMode(m)} activeOpacity={0.7}
              style={[s.modeBtn, mode === m && { backgroundColor: t.ink }]}
            >
              <Text style={[{ fontSize: 12, fontWeight: '600', color: mode === m ? t.bg : t.muted }]}>
                {m === 'search' ? 'Caută baza de date' : 'Introdu manual'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'search' ? (
          <>
            {/* Search bar */}
            <View style={{ gap: 8 }}>
              <View style={[s.searchRow, { backgroundColor: t.surface, borderColor: t.line }]}>
                <FpIcon name="search" size={16} color={t.muted}/>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="ex: piept de pui, măr, orez…"
                  placeholderTextColor={t.muted2}
                  returnKeyType="search"
                  onSubmitEditing={() => void handleSearch()}
                  autoCapitalize="none"
                  style={[s.searchInput, { color: t.ink }]}
                />
                <TouchableOpacity
                  onPress={() => void handleSearch()}
                  disabled={searching}
                  activeOpacity={0.85}
                  style={[s.searchSubmit, { backgroundColor: t.primary }]}
                >
                  {searching
                    ? <ActivityIndicator color={t.primaryInk} size="small"/>
                    : <Text style={[{ fontSize: 12, fontWeight: '700', color: t.primaryInk }]}>Caută</Text>
                  }
                </TouchableOpacity>
              </View>
              {searchError ? <Text style={[{ fontSize: 12, color: t.bad }]}>{searchError}</Text> : null}
            </View>

            {/* Results */}
            {results.length > 0 && !selected ? (
              <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
                {results.slice(0, 15).map((item, idx) => (
                  <View key={item.external_id}>
                    <TouchableOpacity
                      style={s.resultRow}
                      onPress={() => { setSelected(item); setGrams('100'); }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[{ fontSize: 13, fontWeight: '600', color: t.ink }]} numberOfLines={2}>{item.name}</Text>
                        <Text style={[{ fontSize: 11, color: t.muted, fontFamily: MONO }]}>
                          per 100g · {Math.round(item.per_100g.kcal)} kcal · P {Math.round(item.per_100g.protein_g)}g
                        </Text>
                      </View>
                      <View style={[s.selectBadge, { backgroundColor: t.primarySoft }]}>
                        <Text style={[{ fontSize: 11, fontWeight: '600', color: t.primary }]}>Selectează</Text>
                      </View>
                    </TouchableOpacity>
                    {idx < results.length - 1 && <View style={[s.divider, { backgroundColor: t.lineSoft }]}/>}
                  </View>
                ))}
              </View>
            ) : null}

            {/* Selected item */}
            {selected ? (
              <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <Text style={[{ fontSize: 15, fontWeight: '700', color: t.ink, flex: 1, marginRight: 12 }]} numberOfLines={2}>
                    {selected.name}
                  </Text>
                  <TouchableOpacity onPress={() => setSelected(null)}>
                    <Text style={[{ fontSize: 12, fontWeight: '600', color: t.primary }]}>Schimbă</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ gap: 6 }}>
                  <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>GRAMAJ (g)</Text>
                  <TextInput
                    value={grams}
                    onChangeText={setGrams}
                    placeholder="100"
                    keyboardType="numeric"
                    style={[s.field, { backgroundColor: t.surface2, borderColor: t.line, color: t.ink }]}
                  />
                </View>

                {preview && selectedGrams > 0 ? (
                  <View style={[s.previewRow, { borderTopColor: t.lineSoft, borderBottomColor: t.lineSoft }]}>
                    {[
                      { label: 'Kcal',     val: Math.round(preview.kcal),      color: t.accent },
                      { label: 'Proteine', val: Math.round(preview.protein_g), color: t.macroProtein },
                      { label: 'Glucide',  val: Math.round(preview.carbs_g),   color: t.macroCarbs },
                      { label: 'Grăsimi', val: Math.round(preview.fat_g),     color: t.macroFat },
                    ].map((chip) => (
                      <View key={chip.label} style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={[{ fontSize: 18, fontWeight: '800', color: chip.color, fontFamily: MONO }]}>{chip.val}</Text>
                        <Text style={[{ fontSize: 10, color: t.muted, fontFamily: MONO, marginTop: 2 }]}>{chip.label}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={() => void handleAddFromSearch()}
                  disabled={saving || !selectedGrams || selectedGrams <= 0}
                  activeOpacity={0.85}
                  style={[s.addBtn, { backgroundColor: t.primary, opacity: saving ? 0.6 : 1 }]}
                >
                  {saving
                    ? <ActivityIndicator color={t.primaryInk} size="small"/>
                    : <>
                        <FpIcon name="plus" size={16} color={t.primaryInk}/>
                        <Text style={[{ fontSize: 14, fontWeight: '700', color: t.primaryInk }]}>Adaugă în jurnal</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        ) : (
          /* Manual entry */
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, marginBottom: 16 }]}>DATE NUTRITIONALE</Text>
            {[
              { label: 'Denumire aliment', value: manualName,    set: setManualName,    kb: 'default'  as const, cap: 'words' as const },
              { label: 'Gramaj (g)',        value: manualGrams,   set: setManualGrams,   kb: 'numeric'  as const, cap: 'none'  as const },
              { label: 'Calorii (kcal)',    value: manualKcal,    set: setManualKcal,    kb: 'numeric'  as const, cap: 'none'  as const },
              { label: 'Proteine (g)',      value: manualProtein, set: setManualProtein, kb: 'numeric'  as const, cap: 'none'  as const },
              { label: 'Glucide (g)',       value: manualCarbs,   set: setManualCarbs,   kb: 'numeric'  as const, cap: 'none'  as const },
              { label: 'Grăsimi (g)',      value: manualFat,     set: setManualFat,     kb: 'numeric'  as const, cap: 'none'  as const },
            ].map((f) => (
              <View key={f.label} style={{ gap: 4, marginBottom: 12 }}>
                <Text style={[s.fieldLabel, { color: t.muted, fontFamily: MONO }]}>{f.label.toUpperCase()}</Text>
                <TextInput
                  value={f.value}
                  onChangeText={f.set}
                  keyboardType={f.kb}
                  autoCapitalize={f.cap}
                  style={[s.field, { backgroundColor: t.surface2, borderColor: t.line, color: t.ink }]}
                />
              </View>
            ))}
            <TouchableOpacity
              onPress={() => void handleAddManual()}
              disabled={saving || !manualName.trim() || !manualGrams.trim()}
              activeOpacity={0.85}
              style={[s.addBtn, { backgroundColor: t.primary, opacity: saving || !manualName.trim() ? 0.5 : 1 }]}
            >
              {saving
                ? <ActivityIndicator color={t.primaryInk} size="small"/>
                : <>
                    <FpIcon name="plus" size={16} color={t.primaryInk}/>
                    <Text style={[{ fontSize: 14, fontWeight: '700', color: t.primaryInk }]}>Adaugă în jurnal</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}
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
  backBtn: { padding: 4 },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  headerTitle: { fontSize: 22, letterSpacing: -0.4, lineHeight: 26 },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
  },
  content: { padding: 20, gap: 16, paddingBottom: 80 },
  mealChip: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1,
  },
  modeSeg: { flexDirection: 'row', borderRadius: 999, padding: 3, gap: 2, borderWidth: 1 },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4,
  },
  searchInput: { flex: 1, fontSize: 14, height: 44, outlineWidth: 0 } as any,
  searchSubmit: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  card: { borderRadius: 20, borderWidth: 1, padding: 18 },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  selectBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  divider: { height: 1 },
  fieldLabel: { fontSize: 9, letterSpacing: 1.8, fontWeight: '500' },
  field: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, outlineWidth: 0,
  } as any,
  previewRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, marginVertical: 14,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 16,
  },
});
