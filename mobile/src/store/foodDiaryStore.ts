import { create } from "zustand";

import { nutritionApi } from "@/services/nutritionApi";
import { userApi } from "@/services/userApi";
import { wellnessApi } from "@/services/wellnessApi";
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

  // Water (ml per day, server-backed)
  waterMlByDate: Record<string, number>;

  // Weight history (hydrated from weight-log API; latest may mirror profile.weight_kg)
  weightLog: WeightEntry[];

  setDate: (date: string) => void;
  fetchDay: (date: string) => Promise<void>;
  addEntry: (req: FoodLogCreateRequest) => Promise<boolean>;
  deleteEntry: (id: number) => Promise<void>;
  setDailyKcalTarget: (kcal: number) => void;
  hydrateCalorieTargetFromServer: (kcal: number | null | undefined) => void;
  clearCalorieTarget: () => void;

  fetchWaterMl: (date: string) => Promise<void>;
  setWaterMl: (date: string, ml: number) => Promise<boolean>;
  bumpWaterMl: (date: string, deltaMl: number) => Promise<boolean>;
  getWaterMl: (date: string) => number;

  logWeight: (weight_kg: number) => void;
  getLatestWeight: () => number | null;
  hydrateWeightLogsFromServer: () => Promise<void>;
  resetWellnessLocal: () => void;
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
  waterMlByDate: {},
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

  fetchWaterMl: async (date) => {
    try {
      const { ml_total } = await wellnessApi.getWaterIntake(date);
      set((state) => ({
        waterMlByDate: { ...state.waterMlByDate, [date]: ml_total },
      }));
    } catch {
      /* offline / stale cache */
    }
  },

  setWaterMl: async (date, ml) => {
    const clamped = Math.max(0, Math.min(Math.round(ml), 20000));
    try {
      await wellnessApi.putWaterIntake({ log_date: date, ml_total: clamped });
      set((state) => ({
        waterMlByDate: { ...state.waterMlByDate, [date]: clamped },
      }));
      return true;
    } catch {
      set({ error: "Nu am putut salva apa." });
      return false;
    }
  },

  bumpWaterMl: async (date, deltaMl) => {
    const cur = get().getWaterMl(date);
    return get().setWaterMl(date, cur + deltaMl);
  },

  getWaterMl: (date) => get().waterMlByDate[date] ?? 0,

  logWeight: (weight_kg) => {
    const date = todayString();
    set((state) => {
      const filtered = state.weightLog.filter((e) => e.date !== date);
      return {
        weightLog: [...filtered, { date, weight_kg }].sort((a, b) => a.date.localeCompare(b.date)),
      };
    });
  },

  getLatestWeight: () => {
    const log = get().weightLog;
    if (log.length === 0) return null;
    return log[log.length - 1].weight_kg;
  },

  hydrateWeightLogsFromServer: async () => {
    try {
      const logs = await userApi.getWeightLogs();
      const byDay = new Map<string, number>();
      const sorted = [...logs].sort(
        (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
      );
      for (const w of sorted) {
        const d = new Date(w.logged_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        byDay.set(key, w.weight_kg);
      }
      const weightLog = Array.from(byDay.entries())
        .map(([dateStr, w]) => ({ date: dateStr, weight_kg: w }))
        .sort((a, b) => a.date.localeCompare(b.date));
      set({ weightLog });
    } catch {
      /* ignore */
    }
  },

  resetWellnessLocal: () =>
    set({
      waterMlByDate: {},
      weightLog: [],
    }),
}));
