import { create } from "zustand";

import { FavoriteGymEntry, gymApi } from "@/services/gymApi";

type GymStoreState = {
  favorites: FavoriteGymEntry[];
  favoriteGymIds: Set<number>;
  isFetching: boolean;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (gymId: number) => Promise<void>;
  initFavoriteState: (gymId: number, isFavorited: boolean) => void;
};

export const useGymStore = create<GymStoreState>((set, get) => ({
  favorites: [],
  favoriteGymIds: new Set(),
  isFetching: false,

  fetchFavorites: async () => {
    set({ isFetching: true });
    try {
      const favorites = await gymApi.getFavorites();
      set({
        favorites,
        favoriteGymIds: new Set(favorites.map((f) => f.gym_id)),
      });
    } catch {
      // User may not be authenticated — fail silently
    } finally {
      set({ isFetching: false });
    }
  },

  toggleFavorite: async (gymId: number) => {
    const wasIn = get().favoriteGymIds.has(gymId);

    // Optimistic update
    set((state) => {
      const next = new Set(state.favoriteGymIds);
      wasIn ? next.delete(gymId) : next.add(gymId);
      return { favoriteGymIds: next };
    });

    try {
      await gymApi.toggleFavorite(gymId);
      // Refresh favorites list to keep it consistent
      get().fetchFavorites().catch(() => {});
    } catch {
      // Revert on failure
      set((state) => {
        const next = new Set(state.favoriteGymIds);
        wasIn ? next.add(gymId) : next.delete(gymId);
        return { favoriteGymIds: next };
      });
    }
  },

  initFavoriteState: (gymId: number, isFavorited: boolean) => {
    set((state) => {
      const next = new Set(state.favoriteGymIds);
      isFavorited ? next.add(gymId) : next.delete(gymId);
      return { favoriteGymIds: next };
    });
  },
}));
