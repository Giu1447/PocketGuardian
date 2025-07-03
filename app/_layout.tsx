/**
 * Root Layout für PocketGuardian App
 * STABILISIERTE VERSION
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ErrorBoundary from '../src/components/ErrorBoundary';
import {
    notificationService,
    sensorService
} from '../src/services';

export default function RootLayout() {
  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * App-Initialisierung - Vereinfacht für Stabilität
   */
  const initializeApp = async () => {
    try {
      console.log('🚀 PocketGuardian wird gestartet (Root Layout)...');

      // Nur kritische Services initialisieren
      try {
        await sensorService.initialize();
        console.log('✅ Sensor-Service initialisiert');
      } catch (error) {
        console.warn('⚠️ Sensor-Initialisierung fehlgeschlagen:', error);
      }

      try {
        await notificationService.initialize();
        console.log('✅ Notification-Service initialisiert');
      } catch (error) {
        console.warn('⚠️ Notification-Initialisierung fehlgeschlagen:', error);
      }

      console.log('✅ Root Layout erfolgreich initialisiert');

    } catch (error) {
      console.error('❌ Fehler beim Starten der App (Root Layout):', error);
      
      // Nur kritische Fehler dem User anzeigen
      if (!__DEV__) {
        Alert.alert(
          'Startup-Fehler',
          'Ein Fehler ist aufgetreten. Bitte starten Sie die App neu.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider theme={MD3LightTheme}>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#007AFF',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false 
              }} 
            />
            <Stack.Screen 
              name="alert" 
              options={{ 
                title: '🚨 Notfall',
                presentation: 'modal'
              }} 
            />
            <Stack.Screen 
              name="camera" 
              options={{ 
                title: '📸 Kamera',
                presentation: 'modal'
              }} 
            />
          </Stack>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

/**
 * App-Metadaten für Debugging
 */
if (__DEV__) {
  console.log('🛡️ PocketGuardian Development Build');
  console.log('📱 Platform:', Platform.OS);
  console.log('🏗️ Build Environment:', __DEV__ ? 'Development' : 'Production');
}
