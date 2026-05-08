import { create } from 'zustand';

import { wellnessApi, type PhysicalActivityDto } from '@/services/wellnessApi';

export type ActivityType = 'walking' | 'running' | 'cycling' | 'gym' | 'swimming' | 'yoga' | 'other';

export interface ActivityEntry {
  id: string;
  date: string;
  type: ActivityType;
  title: string;
  duration_min: number;
  distance_km?: number;
  calories_burned?: number;
  notes?: string;
}

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  walking: 'Mers pe jos',
  running: 'Alergare',
  cycling: 'Ciclism',
  gym: 'Sală de fitness',
  swimming: 'Înot',
  yoga: 'Yoga',
  other: 'Altele',
};

const ACTIVITY_KCAL_PER_MIN: Record<ActivityType, number> = {
  walking: 4,
  running: 10,
  cycling: 7,
  gym: 6,
  swimming: 9,
  yoga: 3,
  other: 5,
};

export const estimateCalories = (type: ActivityType, duration_min: number): number =>
  Math.round(ACTIVITY_KCAL_PER_MIN[type] * duration_min);

export const activityTypeLabel = (type: ActivityType): string => ACTIVITY_LABELS[type];

const isActivityType = (v: string): v is ActivityType =>
  v === 'walking' ||
  v === 'running' ||
  v === 'cycling' ||
  v === 'gym' ||
  v === 'swimming' ||
  v === 'yoga' ||
  v === 'other';

function mapDto(row: PhysicalActivityDto): ActivityEntry {
  const type = isActivityType(row.activity_type) ? row.activity_type : 'other';
  return {
    id: String(row.id),
    date: row.activity_date,
    type,
    title: activityTypeLabel(type),
    duration_min: row.duration_min,
    distance_km: row.distance_km ?? undefined,
    calories_burned: row.calories_burned ?? undefined,
    notes: row.notes ?? undefined,
  };
}

interface ActivityState {
  entries: ActivityEntry[];
  loading: boolean;
  error: string | null;
  fetchActivities: () => Promise<void>;
  addActivity: (entry: Omit<ActivityEntry, 'id'>) => Promise<boolean>;
  deleteActivity: (id: string) => void;
  getEntriesForDate: (date: string) => ActivityEntry[];
  getTodayCalories: (date: string) => number;
  clear: () => void;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,

  clear: () => set({ entries: [], error: null }),

  fetchActivities: async () => {
    set({ loading: true, error: null });
    try {
      const rows = await wellnessApi.listPhysicalActivities();
      set({ entries: rows.map(mapDto), loading: false });
    } catch {
      set({ error: 'Nu am putut încărca activitățile.', loading: false });
    }
  },

  addActivity: async (entry) => {
    try {
      const created = await wellnessApi.createPhysicalActivity({
        activity_date: entry.date,
        activity_type: entry.type,
        duration_min: entry.duration_min,
        distance_km: entry.distance_km,
        calories_burned: entry.calories_burned,
        notes: entry.notes,
      });
      const mapped = mapDto(created);
      set((state) => ({ entries: [mapped, ...state.entries] }));
      return true;
    } catch {
      set({ error: 'Nu am putut salva activitatea.' });
      return false;
    }
  },

  deleteActivity: (id) => {
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
  },

  getEntriesForDate: (date) => get().entries.filter((e) => e.date === date),

  getTodayCalories: (date) =>
    get()
      .entries.filter((e) => e.date === date)
      .reduce((sum, e) => sum + (e.calories_burned ?? 0), 0),
}));
