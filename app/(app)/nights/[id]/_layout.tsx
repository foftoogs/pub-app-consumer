import { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Tabs, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useNightsStore } from '@/stores/nights';

export default function NightDetailLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentNight, loading, error, fetchNight } = useNightsStore();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (id) fetchNight(id);
  }, [id]);

  if (loading && !currentNight) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !currentNight) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Members',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="itinerary"
        options={{
          title: 'Itinerary',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="invite"
        options={{
          title: 'Invite',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'mail' : 'mail-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
      backgroundColor: colors.background,
    },
    errorText: {
      ...Typography.body,
      color: colors.error,
      textAlign: 'center',
    },
  });
}
