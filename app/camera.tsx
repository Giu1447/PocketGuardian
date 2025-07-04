/**
 * Camera Screen - Kamera-Seite für manuelle Aufnahmen (Expo Router)
 */

import { CameraView } from 'expo-camera';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Surface, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cameraService } from '../src/services';
import { EmergencyData } from '../src/types';
import { formatDate } from '../src/utils/helpers';

export default function CameraScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const frontCameraRef = useRef<any>(null);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastVideo, setLastVideo] = useState<EmergencyData | null>(null);
  const [camerasReady, setCamerasReady] = useState({ front: false });

  // Initial setup der Kamera-Referenzen
  useEffect(() => {
    const timer = setTimeout(() => {
      cameraService.setFrontCameraRef(frontCameraRef.current);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Handler für Kamera-Bereitschaft
   */
  const handleFrontCameraReady = () => {
    console.log('✅ Front-Kamera bereit (Camera Screen)');
    setCamerasReady(prev => ({ ...prev, front: true }));
    cameraService.setFrontCameraReady();
  };

  /**
   * Nimmt ein 5-Sekunden-Notfallvideo auf
   */
  const captureEmergencyVideo = async () => {
    if (isCapturing) return;

    // Prüfe ob die Kamera bereit ist
    if (!camerasReady.front) {
      console.warn('⚠️ Kamera nicht bereit für Aufnahme');
      return;
    }

    try {
      setIsCapturing(true);
      console.log('🎥 Manuelle Video-Aufnahme...');

      // Setze Kamera-Referenz für den Service
      cameraService.setFrontCameraRef(frontCameraRef.current);

      // Führe Video-Aufnahme durch
      const emergencyData = await cameraService.captureEmergencyVideo();

      if (!emergencyData) {
        throw new Error('Video-Aufnahme fehlgeschlagen');
      }

      setLastVideo(emergencyData);
      console.log('✅ Video erfolgreich aufgenommen');

    } catch (error) {
      console.error('❌ Fehler bei Video-Aufnahme:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Navigiert zum Alert Screen mit dem aufgenommenen Video
   */
  const sendAsEmergency = () => {
    if (!lastVideo) return;

    router.push({
      pathname: '/alert',
      params: {
        type: 'manual',
        timestamp: lastVideo.timestamp.toString()
      }
    });
  };

  /**
   * Zurück zur Hauptseite
   */
  const goBack = () => {
    router.back();
  };

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
        <Surface style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            🎥 Kamera
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Manuelle Videoaufnahme
          </Text>
        </Surface>
      </View>

      {/* Kamera */}
      <View style={styles.cameraContainer}>
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

      {/* Aktionen */}
      <Card style={styles.actionCard}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={captureEmergencyVideo}
            disabled={isCapturing || !camerasReady.front}
            style={styles.captureButton}
            icon="video"
            loading={isCapturing}
          >
            {isCapturing ? 'Video-Aufnahme läuft...' : 
             !camerasReady.front ? 'Kamera wird vorbereitet...' :
             '5-Sekunden-Video aufnehmen'}
          </Button>

          {lastVideo && (
            <>
              <Text variant="bodyMedium" style={styles.photoInfo}>
                ✅ Letzte Aufnahme: {formatDate(lastVideo.timestamp)}
                {lastVideo.frontVideo ? ` (${Math.round(lastVideo.frontVideo.duration / 1000)} Sekunden Video)` : ''}
              </Text>
              
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={goBack}
                  style={styles.actionButton}
                  icon="arrow-left"
                >
                  Zurück
                </Button>
                <Button
                  mode="contained"
                  onPress={sendAsEmergency}
                  style={styles.actionButton}
                  icon="alert"
                  buttonColor={theme.colors.error}
                >
                  Als Notfall senden
                </Button>
              </View>
            </>
          )}

          {!lastVideo && (
            <Button
              mode="outlined"
              onPress={goBack}
              style={styles.backButton}
              icon="arrow-left"
            >
              Zurück
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.infoTitle}>
            ℹ️ Information
          </Text>
          <Text variant="bodySmall" style={styles.infoText}>
            Nehmen Sie manuell ein 5-Sekunden-Notfallvideo auf und senden Sie es optional als Notfall an Ihre Kontakte.
            {'\n\n'}
            Das Video wird mit Zeitstempel gespeichert und dokumentiert die aktuelle Situation in Echtzeit.
          </Text>
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
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
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
  actionCard: {
    margin: 16,
    marginTop: 0,
  },
  captureButton: {
    marginBottom: 16,
  },
  photoInfo: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  backButton: {
    marginTop: 8,
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
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
