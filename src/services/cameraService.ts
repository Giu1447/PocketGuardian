/**
 * Kamera-Service für automatische Bildaufnahme
 */

import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { CapturedImage, DualCapturedImages } from '../types';
import { formatDateForFilename } from '../utils/helpers';

class CameraService {
  private frontCameraRef: any | null = null;
  private backCameraRef: any | null = null;
  private hasPermission = false;
  private hasMediaLibraryPermission = false;
  private frontCameraReady = false;
  private backCameraReady = false;

  /**
   * Initialisiert den Kamera-Service
   */
  public async initialize(): Promise<boolean> {
    try {
      // Kamera-Berechtigung anfordern
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      this.hasPermission = cameraPermission.status === 'granted';

      // MediaLibrary-Berechtigung anfordern
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      this.hasMediaLibraryPermission = mediaLibraryPermission.status === 'granted';

      return this.hasPermission && this.hasMediaLibraryPermission;
    } catch (error) {
      console.error('Fehler beim Initialisieren der Kamera:', error);
      return false;
    }
  }

  /**
   * Setzt die Kamera-Referenzen
   */
  public setFrontCameraRef(ref: any): void {
    this.frontCameraRef = ref;
    this.frontCameraReady = false; // Reset ready state when setting new ref
  }

  public setBackCameraRef(ref: any): void {
    this.backCameraRef = ref;
    this.backCameraReady = false; // Reset ready state when setting new ref
  }

  /**
   * Markiert Kameras als bereit
   */
  public setFrontCameraReady(): void {
    this.frontCameraReady = true;
    console.log('✅ Front-Kamera ist bereit');
  }

  public setBackCameraReady(): void {
    this.backCameraReady = true;
    console.log('✅ Back-Kamera ist bereit');
  }

  /**
   * Setzt die Kamera-Referenz (Legacy-Methode für Rückwärtskompatibilität)
   */
  public setCameraRef(ref: any): void {
    this.backCameraRef = ref;
    this.backCameraReady = false;
  }

  /**
   * Wartet darauf, dass beide Kameras bereit sind - Verbessert mit längerer Wartezeit
   */
  private async waitForCamerasReady(maxWaitTime: number = 8000): Promise<void> {
    const startTime = Date.now();
    
    console.log('⏳ Warte auf Kamera-Bereitschaft...');
    
    while (Date.now() - startTime < maxWaitTime) {
      if (this.frontCameraReady && this.backCameraReady) {
        console.log('✅ Beide Kameras sind bereit');
        return;
      }
      
      // Prüfe einzelne Kameras
      if (!this.frontCameraReady && this.frontCameraRef) {
        console.log('⏳ Warte auf Front-Kamera...');
      }
      if (!this.backCameraReady && this.backCameraRef) {
        console.log('⏳ Warte auf Back-Kamera...');
      }
      
      // Längere Wartezeit zwischen Prüfungen
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.warn('⚠️ Timeout beim Warten auf Kamera-Bereitschaft');
    console.warn(`Status: Front=${this.frontCameraReady}, Back=${this.backCameraReady}`);
    console.warn(`Referenzen: Front=${!!this.frontCameraRef}, Back=${!!this.backCameraRef}`);
  }

  /**
   * Macht ein Foto automatisch (bei Bewegungserkennung) mit verbesserter Fehlerbehandlung
   */
  public async captureDualPhoto(): Promise<DualCapturedImages | null> {
    if (!this.hasPermission) {
      console.error('❌ Keine Kamera-Berechtigung');
      return null;
    }

    // Prüfe ob mindestens eine Kamera-Referenz vorhanden ist
    if (!this.frontCameraRef && !this.backCameraRef) {
      console.error('❌ Keine Kamera-Referenzen vorhanden');
      return null;
    }

    try {
      console.log('📸 Dual-Foto wird aufgenommen...');
      
      // Warte länger auf Kamera-Bereitschaft
      await this.waitForCamerasReady(10000); // 10 Sekunden
      
      const timestamp = Date.now();
      const results: DualCapturedImages = {
        timestamp,
      };

      // Erstelle Liste verfügbarer Kameras
      const availableCameras: Array<{ ref: any; type: 'front' | 'back'; ready: boolean }> = [];
      
      if (this.frontCameraRef) {
        availableCameras.push({ ref: this.frontCameraRef, type: 'front', ready: this.frontCameraReady });
      }
      if (this.backCameraRef) {
        availableCameras.push({ ref: this.backCameraRef, type: 'back', ready: this.backCameraReady });
      }
      
      console.log(`📱 Verfügbare Kameras: ${availableCameras.length}`);
      availableCameras.forEach(cam => {
        console.log(`  ${cam.type}: ${cam.ready ? '✅ Bereit' : '⏳ Nicht bereit'}`);
      });
      
      // Versuche nur mit bereiten Kameras
      const readyCameras = availableCameras.filter(cam => cam.ready);
      
      if (readyCameras.length === 0) {
        console.warn('⚠️ Keine Kameras bereit, versuche trotzdem mit verfügbaren Kameras');
        // Fallback: Versuche mit allen verfügbaren Kameras
        readyCameras.push(...availableCameras);
      }

      // Parallel alle bereiten Kameras auslösen
      const promises = readyCameras.map(camera => 
        this.captureFromCamera(camera.ref, camera.type)
      );

      const results_array = await Promise.allSettled(promises);

      // Verarbeite Ergebnisse
      results_array.forEach((result, index) => {
        const cameraType = readyCameras[index].type;
        
        if (result.status === 'fulfilled' && result.value) {
          if (cameraType === 'front') {
            results.frontImage = result.value;
          } else {
            results.backImage = result.value;
          }
          console.log(`✅ ${cameraType}-Kamera Foto erfolgreich aufgenommen`);
        } else {
          console.warn(`⚠️ ${cameraType}-Kamera Foto fehlgeschlagen:`, 
            result.status === 'rejected' ? result.reason : 'Unbekannter Fehler');
        }
      });

      // Mindestens ein Foto muss erfolgreich sein
      if (!results.frontImage && !results.backImage) {
        console.error('❌ Beide Kameras konnten kein Foto aufnehmen');
        return null;
      }

      console.log(`✅ Dual-Foto erfolgreich: ${results.frontImage ? 'Front' : ''}${results.frontImage && results.backImage ? ' & ' : ''}${results.backImage ? 'Back' : ''}`);
      return results;

    } catch (error) {
      console.error('❌ Fehler beim Aufnehmen des Dual-Fotos:', error);
      return null;
    }
  }

  /**
   * Hilfsmethode zum Aufnehmen von einer spezifischen Kamera
   */
  private async captureFromCamera(cameraRef: any, cameraType: 'front' | 'back'): Promise<CapturedImage | null> {
    if (!cameraRef) {
      throw new Error(`${cameraType}-Kamera nicht verfügbar`);
    }

    try {
      // Zusätzliche Wartezeit für Kamera-Stabilisierung
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const photo = await cameraRef.takePictureAsync({
        quality: 0.7, // Reduziert für bessere Performance
        base64: false,
        skipProcessing: false,
        exif: false, // Deaktiviert EXIF-Daten für bessere Performance
      });

      if (!photo || !photo.uri) {
        throw new Error(`${cameraType}-Kamera konnte kein Foto aufnehmen`);
      }

      // Foto in der Galerie speichern
      const asset = await this.saveToGallery(photo.uri);
      
      const capturedImage: CapturedImage = {
        uri: asset?.uri || photo.uri,
        timestamp: Date.now(),
        camera: cameraType,
      };

      return capturedImage;

    } catch (error) {
      console.error(`❌ Fehler bei ${cameraType}-Kamera:`, error);
      throw error;
    }
  }

  /**
   * Macht ein Foto automatisch (bei Bewegungserkennung) - Legacy-Methode
   */
  public async capturePhoto(): Promise<CapturedImage | null> {
    if (!this.backCameraRef || !this.hasPermission) {
      console.error('Kamera nicht verfügbar oder keine Berechtigung');
      return null;
    }

    try {
      console.log('📸 Foto wird aufgenommen...');
      
      const photo = await this.backCameraRef.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (!photo) {
        console.error('Foto konnte nicht aufgenommen werden');
        return null;
      }

      // Foto in der Galerie speichern
      const asset = await this.saveToGallery(photo.uri);
      
      const capturedImage: CapturedImage = {
        uri: asset?.uri || photo.uri,
        timestamp: Date.now(),
        camera: 'back',
        // Location würde hier eingefügt werden, wenn GPS verfügbar
      };

      console.log('✅ Foto erfolgreich aufgenommen:', capturedImage.uri);
      return capturedImage;

    } catch (error) {
      console.error('❌ Fehler beim Aufnehmen des Fotos:', error);
      return null;
    }
  }

  /**
   * Speichert das Foto in der Galerie
   */
  private async saveToGallery(uri: string): Promise<MediaLibrary.Asset | null> {
    if (!this.hasMediaLibraryPermission) {
      console.warn('Keine Berechtigung zum Speichern in der Galerie');
      return null;
    }

    try {
      const asset = await MediaLibrary.createAssetAsync(uri);
      console.log('Foto in Galerie gespeichert:', asset.id);
      return asset;
    } catch (error) {
      console.error('Fehler beim Speichern in der Galerie:', error);
      return null;
    }
  }

  /**
   * Manuelles Foto aufnehmen (für Testing)
   */
  public async captureManualPhoto(): Promise<CapturedImage | null> {
    return this.capturePhoto();
  }

  /**
   * Überprüft, ob die Kameras verfügbar sind
   */
  public isAvailable(): boolean {
    return this.hasPermission && (this.frontCameraRef !== null || this.backCameraRef !== null);
  }

  /**
   * Überprüft, ob beide Kameras verfügbar sind
   */
  public isDualCameraAvailable(): boolean {
    return this.hasPermission && this.frontCameraRef !== null && this.backCameraRef !== null;
  }

  /**
   * Gibt den Berechtigungsstatus zurück
   */
  public getPermissionStatus(): {
    camera: boolean;
    mediaLibrary: boolean;
  } {
    return {
      camera: this.hasPermission,
      mediaLibrary: this.hasMediaLibraryPermission,
    };
  }

  /**
   * Generiert einen Dateinamen für das Foto
   */
  private generateFilename(): string {
    const timestamp = formatDateForFilename(Date.now());
    return `PocketGuardian_${timestamp}.jpg`;
  }
}

// Singleton-Instanz
export const cameraService = new CameraService();
export default cameraService;
