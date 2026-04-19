const path = require('path');

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-.*|@expo/.*|react-native-.*|@react-native-.*|@supabase/.*|date-fns)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@stores/(.*)$': '<rootDir>/stores/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@app-types/(.*)$': '<rootDir>/types/$1',
    '^@theme/(.*)$': '<rootDir>/theme/$1',
    '^@theme$': '<rootDir>/theme/index',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^react-native-mmkv$': '<rootDir>/__mocks__/react-native-mmkv.js',
    '^expo-haptics$': '<rootDir>/__mocks__/expo-haptics.js',
    '^expo-web-browser$': '<rootDir>/__mocks__/expo-web-browser.js',
    '^expo-linking$': '<rootDir>/__mocks__/expo-linking.js',
    '^@supabase/supabase-js$': '<rootDir>/__mocks__/@supabase/supabase-js.js',
  },
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleDirectories: [
    'node_modules',
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '../../node_modules'),
  ],
  collectCoverageFrom: [
    'services/calculations/**/*.ts',
    'utils/**/*.ts',
    '!**/*.d.ts',
  ],
};
