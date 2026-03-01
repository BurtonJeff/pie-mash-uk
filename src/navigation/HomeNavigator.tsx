import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/Home/HomeScreen';
import ShopDetailScreen from '../screens/Discover/ShopDetailScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  ShopDetail: { shopId: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Home', headerLargeTitle: true }}
      />
      <Stack.Screen
        name="ShopDetail"
        component={ShopDetailScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  );
}
