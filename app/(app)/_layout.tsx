import { Tabs } from 'expo-router';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/use-theme-colors';

const TAB_ICONS: Record<string, { focused: string; default: string }> = {
  nights: { focused: 'calendar', default: 'calendar-outline' },
  venues: { focused: 'location', default: 'location-outline' },
  profile: { focused: 'person', default: 'person-outline' },
  settings: { focused: 'settings', default: 'settings-outline' },
};

export default function AppLayout() {
  const colors = useThemeColors();

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
