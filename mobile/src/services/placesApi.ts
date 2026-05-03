import { api } from "@/services/api";

export type RealGymSummary = {
  place_id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  rating: number | null;
  review_count: number | null;
  website: string | null;
  google_maps_url: string | null;
  photo_url: string | null;
  opening_hours: string[] | null;
  distance_m: number | null;
};

export type RealGymDetail = {
  place_id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  google_maps_url: string | null;
  rating: number | null;
  review_count: number | null;
  opening_hours: string[] | null;
  photo_urls: string[];
};

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  formatted_address: string;
  city: string | null;
};

export const placesApi = {
  searchNearbyGyms: async (params: { latitude: number; longitude: number; radius_m?: number }): Promise<RealGymSummary[]> => {
    const { data } = await api.get<RealGymSummary[]>("/places/gyms/nearby", { params });
    return data;
  },
  getGymDetail: async (placeId: string): Promise<RealGymDetail> => {
    const { data } = await api.get<RealGymDetail>(`/places/gyms/${encodeURIComponent(placeId)}`);
    return data;
  },
  geocode: async (query: string): Promise<GeocodeResult> => {
    const { data } = await api.get<GeocodeResult>("/places/geocode", {
      params: { query },
    });
    return data;
  },
};
