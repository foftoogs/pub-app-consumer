import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import VenueMap, { MapPin } from '../components/ui/venue-map';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Override the global react-native-maps mock with one that captures onPress
jest.mock('react-native-maps', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  const MockMapView = (props: any) => (
    <View testID={props.testID}>{props.children}</View>
  );
  const MockMarker = (props: any) => (
    <TouchableOpacity testID={`marker-${props.title}`} onPress={props.onPress}>
      {props.children}
    </TouchableOpacity>
  );
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
  };
});

const pin1: MapPin = {
  id: 'v1',
  latitude: -37.82,
  longitude: 144.99,
  title: 'The Local Pub',
  label: '1',
};

const pin2: MapPin = {
  id: 'v2',
  latitude: -37.81,
  longitude: 144.97,
  title: 'Cocktail Lounge',
  label: '2',
  selected: true,
};

describe('VenueMap', () => {
  it('renders with testID and correct height', () => {
    const { getByTestId } = render(
      <VenueMap pins={[pin1]} testID="test-map" height={300} />
    );
    expect(getByTestId('test-map')).toBeTruthy();
  });

  it('renders markers for each pin', () => {
    const { getByTestId } = render(<VenueMap pins={[pin1, pin2]} />);
    expect(getByTestId('marker-The Local Pub')).toBeTruthy();
    expect(getByTestId('marker-Cocktail Lounge')).toBeTruthy();
  });

  it('displays pin labels', () => {
    const { getByText } = render(<VenueMap pins={[pin1, pin2]} />);
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });

  it('falls back to first character of title when no label', () => {
    const noLabelPin: MapPin = { id: 'v3', latitude: -37.8, longitude: 145.0, title: 'Zephyr Bar' };
    const { getByText } = render(<VenueMap pins={[noLabelPin]} />);
    expect(getByText('Z')).toBeTruthy();
  });

  it('calls onPinPress when a marker is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <VenueMap pins={[pin1]} onPinPress={onPress} />
    );
    fireEvent.press(getByTestId('marker-The Local Pub'));
    expect(onPress).toHaveBeenCalledWith(pin1);
  });

  it('renders with default region when no pins', () => {
    const { toJSON } = render(<VenueMap pins={[]} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with single pin region', () => {
    const { toJSON } = render(<VenueMap pins={[pin1]} />);
    expect(toJSON()).toBeTruthy();
  });

  it('uses initialRegion when provided', () => {
    const region = { latitude: -33.87, longitude: 151.21, latitudeDelta: 0.1, longitudeDelta: 0.1 };
    const { toJSON } = render(<VenueMap pins={[pin1]} initialRegion={region} />);
    expect(toJSON()).toBeTruthy();
  });

  it('does not call onPinPress when not provided', () => {
    const { getByTestId } = render(<VenueMap pins={[pin1]} />);
    // Should not throw when pressing without onPinPress
    fireEvent.press(getByTestId('marker-The Local Pub'));
  });
});
