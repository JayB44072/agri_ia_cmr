import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {
  // expo-notifications not available in this build
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Notifications || !Device) return null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22c55e',
      });
    }

    if (!Device.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id';
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (error) {
    console.warn('Push notifications unavailable:', error);
    return null;
  }
}

export async function savePushTokenToDatabase(userId: string, token: string): Promise<void> {
  try {
    const deviceId = Device?.modelName || 'unknown';
    const platform = Platform.OS as 'ios' | 'android' | 'web';

    await supabase.from('push_tokens').upsert(
      { user_id: userId, token, device_id: deviceId, platform, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,device_id' }
    );
  } catch (error) {
    console.warn('Could not save push token:', error);
  }
}

export function setupNotificationListeners(
  onNotificationReceived?: (notification: any) => void,
  onNotificationTapped?: (response: any) => void
): () => void {
  if (!Notifications) return () => {};

  try {
    const received = Notifications.addNotificationReceivedListener((n) => {
      onNotificationReceived?.(n);
    });
    const tapped = Notifications.addNotificationResponseReceivedListener((r) => {
      onNotificationTapped?.(r);
    });
    return () => { received.remove(); tapped.remove(); };
  } catch {
    return () => {};
  }
}
