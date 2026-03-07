import React, { useEffect, Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <View style={eb.container}>
          <Text style={eb.title}>Startup Error</Text>
          <ScrollView>
            <Text style={eb.message}>{err.message}</Text>
            <Text style={eb.stack}>{err.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', color: '#c00', marginBottom: 12 },
  message: { fontSize: 15, color: '#333', marginBottom: 12 },
  stack: { fontSize: 11, color: '#888', fontFamily: 'monospace' },
});

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
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <NavigationContainer
        ref={navigationRef}
        onReady={async () => {
          try {
            const initial = await Notifications.getLastNotificationResponseAsync();
            if (initial) {
              handleNotificationNavigation(
                initial.notification.request.content.data as Record<string, unknown>,
              );
            }
          } catch {
            // Notification handling failure should never crash the app
          }
        }}
      >
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
