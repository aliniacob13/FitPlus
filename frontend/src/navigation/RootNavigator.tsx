import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUserStore } from '../lib/userStore';

// Import your screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen'; // Make sure this exists!
import HomeScreen from '../screens/home/HomeScreen';
import UpdateProfileScreen from '../screens/home/UpdateProfileScreen';
const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  // Check the global store to see if we have a token
  const token = useUserStore((state) => state.token);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        // --- PROTECTED ROUTES (Logged In) ---
        <>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
        </>
      ) : (
        // --- AUTH ROUTES (Not Logged In) ---
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}