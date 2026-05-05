import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";
import { DietChatScreen } from "@/screens/chat/DietChatScreen";
import { WorkoutChatScreen } from "@/screens/chat/WorkoutChatScreen";
import { HomeScreen } from "@/screens/home/HomeScreen";
import { MapScreen } from "@/screens/map/MapScreen";
import { ProfileScreen } from "@/screens/profile/ProfileScreen";
import { MainTabParamList } from "@/types/navigation";

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type TabIconConfig = {
  active: IoniconName;
  inactive: IoniconName;
};

const TAB_ICONS: Record<string, TabIconConfig> = {
  Home: { active: "home", inactive: "home-outline" },
  Map: { active: "map", inactive: "map-outline" },
  Workout: { active: "barbell", inactive: "barbell-outline" },
  Diet: { active: "nutrition", inactive: "nutrition-outline" },
  Profile: { active: "person", inactive: "person-outline" },
};

const makeTabIcon =
  (tabName: string) =>
  ({ color, focused }: { color: string; focused: boolean; size: number }) => {
    const config = TAB_ICONS[tabName];
    const iconName = focused ? config.active : config.inactive;
    return <Ionicons name={iconName} size={22} color={color} />;
  };

export const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.mutedText,
      tabBarStyle: {
        backgroundColor: colors.card,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 8,
        paddingTop: 4,
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: "600",
        letterSpacing: 0.2,
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ tabBarIcon: makeTabIcon("Home") }}
    />
    <Tab.Screen
      name="Map"
      component={MapScreen}
      options={{ tabBarIcon: makeTabIcon("Map") }}
    />
    <Tab.Screen
      name="Workout"
      component={WorkoutChatScreen}
      options={{ tabBarIcon: makeTabIcon("Workout") }}
    />
    <Tab.Screen
      name="Diet"
      component={DietChatScreen}
      options={{ tabBarIcon: makeTabIcon("Diet") }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarIcon: makeTabIcon("Profile") }}
    />
  </Tab.Navigator>
);
