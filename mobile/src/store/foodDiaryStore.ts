import { create } from "zustand";

import { nutritionApi } from "@/services/nutritionApi";
import type { DailyTotals, FoodLogCreateRequest, FoodLogEntry } from "@/services/nutritionApi";
import { formatApiError } from "@/utils/apiErrors";

const toLocalDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const todayString = () => toLocalDateString(new Date());

export interface WeightEntry {
  date: string;
  weight_kg: number;
}

interface FoodDiaryState {
  date: string;
  entries: FoodLogEntry[];
  totals: DailyTotals;
  dailyKcalTarget: number | null;
  hasCalorieTarget: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Water tracking (per day)
  waterByDate: Record<string, number>;

  // Local weight log
  weightLog: WeightEntry[];

  setDate: (date: string) => void;
  fetchDay: (date: string) => Promise<void>;
  addEntry: (req: FoodLogCreateRequest) => Promise<boolean>;
  deleteEntry: (id: number) => Promise<void>;
  setDailyKcalTarget: (kcal: number) => void;
  hydrateCalorieTargetFromServer: (kcal: number | null | undefined) => void;
  clearCalorieTarget: () => void;

  // Water actions
  logWater: (date: string, delta?: number) => void;
  getWaterGlasses: (date: string) => number;

  // Weight actions
  logWeight: (weight_kg: number) => void;
  getLatestWeight: () => number | null;
}

const EMPTY_TOTALS: DailyTotals = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

export const useFoodDiaryStore = create<FoodDiaryState>((set, get) => ({
  date: todayString(),
  entries: [],
  totals: EMPTY_TOTALS,
  dailyKcalTarget: null,
  hasCalorieTarget: false,
  loading: false,
  saving: false,
  error: null,
  waterByDate: {},
  weightLog: [],

  setDate: (date) => set({ date }),

  fetchDay: async (date) => {
    set({ loading: true, error: null });
    try {
      const { data } = await nutritionApi.getFoodLog(date);
      set({ date, entries: data.entries, totals: data.totals });
    } catch (err) {
      set({ error: formatApiError(err, "Could not load food log.") });
    } finally {
      set({ loading: false });
    }
  },

  addEntry: async (req) => {
    set({ saving: true, error: null });
    try {
      await nutritionApi.addFoodLogEntry(req);
      await get().fetchDay(req.date);
      set({ saving: false });
      return true;
    } catch (err) {
      set({ error: formatApiError(err, "Could not add entry."), saving: false });
      return false;
    }
  },

  deleteEntry: async (id) => {
    set({ error: null });
    try {
      await nutritionApi.deleteFoodLogEntry(id);
      const { date } = get();
      await get().fetchDay(date);
    } catch (err) {
      set({ error: formatApiError(err, "Could not delete entry.") });
    }
  },

  setDailyKcalTarget: (kcal) =>
    set({ dailyKcalTarget: kcal, hasCalorieTarget: true }),

  hydrateCalorieTargetFromServer: (kcal) => {
    if (kcal == null) {
      set({ dailyKcalTarget: null, hasCalorieTarget: false });
      return;
    }
    set({ dailyKcalTarget: kcal, hasCalorieTarget: true });
  },

  clearCalorieTarget: () => set({ dailyKcalTarget: null, hasCalorieTarget: false }),

  logWater: (date, delta = 1) => {
    set((state) => {
      const current = state.waterByDate[date] ?? 0;
      const next = Math.max(0, Math.min(current + delta, 20));
      return { waterByDate: { ...state.waterByDate, [date]: next } };
    });
  },

  getWaterGlasses: (date) => {
    return get().waterByDate[date] ?? 0;
  },

  logWeight: (weight_kg) => {
    const date = todayString();
    set((state) => {
      const filtered = state.weightLog.filter((e) => e.date !== date);
      return { weightLog: [...filtered, { date, weight_kg }].sort((a, b) => a.date.localeCompare(b.date)) };
    });
  },

  getLatestWeight: () => {
    const log = get().weightLog;
    if (log.length === 0) return null;
    return log[log.length - 1].weight_kg;
  },
}));
