import { api } from "@/services/api";

export type ExerciseType =
  | "running"
  | "walking"
  | "cycling"
  | "swimming"
  | "jump_rope"
  | "yoga"
  | "weight_training"
  | "hiit"
  | "dancing"
  | "hiking"
  | "rowing"
  | "elliptical";

export interface ExerciseLogEntry {
  id: number;
  exercise_type: ExerciseType;
  duration_minutes: number;
  kcal_burned: number;
  notes: string | null;
  logged_at: string;
}

export interface ExerciseLogCreatePayload {
  exercise_type: ExerciseType;
  duration_minutes: number;
  notes?: string;
}

// MET values mirrored from backend — used for live calorie preview on mobile.
export const EXERCISE_MET: Record<ExerciseType, number> = {
  running: 9.8,
  walking: 3.5,
  cycling: 7.5,
  swimming: 8.0,
  jump_rope: 12.3,
  yoga: 2.5,
  weight_training: 5.0,
  hiit: 8.0,
  dancing: 5.5,
  hiking: 6.0,
  rowing: 7.0,
  elliptical: 5.0,
};

export const exerciseApi = {
  getLog: async (): Promise<ExerciseLogEntry[]> => {
    const { data } = await api.get<ExerciseLogEntry[]>("/users/me/exercise-log");
    return data;
  },

  addEntry: async (payload: ExerciseLogCreatePayload): Promise<ExerciseLogEntry> => {
    const { data } = await api.post<ExerciseLogEntry>("/users/me/exercise-log", payload);
    return data;
  },

  deleteEntry: async (id: number): Promise<void> => {
    await api.delete(`/exercise-log/${id}`);
  },
};
