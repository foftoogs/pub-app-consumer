import { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Tabs, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useNightsStore } from '@/features/nights/store';
import { Night } from '@/features/nights/types';

function statusColor(colors: ThemeColors, status: Night['status']) {
  switch (status) {
    case 'planning':
      return colors.info;
    case 'active':
      return colors.success;
    case 'closed':
      return colors.textMuted;
    case 'cancelled':
      return colors.error;
  }
}

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
    <View style={styles.wrapper}>
      {currentNight && (
        <View style={styles.nightHeader}>
          <Text style={styles.nightName} numberOfLines={1}>{currentNight.name}</Text>
          <View style={[styles.statusChip, { backgroundColor: statusColor(colors, currentNight.status) }]}>
            <Text style={styles.statusText}>{currentNight.status}</Text>
          </View>
        </View>
      )}
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
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.background,
    },
    nightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    nightName: {
      ...Typography.subheading,
      color: colors.text,
      flex: 1,
      marginRight: Spacing.sm,
    },
    statusChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.md,
    },
    statusText: {
      ...Typography.label,
      color: colors.textOnPrimary,
      textTransform: 'capitalize',
      letterSpacing: 0,
    },
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
