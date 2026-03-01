import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { navigationRef } from '../navigation/navigationRef';

// Show alerts and play sound when a notification arrives while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests push notification permission, gets the Expo push token,
 * and saves it to the user's profile row so edge functions can reach them.
 */
export async function registerForPushNotifications(userId: string): Promise<void> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;

    if (existing !== 'granted') {
      const { status: requested } = await Notifications.requestPermissionsAsync();
      status = requested;
    }

    if (status !== 'granted') return;

    // Android requires an explicit notification channel.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Pie & Mash UK',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2D5016',
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : {},
    );

    await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('id', userId);
  } catch {
    // Never crash the app over a notification setup failure.
  }
}

/** Navigate to the appropriate screen when the user taps a push notification. */
export function handleNotificationNavigation(data: Record<string, unknown>): void {
  if (!navigationRef.isReady()) return;

  switch (data?.type) {
    case 'badge':
      navigationRef.navigate('Journey' as never);
      break;
    case 'message':
      navigationRef.navigate('Community' as never);
      break;
    case 'challenge':
      navigationRef.navigate('Community' as never);
      break;
  }
}

/**
 * Sets up foreground + tap notification listeners.
 * Returns a cleanup function — call it in a useEffect return.
 */
export function setupNotificationHandlers(): () => void {
  // Foreground: notification received while app is open (display handled by setNotificationHandler above).
  const receivedSub = Notifications.addNotificationReceivedListener(() => {
    // No extra action needed; the system handler shows the banner.
  });

  // Tap: user taps a notification (foreground or background).
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    handleNotificationNavigation(data);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
