import { create } from 'zustand';

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
  walking:  'Mers pe jos',
  running:  'Alergare',
  cycling:  'Ciclism',
  gym:      'Sală de fitness',
  swimming: 'Înot',
  yoga:     'Yoga',
  other:    'Altele',
};

const ACTIVITY_KCAL_PER_MIN: Record<ActivityType, number> = {
  walking:  4,
  running:  10,
  cycling:  7,
  gym:      6,
  swimming: 9,
  yoga:     3,
  other:    5,
};

export const estimateCalories = (type: ActivityType, duration_min: number): number =>
  Math.round(ACTIVITY_KCAL_PER_MIN[type] * duration_min);

export const activityTypeLabel = (type: ActivityType): string => ACTIVITY_LABELS[type];

interface ActivityState {
  entries: ActivityEntry[];
  addActivity: (entry: Omit<ActivityEntry, 'id'>) => void;
  deleteActivity: (id: string) => void;
  getEntriesForDate: (date: string) => ActivityEntry[];
  getTodayCalories: (date: string) => number;
}

let nextId = 1;

export const useActivityStore = create<ActivityState>((set, get) => ({
  entries: [],

  addActivity: (entry) => {
    const id = String(nextId++);
    set((state) => ({ entries: [...state.entries, { ...entry, id }] }));
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
