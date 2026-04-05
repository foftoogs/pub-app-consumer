import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Tabs, useLocalSearchParams } from 'expo-router';
import { useNightsStore } from '@/stores/nights';

export default function NightDetailLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentNight, loading, fetchNight } = useNightsStore();

  useEffect(() => {
    if (id) fetchNight(id);
  }, [id]);

  if (loading && !currentNight) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#fff' },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Overview' }} />
      <Tabs.Screen name="members" options={{ title: 'Members' }} />
      <Tabs.Screen name="itinerary" options={{ title: 'Itinerary' }} />
      <Tabs.Screen name="invite" options={{ title: 'Invite' }} />
    </Tabs>
  );
}
