import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { useNightsStore } from '@/stores/nights';
import { Night } from '@/types/night';

const TAB_ICONS: Record<string, { focused: string; default: string }> = {
  home: { focused: 'home', default: 'home-outline' },
  nights: { focused: 'calendar', default: 'calendar-outline' },
  venues: { focused: 'location', default: 'location-outline' },
  profile: { focused: 'person', default: 'person-outline' },
  settings: { focused: 'settings', default: 'settings-outline' },
};

function hasActiveNight(nights: Night[]): boolean {
  return nights.some((n) => n.status === 'active');
}

export default function AppLayout() {
  const colors = useThemeColors();
  const nights = useNightsStore((s) => s.nights);
  const showLive = useMemo(() => hasActiveNight(nights), [nights]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={(focused ? TAB_ICONS.home.focused : TAB_ICONS.home.default) as any}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="nights"
        options={({ route }) => {
          const focused = getFocusedRouteNameFromRoute(route);
          // Hide main tab bar when viewing night detail (it has its own tabs)
          const hideTabBar = focused === '[id]';
          return {
            title: 'Events',
            tabBarStyle: hideTabBar
              ? { display: 'none' as const }
              : {
                  backgroundColor: colors.tabBarBackground,
                  borderTopColor: colors.tabBarBorder,
                },
            tabBarIcon: ({ focused: isFocused, color, size }) => (
              <Ionicons
                name={(isFocused ? TAB_ICONS.nights.focused : TAB_ICONS.nights.default) as any}
                size={size}
                color={color}
              />
            ),
          };
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          href: showLive ? '/(app)/live' : null,
          tabBarActiveTintColor: colors.live,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'radio' : 'radio-outline'}
              size={size}
              color={colors.live}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="venues"
        options={{
          title: 'Venues',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={(focused ? TAB_ICONS.venues.focused : TAB_ICONS.venues.default) as any}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={(focused ? TAB_ICONS.profile.focused : TAB_ICONS.profile.default) as any}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={(focused ? TAB_ICONS.settings.focused : TAB_ICONS.settings.default) as any}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
