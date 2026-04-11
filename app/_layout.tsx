import { useEffect, useMemo } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth';

function buildNavigationTheme(scheme: 'light' | 'dark'): Theme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const palette = Colors[scheme];
  return {
    ...base,
    dark: scheme === 'dark',
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      notification: palette.secondary,
    },
  };
}

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const segments = useSegments();
  const token = useAuthStore((s) => s.token);
  const isReady = useAuthStore((s) => s.isReady);
  const hydrate = useAuthStore((s) => s.hydrate);

  const navigationTheme = useMemo(() => buildNavigationTheme(colorScheme), [colorScheme]);
  const palette = Colors[colorScheme];

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inInvite = segments[0] === 'invite';

    if (!token && !inAuthGroup && !inInvite) {
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      router.replace('/(app)/home');
    }
  }, [token, isReady, segments]);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: palette.background,
        }}
      >
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="invite" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
