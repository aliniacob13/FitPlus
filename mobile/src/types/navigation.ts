export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  Workout: undefined;
  Diet: undefined;
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
};
