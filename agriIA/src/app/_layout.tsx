import { Stack, useSegments, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { UserProvider } from '@/context/UserContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function NavigationWrapper(): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { session, loading } = useAuth();
  const segments = useSegments() as any;
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!session && inTabsGroup) {
      // Redirect to login if trying to access private screens without being authenticated
      router.replace('/(auth)/login' as any);
    } else if (session && (inAuthGroup || segments.length === 0 || segments[0] === 'index')) {
      // Redirect to dashboard if authenticated and trying to access splash or login
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
    <UserProvider>
      <AuthProvider>
        <NavigationWrapper />
      </AuthProvider>
    </UserProvider>
  );
}