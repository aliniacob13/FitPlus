import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

console.log('[API] BASE_URL is:', BASE_URL);

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    console.log(`[API] ▶ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('[API] ▶ Body:', JSON.stringify(config.data));

    const token = await SecureStore.getItemAsync('jwt_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] ▶ Token attached');
    }
    return config;
  },
  (error) => {
    console.log('[API] ▶ Request setup error:', error.message);
    return Promise.reject(error);
  }
);

// ── Response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ◀ ${response.status} ${response.config.url}`);
    console.log('[API] ◀ Response:', JSON.stringify(response.data));
    return response;
  },
  (error) => {
    if (error.response) {
      // Server replied with a non-2xx status
      console.log(`[API] ◀ ERROR ${error.response.status} ${error.config?.url}`);
      console.log('[API] ◀ Error body:', JSON.stringify(error.response.data));
    } else if (error.request) {
      // Request was made but no response received (timeout, wrong IP, etc.)
      console.log('[API] ◀ NO RESPONSE received — timeout or wrong URL');
      console.log('[API] ◀ Request was sent to:', error.config?.baseURL, error.config?.url);
    } else {
      // Something else
      console.log('[API] ◀ Unexpected error:', error.message);
    }
    return Promise.reject(error);
  }
);