import { api } from "@/services/api";

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

type Credentials = {
  email: string;
  password: string;
};

export const authApi = {
  register: async (payload: Credentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  },
  login: async (payload: Credentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },
};
