/**
 * Home Screen - Hauptbildschirm der PocketGuardian App (Expo Router)
 * RESPONSIVE VERSION mit verbesserter Stabilität
 */

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Surface, Switch, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    backgroundTaskService,
    cameraService,
    emergencyService,
    notificationService,
    sensorService
} from '../../src/services';
import { AppSettings, EmergencyContact } from '../../src/types';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [backgroundStatus, setBackgroundStatus] = useState<string>('Unbekannt');
  const [isPocketMode, setIsPocketMode] = useState(false);
  const [autoModeEnabled, setAutoModeEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      threshold: 25.0, // Hochschwellig für Stabilität
      isEnabled: true,
      sensitivity: 'low'
    },
    autoCapture: true
  });

  useEffect(() => {
    initializeServices();
    checkBackgroundStatus();
  }, []);

  /**
   * Initialisiert alle Services - Vereinfacht für Stabilität
   */
  const initializeServices = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Initialisiere Services (vereinfacht)...');

      // Nur kritische Services initialisieren
      await sensorService.initialize();
      await notificationService.initialize();
      
      // Prüfe E-Mail-Verfügbarkeit
      const emailAvailable = await emergencyService.isEmailAvailable();
      console.log('📧 E-Mail verfügbar:', emailAvailable);

      // Setze Pocket-Handler
      sensorService.setPocketStateHandler(handlePocketStateChange);

      setIsInitialized(true);
      console.log('✅ Services erfolgreich initialisiert');

    } catch (error) {
      console.error('❌ Fehler bei Service-Initialisierung:', error);
      Alert.alert(
        'Initialisierungs-Fehler',
        'Einige Funktionen sind möglicherweise nicht verfügbar.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Überprüft den Background-Status - Vereinfacht
   */
  const checkBackgroundStatus = async () => {
    try {
      const status = await backgroundTaskService.getBackgroundStatus();
      setBackgroundStatus(status.status);
    } catch (error) {
      console.error('❌ Fehler beim Background-Status:', error);
      setBackgroundStatus('Fehler');
    }
  };

  /**
   * Handler für Pocket-Status-Änderungen (automatische Aktivierung/Deaktivierung)
   */
  const handlePocketStateChange = async (inPocket: boolean) => {
    try {
      setIsPocketMode(inPocket);
      
      if (!autoModeEnabled) {
        console.log('💡 Auto-Mode deaktiviert, ignoriere Pocket-Status');
        return;
      }
      
      console.log(`💡 Pocket-Status: ${inPocket ? 'IM POCKET' : 'DRAUSSEN'}`);
      
      if (inPocket && !isMonitoring) {
        // Automatisch aktivieren wenn im Pocket
        console.log('🔄 Auto-Aktivierung: Handy im Pocket erkannt');
        await toggleMonitoring();
        
        await notificationService.showLocalNotification({
          title: '🔄 Auto-Aktiviert',
          body: 'PocketGuardian wurde automatisch aktiviert',
          data: { type: 'auto_activated' }
        });
        
      } else if (!inPocket && isMonitoring && autoModeEnabled) {
        // Automatisch deaktivieren wenn draußen
        console.log('⏸️ Auto-Deaktivierung: Handy aus Pocket genommen');
        await toggleMonitoring();
        
        await notificationService.showLocalNotification({
          title: '⏸️ Auto-Deaktiviert',
          body: 'PocketGuardian wurde automatisch deaktiviert',
          data: { type: 'auto_deactivated' }
        });
      }
    } catch (error) {
      console.error('❌ Fehler bei Pocket-Handler:', error);
    }
  };

  /**
   * Startet/Stoppt die Bewegungsüberwachung - Vereinfacht
   */
  const toggleMonitoring = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      if (isMonitoring) {
        // Stoppe Überwachung
        sensorService.stopMonitoring();
        await backgroundTaskService.stopBackgroundMonitoring();
        setIsMonitoring(false);
        console.log('⏹️ Überwachung gestoppt');
        
        await notificationService.showLocalNotification({
          title: '⏹️ Überwachung gestoppt',
          body: 'PocketGuardian-Überwachung wurde deaktiviert',
          data: { type: 'monitoring_stopped' }
        });
        
      } else {
        // Starte Überwachung
        sensorService.updateSettings(settings.sensorSettings);
        
        sensorService.startMonitoring(async () => {
          console.log('🚨 Bewegung erkannt! Starte Notfallprotokoll...');
          await handleEmergency();
        });
        
        await backgroundTaskService.startBackgroundMonitoring();
        setIsMonitoring(true);
        console.log('✅ Überwachung gestartet');
        
        await notificationService.showLocalNotification({
          title: '✅ Überwachung gestartet',
          body: 'PocketGuardian überwacht jetzt Bewegungen',
          data: { type: 'monitoring_started' }
        });
      }
    } catch (error) {
      console.error('❌ Fehler beim Umschalten der Überwachung:', error);
      Alert.alert(
        'Fehler',
        'Die Überwachung konnte nicht umgeschaltet werden.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Behandelt Notfälle - Vereinfacht
   */
  const handleEmergency = async () => {
    try {
      console.log('🚨 Notfall-Handler gestartet');
      
      // Sofort zu Alert-Screen navigieren
      router.push('/alert');
      
      // Kamera-Aufnahme im Hintergrund
      setTimeout(async () => {
        await cameraService.takeDualPhotos();
      }, 500);
      
    } catch (error) {
      console.error('❌ Fehler im Notfall-Handler:', error);
    }
  };

  /**
   * Navigiert zu Kamera-Test
   */
  const handleCameraTest = () => {
    router.push('/camera');
  };

  /**
   * Navigiert zu Settings
   */
  const handleSettings = () => {
    router.push('/explore');
  };

  /**
   * Test-Bewegung simulieren
   */
  const handleTestMotion = () => {
    if (isMonitoring) {
      sensorService.testMotionDetection();
    } else {
      Alert.alert(
        'Test nicht möglich',
        'Bitte starten Sie zuerst die Überwachung.',
        [{ text: 'OK' }]
      );
    }
  };

  if (!isInitialized) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Surface style={styles.loadingContainer}>
          <Text variant="headlineSmall">🛡️ PocketGuardian</Text>
          <Text variant="bodyMedium" style={styles.loadingText}>
            Initialisiere Services...
          </Text>
        </Surface>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Surface style={styles.headerContainer}>
        <Text variant="headlineMedium" style={styles.title}>
          🛡️ PocketGuardian
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Intelligente Sicherheitsüberwachung
        </Text>
      </Surface>

      {/* Status Cards */}
      <View style={styles.statusGrid}>
        <Card style={[styles.statusCard, { backgroundColor: isMonitoring ? theme.colors.primaryContainer : theme.colors.surfaceVariant }]}>
          <Card.Content style={styles.statusContent}>
            <Text variant="titleMedium" style={styles.statusTitle}>
              {isMonitoring ? '🔄 Aktiv' : '⏸️ Inaktiv'}
            </Text>
            <Text variant="bodySmall" style={styles.statusText}>
              Überwachung {isMonitoring ? 'läuft' : 'pausiert'}
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statusCard, { backgroundColor: isPocketMode ? theme.colors.tertiaryContainer : theme.colors.surfaceVariant }]}>
          <Card.Content style={styles.statusContent}>
            <Text variant="titleMedium" style={styles.statusTitle}>
              {isPocketMode ? '📱 Pocket' : '🤏 Draußen'}
            </Text>
            <Text variant="bodySmall" style={styles.statusText}>
              {isPocketMode ? 'Im Pocket' : 'Außerhalb'}
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Main Controls */}
      <Card style={styles.controlCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Hauptsteuerung
          </Text>
          
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text variant="titleMedium">Überwachung</Text>
              <Text variant="bodySmall" style={styles.switchSubtext}>
                {isMonitoring ? 'Aktiv - Bewegungen werden überwacht' : 'Inaktiv - Keine Überwachung'}
              </Text>
            </View>
            <Switch
              value={isMonitoring}
              onValueChange={toggleMonitoring}
              disabled={isLoading}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text variant="titleMedium">Auto-Mode</Text>
              <Text variant="bodySmall" style={styles.switchSubtext}>
                Automatische Aktivierung in der Tasche
              </Text>
            </View>
            <Switch
              value={autoModeEnabled}
              onValueChange={setAutoModeEnabled}
              disabled={isLoading}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            📊 System-Info
          </Text>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium">Background-Status:</Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              {backgroundStatus}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium">Sensitivität:</Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              {settings.sensorSettings.sensitivity} ({settings.sensorSettings.threshold})
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium">Notfallkontakte:</Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              {settings.emergencyContacts.length}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleCameraTest}
          style={styles.actionButton}
          disabled={isLoading}
          icon="camera"
        >
          Kamera testen
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleTestMotion}
          style={styles.actionButton}
          disabled={isLoading || !isMonitoring}
          icon="motion-sensor"
        >
          Bewegung simulieren
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleSettings}
          style={styles.actionButton}
          disabled={isLoading}
          icon="cog"
        >
          Einstellungen
        </Button>
      </View>

      {/* Safety Info */}
      <Card style={styles.safetyCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            ⚠️ Sicherheitshinweise
          </Text>
          <Text variant="bodySmall" style={styles.safetyText}>
            • Nur starkes Schütteln löst Alarm aus{'\n'}
            • Auto-Mode aktiviert bei Pocket-Erkennung{'\n'}
            • Background-Überwachung abhängig von Gerät{'\n'}
            • Notfallkontakte regelmäßig testen
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Extra space for bottom navigation
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    padding: 40,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  headerContainer: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
  statusGrid: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statusCard: {
    flex: 1,
    minHeight: 80,
  },
  statusContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  statusTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusText: {
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
  controlCard: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  switchText: {
    flex: 1,
    marginRight: 16,
  },
  switchSubtext: {
    marginTop: 4,
    opacity: 0.7,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoValue: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  actionButton: {
    marginVertical: 6,
  },
  safetyCard: {
    marginBottom: 16,
  },
  safetyText: {
    lineHeight: 20,
    opacity: 0.8,
  },
});
