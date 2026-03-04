import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import OnboardingScreen, { ONBOARDING_KEY } from '../screens/Onboarding/OnboardingScreen';

export default function RootNavigator() {
  const { session, initialized, user } = useAuthStore();

  // Has this user permanently completed onboarding (AsyncStorage)?
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Is the current user an admin? null = still checking
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Has the user passed through onboarding in this app session?
  // Prevents admins looping back to onboarding after completing it.
  const [hasPassedOnboarding, setHasPassedOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingDone(val === 'true');
    });
  }, []);

  // Once auth is settled, check whether the user is an admin
  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setIsAdmin(data?.is_admin ?? false));
  }, [initialized, user?.id]);

  // Wait until auth, AsyncStorage, and admin check are all resolved
  if (!initialized || onboardingDone === null || isAdmin === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2D5016" />
      </View>
    );
  }

  // Show onboarding if:
  //   - new user who hasn't seen it yet, OR
  //   - admin user (always shown for testing), unless already passed this session
  const showOnboarding = !hasPassedOnboarding && (!onboardingDone || isAdmin);

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onComplete={() => {
          setOnboardingDone(true);      // persists for non-admins
          setHasPassedOnboarding(true); // prevents re-showing within this session
        }}
      />
    );
  }

  return session ? <TabNavigator /> : <AuthNavigator />;
}
