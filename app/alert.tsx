/**
 * Alert Screen - Wird bei Bewegungserkennung angezeigt (Expo Router)
 */

import { CameraView } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Alert as RNAlert, StyleSheet, View } from 'react-native';
import { Button, Card, ProgressBar, Surface, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    audioService,
    cameraService,
    emergencyService,
    notificationService
} from '../src/services';
import { CapturedImage, EmergencyContact, EmergencyData } from '../src/types';
import { formatDate } from '../src/utils/helpers';

export default function AlertScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const type = params.type as 'motion' | 'manual' || 'motion';
  const timestamp = parseInt(params.timestamp as string) || Date.now();
  
  const [countdown, setCountdown] = useState(5);
  const [isCapturing, setIsCapturing] = useState(false);
  const [emergencyData, setEmergencyData] = useState<EmergencyData | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string>('');
  const [isCancelled, setIsCancelled] = useState(false);
  const [camerasReady, setCamerasReady] = useState({ front: false });
  const [errorCount, setErrorCount] = useState(0); // Zähle Fehler um Schleifen zu vermeiden
  const [lastErrorTime, setLastErrorTime] = useState(0); // Vermeide Spam-Fehlermeldungen
  
  const frontCameraRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Dummy Notfallkontakte (würden normalerweise aus Settings kommen)
  const emergencyContacts: EmergencyContact[] = [
    {
      id: '1',
      name: 'Notfallkontakt 1',
      phone: '+49123456789',
      email: 'notfall@example.com'
    }
  ];

  useEffect(() => {
    let mounted = true; // Cleanup flag
    
    try {
      // Starte Alarm-Sound
      audioService.playAlarmSound(true).catch(error => {
        console.error('❌ Fehler beim Abspielen des Alarm-Sounds:', error);
      });
      
      // Setze Kamera-Referenzen
      cameraService.setFrontCameraRef(frontCameraRef.current);
      
      // Starte Pulsanimation
      startPulseAnimation();
      
      // Starte Countdown nur wenn nicht abgebrochen
      const countdownInterval = setInterval(() => {
        if (!mounted || isCancelled) return; // Cleanup check
        
        setCountdown(prev => {
          if (prev <= 1 && !isCancelled) {
            // Prüfe vor Aufnahme ob Kameras bereit sind
            if (camerasReady.front) {
              captureEmergencyVideo().catch(error => {
                console.error('Fehler bei automatischer Aufnahme:', error);
                if (mounted && !isCancelled) {
                  setSendStatus('❌ Automatische Aufnahme fehlgeschlagen');
                }
              });
            } else {
              // Kameras noch nicht bereit, verlängere Countdown
              console.log('⚠️ Kameras noch nicht bereit, verlängere Countdown...');
              setSendStatus('⏳ Warte auf Kameras...');
              return 3; // Gib mehr Zeit
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        mounted = false;
        clearInterval(countdownInterval);
        
        // Stoppe den Alarm-Sound beim Unmount
        audioService.stopSound().catch(error => {
          console.error('❌ Fehler beim Stoppen des Alarm-Sounds:', error);
        });
      };
    } catch (error) {
      console.error('Fehler bei AlertScreen useEffect:', error);
    }
  }, [isCancelled, camerasReady]);

  /**
   * Handler für Kamera-Bereitschaft
   */
  const handleFrontCameraReady = () => {
    console.log('✅ Front-Kamera bereit');
    setCamerasReady(prev => ({ ...prev, front: true }));
    cameraService.setFrontCameraReady();
  };

  /**
   * Startet die Pulsanimation
   */
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  /**
   * Bricht den Alert ab
   */
  const cancelAlert = () => {
    setIsCancelled(true);
    // Stoppe den Alarm-Sound
    audioService.stopSound().catch(error => {
      console.error('❌ Fehler beim Stoppen des Alarm-Sounds:', error);
    });
    router.back();
  };

  /**
   * Nimmt ein Video im Notfall auf - Verbessert gegen Abstürze
   */
  const captureEmergencyVideo = async () => {
    if (isCapturing || isCancelled) {
      console.log('🔄 Aufnahme bereits aktiv oder abgebrochen');
      return;
    }

    // Vermeide zu häufige Versuche
    const now = Date.now();
    if (now - lastErrorTime < 5000 && errorCount >= 3) {
      console.log('🛑 Zu viele Fehler, pausiere weitere Versuche');
      setSendStatus('❌ Zu viele Fehler - Bitte manuell wiederholen');
      return;
    }

    try {
      setIsCapturing(true);
      setSendStatus('🎥 Nehme Video auf...');
      console.log('🎥 Starte Videoaufnahme...');

      // Prüfe Kamera-Status
      if (!camerasReady.front) {
        throw new Error('Kamera nicht bereit');
      }

  // Setze Kamera-Referenz für den Service
      cameraService.setFrontCameraRef(frontCameraRef.current);

      // Führe Videoaufnahme durch
      const newEmergencyData = await cameraService.captureEmergencyVideo();

      if (!newEmergencyData) {
        throw new Error('Videoaufnahme fehlgeschlagen');
      }

      setEmergencyData(newEmergencyData);
      console.log('✅ Notfall-Video erfolgreich aufgenommen');
      
      // Reset Fehlerzähler bei Erfolg
      setErrorCount(0);
      setLastErrorTime(0);

      // Automatisch senden
      sendEmergencyVideoToContacts(newEmergencyData);

    } catch (error) {
      console.error('❌ Fehler bei Video-Aufnahme:', error);
      
      // Update Fehlerzähler
      setErrorCount(prev => prev + 1);
      setLastErrorTime(Date.now());
      
      // Zeige angemessene Fehlermeldung basierend auf Fehlertyp
      let errorMessage = '❌ Video konnte nicht aufgenommen werden';
      
      if (error instanceof Error) {
        if (error.message.includes('Kamera')) {
          errorMessage = '❌ Kamera nicht verfügbar - Bitte Berechtigungen prüfen';
        } else if (error.message.includes('bereit')) {
          errorMessage = '⏳ Kamera wird vorbereitet - Bitte warten...';
        }
      }
      
      setSendStatus(errorMessage);
      
      // Verhindere Alert-Spam - zeige nur bei ersten Fehlern
      if (errorCount < 2) {
        setTimeout(() => {
          if (!isCancelled) {
            RNAlert.alert(
              'Fehler', 
              errorMessage,
              [
                { text: 'OK', onPress: () => {
                  // Stoppe den Alarm-Sound bei schwerwiegenden Fehlern
                  if (errorMessage.includes('nicht verfügbar') || errorCount >= 2) {
                    audioService.stopSound().catch(error => {
                      console.error('❌ Fehler beim Stoppen des Alarm-Sounds:', error);
                    });
                  }
                }}
              ]
            );
          }
        }, 500);
      }
      
    } finally {
      setIsCapturing(false);
    }
  };



  /**
   * Sendet das Notfall-Video an Kontakte
   */
  const sendEmergencyVideoToContacts = async (data: EmergencyData) => {
    try {
      setIsSending(true);
      setSendStatus('Sende Notfall-Nachrichten...');

      console.log('📤 Sende Notfall-Video-Nachrichten...');

      // Führe Notfall-Prozedur mit Video aus
      const result = await emergencyService.executeEmergencyProcedureWithVideo(data, emergencyContacts);

      if (result.success) {
        setSendStatus('✅ Notfall-Nachrichten erfolgreich gesendet!');
        
        await notificationService.showLocalNotification({
          title: '✅ Notfall-Nachrichten gesendet',
          body: `${emergencyContacts.length} Kontakte wurden mit Notfall-Video benachrichtigt.`,
          data: { type: 'emergency_sent' }
        });

        // Nach 3 Sekunden zur Hauptseite zurückkehren
        setTimeout(() => {
          // Stoppe den Alarm-Sound
          audioService.stopSound().catch(error => {
            console.error('❌ Fehler beim Stoppen des Alarm-Sounds:', error);
          });
          router.replace('/');
        }, 3000);

      } else {
        setSendStatus('❌ Fehler beim Senden der Notfall-Nachrichten');
        RNAlert.alert(
          'Fehler',
          'Nicht alle Notfall-Nachrichten konnten gesendet werden.',
          [
            { text: 'Wiederholen', onPress: () => sendEmergencyVideoToContacts(data) },
            { text: 'Zurück', onPress: () => {
              // Stoppe den Alarm-Sound
              audioService.stopSound().catch(error => {
                console.error('❌ Fehler beim Stoppen des Alarm-Sounds:', error);
              });
              router.back();
            }}
          ]
        );
      }

    } catch (error) {
      console.error('❌ Fehler beim Senden der Notfall-Nachrichten:', error);
      setSendStatus('❌ Fehler beim Senden');
      RNAlert.alert(
        'Fehler', 
        'Notfall-Nachrichten konnten nicht gesendet werden',
        [
          { text: 'OK', onPress: () => {
            // Stoppe den Alarm-Sound
            audioService.stopSound().catch(error => {
              console.error('❌ Fehler beim Stoppen des Alarm-Sounds:', error);
            });
          }}
        ]
      );
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Legacy-Methode für Rückwärtskompatibilität
   */
  const sendToEmergencyContacts = async (image: CapturedImage) => {
    try {
      setIsSending(true);
      setSendStatus('Sende Notfall-Nachrichten...');

      console.log('📤 Sende Notfall-Nachrichten...');

      // Führe Notfall-Prozedur aus
      const result = await emergencyService.executeEmergencyProcedure(image, emergencyContacts);

      if (result.success) {
        setSendStatus('✅ Notfall-Nachrichten erfolgreich gesendet!');
        
        await notificationService.showLocalNotification({
          title: '✅ Notfall-Nachrichten gesendet',
          body: `${emergencyContacts.length} Kontakte wurden benachrichtigt.`,
          data: { type: 'emergency_sent' }
        });

        // Nach 3 Sekunden zur Hauptseite zurückkehren
        setTimeout(() => {
          // Stoppe den Alarm-Sound
          audioService.stopSound().catch(error => {
            console.error('❌ Fehler beim Stoppen des Alarm-Sounds:', error);
          });
          router.replace('/');
        }, 3000);

      } else {
        setSendStatus('❌ Fehler beim Senden der Notfall-Nachrichten');
        RNAlert.alert(
          'Fehler',
          'Nicht alle Notfall-Nachrichten konnten gesendet werden.',
          [
            { text: 'Wiederholen', onPress: () => sendToEmergencyContacts(image) },
            { text: 'Zurück', onPress: () => {
              // Stoppe den Alarm-Sound
              audioService.stopSound().catch(error => {
                console.error('❌ Fehler beim Stoppen des Alarm-Sounds:', error);
              });
              router.back();
            }}
          ]
        );
      }

    } catch (error) {
      console.error('❌ Fehler beim Senden der Notfall-Nachrichten:', error);
      setSendStatus('❌ Fehler beim Senden');
      RNAlert.alert(
        'Fehler', 
        'Notfall-Nachrichten konnten nicht gesendet werden',
        [
          { text: 'OK', onPress: () => {
            // Stoppe den Alarm-Sound
            audioService.stopSound().catch(error => {
              console.error('❌ Fehler beim Stoppen des Alarm-Sounds:', error);
            });
          }}
        ]
      );
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Manuelles Wiederholen der Aufnahme
   */
  const retakePhoto = () => {
    setEmergencyData(null);
    setCountdown(3);
    setIsCancelled(false);
  };

  // Alarm-Sound abspielen
  useEffect(() => {
    let mounted = true;
    
    const playAlarm = async () => {
      try {
        console.log('🔔 Starte Alarm-Sound...');
        
        // Initialisieren des Audio-Service
        await audioService.initAudio();
        
        // Alarm im Loop abspielen
        const success = await audioService.playAlarmSound(true);
        
        if (success) {
          console.log('✅ Alarm-Sound wird abgespielt');
        } else {
          console.warn('⚠️ Alarm-Sound konnte nicht abgespielt werden');
        }
      } catch (error) {
        console.error('❌ Fehler beim Abspielen des Alarm-Sounds:', error);
      }
    };
    
    // Starte Alarm-Sound
    playAlarm();
    
    // Cleanup bei Komponentenabbau
    return () => {
      mounted = false;
      audioService.stopSound().catch(error => {
        console.error('❌ Fehler beim Stoppen des Alarm-Sounds:', error);
      });
    };
  }, []); // Leerer Dependency-Array = nur beim Mounting

  if (isCancelled) {
    return null;
  }

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    ]}>
      {/* Header */}
      <View style={{ overflow: 'hidden', borderRadius: 8, marginBottom: 16 }}>
        <Surface style={[styles.header, { backgroundColor: theme.colors.errorContainer }]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text variant="headlineMedium" style={[styles.alertTitle, { color: theme.colors.onErrorContainer }]}>
              🚨 NOTFALL ERKANNT!
            </Text>
          </Animated.View>
          <Text variant="bodyMedium" style={[styles.alertSubtitle, { color: theme.colors.onErrorContainer }]}>
            {type === 'motion' ? 'Unerwartete Bewegung erkannt' : 'Manueller Alarm'}
          </Text>
          <Text variant="bodySmall" style={[styles.timestamp, { color: theme.colors.onErrorContainer }]}>
            {formatDate(timestamp)}
          </Text>
        </Surface>
      </View>

      {/* Kamera oder Foto */}
      <View style={styles.cameraContainer}>
        {!emergencyData ? (
          <View style={{ flex: 1 }}>
            {/* Frontkamera View */}
            <View style={{ flex: 1 }}>
              <CameraView
                ref={frontCameraRef}
                style={styles.camera}
                facing="front"
                onCameraReady={handleFrontCameraReady}
              />
            </View>
            <View style={{ 
              padding: 8, 
              backgroundColor: 'rgba(0,0,0,0.7)' 
            }}>
              <Text variant="bodySmall" style={{ color: 'white', textAlign: 'center' }}>
                Frontkamera {camerasReady.front ? '✅' : '⏳'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.photoContainer}>
            <Text variant="titleMedium" style={styles.photoTitle}>
              🎥 Notfall-Video aufgenommen
            </Text>
            {/* Hier würde das aufgenommene Video angezeigt */}
            <View style={{ overflow: 'hidden', borderRadius: 8 }}>
              <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                {emergencyData.frontVideo && (
                  <Text variant="bodyMedium">
                    🎥 Video: {emergencyData.frontVideo.uri.split('/').pop()}
                  </Text>
                )}
                <Text variant="bodySmall" style={{ marginTop: 8 }}>
                  Aufgenommen: {formatDate(emergencyData.timestamp)}
                </Text>
                <Text variant="bodySmall">
                  Dauer: {emergencyData.frontVideo ? `${emergencyData.frontVideo.duration / 1000} Sekunden` : 'Unbekannt'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Status und Aktionen */}
      <Card style={styles.actionCard}>
        <Card.Content>
          {countdown > 0 && !emergencyData && (
            <>
              <Text variant="titleMedium" style={styles.countdownTitle}>
                Foto wird automatisch aufgenommen in:
              </Text>
              <Text variant="displayMedium" style={[styles.countdownText, { color: theme.colors.primary }]}>
                {countdown}
              </Text>
              <ProgressBar 
                progress={(5 - countdown) / 5} 
                style={styles.progressBar}
              />
              <Button
                mode="contained"
                onPress={cancelAlert}
                style={styles.cancelButton}
                buttonColor={theme.colors.error}
                icon="close"
              >
                Abbrechen
              </Button>
            </>
          )}

          {isCapturing && (
            <>
              <Text variant="titleMedium" style={styles.statusText}>
                📸 Nehme Foto auf...
              </Text>
              <ProgressBar indeterminate style={styles.progressBar} />
            </>
          )}

          {emergencyData && (
            <>
              {isSending ? (
                <>
                  <Text variant="titleMedium" style={styles.statusText}>
                    {sendStatus}
                  </Text>
                  <ProgressBar indeterminate style={styles.progressBar} />
                </>
              ) : (
                <>
                  <Text variant="titleMedium" style={styles.statusText}>
                    {sendStatus}
                  </Text>
                  
                  {sendStatus.includes('❌') && (
                    <View style={styles.buttonRow}>
                      <Button
                        mode="outlined"
                        onPress={retakePhoto}
                        style={styles.actionButton}
                        icon="camera-retake"
                      >
                        Wiederholen
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => sendEmergencyVideoToContacts(emergencyData)}
                        style={styles.actionButton}
                        icon="send"
                      >
                        Erneut senden
                      </Button>
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      {/* Notfallkontakte Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.infoTitle}>
            📞 Notfallkontakte ({emergencyContacts.length})
          </Text>
          {emergencyContacts.map((contact, index) => (
            <Text key={contact.id} variant="bodySmall" style={styles.contactInfo}>
              • {contact.name} ({contact.phone})
              {contact.email && ` - ${contact.email}`}
            </Text>
          ))}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    elevation: 4,
  },
  alertTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  alertSubtitle: {
    textAlign: 'center',
    marginTop: 8,
  },
  timestamp: {
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
  cameraContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  camera: {
    flex: 1,
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  actionCard: {
    margin: 16,
    marginTop: 0,
  },
  countdownTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  countdownText: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressBar: {
    marginBottom: 16,
  },
  cancelButton: {
    marginTop: 8,
  },
  statusText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
  },
  infoTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  contactInfo: {
    marginBottom: 4,
    opacity: 0.8,
  },
});
