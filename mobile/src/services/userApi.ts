import { api } from "@/services/api";

export type UserProfile = {
  id?: number;
  email?: string;
  name?: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  fitness_level?: string;
  goals?: string;
};

export type UserProfileUpdatePayload = {
  name?: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  fitness_level?: string;
  goals?: string;
};

export const userApi = {
  me: async (): Promise<UserProfile> => {
    const { data } = await api.get<UserProfile>("/users/me");
    return data;
  },
  updateMe: async (payload: UserProfileUpdatePayload): Promise<UserProfile> => {
    const { data } = await api.put<UserProfile>("/users/me", payload);
    return data;
  },
};
