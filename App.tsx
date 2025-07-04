/**
 * PocketGuardian - Haupteinstiegspunkt der App
 * STABILISIERTE VERSION für bessere Performance
 */

import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';

import AppNavigation from './src/navigation/AppNavigation';
import {
    notificationService,
    sensorService
} from './src/services';
import ThemeProvider from './src/theme/ThemeProvider';

export default function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * App-Initialisierung - Vereinfacht für Stabilität
   */
  const initializeApp = async () => {
    try {
      console.log('🚀 PocketGuardian wird gestartet (stabilisiert)...');

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

      console.log('✅ PocketGuardian erfolgreich gestartet');

    } catch (error) {
      console.error('❌ Fehler beim Starten der App:', error);
      
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
    <ThemeProvider>
      <StatusBar style="auto" />
      <AppNavigation />
    </ThemeProvider>
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
