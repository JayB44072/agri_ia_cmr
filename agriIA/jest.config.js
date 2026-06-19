module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-.*|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-svg|expo-symbols|expo-router)/)',
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/?(*.)+(spec|test).(ts|tsx|js)'],
};
