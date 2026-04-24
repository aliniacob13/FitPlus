import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

import { env } from "@/constants/env";

type AuthTokenGetters = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onAccessTokenUpdate: (token: string | null) => void;
  onAuthFailure: () => void;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
});

let authGetters: AuthTokenGetters | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const setApiAuthHandlers = (handlers: AuthTokenGetters) => {
  authGetters = handlers;
};

const refreshAccessToken = async (): Promise<string | null> => {
  if (!authGetters) {
    return null;
  }

  const refreshToken = authGetters.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post<{ access_token: string }>(
      `${env.apiBaseUrl}/auth/refresh`,
      { refresh_token: refreshToken },
      { timeout: 15000 },
    );
    const newToken = response.data.access_token;
    authGetters.onAccessTokenUpdate(newToken);
    return newToken;
  } catch {
    authGetters.onAuthFailure();
    return null;
  }
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!authGetters) {
    return config;
  }

  const token = authGetters.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const statusCode = error.response?.status;

    if (!originalRequest || statusCode !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newAccessToken = await refreshPromise;
    if (!newAccessToken) {
      return Promise.reject(error);
    }

    const updatedConfig: AxiosRequestConfig = {
      ...originalRequest,
      headers: {
        ...originalRequest.headers,
        Authorization: `Bearer ${newAccessToken}`,
      },
    };

    return api.request(updatedConfig);
  },
);
