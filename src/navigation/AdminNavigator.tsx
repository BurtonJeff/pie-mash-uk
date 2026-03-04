import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminHomeScreen from '../screens/Admin/AdminHomeScreen';
import AdminShopsScreen from '../screens/Admin/AdminShopsScreen';
import AdminShopFormScreen from '../screens/Admin/AdminShopFormScreen';
import AdminBadgesScreen from '../screens/Admin/AdminBadgesScreen';
import AdminBadgeFormScreen from '../screens/Admin/AdminBadgeFormScreen';
import AdminChallengesScreen from '../screens/Admin/AdminChallengesScreen';
import AdminChallengeFormScreen from '../screens/Admin/AdminChallengeFormScreen';
import AdminFactsScreen from '../screens/Admin/AdminFactsScreen';
import AdminFactFormScreen from '../screens/Admin/AdminFactFormScreen';
import AdminFaqItemsScreen from '../screens/Admin/AdminFaqItemsScreen';
import AdminFaqItemFormScreen from '../screens/Admin/AdminFaqItemFormScreen';
import AdminLegalScreen from '../screens/Admin/AdminLegalScreen';
import AdminOnboardingScreen from '../screens/Admin/AdminOnboardingScreen';
import AdminOnboardingFormScreen from '../screens/Admin/AdminOnboardingFormScreen';
import AdminFeedbackScreen from '../screens/Admin/AdminFeedbackScreen';

export type AdminStackParamList = {
  AdminHome: undefined;
  AdminShops: undefined;
  AdminShopForm: { shopId?: string };
  AdminBadges: undefined;
  AdminBadgeForm: { badgeId?: string };
  AdminChallenges: undefined;
  AdminChallengeForm: { challengeId?: string };
  AdminFacts: undefined;
  AdminFactForm: { factId?: string };
  AdminFaqItems: undefined;
  AdminFaqItemForm: { itemId?: string };
  AdminLegal: undefined;
  AdminOnboarding: undefined;
  AdminOnboardingForm: { slideId?: string };
  AdminFeedback: undefined;
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
      />
      <Stack.Screen
        name="AdminBadges"
        component={AdminBadgesScreen}
        options={{ title: 'Badges' }}
      />
      <Stack.Screen
        name="AdminBadgeForm"
        component={AdminBadgeFormScreen}
      />
      <Stack.Screen
        name="AdminChallenges"
        component={AdminChallengesScreen}
        options={{ title: 'Challenges' }}
      />
      <Stack.Screen
        name="AdminChallengeForm"
        component={AdminChallengeFormScreen}
      />
      <Stack.Screen
        name="AdminFacts"
        component={AdminFactsScreen}
        options={{ title: 'Did You Know Facts' }}
      />
      <Stack.Screen
        name="AdminFactForm"
        component={AdminFactFormScreen}
      />
      <Stack.Screen
        name="AdminFaqItems"
        component={AdminFaqItemsScreen}
        options={{ title: 'FAQ Items' }}
      />
      <Stack.Screen
        name="AdminFaqItemForm"
        component={AdminFaqItemFormScreen}
      />
      <Stack.Screen
        name="AdminLegal"
        component={AdminLegalScreen}
        options={{ title: 'Legal Content' }}
      />
      <Stack.Screen
        name="AdminOnboarding"
        component={AdminOnboardingScreen}
        options={{ title: 'Onboarding Slides' }}
      />
      <Stack.Screen
        name="AdminOnboardingForm"
        component={AdminOnboardingFormScreen}
      />
      <Stack.Screen
        name="AdminFeedback"
        component={AdminFeedbackScreen}
        options={{ title: 'User Feedback' }}
      />
    </Stack.Navigator>
  );
}
