/**
 * Camera Screen - Für manuelle Kameranutzung
 */

import { CameraView } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, useTheme } from 'react-native-paper';
import { cameraService, notificationService } from '../services';

interface CameraScreenProps {
  navigation: any;
}

export default function CameraScreen({ navigation }: CameraScreenProps) {
  const theme = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    initializeCamera();
  }, []);

  /**
   * Initialisiert die Kamera
   */
  const initializeCamera = async () => {
    try {
      const success = await cameraService.initialize();
      if (success) {
        setIsReady(true);
      } else {
        Alert.alert(
          'Kamera nicht verfügbar',
          'Die Kamera-Berechtigungen wurden nicht erteilt.',
          [
            { text: 'Zurück', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('Fehler beim Initialisieren der Kamera:', error);
      Alert.alert('Fehler', 'Kamera konnte nicht initialisiert werden');
    }
  };

  /**
   * Kamera umschalten (vorne/hinten)
   */
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  /**
   * Foto aufnehmen
   */
  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    setIsCapturing(true);

    try {
      // Setze Kamera-Referenz im Service
      cameraService.setCameraRef(cameraRef.current);
      
      // Foto aufnehmen
      const image = await cameraService.captureManualPhoto();
      
      if (image) {
        await notificationService.notifyPhotoTaken(image);
        
        Alert.alert(
          'Foto gespeichert',
          'Das Foto wurde erfolgreich aufgenommen und gespeichert.',
          [
            { text: 'Weiteres Foto', style: 'default' },
            { text: 'Fertig', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        Alert.alert('Fehler', 'Foto konnte nicht aufgenommen werden');
      }
    } catch (error) {
      console.error('Fehler beim Aufnehmen des Fotos:', error);
      Alert.alert('Fehler', 'Ein Fehler ist beim Aufnehmen des Fotos aufgetreten');
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isReady) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge">Kamera wird initialisiert...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Kamera-Vorschau */}
      <Card style={styles.cameraCard}>
        <Card.Content style={styles.cameraContent}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          />
        </Card.Content>
      </Card>

      {/* Kamera-Kontrollen */}
      <View style={styles.controls}>
        <View style={styles.topControls}>
          <IconButton
            icon="camera-flip"
            size={32}
            onPress={toggleCameraFacing}
            iconColor={theme.colors.onSurface}
          />
        </View>
        
        <View style={styles.bottomControls}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.controlButton}
            icon="arrow-left"
          >
            Zurück
          </Button>
          
          <IconButton
            icon="camera"
            size={64}
            mode="contained"
            onPress={takePicture}
            disabled={isCapturing}
            iconColor={theme.colors.onPrimary}
            containerColor={theme.colors.primary}
            style={styles.captureButton}
          />
          
          <View style={styles.spacer} />
        </View>
      </View>

      {/* Status-Anzeige */}
      {isCapturing && (
        <View style={styles.statusOverlay}>
          <Card style={styles.statusCard}>
            <Card.Content style={styles.statusContent}>
              <Text variant="bodyLarge" style={styles.statusText}>
                📸 Foto wird aufgenommen...
              </Text>
            </Card.Content>
          </Card>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCard: {
    flex: 1,
    margin: 16,
    marginBottom: 8,
  },
  cameraContent: {
    flex: 1,
    padding: 0,
  },
  camera: {
    flex: 1,
  },
  controls: {
    padding: 16,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    flex: 1,
    marginRight: 16,
  },
  captureButton: {
    elevation: 8,
  },
  spacer: {
    flex: 1,
    marginLeft: 16,
  },
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  statusCard: {
    margin: 32,
  },
  statusContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statusText: {
    textAlign: 'center',
  },
});
