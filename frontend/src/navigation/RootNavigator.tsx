import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUserStore } from '../lib/userStore';

import LoginScreen        from '../screens/auth/LoginScreen';
import RegisterScreen     from '../screens/auth/RegisterScreen';
import MainTabs           from './MainTabs';
import UpdateProfileScreen from '../screens/home/UpdateProfileScreen';
import GymDetailScreen    from '../screens/map/GymDetailScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const token = useUserStore((state) => state.token);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        // ── Authenticated ──────────────────────────────────────
        <>
          <Stack.Screen name="MainTabs"     component={MainTabs} />
          <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
          <Stack.Screen name="GymDetail"    component={GymDetailScreen} />
        </>
      ) : (
        // ── Unauthenticated ────────────────────────────────────
        <>
          <Stack.Screen name="Login"    component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}