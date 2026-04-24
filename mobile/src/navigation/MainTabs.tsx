import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

import { colors } from "@/constants/theme";
import { DietChatScreen } from "@/screens/chat/DietChatScreen";
import { WorkoutChatScreen } from "@/screens/chat/WorkoutChatScreen";
import { HomeScreen } from "@/screens/home/HomeScreen";
import { MapScreen } from "@/screens/map/MapScreen";
import { ProfileScreen } from "@/screens/profile/ProfileScreen";
import { MainTabParamList } from "@/types/navigation";

const Tab = createBottomTabNavigator<MainTabParamList>();

const getIcon = (label: string) => () => <Text style={{ color: colors.text }}>{label}</Text>;

export const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.mutedText,
      tabBarStyle: {
        backgroundColor: colors.card,
        borderTopColor: colors.border,
      },
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: getIcon("H") }} />
    <Tab.Screen name="Map" component={MapScreen} options={{ tabBarIcon: getIcon("M") }} />
    <Tab.Screen name="Workout" component={WorkoutChatScreen} options={{ tabBarIcon: getIcon("W") }} />
    <Tab.Screen name="Diet" component={DietChatScreen} options={{ tabBarIcon: getIcon("D") }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: getIcon("P") }} />
  </Tab.Navigator>
);
