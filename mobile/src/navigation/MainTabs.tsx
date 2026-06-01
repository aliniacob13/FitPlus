import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadows } from "@/constants/theme";
import { DietChatScreen } from "@/screens/chat/DietChatScreen";
import { WorkoutChatScreen } from "@/screens/chat/WorkoutChatScreen";
import { HomeScreen } from "@/screens/home/HomeScreen";
import { MapScreen } from "@/screens/map/MapScreen";
import { ProfileScreen } from "@/screens/profile/ProfileScreen";
import { MainTabParamList } from "@/types/navigation";

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  Home:    { active: "home",      inactive: "home-outline" },
  Map:     { active: "map",       inactive: "map-outline" },
  Workout: { active: "barbell",   inactive: "barbell-outline" },
  Diet:    { active: "nutrition", inactive: "nutrition-outline" },
  Profile: { active: "person",    inactive: "person-outline" },
};

// The center "AI" tab uses a raised pill button
const CenterTabIcon = ({ focused }: { focused: boolean }) => (
  <View style={[centerStyles.wrap, focused && centerStyles.wrapActive]}>
    <Ionicons
      name="flash"
      size={22}
      color={focused ? colors.primaryInk : colors.primaryBase}
    />
  </View>
);

const centerStyles = StyleSheet.create({
  wrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
    borderWidth: 1,
    borderColor: colors.primaryBase + "50",
  },
  wrapActive: {
    backgroundColor: colors.primaryBase,
    ...shadows.accent,
  },
});

export const MainTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryBase,
        tabBarInactiveTintColor: colors.muted2,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: Math.max(insets.bottom, 12),
          height: 64,
          backgroundColor: colors.surfaceBase,
          borderRadius: radius.card + 4,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.lineColor,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "600",
          letterSpacing: 0.3,
          textTransform: "uppercase",
        },
        tabBarItemStyle: {
          paddingBottom: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? TAB_ICONS.Home.active : TAB_ICONS.Home.inactive} size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? TAB_ICONS.Map.active : TAB_ICONS.Map.inactive} size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutChatScreen}
        initialParams={{ conversationId: undefined }}
        options={{
          tabBarLabel: "AI",
          tabBarIcon: ({ focused }) => <CenterTabIcon focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Diet"
        component={DietChatScreen}
        initialParams={{ conversationId: undefined }}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? TAB_ICONS.Diet.active : TAB_ICONS.Diet.inactive} size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? TAB_ICONS.Profile.active : TAB_ICONS.Profile.inactive} size={20} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};