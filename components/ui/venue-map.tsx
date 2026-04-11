import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import { Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

export interface MapPin {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  label?: string;
  selected?: boolean;
}

interface VenueMapProps {
  pins: MapPin[];
  initialRegion?: Region;
  height?: number;
  onPinPress?: (pin: MapPin) => void;
  testID?: string;
}

const DEFAULT_REGION: Region = {
  // Melbourne CBD
  latitude: -37.8136,
  longitude: 144.9631,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function fitBounds(pins: MapPin[]): Region {
  if (pins.length === 0) return DEFAULT_REGION;
  if (pins.length === 1) {
    return {
      latitude: pins[0].latitude,
      longitude: pins[0].longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  let minLat = pins[0].latitude;
  let maxLat = pins[0].latitude;
  let minLng = pins[0].longitude;
  let maxLng = pins[0].longitude;

  for (const pin of pins) {
    minLat = Math.min(minLat, pin.latitude);
    maxLat = Math.max(maxLat, pin.latitude);
    minLng = Math.min(minLng, pin.longitude);
    maxLng = Math.max(maxLng, pin.longitude);
  }

  const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
  const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.01);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export default function VenueMap({
  pins,
  initialRegion,
  height = 200,
  onPinPress,
  testID,
}: VenueMapProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);

  const region = initialRegion ?? fitBounds(pins);

  useEffect(() => {
    if (ready && pins.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(
        pins.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
        { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true }
      );
    }
  }, [ready, pins]);

  return (
    <View testID={testID} style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onMapReady={() => setReady(true)}
        showsUserLocation
        showsMyLocationButton={Platform.OS === 'android'}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            title={pin.title}
            onPress={() => onPinPress?.(pin)}
          >
            <View style={[styles.marker, pin.selected && styles.markerSelected]}>
              <Text style={[styles.markerText, pin.selected && styles.markerTextSelected]}>
                {pin.label ?? pin.title.charAt(0)}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      borderRadius: Radius.lg,
      overflow: 'hidden',
      marginBottom: Spacing.md,
    },
    map: {
      flex: 1,
    },
    marker: {
      backgroundColor: colors.primary,
      borderRadius: Radius.pill,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.textOnPrimary,
    },
    markerSelected: {
      backgroundColor: colors.live,
      borderColor: colors.textOnPrimary,
      width: 38,
      height: 38,
    },
    markerText: {
      ...Typography.label,
      color: colors.textOnPrimary,
      fontWeight: '700',
      fontSize: 13,
    },
    markerTextSelected: {
      fontSize: 15,
    },
  });
}
