import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import JourneyScreen from '../screens/Journey/JourneyScreen';
import AllBadgesScreen from '../screens/Journey/AllBadgesScreen';
import AllVisitsScreen from '../screens/Journey/AllVisitsScreen';
import EditProfileScreen from '../screens/Journey/EditProfileScreen';
import SettingsScreen from '../screens/Journey/SettingsScreen';

export type JourneyStackParamList = {
  JourneyHome: undefined;
  AllBadges: undefined;
  AllVisits: undefined;
  EditProfile: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<JourneyStackParamList>();

export default function JourneyNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="JourneyHome" component={JourneyScreen} options={{ title: 'My Journey' }} />
      <Stack.Screen name="AllBadges" component={AllBadgesScreen} options={{ title: 'Badge Collection' }} />
      <Stack.Screen name="AllVisits" component={AllVisitsScreen} options={{ title: 'Visit History' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
