import { create } from "zustand";

import { UserProfile, userApi } from "@/services/userApi";

type UserState = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  setProfile: (profile: UserProfile | null) => void;
  fetchMe: () => Promise<void>;
  clearProfile: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  loading: false,
  error: null,
  setProfile: (profile) => set({ profile }),
  fetchMe: async () => {
    set({ loading: true, error: null });
    try {
      const profile = await userApi.me();
      set({ profile });
    } catch {
      set({ error: "Nu am putut incarca profilul." });
    } finally {
      set({ loading: false });
    }
  },
  clearProfile: () => set({ profile: null, error: null }),
}));
