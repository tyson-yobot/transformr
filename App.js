// Monorepo shim: expo/AppEntry.js at root node_modules resolves to ../../App.
// Re-export the expo-router qualified entry App component.
// NOTE: expo/AppEntry.js calls registerRootComponent(App) after this import,
// which is the correct single registration point.
import '@expo/metro-runtime';
export { App as default } from 'expo-router/build/qualified-entry';
