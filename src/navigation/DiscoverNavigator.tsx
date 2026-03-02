import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DiscoverScreen from '../screens/Discover/DiscoverScreen';
import ShopDetailScreen from '../screens/Discover/ShopDetailScreen';

export type DiscoverStackParamList = {
  DiscoverHome: undefined;
  ShopDetail: { shopId: string };
};

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

export default function DiscoverNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontSize: 22 } }}>
      <Stack.Screen
        name="DiscoverHome"
        component={DiscoverScreen}
        options={{ title: 'Discover' }}
      />
      <Stack.Screen
        name="ShopDetail"
        component={ShopDetailScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  );
}
