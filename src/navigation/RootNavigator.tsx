import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { palette } from '@/theme';
import { storage, StorageKeys } from '@/storage/storage';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { ProfileEditScreen } from '@/screens/ProfileEditScreen';
import { CreateRoomScreen } from '@/screens/CreateRoomScreen';
import { PlatformSelectScreen } from '@/screens/PlatformSelectScreen';
import { WebViewLoginScreen } from '@/screens/WebViewLoginScreen';
import { RoomScreen } from '@/screens/RoomScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Native stack with interactive swipe-back, translucent headers hidden in
 * favour of our custom NavBars, and native sheet presentation for the
 * create-room flow (form sheet on iOS, full-screen elsewhere).
 */
export function RootNavigator() {
  const seenOnboarding = storage.getBool(StorageKeys.onboardingDone) === true;

  return (
    <Stack.Navigator
      initialRouteName={seenOnboarding ? 'Home' : 'Onboarding'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.background },
        animation: 'slide_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
      <Stack.Screen name="PlatformSelect" component={PlatformSelectScreen} />
      <Stack.Screen name="WebViewLogin" component={WebViewLoginScreen} />
      <Stack.Screen
        name="Room"
        component={RoomScreen}
        // No accidental swipe-out of a room — leaving is confirmed via the X.
        options={{ animation: 'slide_from_right', gestureEnabled: false, fullScreenGestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
