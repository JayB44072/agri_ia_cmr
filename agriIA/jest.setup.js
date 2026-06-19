// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-symbols
jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

// Silence LogBox warnings in tests
jest.mock('react-native/Libraries/LogBox/LogBox', () => ({
  __esModule: true,
  default: { ignoreLogs: jest.fn(), install: jest.fn() },
}));
