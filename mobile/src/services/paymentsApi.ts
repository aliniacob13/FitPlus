import { api, API_LONG_OPERATION_TIMEOUT_MS } from "@/services/api";

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

export type ConfirmCheckoutSessionResponse = {
  ok: boolean;
};

export type GymPricingImportResponse = {
  plans: GymPricingPlan[];
  source_url: string;
  persisted: boolean;
  note?: string | null;
};

export const paymentsApi = {
  getGymPricing: async (gymId: number): Promise<GymPricingPlan[]> => {
    const { data } = await api.get<GymPricingPlan[]>(`/gyms/${gymId}/pricing`);
    return data;
  },

  /** Crawl gym website + LLM extract; requires auth. Omits url to use gym.website from DB. */
  importGymPricingFromUrl: async (
    gymId: number,
    body?: {
      url?: string;
      persist?: boolean;
      use_playwright?: boolean;
      deep_crawl?: boolean;
    },
  ): Promise<GymPricingImportResponse> => {
    const { data } = await api.post<GymPricingImportResponse>(
      `/gyms/${gymId}/pricing/import-from-url`,
      body ?? { persist: true },
      { timeout: API_LONG_OPERATION_TIMEOUT_MS },
    );
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

  confirmCheckoutSession: async (sessionId: string): Promise<ConfirmCheckoutSessionResponse> => {
    const { data } = await api.post<ConfirmCheckoutSessionResponse>(`/payments/checkout/confirm-session`, {
      session_id: sessionId,
    });
    return data;
  },

  getMySubscriptions: async (): Promise<UserSubscription[]> => {
    const { data } = await api.get<UserSubscription[]>(`/users/me/subscriptions`);
    return data;
  },
};
