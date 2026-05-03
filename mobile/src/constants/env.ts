const fallbackBaseUrl = "http://localhost:8000/api/v1";

export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackBaseUrl,
};
