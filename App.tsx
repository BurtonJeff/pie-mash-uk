import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { initAuthListener } from './src/store/authStore';
import { useAuthStore } from './src/store/authStore';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import {
  registerForPushNotifications,
  setupNotificationHandlers,
  handleNotificationNavigation,
} from './src/lib/notifications';

const queryClient = new QueryClient();

export default function App() {
  const { session } = useAuthStore();

  // Initialise auth listener once on mount.
  useEffect(() => {
    initAuthListener();
  }, []);

  // Set up notification tap/receive listeners for the app's lifetime.
  useEffect(() => {
    return setupNotificationHandlers();
  }, []);

  // Register / refresh the push token whenever the signed-in user changes.
  useEffect(() => {
    if (session?.user?.id) {
      registerForPushNotifications(session.user.id);
    }
  }, [session?.user?.id]);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer
        ref={navigationRef}
        onReady={async () => {
          // Handle the notification that launched the app from a cold start.
          const initial = await Notifications.getLastNotificationResponseAsync();
          if (initial) {
            handleNotificationNavigation(
              initial.notification.request.content.data as Record<string, unknown>,
            );
          }
        }}
      >
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
