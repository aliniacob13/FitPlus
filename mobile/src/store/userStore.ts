import { create } from "zustand";

import { UserProfile, UserProfileUpdatePayload, userApi } from "@/services/userApi";
import { useFoodDiaryStore } from "@/store/foodDiaryStore";

type UserState = {
  profile: UserProfile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  setProfile: (profile: UserProfile | null) => void;
  fetchMe: () => Promise<void>;
  updateProfile: (payload: UserProfileUpdatePayload) => Promise<boolean>;
  clearProfile: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  loading: false,
  saving: false,
  error: null,
  setProfile: (profile) => set({ profile }),
  fetchMe: async () => {
    set({ loading: true, error: null });
    try {
      const profile = await userApi.me();
      set({ profile });
      useFoodDiaryStore.getState().hydrateCalorieTargetFromServer(profile.daily_calorie_target);
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
      useFoodDiaryStore.getState().hydrateCalorieTargetFromServer(profile.daily_calorie_target);
      return true;
    } catch {
      set({ error: "Nu am putut salva profilul." });
      return false;
    } finally {
      set({ saving: false });
    }
  },
  clearProfile: () => set({ profile: null, error: null }),
}));
