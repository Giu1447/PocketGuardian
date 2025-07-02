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
import { DualCapturedImages } from '../src/types';
import { formatDate } from '../src/utils/helpers';

export default function CameraScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const frontCameraRef = useRef<any>(null);
  const backCameraRef = useRef<any>(null);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastPhotos, setLastPhotos] = useState<DualCapturedImages | null>(null);
  const [camerasReady, setCamerasReady] = useState({ front: false, back: false });

  // Initial setup der Kamera-Referenzen
  useEffect(() => {
    const timer = setTimeout(() => {
      cameraService.setFrontCameraRef(frontCameraRef.current);
      cameraService.setBackCameraRef(backCameraRef.current);
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

  const handleBackCameraReady = () => {
    console.log('✅ Back-Kamera bereit (Camera Screen)');
    setCamerasReady(prev => ({ ...prev, back: true }));
    cameraService.setBackCameraReady();
  };

  /**
   * Nimmt Dual-Kamera-Fotos auf
   */
  const captureDualPhoto = async () => {
    if (isCapturing) return;

    // Prüfe ob mindestens eine Kamera bereit ist
    if (!camerasReady.front && !camerasReady.back) {
      console.warn('⚠️ Keine Kamera bereit für Aufnahme');
      return;
    }

    try {
      setIsCapturing(true);
      console.log('📸 Manuelle Dual-Kamera-Aufnahme...');

      // Setze Kamera-Referenzen für den Service
      cameraService.setFrontCameraRef(frontCameraRef.current);
      cameraService.setBackCameraRef(backCameraRef.current);

      // Führe Dual-Kamera-Aufnahme durch
      const dualImages = await cameraService.captureDualPhoto();

      if (!dualImages) {
        throw new Error('Dual-Kamera-Aufnahme fehlgeschlagen');
      }

      setLastPhotos(dualImages);
      console.log('✅ Dual-Fotos erfolgreich aufgenommen');

    } catch (error) {
      console.error('❌ Fehler bei Dual-Kamera-Aufnahme:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Legacy-Einzelkamera-Aufnahme
   */
  const capturePhoto = async () => {
    if (isCapturing || !backCameraRef.current) return;

    try {
      setIsCapturing(true);
      console.log('📸 Manuelle Fotoaufnahme...');

      const photo = await backCameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      });

      const capturedImage = {
        uri: photo.uri,
        timestamp: Date.now(),
        location: undefined, // Location würde hier erfasst werden
        camera: 'back' as const,
      };

      // Konvertiere zu DualCapturedImages Format
      const dualImages: DualCapturedImages = {
        backImage: capturedImage,
        timestamp: capturedImage.timestamp,
      };

      setLastPhotos(dualImages);
      console.log('✅ Foto erfolgreich aufgenommen:', photo.uri);

    } catch (error) {
      console.error('❌ Fehler bei Fotoaufnahme:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Navigiert zum Alert Screen mit den aufgenommenen Fotos
   */
  const sendAsEmergency = () => {
    if (!lastPhotos) return;

    router.push({
      pathname: '/alert',
      params: {
        type: 'manual',
        timestamp: lastPhotos.timestamp.toString()
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
      <Surface style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          📷 Kamera
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Manuelle Fotoaufnahme
        </Text>
      </Surface>

      {/* Kamera */}
      <View style={styles.cameraContainer}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <CameraView
            ref={frontCameraRef}
            style={[styles.camera, { flex: 1, marginRight: 2 }]}
            facing="front"
            onCameraReady={handleFrontCameraReady}
          />
          <CameraView
            ref={backCameraRef}
            style={[styles.camera, { flex: 1, marginLeft: 2 }]}
            facing="back"
            onCameraReady={handleBackCameraReady}
          />
        </View>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          padding: 8, 
          backgroundColor: 'rgba(0,0,0,0.7)' 
        }}>
          <Text variant="bodySmall" style={{ color: 'white', flex: 1, textAlign: 'center' }}>
            Frontkamera {camerasReady.front ? '✅' : '⏳'}
          </Text>
          <Text variant="bodySmall" style={{ color: 'white', flex: 1, textAlign: 'center' }}>
            Rückkamera {camerasReady.back ? '✅' : '⏳'}
          </Text>
        </View>
      </View>

      {/* Aktionen */}
      <Card style={styles.actionCard}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={captureDualPhoto}
            disabled={isCapturing || (!camerasReady.front && !camerasReady.back)}
            style={styles.captureButton}
            icon="camera"
            loading={isCapturing}
          >
            {isCapturing ? 'Dual-Aufnahme läuft...' : 
             (!camerasReady.front && !camerasReady.back) ? 'Kameras werden vorbereitet...' :
             'Dual-Fotos aufnehmen'}
          </Button>

          {lastPhotos && (
            <>
              <Text variant="bodyMedium" style={styles.photoInfo}>
                ✅ Letzte Aufnahme: {formatDate(lastPhotos.timestamp)}
                {lastPhotos.frontImage && lastPhotos.backImage ? ' (Beide Kameras)' : 
                 lastPhotos.frontImage ? ' (Frontkamera)' : ' (Rückkamera)'}
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

          {!lastPhotos && (
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
            Nehmen Sie manuell Fotos mit beiden Kameras auf und senden Sie sie optional als Notfall an Ihre Kontakte.
            {'\n\n'}
            Die Fotos werden mit Zeitstempel und Standort (falls verfügbar) gespeichert. Dual-Kamera-Aufnahmen bieten umfassendere Dokumentation.
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
