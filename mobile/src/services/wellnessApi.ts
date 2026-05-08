import { api } from "@/services/api";

export type PhysicalActivityDto = {
  id: number;
  user_id: number;
  activity_date: string;
  activity_type: string;
  duration_min: number;
  distance_km: number | null;
  calories_burned: number | null;
  notes: string | null;
  created_at: string;
};

export type PhysicalActivityCreatePayload = {
  activity_date?: string;
  activity_type: string;
  duration_min: number;
  distance_km?: number;
  calories_burned?: number;
  notes?: string;
};

export type WaterIntakeReadDto = {
  log_date: string;
  ml_total: number;
};

export type WaterIntakeWritePayload = {
  log_date: string;
  ml_total: number;
};

export type WaterIntakeResponseDto = {
  id: number;
  user_id: number;
  log_date: string;
  ml_total: number;
  updated_at: string;
};

export const wellnessApi = {
  listPhysicalActivities: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<PhysicalActivityDto[]> => {
    const { data } = await api.get<PhysicalActivityDto[]>("/users/me/physical-activities", {
      params,
    });
    return data;
  },

  createPhysicalActivity: async (
    payload: PhysicalActivityCreatePayload,
  ): Promise<PhysicalActivityDto> => {
    const { data } = await api.post<PhysicalActivityDto>("/users/me/physical-activities", payload);
    return data;
  },

  getWaterIntake: async (date: string): Promise<WaterIntakeReadDto> => {
    const { data } = await api.get<WaterIntakeReadDto>("/users/me/water-intake", {
      params: { date },
    });
    return data;
  },

  putWaterIntake: async (payload: WaterIntakeWritePayload): Promise<WaterIntakeResponseDto> => {
    const { data } = await api.put<WaterIntakeResponseDto>("/users/me/water-intake", payload);
    return data;
  },
};
