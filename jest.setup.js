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

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}));
