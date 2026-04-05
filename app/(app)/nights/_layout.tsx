import { Stack } from 'expo-router';

export default function NightsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'My Nights' }} />
      <Stack.Screen name="create" options={{ title: 'Create Night', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
