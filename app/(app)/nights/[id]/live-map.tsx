import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuthStore } from '@/features/auth/store';
import { useLiveStore } from '@/features/live/store';

const LOCATION_INTERVAL_MS = 15_000;
const SYDNEY_REGION: Region = {
  latitude: -33.8688,
  longitude: 151.2093,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function LiveMapScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const consumer = useAuthStore((s) => s.consumer);
  const connectionStatus = useLiveStore((s) => s.connectionStatus);
  const presenceMembers = useLiveStore((s) => s.presenceMembers);
  const memberLocations = useLiveStore((s) => s.memberLocations);
  const sendLocation = useLiveStore((s) => s.sendLocation);
  const mapRef = useRef<MapView>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request location permission and start sharing
  useEffect(() => {
    if (connectionStatus !== 'connected') return;

    let mounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;

      if (status !== 'granted') {
        setPermissionGranted(false);
        return;
      }
      setPermissionGranted(true);

      // Send initial location
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (mounted) {
        sendLocation(loc.coords.latitude, loc.coords.longitude);
      }

      // Send periodic updates
      intervalRef.current = setInterval(async () => {
        try {
          const update = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          sendLocation(update.coords.latitude, update.coords.longitude);
        } catch {
          // Location unavailable — skip this tick
        }
      }, LOCATION_INTERVAL_MS);
    })();

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [connectionStatus, sendLocation]);

  const fitToMarkers = useCallback(() => {
    const coords = Array.from(memberLocations.values()).map((loc) => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
    if (coords.length > 0) {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  }, [memberLocations]);

  if (connectionStatus !== 'connected') {
    return (
      <View style={styles.centered}>
        <Ionicons name="location" size={32} color={colors.textMuted} />
        <Text style={styles.statusText}>
          {connectionStatus === 'connecting'
            ? 'Establishing encrypted connection...'
            : 'Not connected to live night'}
        </Text>
      </View>
    );
  }

  const locationEntries = Array.from(memberLocations.entries());
  const memberNameMap = new Map(presenceMembers.map((m) => [m.id, m.name]));

  return (
    <View style={styles.container}>
      <View style={styles.encryptedBanner}>
        <Ionicons name="shield-checkmark" size={14} color={colors.success} />
        <Text style={styles.encryptedText}>End-to-end encrypted</Text>
      </View>

      {permissionGranted === false && (
        <View style={styles.permissionBanner}>
          <Ionicons name="warning" size={14} color={colors.warning} />
          <Text style={styles.permissionText}>
            Location permission denied — you can see others but won&apos;t appear on the map
          </Text>
        </View>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={SYDNEY_REGION}
        onMapReady={fitToMarkers}
        showsUserLocation={permissionGranted === true}
        showsMyLocationButton
      >
        {locationEntries.map(([memberId, loc]) => {
          if (memberId === consumer?.id) return null;
          const name = memberNameMap.get(memberId) ?? 'Member';
          return (
            <Marker
              key={memberId}
              coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
              title={name}
              description={`Last update: ${new Date(loc.timestamp).toLocaleTimeString('en-AU', {
                hour: '2-digit',
                minute: '2-digit',
              })}`}
              pinColor={colors.primary}
            />
          );
        })}
      </MapView>

      <View style={styles.memberCount}>
        <Ionicons name="people" size={16} color={colors.textOnPrimary} />
        <Text style={styles.memberCountText}>
          {presenceMembers.length} online
        </Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.xl,
    },
    statusText: {
      ...Typography.body,
      color: colors.textMuted,
      textAlign: 'center',
    },
    encryptedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.xs,
      backgroundColor: colors.surfaceAlt,
    },
    encryptedText: {
      ...Typography.label,
      color: colors.success,
      letterSpacing: 0,
    },
    permissionBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.surfaceAlt,
    },
    permissionText: {
      ...Typography.label,
      color: colors.warning,
      flex: 1,
      letterSpacing: 0,
    },
    map: {
      flex: 1,
    },
    memberCount: {
      position: 'absolute',
      bottom: Spacing.xl,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm,
      borderRadius: 20,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    memberCountText: {
      ...Typography.label,
      color: colors.textOnPrimary,
      letterSpacing: 0,
    },
  });
}
