import { api } from "@/services/api";

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

export type FoodLogSource = "manual" | "search" | "barcode" | "plate";

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
};
