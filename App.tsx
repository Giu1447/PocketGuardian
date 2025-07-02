/**
 * PocketGuardian - Haupteinstiegspunkt der App
 * 
 * Eine intelligente Sicherheits-App, die bei unerwarteten Bewegungen
 * automatisch Fotos aufnimmt und Notfallkontakte benachrichtigt.
 */

import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';

import AppNavigation from './src/navigation/AppNavigation';
import {
    backgroundTaskService,
    emailService,
    notificationService,
    sensorService
} from './src/services';
import ThemeProvider from './src/theme/ThemeProvider';

export default function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * App-Initialisierung
   */
  const initializeApp = async () => {
    try {
      console.log('🚀 PocketGuardian wird gestartet...');

      // Initialisiere Services
      const initResults = await Promise.allSettled([
        sensorService.initialize(),
        notificationService.initialize(),
        emailService.isAvailable(), // Prüfe E-Mail-Verfügbarkeit
      ]);

      // Prüfe Initialisierungsergebnisse
      const sensorResult = initResults[0];
      const notificationResult = initResults[1];
      const emailResult = initResults[2];

      if (sensorResult.status === 'rejected') {
        console.warn('Sensor-Initialisierung fehlgeschlagen:', sensorResult.reason);
      }

      if (notificationResult.status === 'rejected') {
        console.warn('Benachrichtigungs-Initialisierung fehlgeschlagen:', notificationResult.reason);
      }

      if (emailResult.status === 'fulfilled') {
        console.log('📧 E-Mail-Service verfügbar:', emailResult.value);
      } else {
        console.warn('E-Mail-Service nicht verfügbar:', emailResult.reason);
      }

      // Prüfe Background-Fähigkeiten
      const backgroundStatus = await backgroundTaskService.getBackgroundStatus();
      if (!backgroundStatus.available) {
        console.warn('Background-Tasks nicht verfügbar');
        
        // Warnung nur auf echten Geräten anzeigen
        if (!__DEV__) {
          Alert.alert(
            'Hinweis',
            'Hintergrund-Funktionen sind auf diesem Gerät eingeschränkt. Die App funktioniert nur im Vordergrund optimal.',
            [{ text: 'Verstanden' }]
          );
        }
      }

      // Willkommens-Benachrichtigung (nur im Dev-Mode)
      if (__DEV__) {
        setTimeout(async () => {
          await notificationService.showLocalNotification({
            title: '🛡️ PocketGuardian gestartet',
            body: 'Willkommen! Die App ist bereit zur Bewegungsüberwachung.',
            data: { type: 'welcome' }
          });
        }, 2000);
      }

      console.log('✅ PocketGuardian erfolgreich gestartet');

    } catch (error) {
      console.error('❌ Fehler beim Starten der App:', error);
      
      Alert.alert(
        'Startup-Fehler',
        'Ein unerwarteter Fehler ist beim Starten der App aufgetreten. Bitte starten Sie die App neu.',
        [{ text: 'OK' }]
      );
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
