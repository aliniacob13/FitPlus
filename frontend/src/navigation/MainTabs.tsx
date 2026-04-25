import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';


import HomeScreen from '../screens/home/HomeScreen';

const Tab = createBottomTabNavigator();

// Temporary placeholder screens for the tabs we haven't built yet
const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{name} Coming Soon</Text></View>
);

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={() => <PlaceholderScreen name="Map" />} />
      <Tab.Screen name="Workout AI" component={() => <PlaceholderScreen name="Workout AI" />} />
      <Tab.Screen name="Diet AI" component={() => <PlaceholderScreen name="Diet AI" />} />
      <Tab.Screen name="Profile" component={() => <PlaceholderScreen name="Profile" />} />
    </Tab.Navigator>
  );
}
