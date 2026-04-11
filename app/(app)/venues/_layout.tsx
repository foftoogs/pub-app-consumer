import { Stack } from 'expo-router';

export default function VenuesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Venues' }} />
    </Stack>
  );
}
