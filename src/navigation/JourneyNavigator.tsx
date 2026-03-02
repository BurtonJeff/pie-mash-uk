import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import JourneyScreen from '../screens/Journey/JourneyScreen';
import AllBadgesScreen from '../screens/Journey/AllBadgesScreen';
import AllVisitsScreen from '../screens/Journey/AllVisitsScreen';
import EditProfileScreen from '../screens/Journey/EditProfileScreen';
import SettingsScreen from '../screens/Journey/SettingsScreen';
import FAQScreen from '../screens/Journey/FAQScreen';
import AdminNavigator from './AdminNavigator';

export type JourneyStackParamList = {
  JourneyHome: undefined;
  AllBadges: undefined;
  AllVisits: undefined;
  EditProfile: undefined;
  Settings: undefined;
  FAQ: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<JourneyStackParamList>();

export default function JourneyNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontSize: 22 } }}>
      <Stack.Screen name="JourneyHome" component={JourneyScreen} options={{ title: 'My Journey' }} />
      <Stack.Screen name="AllBadges" component={AllBadgesScreen} options={{ title: 'Badge Collection' }} />
      <Stack.Screen name="AllVisits" component={AllVisitsScreen} options={{ title: 'Visit History' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="FAQ" component={FAQScreen} options={{ title: 'FAQ' }} />
      <Stack.Group screenOptions={{ presentation: 'modal', headerShown: false }}>
        <Stack.Screen name="Admin" component={AdminNavigator} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
