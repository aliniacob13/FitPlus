import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use your computer's local IP address if testing on a physical phone, 
// or localhost/10.0.2.2 if using an emulator.
const BASE_URL = 'http://192.168.100.16:8000/api/v1'; // Change this to match your backend port

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// This "Interceptor" runs before every single request is sent.
// It grabs the token from SecureStore and sticks it in the headers.
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
