import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function VenuesLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Venues' }} />
      <Stack.Screen name="[id]" options={{ title: 'Venue' }} />
    </Stack>
  );
}
