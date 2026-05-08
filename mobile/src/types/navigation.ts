export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Diary: undefined;
  Chat: { agentType?: 'workout' | 'diet' } | undefined;
  Map: undefined;
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
  ConversationHistory: { agentType: 'workout' | 'diet' };
  DietPreferences: undefined;
  Workout: undefined;
};