import { create } from "zustand";

import { nutritionApi } from "@/services/nutritionApi";
import type { DailyTotals, FoodLogCreateRequest, FoodLogEntry } from "@/services/nutritionApi";

const toLocalDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const todayString = () => toLocalDateString(new Date());

interface FoodDiaryState {
  date: string;
  entries: FoodLogEntry[];
  totals: DailyTotals;
  dailyKcalTarget: number | null;
  hasCalorieTarget: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;

  setDate: (date: string) => void;
  fetchDay: (date: string) => Promise<void>;
  addEntry: (req: FoodLogCreateRequest) => Promise<boolean>;
  deleteEntry: (id: number) => Promise<void>;
  setDailyKcalTarget: (kcal: number) => void;
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

  setDate: (date) => set({ date }),

  fetchDay: async (date) => {
    set({ loading: true, error: null });
    try {
      const { data } = await nutritionApi.getFoodLog(date);
      set({ date, entries: data.entries, totals: data.totals });
    } catch {
      set({ error: "Could not load food log." });
    } finally {
      set({ loading: false });
    }
  },

  addEntry: async (req) => {
    set({ saving: true, error: null });
    try {
      await nutritionApi.addFoodLogEntry(req);
      // Refresh the day after adding
      await get().fetchDay(req.date);
      set({ saving: false });
      return true;
    } catch {
      set({ error: "Could not add entry.", saving: false });
      return false;
    }
  },

  deleteEntry: async (id) => {
    set({ error: null });
    try {
      await nutritionApi.deleteFoodLogEntry(id);
      const { date } = get();
      await get().fetchDay(date);
    } catch {
      set({ error: "Could not delete entry." });
    }
  },

  setDailyKcalTarget: (kcal) =>
    set({
      dailyKcalTarget: kcal,
      hasCalorieTarget: true,
    }),
}));
