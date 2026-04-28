import { api } from "@/services/api";

export type NearbyGym = {
  id: number;
  place_id?: string | null;
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
  place_id?: string | null;
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

export type GymReview = {
  id: number;
  user_id: number;
  gym_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type FavoriteGymEntry = {
  favorite_id: number;
  gym_id: number;
  name: string;
  address: string | null;
  image_url: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
};

export type ToggleFavoriteResult = {
  is_favorited: boolean;
  message: string;
};

export type GymDetailExtended = GymDetail & {
  reviews: GymReview[];
  average_rating: number | null;
  is_favorited: boolean;
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
  getDetailExtended: async (gymId: number): Promise<GymDetailExtended> => {
    const { data } = await api.get<GymDetailExtended>(`/gyms/${gymId}`);
    return data;
  },
  resolvePlaceToDbGym: async (placeId: string): Promise<GymDetailExtended> => {
    const { data } = await api.post<GymDetailExtended>(`/gyms/resolve-place/${encodeURIComponent(placeId)}`);
    return data;
  },
  addReview: async (gymId: number, payload: { rating: number; comment?: string }): Promise<GymReview> => {
    const { data } = await api.post<GymReview>(`/gyms/${gymId}/reviews`, payload);
    return data;
  },
  getReviews: async (gymId: number): Promise<GymReview[]> => {
    const { data } = await api.get<GymReview[]>(`/gyms/${gymId}/reviews`);
    return data;
  },
  toggleFavorite: async (gymId: number): Promise<ToggleFavoriteResult> => {
    const { data } = await api.post<ToggleFavoriteResult>(`/gyms/${gymId}/favorite`);
    return data;
  },
  getFavorites: async (): Promise<FavoriteGymEntry[]> => {
    const { data } = await api.get<FavoriteGymEntry[]>("/users/me/favorites");
    return data;
  },
};
