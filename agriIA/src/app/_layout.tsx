import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { UserProvider } from '@/context/UserContext';

export default function RootLayout(): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <UserProvider>
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
    </UserProvider>
  );
}