import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  DarkTheme,
  NavigationContainer,
  Theme,
} from '@react-navigation/native';

import { palette } from '@/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ensureSession, isBackendConfigured } from '@/backend';

const asteraTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.background,
    card: palette.surface,
    text: palette.textPrimary,
    border: palette.separator,
    primary: palette.copper,
    notification: palette.copper,
  },
};

export default function App() {
  // Establish a backend identity once, when configured. No-ops on mock data.
  useEffect(() => {
    if (isBackendConfigured) {
      ensureSession().catch((e) => console.warn('[astera] backend init failed:', e));
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={asteraTheme}>
          <StatusBar style="light" />
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
