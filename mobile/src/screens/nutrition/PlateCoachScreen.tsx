import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { MacroBar } from '@/components/ui/MacroBar';
import type { ClarificationAnswer, PlateAnalysisResponse, PlateItem } from '@/services/nutritionApi';
import { nutritionApi } from '@/services/nutritionApi';
import { useFoodDiaryStore } from '@/store/foodDiaryStore';
import { AppStackParamList } from '@/types/navigation';
import { formatApiError } from '@/utils/apiErrors';

type NavProp = NativeStackNavigationProp<AppStackParamList, 'PlateCoach'>;
type RoutePropType = RouteProp<AppStackParamList, 'PlateCoach'>;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

interface EditableItem extends PlateItem {
  selected: boolean;
  editedName: string;
  editedGrams: string;
}

const pct = (c: number) => `${Math.round(c * 100)}%`;

const imagePickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.85,
  ...(Platform.OS === 'ios'
    ? { preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible }
    : {}),
};

export const PlateCoachScreen = () => {
  const { t } = useTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { date } = route.params;

  const saving = useFoodDiaryStore((s) => s.saving);
  const addEntry = useFoodDiaryStore((s) => s.addEntry);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PlateAnalysisResponse | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [clarifyAnswers, setClarifyAnswers] = useState<Record<number, string>>({});
  const [clarifying, setClarifying] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required.'); return; }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Photo library access is required.'); return; }
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync(imagePickerOptions)
      : await ImagePicker.launchImageLibraryAsync(imagePickerOptions);

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setAnalysis(null);
      setItems([]);
      setClarifyAnswers({});
      await runAnalysis(asset.uri, undefined, asset.mimeType ?? undefined);
    }
  };

  const runAnalysis = async (uri: string, existingConvId?: number, mimeType?: string) => {
    setAnalyzing(true);
    try {
      const { data } = await nutritionApi.analyzePlate(uri, existingConvId, mimeType);
      applyAnalysis(data);
    } catch (err) {
      Alert.alert('Analysis failed', formatApiError(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const applyAnalysis = (data: PlateAnalysisResponse) => {
    setAnalysis(data);
    setItems(data.items.map((it) => ({
      ...it,
      protein_g_estimate: it.protein_g_estimate ?? 0,
      carbs_g_estimate: it.carbs_g_estimate ?? 0,
      fat_g_estimate: it.fat_g_estimate ?? 0,
      selected: true,
      editedName: it.food_name_estimate,
      editedGrams: String(Math.round(it.grams_estimate)),
    })));
    setClarifyAnswers({});
  };

  const handleClarify = async () => {
    if (!analysis) return;
    const answers: ClarificationAnswer[] = analysis.needs_clarification
      .filter((q) => (clarifyAnswers[q.index] ?? '').trim().length > 0)
      .map((q) => ({ index: q.index, answer: clarifyAnswers[q.index].trim() }));
    if (answers.length === 0) { Alert.alert('No answers', 'Please fill in at least one clarification.'); return; }
    setClarifying(true);
    try {
      const { data } = await nutritionApi.clarifyPlate({ conversation_id: analysis.conversation_id, answers });
      applyAnalysis(data);
    } catch (err) {
      Alert.alert('Clarification failed', formatApiError(err));
    } finally {
      setClarifying(false);
    }
  };

  const updateItem = (index: number, field: 'editedName' | 'editedGrams', value: string) => {
    setItems((prev) => prev.map((it) => (it.index === index ? { ...it, [field]: value } : it)));
  };

  const toggleItem = (index: number) => {
    setItems((prev) => prev.map((it) => (it.index === index ? { ...it, selected: !it.selected } : it)));
  };

  const handleAddSelected = async () => {
    const selected = items.filter((it) => it.selected);
    if (selected.length === 0) { Alert.alert('Nothing selected', 'Select at least one item to add.'); return; }
    let allOk = true;
    for (const it of selected) {
      const g = Number(it.editedGrams);
      if (!it.editedName.trim() || !g || g <= 0) continue;
      const baseG = it.grams_estimate > 0 ? it.grams_estimate : g;
      const ratio = g / baseG;
      const ok = await addEntry({
        date,
        name: it.editedName.trim(),
        grams: g,
        kcal: Math.round(it.kcal_estimate * ratio),
        protein_g: Math.round((it.protein_g_estimate ?? 0) * ratio * 10) / 10,
        carbs_g: Math.round((it.carbs_g_estimate ?? 0) * ratio * 10) / 10,
        fat_g: Math.round((it.fat_g_estimate ?? 0) * ratio * 10) / 10,
        source: 'plate',
      });
      if (!ok) allOk = false;
    }
    if (allOk) {
      navigation.goBack();
    } else {
      const detail = useFoodDiaryStore.getState().error ?? 'Some items could not be saved.';
      Alert.alert('Partial save', detail);
    }
  };

  const selectedCount = items.filter((it) => it.selected).length;
  const hasClarifications = (analysis?.needs_clarification.length ?? 0) > 0;

  const plateMacroPreview = useMemo(() => {
    let kcal = 0, p = 0, c = 0, f = 0;
    for (const it of items) {
      const g = Number(it.editedGrams);
      if (!g || g <= 0) continue;
      const baseG = it.grams_estimate > 0 ? it.grams_estimate : g;
      const ratio = g / baseG;
      kcal += it.kcal_estimate * ratio;
      p += (it.protein_g_estimate ?? 0) * ratio;
      c += (it.carbs_g_estimate ?? 0) * ratio;
      f += (it.fat_g_estimate ?? 0) * ratio;
    }
    return { kcal, p, c, f };
  }, [items]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <FpIcon name="left" size={20} color={t.ink}/>
        </TouchableOpacity>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>AI VISION</Text>
          <Text style={[s.headerTitle, { fontFamily: SERIF, color: t.ink }]}>Plate Coach</Text>
        </View>
        <View style={{ width: 20 }}/>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: 22, paddingTop: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo viewport */}
        {imageUri ? (
          <View style={[s.photoWrapper, { borderColor: t.line }]}>
            <Image source={{ uri: imageUri }} style={s.photo} resizeMode="cover"/>
            {analyzing && (
              <View style={s.analyzeOverlay}>
                <ActivityIndicator color={t.primary} size="large"/>
                <Text style={[s.analyzeText, { color: t.ink, fontFamily: MONO }]}>Analizez farfuria…</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[s.placeholder, { borderColor: t.line, backgroundColor: t.surface }]}>
            <FpIcon name="camera" size={32} color={t.muted2}/>
            <Text style={[s.placeholderTitle, { color: t.muted, fontFamily: SERIF }]}>Fotografiază farfuria</Text>
            <Text style={[s.placeholderSub, { color: t.muted2 }]}>
              AI-ul va estima fiecare aliment și caloriile
            </Text>
          </View>
        )}

        {/* Pick buttons */}
        <View style={[s.pickRow, { marginTop: 14 }]}>
          <TouchableOpacity
            onPress={() => void pickImage(true)}
            disabled={analyzing}
            activeOpacity={0.8}
            style={[s.pickBtn, { backgroundColor: t.primary, opacity: analyzing ? 0.5 : 1 }]}
          >
            <FpIcon name="camera" size={16} color={t.bg}/>
            <Text style={[s.pickBtnText, { color: t.bg }]}>Cameră</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => void pickImage(false)}
            disabled={analyzing}
            activeOpacity={0.8}
            style={[s.pickBtn, { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, opacity: analyzing ? 0.5 : 1 }]}
          >
            <FpIcon name="search" size={16} color={t.ink}/>
            <Text style={[s.pickBtnText, { color: t.ink }]}>Galerie</Text>
          </TouchableOpacity>
        </View>

        {/* Analysis results */}
        {analysis != null && !analyzing && (
          <>
            {/* Summary card */}
            <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line, marginTop: 20 }]}>
              <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>ESTIMARE TOTALĂ</Text>
              <Text style={[s.bigKcal, { fontFamily: SERIF, color: t.ink }]}>
                ~{Math.round(plateMacroPreview.kcal)} <Text style={{ fontSize: 16, color: t.muted }}>kcal</Text>
              </Text>
              <View style={{ marginTop: 14, gap: 8 }}>
                <MacroBar label="Proteine" value={Math.round(plateMacroPreview.p)} target={100} color={t.macroProtein}/>
                <MacroBar label="Carbohidrați" value={Math.round(plateMacroPreview.c)} target={250} color={t.macroCarbs}/>
                <MacroBar label="Grăsimi" value={Math.round(plateMacroPreview.f)} target={67} color={t.macroFat}/>
              </View>
              {analysis.assumptions.length > 0 && (
                <Text style={[s.assumptions, { color: t.muted2, marginTop: 10 }]}>{analysis.assumptions}</Text>
              )}
            </View>

            {/* Detected items */}
            <Text style={[s.sectionTitle, { color: t.ink, fontFamily: SERIF, marginTop: 22 }]}>
              Alimente detectate
            </Text>
            <Text style={[s.sectionSub, { color: t.muted }]}>Editează înainte de a salva</Text>

            <View style={{ gap: 12, marginTop: 12 }}>
              {items.map((it) => (
                <ItemCard
                  key={it.index}
                  item={it}
                  onToggle={toggleItem}
                  onNameChange={(v) => updateItem(it.index, 'editedName', v)}
                  onGramsChange={(v) => updateItem(it.index, 'editedGrams', v)}
                />
              ))}
            </View>

            {/* Clarification */}
            {hasClarifications && (
              <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line, marginTop: 16, gap: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FpIcon name="spark" size={16} color={t.primary}/>
                  <Text style={[s.sectionTitle, { color: t.ink }]}>AI are întrebări</Text>
                </View>
                <Text style={[{ fontSize: 12, color: t.muted }]}>
                  Răspunde pentru estimări mai precise.
                </Text>
                {analysis.needs_clarification.map((q) => (
                  <View key={q.index} style={{ gap: 6 }}>
                    <Text style={[{ fontSize: 13, fontWeight: '500', color: t.ink2 }]}>
                      #{q.index}: {q.question}
                    </Text>
                    <TextInput
                      style={[s.clarifyInput, { borderColor: t.line, backgroundColor: t.surface2, color: t.ink }]}
                      value={clarifyAnswers[q.index] ?? ''}
                      onChangeText={(v) => setClarifyAnswers((prev) => ({ ...prev, [q.index]: v }))}
                      placeholder="Răspunsul tău…"
                      placeholderTextColor={t.muted2}
                    />
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => void handleClarify()}
                  disabled={clarifying}
                  activeOpacity={0.8}
                  style={[s.ghostBtn, { borderColor: t.primary + '60' }]}
                >
                  {clarifying ? <ActivityIndicator size="small" color={t.primary}/> : (
                    <Text style={[{ fontSize: 14, fontWeight: '600', color: t.primary }]}>
                      Trimite răspunsurile
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Save to diary */}
            <TouchableOpacity
              onPress={() => void handleAddSelected()}
              disabled={saving || selectedCount === 0}
              activeOpacity={0.85}
              style={[s.primaryBtn, { backgroundColor: t.primary, opacity: (saving || selectedCount === 0) ? 0.5 : 1, marginTop: 20 }]}
            >
              {saving ? <ActivityIndicator size="small" color={t.bg}/> : (
                <>
                  <FpIcon name="plus" size={16} color={t.bg}/>
                  <Text style={[{ fontSize: 14, fontWeight: '600', color: t.bg }]}>
                    {selectedCount > 0
                      ? `Salvează ${selectedCount} ${selectedCount === 1 ? 'aliment' : 'alimente'} în jurnal`
                      : 'Salvează în jurnal'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <Text style={[s.disclaimer, { color: t.muted2 }]}>
          {analysis?.disclaimer ?? 'Estimări orientative — nu reprezintă sfat medical.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const ItemCard = ({
  item, onToggle, onNameChange, onGramsChange,
}: {
  item: EditableItem;
  onToggle: (index: number) => void;
  onNameChange: (v: string) => void;
  onGramsChange: (v: string) => void;
}) => {
  const { t } = useTheme();
  const g = Number(item.editedGrams);
  const baseG = item.grams_estimate > 0 ? item.grams_estimate : g > 0 ? g : 1;
  const ratio = g > 0 ? g / baseG : 1;
  const previewKcal = Math.round(item.kcal_estimate * ratio);
  const previewP = Math.round((item.protein_g_estimate ?? 0) * ratio);
  const previewC = Math.round((item.carbs_g_estimate ?? 0) * ratio);
  const previewF = Math.round((item.fat_g_estimate ?? 0) * ratio);
  const confColor = item.confidence >= 0.75 ? t.good : item.confidence >= 0.5 ? t.accent : t.bad;

  return (
    <View style={[s.card, {
      backgroundColor: item.selected ? t.surface : t.surface2,
      borderColor: item.selected ? t.primary + '50' : t.line,
    }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => onToggle(item.index)}
          activeOpacity={0.7}
          style={[s.checkbox, {
            borderColor: item.selected ? t.primary : t.line,
            backgroundColor: item.selected ? t.primary : 'transparent',
          }]}
        >
          {item.selected && <FpIcon name="check" size={12} color={t.bg}/>}
        </TouchableOpacity>
        <View style={[s.confBadge, { backgroundColor: confColor + '20' }]}>
          <Text style={[{ fontSize: 10, fontWeight: '700', color: confColor, fontFamily: 'monospace' }]}>
            {pct(item.confidence)}
          </Text>
        </View>
      </View>

      <TextInput
        style={[s.nameInput, { borderColor: t.line, backgroundColor: t.surface2, color: t.ink }]}
        value={item.editedName}
        onChangeText={onNameChange}
        autoCapitalize="sentences"
        placeholder="Aliment"
        placeholderTextColor={t.muted2}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <View style={{ flex: 1 }}>
          <TextInput
            style={[s.nameInput, { borderColor: t.line, backgroundColor: t.surface2, color: t.ink }]}
            value={item.editedGrams}
            onChangeText={onGramsChange}
            keyboardType="numeric"
            placeholder="Grame"
            placeholderTextColor={t.muted2}
          />
        </View>
        <View style={[s.kcalPill, { backgroundColor: t.accentSoft }]}>
          <Text style={[{ fontSize: 12, fontWeight: '700', color: t.accent, fontFamily: 'monospace' }]}>
            ~{previewKcal} kcal
          </Text>
        </View>
      </View>

      <Text style={[{ fontSize: 11, color: t.muted, marginTop: 6, fontFamily: 'monospace' }]}>
        P {previewP}g · C {previewC}g · F {previewF}g
      </Text>
    </View>
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
  photoWrapper: { borderRadius: 22, borderWidth: 1, overflow: 'hidden', height: 260 },
  photo: { width: '100%', height: '100%' },
  analyzeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  analyzeText: { fontSize: 13, letterSpacing: 1.2 },
  placeholder: {
    height: 220, borderRadius: 22, borderWidth: 1, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32,
  },
  placeholderTitle: { fontSize: 18, letterSpacing: -0.3, marginTop: 8 },
  placeholderSub: { fontSize: 12, textAlign: 'center' },
  pickRow: { flexDirection: 'row', gap: 10 },
  pickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 16,
  },
  pickBtnText: { fontSize: 14, fontWeight: '600' },
  card: { borderRadius: 22, borderWidth: 1, padding: 18 },
  bigKcal: { fontSize: 36, fontWeight: '700', letterSpacing: -1, marginTop: 4 },
  assumptions: { fontSize: 11 },
  sectionTitle: { fontSize: 20, letterSpacing: -0.3, fontWeight: '600' },
  sectionSub: { fontSize: 12, marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  confBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  nameInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  kcalPill: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-end' },
  clarifyInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 44, fontSize: 14 },
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 16, borderWidth: 1,
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 18,
  },
  disclaimer: { fontSize: 11, textAlign: 'center', paddingHorizontal: 16, marginTop: 20 },
});