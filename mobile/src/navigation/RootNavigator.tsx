import { AuthStack } from "@/navigation/AuthStack";
import { MainTabs } from "@/navigation/MainTabs";
import { AddFoodScreen } from "@/screens/nutrition/AddFoodScreen";
import { CalorieTargetScreen } from "@/screens/nutrition/CalorieTargetScreen";
import { FoodDiaryScreen } from "@/screens/nutrition/FoodDiaryScreen";
import { LabelScanScreen } from "@/screens/nutrition/LabelScanScreen";
import { PlateCoachScreen } from "@/screens/nutrition/PlateCoachScreen";
import { UpdateProfileScreen } from "@/screens/profile/UpdateProfileScreen";
import { useAuthStore } from "@/store/authStore";
import { AppStackParamList } from "@/types/navigation";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator<AppStackParamList>();

const AuthenticatedStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
    <Stack.Screen name="CalorieTarget" component={CalorieTargetScreen} />
    <Stack.Screen name="FoodDiary" component={FoodDiaryScreen} />
    <Stack.Screen name="AddFood" component={AddFoodScreen} />
    <Stack.Screen name="LabelScan" component={LabelScanScreen} />
    <Stack.Screen name="PlateCoach" component={PlateCoachScreen} />
  </Stack.Navigator>
);

export const RootNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <AuthenticatedStack /> : <AuthStack />;
};
