import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";

export const useBootstrapApp = () => {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const isBootstrapped = useAuthStore((state) => state.isBootstrapped);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchMe = useUserStore((state) => state.fetchMe);
  const clearProfile = useUserStore((state) => state.clearProfile);

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    if (!isBootstrapped) {
      return;
    }
    if (isAuthenticated) {
      void fetchMe();
    } else {
      clearProfile();
    }
  }, [isAuthenticated, isBootstrapped, fetchMe, clearProfile]);

  return { isBootstrapped };
};
