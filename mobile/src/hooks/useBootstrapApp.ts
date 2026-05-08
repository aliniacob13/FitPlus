import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useActivityStore } from "@/store/activityStore";
import { todayString, useFoodDiaryStore } from "@/store/foodDiaryStore";
import { useUserStore } from "@/store/userStore";

/**
 * useBootstrapApp
 *
 * Runs once on app startup (mounted in the root component).
 * - Hydrates auth tokens from secure storage
 * - Fetches the user profile + diet preferences when authenticated
 * - Clears all local state on logout
 */
export const useBootstrapApp = () => {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const isBootstrapped = useAuthStore((state) => state.isBootstrapped);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const fetchMe = useUserStore((state) => state.fetchMe);
  const clearProfile = useUserStore((state) => state.clearProfile);
  const fetchDietPreferences = useUserStore(
    (state) => state.fetchDietPreferences,
  );

  const resetAllChats = useChatStore((state) => state.resetAll);

  // Step 1 — restore tokens from secure storage
  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  // Step 2 — once we know the auth state, load or clear data
  useEffect(() => {
    if (!isBootstrapped) return;

    if (isAuthenticated) {
      // Kick off both fetches in parallel; neither is blocking for the UI.
      void fetchMe();
      void fetchDietPreferences();
      void useActivityStore.getState().fetchActivities();
      void useFoodDiaryStore.getState().hydrateWeightLogsFromServer();
      void useFoodDiaryStore.getState().fetchWaterMl(todayString());
    } else {
      // User is logged out — clear all cached state.
      clearProfile();
      resetAllChats();
    }
  }, [
    isAuthenticated,
    isBootstrapped,
    fetchMe,
    clearProfile,
    fetchDietPreferences,
    resetAllChats,
  ]);

  return { isBootstrapped };
};
