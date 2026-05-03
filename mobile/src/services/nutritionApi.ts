import { api } from "@/services/api";

const guessImageMime = (uri: string): string => {
  const lower = uri.split("?")[0]?.toLowerCase() ?? "";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".heif")) return "image/heif";
  return "image/jpeg";
};

const normalizeMime = (mime: string | undefined): string | undefined => {
  if (!mime) return undefined;
  const m = mime.toLowerCase();
  if (m === "image/jpg") return "image/jpeg";
  return m;
};

// ── Phase 1 — TDEE calculator ────────────────────────────────────────────────

export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";
export type Goal = "lose" | "maintain" | "gain";

export interface NutritionTargetRequest {
  sex: Sex;
  age: number;
  weight_kg: number;
  height_cm: number;
  activity_level: ActivityLevel;
  goal: Goal;
  weekly_rate_kg?: number;
}

export interface MacrosSuggestion {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface NutritionTargetResponse {
  bmr: number;
  tdee: number;
  target_calories: number;
  macros_suggestion: MacrosSuggestion;
}

// ── Phase 2 — Food search ────────────────────────────────────────────────────

export interface FoodPer100g {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface FoodSearchResultItem {
  name: string;
  external_id: string;
  per_100g: FoodPer100g;
  serving_g: number;
}

// ── Phase 2 — Food log ───────────────────────────────────────────────────────

export type FoodLogSource = "manual" | "search" | "barcode" | "plate" | "label_scan";

export interface FoodLogCreateRequest {
  date: string; // YYYY-MM-DD
  name: string;
  grams: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source: FoodLogSource;
  external_id?: string;
}

export interface FoodLogEntry {
  id: number;
  date: string;
  name: string;
  grams: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source: FoodLogSource;
  created_at: string;
}

export interface DailyTotals {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface FoodLogDayResponse {
  date: string;
  entries: FoodLogEntry[];
  totals: DailyTotals;
}

// ── Phase 3 — Label scan ─────────────────────────────────────────────────────

export interface LabelScanResult {
  kcal: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  protein_g: number | null;
  serving_size_g: number | null;
  per_100g: boolean;
  confidence: number; // 0.0 – 1.0
}

// ── Phase 4 — Plate coach ────────────────────────────────────────────────────

export interface PlateItem {
  index: number;
  food_name_estimate: string;
  grams_estimate: number;
  kcal_estimate: number;
  protein_g_estimate: number;
  carbs_g_estimate: number;
  fat_g_estimate: number;
  confidence: number; // 0.0 – 1.0
}

export interface ClarificationQuestion {
  index: number;
  question: string;
}

export interface PlateAnalysisResponse {
  items: PlateItem[];
  total_kcal_estimate: number;
  assumptions: string;
  needs_clarification: ClarificationQuestion[];
  conversation_id: number;
  disclaimer: string;
}

export interface ClarificationAnswer {
  index: number;
  answer: string;
}

export interface ClarificationRequest {
  conversation_id: number;
  answers: ClarificationAnswer[];
}

// ── API client ───────────────────────────────────────────────────────────────

export const nutritionApi = {
  // Phase 1
  computeTargets: (payload: NutritionTargetRequest) =>
    api.post<NutritionTargetResponse>("/users/me/nutrition-targets/compute", payload),

  // Phase 2 — food search
  searchFoods: (q: string, page = 1) =>
    api.get<FoodSearchResultItem[]>("/nutrition/foods/search", { params: { q, page } }),

  // Phase 2 — food log
  getFoodLog: (date: string) =>
    api.get<FoodLogDayResponse>("/users/me/food-log", { params: { date } }),

  addFoodLogEntry: (payload: FoodLogCreateRequest) =>
    api.post<FoodLogEntry>("/users/me/food-log", payload),

  deleteFoodLogEntry: (id: number) =>
    api.delete(`/food-log/${id}`),

  // Phase 4 — plate coach
  analyzePlate: (imageUri: string, conversationId?: number, mimeType?: string) => {
    const formData = new FormData();
    const mime = normalizeMime(mimeType) ?? guessImageMime(imageUri);
    const ext =
      mime === "image/png"
        ? "png"
        : mime === "image/webp"
          ? "webp"
          : mime === "image/heic" || mime === "image/heif"
            ? "heic"
            : "jpg";
    formData.append("image", {
      uri: imageUri,
      type: mime,
      name: `plate.${ext}`,
    } as unknown as Blob);
    if (conversationId != null) {
      formData.append("conversation_id", String(conversationId));
    }
    return api.post<PlateAnalysisResponse>("/ai/nutrition/plate/analyze", formData, {
      timeout: 60000,
    });
  },

  clarifyPlate: (payload: ClarificationRequest) =>
    api.post<PlateAnalysisResponse>("/ai/nutrition/plate/clarify", payload),

  // Phase 3 — label scan
  scanLabel: (imageUri: string, mimeType?: string) => {
    const formData = new FormData();
    const mime = normalizeMime(mimeType) ?? guessImageMime(imageUri);
    const ext =
      mime === "image/png"
        ? "png"
        : mime === "image/webp"
          ? "webp"
          : mime === "image/heic" || mime === "image/heif"
            ? "heic"
            : "jpg";
    formData.append("image", {
      uri: imageUri,
      type: mime,
      name: `label.${ext}`,
    } as unknown as Blob);
    return api.post<LabelScanResult>("/nutrition/label-scan", formData, {
      timeout: 30000, // OCR can take longer than the default 15 s
    });
  },
};
