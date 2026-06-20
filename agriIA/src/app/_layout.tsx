import { Stack, useSegments, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { UserProvider } from '@/context/UserContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';

// Lazy load — n'importe pas expo-notifications au top level
const getNotifService = () => require('@/services/notifications/expoPush');

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  state = { hasError: false, error: '' };
  static getDerivedStateFromError(e: Error) {
    return { hasError: true, error: e.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 16, color: '#e53e3e', textAlign: 'center' }}>
            Erreur au démarrage:{'\n'}{this.state.error}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function NavigationWrapper(): React.JSX.Element {
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { session, loading, user } = useAuth();
  const segments = useSegments() as any;
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    let cleanupListeners: (() => void) | undefined;

    async function initializePushNotifications() {
      try {
        const { registerForPushNotificationsAsync, savePushTokenToDatabase, setupNotificationListeners } = getNotifService();
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await savePushTokenToDatabase(user.id, token);
        }
        cleanupListeners = setupNotificationListeners(
          undefined,
          (response: any) => {
            const data = response?.notification?.request?.content?.data;
            if (data?.type === 'message_received') router.push('/(tabs)/chat' as any);
            else if (data?.type === 'diagnostic_ready') router.push('/(tabs)/diagnostic' as any);
            else if (data?.type === 'calendar_reminder') router.push('/(tabs)/calendrier' as any);
          }
        );
      } catch (error) {
        console.warn('Push notifications unavailable:', error);
      }
    }

    initializePushNotifications();
    return () => { cleanupListeners?.(); };
  }, [user]);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    if (!session && inTabsGroup) {
      router.replace('/(auth)/login' as any);
    } else if (session && (inAuthGroup || segments.length === 0 || segments[0] === 'index')) {
      router.replace('/(tabs)/' as any);
    }
  }, [session, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{ animation: 'none', contentStyle: { backgroundColor: Colors.splash.bgDark } }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{ animation: 'fade', contentStyle: { backgroundColor: colors.background } }}
      />
    </Stack>
  );
}

export default function RootLayout(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <UserProvider>
          <AuthProvider>
            <NavigationWrapper />
          </AuthProvider>
        </UserProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
