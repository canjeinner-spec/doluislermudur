import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { palette } from '@/theme';
import { HomeScreen } from '@/screens/HomeScreen';
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
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.background },
        animation: 'slide_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
      <Stack.Screen name="PlatformSelect" component={PlatformSelectScreen} />
      <Stack.Screen name="WebViewLogin" component={WebViewLoginScreen} />
      <Stack.Screen
        name="Room"
        component={RoomScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
