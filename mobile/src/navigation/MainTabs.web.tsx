import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { CustomTabBar } from '@/components/ui/CustomTabBar';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { DiaryTabScreen } from '@/screens/diary/DiaryTabScreen';
import { ChatScreen } from '@/screens/chat/ChatScreen';
import { MapScreen } from '@/screens/map/MapScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { MainTabParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
      // Push all tab screens right to make room for the 230px sidebar
      sceneStyle: { marginLeft: 230 },
    } as any}
  >
    <Tab.Screen name="Home"    component={HomeScreen}     />
    <Tab.Screen name="Diary"   component={DiaryTabScreen} />
    <Tab.Screen name="Chat"    component={ChatScreen}     />
    <Tab.Screen name="Map"     component={MapScreen}      />
    <Tab.Screen name="Profile" component={ProfileScreen}  />
  </Tab.Navigator>
);
