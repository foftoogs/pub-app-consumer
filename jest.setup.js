// Mock expo-secure-store globally for all tests
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-linear-gradient — render as a plain View in tests
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: (props) => <View {...props} />,
  };
});

// Mock react-native-svg — render SVG elements as plain Views
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  const MockSvg = (props) => <View {...props} />;
  const MockComponent = (props) => <View {...props} />;
  return {
    __esModule: true,
    default: MockSvg,
    Svg: MockSvg,
    Circle: MockComponent,
    Rect: MockComponent,
    Line: MockComponent,
    Path: MockComponent,
    G: MockComponent,
    Defs: MockComponent,
    LinearGradient: MockComponent,
    Stop: MockComponent,
    Ellipse: MockComponent,
  };
});

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const MockMapView = (props) => <View testID={props.testID} {...props} />;
  MockMapView.Marker = (props) => <View {...props} />;
  const MockMarker = (props) => <View {...props} />;
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
  };
});

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: -37.8136, longitude: 144.9631 } })
  ),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({ data: 'ExponentPushToken[mock]' })
  ),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  removeNotificationSubscription: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { HIGH: 4 },
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: false,
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}));

// Mock @expo/vector-icons to avoid async font loading that causes
// act() warnings and prevents Jest from exiting cleanly.
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  const createIcon = () => (props) => <Text {...props}>{props.name}</Text>;
  return {
    Ionicons: createIcon(),
    MaterialIcons: createIcon(),
    FontAwesome: createIcon(),
    Feather: createIcon(),
  };
});
