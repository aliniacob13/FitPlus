/** LAN URL for backend (must end with /api/v1). Phones cannot use localhost — use your PC's Wi‑Fi IP. */
const fallbackBaseUrl = "http://172.20.10.4:8000/api/v1";

export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackBaseUrl,
};
