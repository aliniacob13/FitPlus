import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

// This matches your Alembic database schema!
interface UserProfile {
  id: number;
  email: string;
  name: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  fitness_level?: string;
  goals?: string;
}

interface UserState {
  user: UserProfile | null;
  token: string | null;
  isLoggedIn: boolean;
  
  // Actions
  login: (user: UserProfile, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,

  login: async (user, token) => {
    // Save the token securely to the device
    await SecureStore.setItemAsync('jwt_token', token);
    set({ user, token, isLoggedIn: true });
  },

  logout: async () => {
    // Remove the token when logging out
    await SecureStore.deleteItemAsync('jwt_token');
    set({ user: null, token: null, isLoggedIn: false });
  },

  updateProfile: (data) => 
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null
    }))
}));
