import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/Home/HomeScreen';
import ShopDetailScreen from '../screens/Discover/ShopDetailScreen';
import EditCheckInScreen from '../screens/Journey/EditCheckInScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  ShopDetail: { shopId: string };
  EditCheckIn: {
    checkInId: string;
    shopName: string;
    initialPhotoUrl: string | null;
    initialNotes: string | null;
  };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontSize: 22 } }}>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Pie and Mash' }}
      />
      <Stack.Screen
        name="ShopDetail"
        component={ShopDetailScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="EditCheckIn"
        component={EditCheckInScreen}
        options={{ title: 'Edit Check-in' }}
      />
    </Stack.Navigator>
  );
}
