import { api } from "@/services/api";

export type NearbyGym = {
  id: number;
  name: string;
  address: string | null;
  rating: number | null;
  latitude: number;
  longitude: number;
  distance_m: number;
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
};
