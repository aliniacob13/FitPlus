import { create } from "zustand";

import {
  DietPreferences,
  DietPreferencesPayload,
  UserProfile,
  UserProfileUpdatePayload,
  userApi,
} from "@/services/userApi";
import { useFoodDiaryStore } from "@/store/foodDiaryStore";

// ── State shape ───────────────────────────────────────────────────────────────

type UserState = {
  // Profile
  profile: UserProfile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Diet preferences
  dietPreferences: DietPreferences | null;
  dietLoading: boolean;
  dietSaving: boolean;
  dietError: string | null;

  // Profile actions
  setProfile: (profile: UserProfile | null) => void;
  fetchMe: () => Promise<void>;
  updateProfile: (payload: UserProfileUpdatePayload) => Promise<boolean>;
  clearProfile: () => void;

  // Diet actions
  fetchDietPreferences: () => Promise<void>;
  updateDietPreferences: (payload: DietPreferencesPayload) => Promise<boolean>;
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useUserStore = create<UserState>((set) => ({
  // ── Profile ─────────────────────────────────────────────────────────────
  profile: null,
  loading: false,
  saving: false,
  error: null,

  // ── Diet ────────────────────────────────────────────────────────────────
  dietPreferences: null,
  dietLoading: false,
  dietSaving: false,
  dietError: null,

  // ── Profile actions ──────────────────────────────────────────────────────

  setProfile: (profile) => set({ profile }),

  fetchMe: async () => {
    set({ loading: true, error: null });
    try {
      const profile = await userApi.me();
      set({ profile });
      useFoodDiaryStore
        .getState()
        .hydrateCalorieTargetFromServer(profile.daily_calorie_target);
    } catch {
      set({ error: "Nu am putut incarca profilul." });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (payload) => {
    set({ saving: true, error: null });
    try {
      const profile = await userApi.updateMe(payload);
      set({ profile });
      useFoodDiaryStore
        .getState()
        .hydrateCalorieTargetFromServer(profile.daily_calorie_target);
      return true;
    } catch {
      set({ error: "Nu am putut salva profilul." });
      return false;
    } finally {
      set({ saving: false });
    }
  },

  clearProfile: () => set({ profile: null, error: null }),

  // ── Diet preference actions ───────────────────────────────────────────────

  fetchDietPreferences: async () => {
    set({ dietLoading: true, dietError: null });
    try {
      const dietPreferences = await userApi.getDietPreferences();
      set({ dietPreferences });
    } catch {
      set({ dietError: "Nu am putut incarca preferintele alimentare." });
    } finally {
      set({ dietLoading: false });
    }
  },

  updateDietPreferences: async (payload) => {
    set({ dietSaving: true, dietError: null });
    try {
      const dietPreferences = await userApi.updateDietPreferences(payload);
      set({ dietPreferences });
      return true;
    } catch {
      set({ dietError: "Nu am putut salva preferintele alimentare." });
      return false;
    } finally {
      set({ dietSaving: false });
    }
  },
}));
