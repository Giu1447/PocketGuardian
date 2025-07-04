/**
 * Home Screen - Hauptbildschirm der PocketGuardian App (Expo Router)
 * BEREINIGT: Ohne Hintergrundaktivitäten und Rückkamera-Logik
 */

import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Surface, Switch, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppSettings, EmergencyContact } from '../../src/types';

// Mock Services für Entwicklung
const mockServices = {
  audioService: {
    playAlarmSound: async (loop: boolean = false) => Promise.resolve(),
    stopSound: async () => Promise.resolve(),
  },
  cameraService: {
    initialize: async () => Promise.resolve(true),
  },
  notificationService: {
    initialize: async () => Promise.resolve(true),
    showLocalNotification: async (options: any) => Promise.resolve(),
  },
  sensorService: {
    initialize: async () => Promise.resolve(true),
    updateSettings: (settings: any) => {},
    setPocketStateHandler: (handler: any) => {},
    stopMonitoring: () => {},
    startMonitoring: (onMotion: any, onData?: any) => {},
    testMotionDetection: () => {},
  },
};

const { audioService, cameraService, notificationService, sensorService } = mockServices;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPocketMode, setIsPocketMode] = useState(false);
  const [autoModeEnabled, setAutoModeEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sensorData, setSensorData] = useState<{
    totalAcceleration?: number;
    timeSinceLastMotion?: number | string;
    lightLevel?: number;
    inPocket?: boolean;
  } | null>(null);
  
  const appState = useRef(AppState.currentState);

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
    
    // Reinigung beim Unmount
    return () => {
      const cleanup = async () => {
        try {
          await audioService.stopSound();
        } catch (error) {
          console.error('❌ Fehler beim Stoppen des Alarm-Sounds beim Unmount:', error);
        }
      };
      cleanup();
    };
  }, []);

  // toggleMonitoring muss vor handleAppStateChange deklariert werden!
  /**
   * Startet/Stoppt die Bewegungsüberwachung - Ohne Hintergrundaktivitäten
   */
  const toggleMonitoring = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      if (isMonitoring) {
        // Stoppe Überwachung
        sensorService.stopMonitoring();
        setIsMonitoring(false);
        setSensorData(null);
        console.log('⏹️ Überwachung gestoppt');
        
        // Stoppe auch den Alarm-Sound
        try {
          await audioService.stopSound();
          console.log('🔇 Alarm-Sound gestoppt beim Deaktivieren der Überwachung');
        } catch (soundError) {
          console.error('❌ Fehler beim Stoppen des Alarm-Sounds:', soundError);
        }
        
        try {
          await notificationService.showLocalNotification({
            title: '⏹️ Überwachung gestoppt',
            body: 'PocketGuardian-Überwachung wurde deaktiviert',
            data: { type: 'monitoring_stopped' }
          });
        } catch (error) {
          console.warn('⚠️ Notification-Fehler:', error);
        }
        
      } else {
        // Aktiviere Sensor-Einstellungen und starte Überwachung
        sensorService.updateSettings({
          isEnabled: true,
          sensitivity: 'low'
        });
        
        // Starte Überwachung mit Debug-Callback
        sensorService.startMonitoring(handleMotionDetected, (data: any) => {
          setSensorData(data);
        });
        setIsMonitoring(true);
        console.log('▶️ Überwachung gestartet');
        
        try {
          await notificationService.showLocalNotification({
            title: '✅ Überwachung gestartet',
            body: 'PocketGuardian überwacht jetzt Bewegungen',
            data: { type: 'monitoring_started' }
          });
        } catch (error) {
          console.warn('⚠️ Notification-Fehler:', error);
        }
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
  }, [isLoading, isMonitoring]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * Handler für App-Zustandsänderungen
   */
  const handleAppStateChange = useCallback((status: AppStateStatus) => {
    appState.current = status;
    
    if (status === 'active') {
      // App kommt in den Vordergrund
      console.log('🌼 App aktiv');
    } else {
      // App geht in den Hintergrund
      console.log('🌙 App inaktiv - stoppe Überwachung');
      if (isMonitoring) {
        toggleMonitoring().catch(error => {
          console.error('❌ Fehler beim Stoppen der Überwachung:', error);
        });
      }
      
      // Stoppe den Alarm-Sound, wenn die App in den Hintergrund geht
      audioService.stopSound().catch(error => {
        console.error('❌ Fehler beim Stoppen des Alarm-Sounds bei App-Deaktivierung:', error);
      });
    }
  }, [isMonitoring, toggleMonitoring]);

  /**
   * Initialisiert alle Services - Vereinfacht ohne Hintergrundaktivitäten
   */
  const initializeServices = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Initialisiere Services (ohne Hintergrundaktivitäten)...');

      // Sequentielle Initialisierung für Stabilität
      let sensorInit = false;
      let cameraInit = false;
      let notificationInit = false;

      try {
        sensorInit = await sensorService.initialize();
        console.log('✅ Sensor-Service:', sensorInit ? 'OK' : 'FEHLER');
      } catch (error) {
        console.warn('⚠️ Sensor-Service Fehler:', error);
      }

      try {
        cameraInit = await cameraService.initialize();
        console.log('✅ Kamera-Service:', cameraInit ? 'OK' : 'FEHLER');
      } catch (error) {
        console.warn('⚠️ Kamera-Service Fehler:', error);
      }

      try {
        notificationInit = await notificationService.initialize();
        console.log('✅ Notification-Service:', notificationInit ? 'OK' : 'FEHLER');
      } catch (error) {
        console.warn('⚠️ Notification-Service Fehler:', error);
      }

      // Konfiguriere Sensor-Einstellungen (SEHR UNSENSIBEL)
      try {
        sensorService.updateSettings(settings.sensorSettings);
        console.log('✅ Sensor-Einstellungen konfiguriert');
      } catch (error) {
        console.warn('⚠️ Fehler beim Konfigurieren der Sensor-Einstellungen:', error);
      }

      setIsInitialized(sensorInit && cameraInit && notificationInit);
    } catch (error) {
      console.error('❌ Fehler bei der Initialisierung:', error);
      Alert.alert(
        'Fehler',
        'Die Services konnten nicht initialisiert werden.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Wird aufgerufen, wenn eine Bewegung erkannt wird
   */
  const handleMotionDetected = useCallback(() => {
    console.log('🚨 BEWEGUNG ERKANNT IN HOME SCREEN');
    audioService.playAlarmSound(true).catch((error: any) => {
      console.error('❌ Audio-Fehler:', error);
    });
    handleEmergency();
  }, []);

  /**
   * Behandelt Notfälle - Vereinfacht mit nur Frontkamera
   */
  const handleEmergency = useCallback(async () => {
    try {
      console.log('🚨 Notfall-Handler gestartet');
      
      router.push({
        pathname: '/alert',
        params: {
          type: 'motion',
          timestamp: Date.now().toString()
        }
      });
      
    } catch (error) {
      console.error('❌ Fehler im Notfall-Handler:', error);
    }
  }, []);

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
  const handleTestMotion = useCallback(() => {
    if (isMonitoring) {
      sensorService.testMotionDetection();
    } else {
      Alert.alert(
        'Test nicht möglich',
        'Bitte starten Sie zuerst die Überwachung.',
        [{ text: 'OK' }]
      );
    }
  }, [isMonitoring]);

  if (!isInitialized) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={{ overflow: 'hidden', borderRadius: 12 }}>
          <Surface style={styles.loadingContainer}>
            <Text variant="headlineSmall">🛡️ PocketGuardian</Text>
            <Text variant="bodyMedium" style={styles.loadingText}>
              Initialisiere Services...
            </Text>
          </Surface>
        </View>
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
      <View style={{ overflow: 'hidden', borderRadius: 12, marginBottom: 16 }}>
        <Surface style={styles.headerContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            🛡️ PocketGuardian
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Intelligente Sicherheitsüberwachung
          </Text>
        </Surface>
      </View>

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
            • Nur Vorderkamera wird für 5 Sekunden verwendet{'\n'}
            • Notfallkontakte regelmäßig testen
          </Text>
        </Card.Content>
      </Card>

      {/* NEU: Debug-Karte für Live-Sensor-Daten */}
      {isMonitoring && sensorData && (
        <Card style={styles.card}>
          <Card.Title title="Live Sensor-Daten (Debug)" subtitle="Wird nur bei aktiver Überwachung angezeigt" />
          <Card.Content>
            <View style={styles.sensorDataContainer}>
              {/* Bewegungssensor-Daten */}
              <View style={styles.sensorDataColumn}>
                <Text style={styles.sensorDataTitle}>Bewegungssensor:</Text>
                <Text>Beschleunigung: {sensorData.totalAcceleration || 'N/A'}</Text>
                <Text>Zeit seit Bewegung: {
                  typeof sensorData.timeSinceLastMotion === 'number' 
                    ? sensorData.timeSinceLastMotion.toFixed(1) 
                    : typeof sensorData.timeSinceLastMotion === 'string'
                      ? sensorData.timeSinceLastMotion.replace('s', '')
                      : 'N/A'
                }s</Text>
              </View>
              
              {/* Lichtsensor-Daten */}
              <View style={styles.sensorDataColumn}>
                <Text style={styles.sensorDataTitle}>Lichtsensor (simuliert):</Text>
                <Text>Lichtstärke: {sensorData.lightLevel || '?'} lux</Text>
                <Text>Status: {sensorData.inPocket ? 'Im Pocket' : 'Sichtbar'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Info-Karte: Notfallkontakte */}
      <Card style={styles.card}>
        <Card.Title title="Notfallkontakte" subtitle={`${settings.emergencyContacts.length} Kontakt(e) hinterlegt`} />
        <Card.Content>
          {settings.emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactRow}>
              <Text variant="bodyMedium">{contact.name}</Text>
              <Text variant="bodySmall" style={styles.contactInfo}>
                {contact.phone} {contact.email ? `| ${contact.email}` : ''}
              </Text>
            </View>
          ))}
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
  // Neue Styles für Sensor-Daten-Anzeige
  sensorDataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  sensorDataColumn: {
    flex: 1,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  sensorDataTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 14,
  },
  safetyCard: {
    marginBottom: 16,
  },
  safetyText: {
    lineHeight: 20,
    opacity: 0.8,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  contactRow: {
    marginVertical: 8,
  },
  contactInfo: {
    marginTop: 4,
    color: '#555',
  },
});
