export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  /** Optional conversationId lets ConversationHistoryScreen pre-load a conversation */
  Workout: { conversationId?: number } | undefined;
  Diet: { conversationId?: number } | undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  UpdateProfile: undefined;
  CalorieTarget: undefined;
  FoodDiary: undefined;
  AddFood: { date: string };
  LabelScan: { date: string };
  PlateCoach: { date: string };
  FavoriteGyms: undefined;
  /** History screen – pick or delete conversations and navigate to the right chat */
  ConversationHistory: { agentType: "workout" | "diet" };
  /** Diet preferences – allergies, restrictions, nutritional goals */
  DietPreferences: undefined;
  /** website optional hint for auto-import when pricing_plans empty (from resolve/detail). */
  SubscriptionPlans: { gymId: number; gymName?: string; website?: string | null };
  PaymentCheckout: { checkoutUrl: string; sessionId: string };
  MySubscriptions: undefined;
};
