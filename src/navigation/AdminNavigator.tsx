import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminHomeScreen from '../screens/Admin/AdminHomeScreen';
import AdminShopsScreen from '../screens/Admin/AdminShopsScreen';
import AdminShopFormScreen from '../screens/Admin/AdminShopFormScreen';
import AdminBadgesScreen from '../screens/Admin/AdminBadgesScreen';
import AdminBadgeFormScreen from '../screens/Admin/AdminBadgeFormScreen';
import AdminChallengesScreen from '../screens/Admin/AdminChallengesScreen';
import AdminChallengeFormScreen from '../screens/Admin/AdminChallengeFormScreen';

export type AdminStackParamList = {
  AdminHome: undefined;
  AdminShops: undefined;
  AdminShopForm: undefined;
  AdminBadges: undefined;
  AdminBadgeForm: undefined;
  AdminChallenges: undefined;
  AdminChallengeForm: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{ title: 'Admin Panel' }}
      />
      <Stack.Screen
        name="AdminShops"
        component={AdminShopsScreen}
        options={{ title: 'Shops' }}
      />
      <Stack.Screen
        name="AdminShopForm"
        component={AdminShopFormScreen}
        options={{ title: 'Add Shop' }}
      />
      <Stack.Screen
        name="AdminBadges"
        component={AdminBadgesScreen}
        options={{ title: 'Badges' }}
      />
      <Stack.Screen
        name="AdminBadgeForm"
        component={AdminBadgeFormScreen}
        options={{ title: 'Add Badge' }}
      />
      <Stack.Screen
        name="AdminChallenges"
        component={AdminChallengesScreen}
        options={{ title: 'Challenges' }}
      />
      <Stack.Screen
        name="AdminChallengeForm"
        component={AdminChallengeFormScreen}
        options={{ title: 'New Challenge' }}
      />
    </Stack.Navigator>
  );
}
