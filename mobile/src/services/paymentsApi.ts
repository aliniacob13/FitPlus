import { api } from "@/services/api";

export type GymPricingPlan = {
  key: string;
  name: string;
  amount_cents: number;
  currency: string;
  period: string;
  period_days: number;
  features: string[];
};

export type UserSubscription = {
  id: number;
  gym_id: number;
  gym_name: string;
  plan_name: string;
  status: string;
  stripe_subscription_id: string | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export type CheckoutSessionResponse = {
  checkout_url: string;
  session_id: string;
};

export const paymentsApi = {
  getGymPricing: async (gymId: number): Promise<GymPricingPlan[]> => {
    const { data } = await api.get<GymPricingPlan[]>(`/gyms/${gymId}/pricing`);
    return data;
  },

  createCheckoutSession: async (
    gymId: number,
    planIndex: number,
  ): Promise<CheckoutSessionResponse> => {
    const { data } = await api.post<CheckoutSessionResponse>(`/payments/checkout`, {
      gym_id: gymId,
      plan_index: planIndex,
    });
    return data;
  },

  getMySubscriptions: async (): Promise<UserSubscription[]> => {
    const { data } = await api.get<UserSubscription[]>(`/users/me/subscriptions`);
    return data;
  },
};
