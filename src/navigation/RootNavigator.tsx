import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
  Tabs: undefined;
  // Auth screens to be added in Phase 1
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const session = useAuthStore((s) => s.session);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Auth flow will gate this in Phase 1 */}
      <Stack.Screen name="Tabs" component={TabNavigator} />
    </Stack.Navigator>
  );
}
