import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import JourneyScreen from '../screens/Journey/JourneyScreen';
import AllBadgesScreen from '../screens/Journey/AllBadgesScreen';
import AllVisitsScreen from '../screens/Journey/AllVisitsScreen';
import EditProfileScreen from '../screens/Journey/EditProfileScreen';
import SettingsScreen from '../screens/Journey/SettingsScreen';
import FAQScreen from '../screens/Journey/FAQScreen';
import LegalScreen from '../screens/Journey/LegalScreen';
import EditCheckInScreen from '../screens/Journey/EditCheckInScreen';
import AdminNavigator from './AdminNavigator';
import MyShopsScreen from '../screens/Journey/MyShopsScreen';

export type JourneyStackParamList = {
  JourneyHome: undefined;
  AllBadges: undefined;
  AllVisits: undefined;
  EditProfile: undefined;
  Settings: undefined;
  FAQ: undefined;
  LegalContent: { type: 'privacy_policy' | 'terms_of_service' };
  EditCheckIn: {
    checkInId: string;
    shopName: string;
    initialPhotoUrls: string[];
    initialNotes: string | null;
  };
  Admin: undefined;
  MyShops: undefined;
};

const Stack = createNativeStackNavigator<JourneyStackParamList>();

export default function JourneyNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontSize: 22 } }}>
      <Stack.Screen name="JourneyHome" component={JourneyScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="AllBadges" component={AllBadgesScreen} options={{ title: 'Badge Collection' }} />
      <Stack.Screen name="AllVisits" component={AllVisitsScreen} options={{ title: 'Visit History' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="FAQ" component={FAQScreen} options={{ title: 'Help & FAQ' }} />
      <Stack.Screen name="EditCheckIn" component={EditCheckInScreen} options={{ title: 'Edit Check-in' }} />
      <Stack.Screen
        name="LegalContent"
        component={LegalScreen}
        options={({ route }) => ({
          title: route.params.type === 'privacy_policy' ? 'Privacy Policy' : 'Terms of Service',
        })}
      />
      <Stack.Screen name="MyShops" component={MyShopsScreen} options={{ title: 'My Shops' }} />
      <Stack.Group screenOptions={{ presentation: 'modal', headerShown: false }}>
        <Stack.Screen name="Admin" component={AdminNavigator} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
