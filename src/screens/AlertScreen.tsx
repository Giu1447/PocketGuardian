/**
 * Alert Screen - Wird bei Bewegungserkennung angezeigt
 */

import { CameraView } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Alert as RNAlert, StyleSheet, View } from 'react-native';
import { Button, Card, ProgressBar, Surface, Text, useTheme } from 'react-native-paper';
import {
    cameraService,
    emergencyService,
    notificationService
} from '../services';
import { CapturedImage, EmergencyContact } from '../types';
import { formatDate } from '../utils/helpers';

interface AlertScreenProps {
  navigation: any;
  route: {
    params: {
      type: 'motion' | 'manual';
      timestamp: number;
    };
  };
}

export default function AlertScreen({ navigation, route }: AlertScreenProps) {
  const theme = useTheme();
  const { type, timestamp } = route.params;
  
  const [countdown, setCountdown] = useState(5);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string>('');
  const [isCancelled, setIsCancelled] = useState(false);
  
  const cameraRef = useRef<any>(null);
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
    // Starte Pulse-Animation
    startPulseAnimation();
    
    // Starte Countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          if (!isCancelled) {
            handleAutoCapture();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Setze Kamera-Referenz
    if (cameraRef.current) {
      cameraService.setCameraRef(cameraRef.current);
    }

    return () => {
      clearInterval(countdownInterval);
    };
  }, [isCancelled]);

  /**
   * Startet die Pulse-Animation für visuellen Alarm
   */
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  /**
   * Automatische Fotoaufnahme nach Countdown
   */
  const handleAutoCapture = async () => {
    if (isCancelled) return;
    
    setIsCapturing(true);
    
    try {
      console.log('📸 Starte automatische Fotoaufnahme...');
      
      const image = await cameraService.capturePhoto();
      
      if (image) {
        setCapturedImage(image);
        await notificationService.notifyPhotoTaken(image);
        
        // Starte automatischen Versand an Notfallkontakte
        await handleEmergencyProcedure(image);
      } else {
        throw new Error('Foto konnte nicht aufgenommen werden');
      }
      
    } catch (error) {
      console.error('Fehler bei automatischer Fotoaufnahme:', error);
      await notificationService.notifyError('Fotoaufnahme fehlgeschlagen');
      setSendStatus('❌ Fotoaufnahme fehlgeschlagen');
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Manuelle Fotoaufnahme
   */
  const handleManualCapture = async () => {
    setIsCancelled(true);
    setIsCapturing(true);
    
    try {
      const image = await cameraService.captureManualPhoto();
      
      if (image) {
        setCapturedImage(image);
        await notificationService.notifyPhotoTaken(image);
        await handleEmergencyProcedure(image);
      } else {
        throw new Error('Foto konnte nicht aufgenommen werden');
      }
      
    } catch (error) {
      console.error('Fehler bei manueller Fotoaufnahme:', error);
      await notificationService.notifyError('Fotoaufnahme fehlgeschlagen');
      setSendStatus('❌ Fotoaufnahme fehlgeschlagen');
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Notfall-Prozedur ausführen
   */
  const handleEmergencyProcedure = async (image: CapturedImage) => {
    if (emergencyContacts.length === 0) {
      setSendStatus('⚠️ Keine Notfallkontakte konfiguriert');
      return;
    }

    setIsSending(true);
    setSendStatus('📤 Sende an Notfallkontakte...');
    
    try {
      const result = await emergencyService.executeEmergencyProcedure(
        image, 
        emergencyContacts
      );
      
      if (result.success) {
        const successfulContacts = result.results.filter(r => r.success).length;
        setSendStatus(`✅ ${successfulContacts}/${result.results.length} Kontakte benachrichtigt`);
        
        // Benachrichtige über erfolgreichen Versand
        for (const contact of emergencyContacts) {
          await notificationService.notifyEmergencyContactSent(contact);
        }
      } else {
        setSendStatus('❌ Versand an alle Kontakte fehlgeschlagen');
        await notificationService.notifyError('Notfallkontakte konnten nicht benachrichtigt werden');
      }
      
    } catch (error) {
      console.error('Fehler bei Notfall-Prozedur:', error);
      setSendStatus('❌ Fehler bei Notfall-Prozedur');
      await notificationService.notifyError('Notfall-Prozedur fehlgeschlagen');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Alarm abbrechen
   */
  const handleCancel = () => {
    RNAlert.alert(
      'Alarm abbrechen',
      'Möchten Sie den Alarm wirklich abbrechen?',
      [
        { text: 'Nein', style: 'cancel' },
        {
          text: 'Ja, abbrechen',
          style: 'destructive',
          onPress: () => {
            setIsCancelled(true);
            navigation.goBack();
          }
        }
      ]
    );
  };

  /**
   * Zurück zur Hauptseite
   */
  const handleGoHome = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  const isCountdownActive = countdown > 0 && !isCancelled && !isCapturing && !capturedImage;
  const isProcessing = isCapturing || isSending;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.errorContainer }]}>
      {/* Alarm-Header */}
      <Animated.View style={[styles.alertHeader, { transform: [{ scale: pulseAnim }] }]}>
        <Surface style={[styles.alertIcon, { backgroundColor: theme.colors.error }]}>
          <Text style={[styles.alertIconText, { color: theme.colors.onError }]}>
            🚨
          </Text>
        </Surface>
        <Text variant="headlineMedium" style={[styles.alertTitle, { color: theme.colors.onErrorContainer }]}>
          {type === 'motion' ? 'BEWEGUNG ERKANNT' : 'MANUELLER ALARM'}
        </Text>
        <Text variant="bodyMedium" style={[styles.alertTime, { color: theme.colors.onErrorContainer }]}>
          {formatDate(timestamp)}
        </Text>
      </Animated.View>

      {/* Countdown */}
      {isCountdownActive && (
        <Card style={styles.countdownCard}>
          <Card.Content style={styles.countdownContent}>
            <Text variant="headlineLarge" style={styles.countdownNumber}>
              {countdown}
            </Text>
            <Text variant="bodyLarge" style={styles.countdownText}>
              Foto wird automatisch in {countdown} Sekunden aufgenommen
            </Text>
            <ProgressBar 
              progress={(5 - countdown) / 5} 
              style={styles.progressBar}
              color={theme.colors.primary}
            />
          </Card.Content>
        </Card>
      )}

      {/* Kamera-Vorschau */}
      <Card style={styles.cameraCard}>
        <Card.Content style={styles.cameraContent}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          />
          {isProcessing && (
            <View style={styles.cameraOverlay}>
              <Text variant="bodyLarge" style={styles.overlayText}>
                {isCapturing ? '📸 Foto wird aufgenommen...' : '📤 Wird gesendet...'}
              </Text>
              <ProgressBar 
                indeterminate 
                style={styles.processingBar}
                color={theme.colors.primary}
              />
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Status */}
      {sendStatus && (
        <Card style={styles.statusCard}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.statusText}>
              {sendStatus}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Aktions-Buttons */}
      <View style={styles.actionButtons}>
        {isCountdownActive && (
          <>
            <Button
              mode="contained"
              onPress={handleManualCapture}
              style={[styles.button, styles.captureButton]}
              buttonColor={theme.colors.primary}
              icon="camera"
            >
              Jetzt fotografieren
            </Button>
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={styles.button}
              textColor={theme.colors.onErrorContainer}
              icon="close"
            >
              Abbrechen
            </Button>
          </>
        )}
        
        {capturedImage && !isProcessing && (
          <Button
            mode="contained"
            onPress={handleGoHome}
            style={styles.button}
            icon="home"
          >
            Zurück zur Startseite
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  alertHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  alertIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },
  alertIconText: {
    fontSize: 40,
  },
  alertTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertTime: {
    textAlign: 'center',
    opacity: 0.8,
  },
  countdownCard: {
    marginBottom: 16,
  },
  countdownContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  countdownText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
  },
  cameraCard: {
    flex: 1,
    marginBottom: 16,
  },
  cameraContent: {
    flex: 1,
    padding: 0,
  },
  camera: {
    flex: 1,
    minHeight: 200,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  overlayText: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  processingBar: {
    width: '80%',
  },
  statusCard: {
    marginBottom: 16,
  },
  statusText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  actionButtons: {
    gap: 12,
  },
  button: {
    marginBottom: 8,
  },
  captureButton: {
    elevation: 4,
  },
});
