import { api } from "@/services/api";

export type NearbyGym = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  image_url?: string | null;
  opening_hours?: Record<string, string> | unknown[] | null;
  equipment?: unknown[] | null;
  pricing_plans?: unknown[] | null;
  review_count?: number;
  latitude: number;
  longitude: number;
  distance_m: number;
};

export type GymDetail = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  description: string | null;
  image_url: string | null;
  opening_hours: Record<string, string> | unknown[] | null;
  equipment: unknown[] | null;
  pricing_plans: unknown[] | null;
  review_count: number;
  latitude: number;
  longitude: number;
};

type NearbyParams = {
  latitude: number;
  longitude: number;
  radius_m?: number;
};

export const gymApi = {
  getNearby: async (params: NearbyParams): Promise<NearbyGym[]> => {
    const { data } = await api.get<NearbyGym[]>("/gyms/nearby", { params });
    return data;
  },
  getById: async (gymId: number): Promise<GymDetail> => {
    const { data } = await api.get<GymDetail>(`/gyms/${gymId}`);
    return data;
  },
};
