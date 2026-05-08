import { api } from "@/services/api";

// ── User Profile ──────────────────────────────────────────────────────────────

export type UserProfile = {
  id?: number;
  email?: string;
  name?: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  fitness_level?: string;
  goals?: string;
  daily_calorie_target?: number | null;
  nutrition_target_updated_at?: string | null;
};

export type UserProfileUpdatePayload = {
  name?: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  fitness_level?: string;
  goals?: string;
};

// ── Diet Preferences ─────────────────────────────────────────────────────────

export type DietPreferences = {
  id: number;
  user_id: number;
  restrictions: string[];
  allergies: string[];
  goals: string | null;
  updated_at: string;
};

export type DietPreferencesPayload = {
  restrictions: string[];
  allergies: string[];
  goals: string | null;
};

export type WeightLogEntryDto = {
  id: number;
  user_id: number;
  weight_kg: number;
  logged_at: string;
};

// ── API ───────────────────────────────────────────────────────────────────────

export const userApi = {
  me: async (): Promise<UserProfile> => {
    const { data } = await api.get<UserProfile>("/users/me");
    return data;
  },

  updateMe: async (payload: UserProfileUpdatePayload): Promise<UserProfile> => {
    const { data } = await api.put<UserProfile>("/users/me", payload);
    return data;
  },

  getDietPreferences: async (): Promise<DietPreferences> => {
    const { data } = await api.get<DietPreferences>("/users/me/diet-preferences");
    return data;
  },

  updateDietPreferences: async (
    payload: DietPreferencesPayload,
  ): Promise<DietPreferences> => {
    const { data } = await api.put<DietPreferences>(
      "/users/me/diet-preferences",
      payload,
    );
    return data;
  },

  getWeightLogs: async (): Promise<WeightLogEntryDto[]> => {
    const { data } = await api.get<WeightLogEntryDto[]>("/users/me/weight-log");
    return data;
  },

  postWeightLog: async (payload: { weight_kg: number }): Promise<WeightLogEntryDto> => {
    const { data } = await api.post<WeightLogEntryDto>("/users/me/weight-log", payload);
    return data;
  },
};
