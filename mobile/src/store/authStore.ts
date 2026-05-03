import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import { AuthResponse, authApi } from "@/services/authApi";
import { setApiAuthHandlers } from "@/services/api";
import { useFoodDiaryStore } from "@/store/foodDiaryStore";

const ACCESS_TOKEN_KEY = "fitplus.access_token";
const REFRESH_TOKEN_KEY = "fitplus.refresh_token";
let fallbackAccessToken: string | null = null;
let fallbackRefreshToken: string | null = null;

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isBootstrapped: boolean;
  isSubmitting: boolean;
  error: string | null;
  hydrateAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
};

const persistTokens = async (accessToken: string | null, refreshToken: string | null) => {
  fallbackAccessToken = accessToken;
  fallbackRefreshToken = refreshToken;
  try {
    if (accessToken) {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    }

    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch {
    // SecureStore may be unavailable on web. We keep in-memory fallback tokens.
  }
};

const applyAuthPayload = async (payload: AuthResponse, set: (partial: Partial<AuthState>) => void) => {
  await persistTokens(payload.access_token, payload.refresh_token);
  set({
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    isAuthenticated: true,
    error: null,
  });
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isBootstrapped: false,
  isSubmitting: false,
  error: null,
  hydrateAuth: async () => {
    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    try {
      [accessToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      ]);
    } catch {
      accessToken = fallbackAccessToken;
      refreshToken = fallbackRefreshToken;
    }

    set({
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken),
      isBootstrapped: true,
    });
  },
  login: async (email, password) => {
    set({ isSubmitting: true, error: null });
    try {
      const payload = await authApi.login({ email, password });
      await applyAuthPayload(payload, set);
      return true;
    } catch {
      set({ error: "Autentificarea a esuat." });
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },
  register: async (email, password) => {
    set({ isSubmitting: true, error: null });
    try {
      const payload = await authApi.register({ email, password });
      await applyAuthPayload(payload, set);
      return true;
    } catch {
      set({ error: "Inregistrarea a esuat." });
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },
  logout: async () => {
    await persistTokens(null, null);
    useFoodDiaryStore.getState().clearCalorieTarget();
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },
  setAccessToken: (token) => {
    set({
      accessToken: token,
      isAuthenticated: Boolean(token),
    });
    void persistTokens(token, get().refreshToken);
  },
}));

setApiAuthHandlers({
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onAccessTokenUpdate: (token) => useAuthStore.getState().setAccessToken(token),
  onAuthFailure: () => {
    void useAuthStore.getState().logout();
  },
});
