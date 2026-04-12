import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { router } from 'expo-router';

import api from '@/lib/api';
import { getOrCreateDeviceId } from '@/lib/crypto';
import { useAuthStore } from '@/features/auth/store';

// Configure notification behaviour when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Registers for push notifications and handles incoming notification taps.
 * Should be called once from the authenticated app layout.
 *
 * - Registers the Expo push token with the API on mount
 * - Navigates to the relevant night screen when a notification is tapped
 */
export function usePushNotifications() {
  const token = useAuthStore((s) => s.token);
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!token) return;

    // Register push token
    registerPushToken();

    // Handle notification taps (deep link to night)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.nightId) {
          router.push(`/(app)/nights/${data.nightId}` as any);
        }
      },
    );

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [token]);
}

async function registerPushToken() {
  try {
    // Only real devices can receive push notifications
    if (!Device.isDevice) return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const pushToken = await Notifications.getExpoPushTokenAsync();
    const deviceId = await getOrCreateDeviceId();

    await api.post('/consumer/device-tokens', {
      token: pushToken.data,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      device_id: deviceId,
    });

    // Android-specific notification channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('night-live', {
        name: 'Live Night',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }
  } catch {
    // Push registration is best-effort — don't block the app
  }
}
