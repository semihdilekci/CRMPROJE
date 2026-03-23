/**
 * Fallback App component for expo/AppEntry resolution in monorepo.
 * expo/AppEntry.js imports ../../App; from root node_modules that resolves
 * to monorepo root. This file satisfies that when Metro/Expo Go uses
 * the default entry path.
 */
import { App } from './apps/mobile/node_modules/expo-router/build/qualified-entry';
export default App;
