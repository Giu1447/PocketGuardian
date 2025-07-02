/**
 * Home Screen - Hauptbildschirm der App
 */

import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, Surface, Switch, Text, useTheme } from 'react-native-paper';
import {
    backgroundTaskService,
    cameraService,
    emergencyService,
    notificationService,
    sensorService
} from '../services';
import { AppSettings, EmergencyContact } from '../types';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const theme = useTheme();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [backgroundStatus, setBackgroundStatus] = useState<string>('Unbekannt');

  // Dummy-Einstellungen (würden normalerweise aus AsyncStorage kommen)
  const [settings] = useState<AppSettings>({
    darkMode: false,
    emergencyContacts: [
      {
        id: '1',
        name: 'Notfallkontakt 1',
        phone: '+49123456789',
        email: 'notfall@example.com'
      }
    ] as EmergencyContact[],
    sensorSettings: {
      threshold: 1.0,
      isEnabled: true,
      sensitivity: 'medium'
    },
    autoCapture: true
  });

  useEffect(() => {
    initializeServices();
    checkBackgroundStatus();
  }, []);

  /**
   * Initialisiert alle Services
   */
  const initializeServices = async () => {
    try {
      console.log('🚀 Initialisiere Services...');
      
      // Initialisiere Services parallel
      const [sensorInit, cameraInit, notificationInit] = await Promise.all([
        sensorService.initialize(),
        cameraService.initialize(),
        notificationService.initialize()
      ]);

      if (!sensorInit) {
        Alert.alert('Warnung', 'Sensor-Berechtigung nicht erteilt');
      }
      
      if (!cameraInit) {
        Alert.alert('Warnung', 'Kamera-Berechtigung nicht erteilt');
      }

      if (!notificationInit) {
        Alert.alert('Warnung', 'Benachrichtigungs-Berechtigung nicht erteilt');
      }

      // Konfiguriere Sensor-Einstellungen
      sensorService.updateSettings(settings.sensorSettings);

      setIsInitialized(true);
      console.log('✅ Services erfolgreich initialisiert');

    } catch (error) {
      console.error('Fehler beim Initialisieren der Services:', error);
      Alert.alert('Fehler', 'Services konnten nicht initialisiert werden');
    }
  };

  /**
   * Überprüft den Background-Status
   */
  const checkBackgroundStatus = async () => {
    const status = await backgroundTaskService.getBackgroundStatus();
    setBackgroundStatus(status.status);
  };

  /**
   * Startet/Stoppt die Bewegungsüberwachung
   */
  const toggleMonitoring = async () => {
    if (isMonitoring) {
      // Stoppe Überwachung
      sensorService.stopMonitoring();
      await backgroundTaskService.stopBackgroundMonitoring();
      setIsMonitoring(false);
      
      await notificationService.showLocalNotification({
        title: '⏹️ Überwachung gestoppt',
        body: 'PocketGuardian wurde deaktiviert.',
        data: { type: 'monitoring_stopped' }
      });
      
    } else {
      // Starte Überwachung
      if (!isInitialized) {
        Alert.alert('Fehler', 'Services sind noch nicht initialisiert');
        return;
      }

      // Starte Sensor-Überwachung mit Callback
      sensorService.startMonitoring(handleMotionDetected);
      
      // Starte Hintergrund-Überwachung
      const backgroundSuccess = await backgroundTaskService.startBackgroundMonitoring();
      
      if (!backgroundSuccess) {
        Alert.alert(
          'Warnung', 
          'Hintergrund-Überwachung nicht verfügbar. App funktioniert nur im Vordergrund.'
        );
      }

      setIsMonitoring(true);
      
      await notificationService.showLocalNotification({
        title: '🛡️ Überwachung gestartet',
        body: 'PocketGuardian überwacht nun Bewegungen.',
        data: { type: 'monitoring_started' }
      });
    }
  };

  /**
   * Wird bei Bewegungserkennung aufgerufen
   */
  const handleMotionDetected = async () => {
    console.log('🚨 Bewegung erkannt - starte Notfall-Prozedur');
    
    try {
      // Benachrichtige über Bewegungserkennung
      await notificationService.notifyMotionDetected();
      
      // Navigiere zum Alert-Screen
      navigation.navigate('Alert', {
        type: 'motion',
        timestamp: Date.now()
      });

      // Automatische Kamera-Aktivierung erfolgt im Alert-Screen
      
    } catch (error) {
      console.error('Fehler bei Bewegungserkennung:', error);
      await notificationService.notifyError('Fehler bei der Bewegungserkennung');
    }
  };

  /**
   * Manueller Test der Bewegungserkennung
   */
  const testMotionDetection = () => {
    if (!isMonitoring) {
      Alert.alert('Info', 'Starten Sie zuerst die Überwachung');
      return;
    }
    
    sensorService.testMotionDetection();
  };

  /**
   * Test aller Systeme
   */
  const runSystemTest = async () => {
    Alert.alert(
      'System-Test',
      'Alle Systeme werden getestet. Dies kann einen Moment dauern.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Starten', 
          onPress: async () => {
            try {
              // Teste Benachrichtigungen
              await notificationService.testNotification();
              
              // Teste Background-Funktionalität
              await backgroundTaskService.testBackgroundFunctionality();
              
              // Teste Notfall-System
              await emergencyService.testEmergencySystem(settings.emergencyContacts);
              
              Alert.alert('Test abgeschlossen', 'Prüfen Sie die Benachrichtigungen für Details');
            } catch (error) {
              Alert.alert('Test-Fehler', 'Ein oder mehrere Tests sind fehlgeschlagen');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.headerCard}>
        <Text variant="headlineMedium" style={styles.title}>
          🛡️ PocketGuardian
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Intelligenter Bewegungsschutz
        </Text>
      </Surface>

      <Card style={styles.statusCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.statusTitle}>
            Status
          </Text>
          <View style={styles.statusItem}>
            <Text variant="bodyMedium">Überwachung:</Text>
            <Text 
              variant="bodyMedium" 
              style={[styles.statusValue, { color: isMonitoring ? theme.colors.primary : theme.colors.outline }]}
            >
              {isMonitoring ? '🟢 Aktiv' : '🔴 Inaktiv'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text variant="bodyMedium">Services:</Text>
            <Text 
              variant="bodyMedium" 
              style={[styles.statusValue, { color: isInitialized ? theme.colors.primary : theme.colors.outline }]}
            >
              {isInitialized ? '✅ Bereit' : '⏳ Initialisiert...'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text variant="bodyMedium">Hintergrund:</Text>
            <Text variant="bodyMedium" style={styles.statusValue}>
              {backgroundStatus}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.controlCard}>
        <Card.Content>
          <View style={styles.switchContainer}>
            <Text variant="titleMedium">Bewegungsüberwachung</Text>
            <Switch
              value={isMonitoring}
              onValueChange={toggleMonitoring}
              disabled={!isInitialized}
            />
          </View>
          
          <Button
            mode="contained"
            onPress={testMotionDetection}
            disabled={!isMonitoring}
            style={styles.button}
            icon="test-tube"
          >
            Bewegung testen
          </Button>
          
          <Button
            mode="outlined"
            onPress={runSystemTest}
            style={styles.button}
            icon="cog"
          >
            System-Test
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.infoTitle}>
            ℹ️ Information
          </Text>
          <Text variant="bodySmall" style={styles.infoText}>
            Aktivieren Sie die Überwachung, um automatisch Fotos bei unerwarteten Bewegungen aufzunehmen.
            {'\n\n'}
            Konfigurieren Sie Notfallkontakte in den Einstellungen.
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 4,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusValue: {
    fontWeight: '500',
  },
  controlCard: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
  infoCard: {
    flex: 1,
  },
  infoTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  infoText: {
    lineHeight: 20,
    opacity: 0.8,
  },
});
