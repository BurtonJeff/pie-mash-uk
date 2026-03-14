import React, { useEffect, useState } from 'react';
import { View, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { fetchActiveOnboardingSlides } from '../lib/content';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import OnboardingScreen, { ONBOARDING_KEY } from '../screens/Onboarding/OnboardingScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';

export default function RootNavigator() {
  const { session, initialized, user, isPasswordRecovery, setPasswordRecovery } = useAuthStore();
  const queryClient = useQueryClient();

  // Has this user permanently completed onboarding (AsyncStorage)?
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Is the current user an admin? null = still checking
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Has the user passed through onboarding in this app session?
  // Prevents admins looping back to onboarding after completing it.
  const [hasPassedOnboarding, setHasPassedOnboarding] = useState(false);

  // Whether the native splash has been hidden yet.
  const [splashHidden, setSplashHidden] = useState(false);


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
    (async () => {
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        );
        const query = supabase
          .from('profiles')
          .select('is_admin, is_active')
          .eq('id', user.id)
          .single();
        const { data } = await Promise.race([query, timeout]) as Awaited<typeof query>;
        if (data?.is_active === false) {
          supabase.auth.signOut();
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.is_admin ?? false);
        }
      } catch {
        setIsAdmin(false);
      }
    })();
  }, [initialized, user?.id]);

  // Once all startup checks are settled, prefetch slides if needed then hide the splash.
  useEffect(() => {
    if (splashHidden) return;
    if (!initialized || onboardingDone === null || isAdmin === null) return;

    const willShowOnboarding = !hasPassedOnboarding && (!onboardingDone || isAdmin);

    (async () => {
      const minimumHold = new Promise((resolve) => setTimeout(resolve, 3000));

      if (willShowOnboarding) {
        // Pre-populate the onboarding slides cache so the screen renders
        // with real data on first paint — no fallback-to-real swap/flicker.
        try {
          await Promise.all([
            minimumHold,
            Promise.race([
              queryClient.prefetchQuery({
                queryKey: ['onboardingSlides'],
                queryFn: fetchActiveOnboardingSlides,
                staleTime: 5 * 60 * 1000,
              }),
              new Promise((resolve) => setTimeout(resolve, 3000)),
            ]),
          ]);
        } catch {
          // Network unavailable — fallback slides will be used, which is fine.
          await minimumHold;
        }
      } else {
        await minimumHold;
      }

      SplashScreen.hideAsync().catch(() => {});
      setSplashHidden(true);
    })();
  }, [initialized, onboardingDone, isAdmin, hasPassedOnboarding, splashHidden, queryClient]);

  // Handle password-reset deep links (pie-mash-uk://reset-password)
  useEffect(() => {
    async function handleUrl(url: string) {
      if (!url.includes('reset-password')) return;

      // PKCE flow: ?code=xxx
      const codeMatch = url.match(/[?&]code=([^&#]+)/);
      if (codeMatch) {
        await supabase.auth.exchangeCodeForSession(decodeURIComponent(codeMatch[1]));
        return; // PASSWORD_RECOVERY event will fire and set state
      }

      // Implicit flow: #access_token=xxx&refresh_token=xxx&type=recovery
      const hash = url.split('#')[1];
      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          // PASSWORD_RECOVERY event will fire and set state
        }
      }
    }

    Linking.getInitialURL().then((url) => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  // Still initialising — native splash is still visible so show nothing.
  if (!initialized || onboardingDone === null || isAdmin === null) {
    return <View style={{ flex: 1 }} />;
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

  if (isPasswordRecovery) {
    return <ResetPasswordScreen onComplete={() => setPasswordRecovery(false)} />;
  }

  return session ? <TabNavigator /> : <AuthNavigator />;
}
