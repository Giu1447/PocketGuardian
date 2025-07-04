/**
 * Kamera-Service für Frontkamera-Videoaufnahme
 */

import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { CapturedVideo, EmergencyData } from '../types';
import { formatDateForFilename } from '../utils/helpers';

class CameraService {
  private frontCameraRef: any | null = null;
  private hasPermission = false;
  private hasMediaLibraryPermission = false;
  private frontCameraReady = false;
  private isRecording = false;
  private videoDuration = 5000; // 5 Sekunden Video

  /**
   * Initialisiert den Kamera-Service
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log('📷 Initialisiere Kamera-Service...');
      // Kamera-Berechtigung anfordern
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      this.hasPermission = cameraPermission.status === 'granted';
      console.log(`  - Kamera-Berechtigung: ${this.hasPermission ? '✅' : '❌'}`)

      // MediaLibrary-Berechtigung anfordern
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      this.hasMediaLibraryPermission = mediaLibraryPermission.status === 'granted';
      console.log(`  - MediaLibrary-Berechtigung: ${this.hasMediaLibraryPermission ? '✅' : '❌'}`)

      if (!this.hasPermission || !this.hasMediaLibraryPermission) {
          console.warn('⚠️ Erforderliche Berechtigungen wurden nicht erteilt.');
      }

      return this.hasPermission && this.hasMediaLibraryPermission;
    } catch (error) {
      console.error('Fehler beim Initialisieren der Kamera:', error);
      return false;
    }
  }

  /**
   * Setzt die Kamera-Referenz
   */
  public setFrontCameraRef(ref: any): void {
    if (ref) {
      this.frontCameraRef = ref;
      console.log('📹 Front-Kamera-Referenz gesetzt.');
    } else {
      console.log('⚪️ Front-Kamera-Referenz entfernt.');
    }
  }

  /**
   * Markiert Kamera als bereit
   */
  public setFrontCameraReady(): void {
    this.frontCameraReady = true;
    console.log('✅ Front-Kamera ist BEREIT');
  }

  /**
   * Setzt die Kamera-Referenz (Legacy-Methode für Rückwärtskompatibilität)
   */
  public setCameraRef(ref: any): void {
    this.frontCameraRef = ref;
  }

  /**
   * Wartet darauf, dass die Kamera bereit ist
   */
  private async waitForCameraReady(maxWaitTime: number = 5000): Promise<boolean> {
    const startTime = Date.now();
    
    console.log('⏳ Warte auf Kamera-Bereitschaft...');
    
    while (Date.now() - startTime < maxWaitTime) {
      if (this.frontCameraRef && this.frontCameraReady) {
        console.log('✅ Kamera ist jetzt bereit.');
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.warn('⚠️ Timeout beim Warten auf Kamera-Bereitschaft.');
    console.warn(`  - Status: Front Ready=${this.frontCameraReady}`);
    console.warn(`  - Referenzen: Front Ref=${!!this.frontCameraRef}`);
    return false;
  }

  /**
   * Nimmt ein 5-Sekunden-Video mit der Frontkamera auf
   */
  public async captureEmergencyVideo(): Promise<EmergencyData | null> {
    if (!this.hasPermission) {
      console.error('❌ Keine Kamera-Berechtigung. Video kann nicht aufgenommen werden.');
      return null;
    }

    if (!this.frontCameraRef) {
      console.error('❌ Kamera-Referenz nicht vorhanden.');
      return null;
    }

    try {
      console.log('🎥 Starte Frontkamera-Videoaufnahme...');
      
      const isReady = await this.waitForCameraReady(5000);
      if (!isReady) {
        console.error('❌ Kamera nicht bereit. Breche Videoaufnahme ab.');
        return null;
      }
      
      const timestamp = Date.now();
      const results: EmergencyData = {
        timestamp,
      };

      console.log('-> Starte 5-Sekunden-Video mit Front-Kamera...');
      const frontVideo = await this.recordVideo(this.frontCameraRef);
      if (frontVideo) {
        results.frontVideo = frontVideo;
        console.log('✅ Video mit Front-Kamera aufgenommen.');
      } else {
        console.warn('⚠️ Videoaufnahme mit Front-Kamera fehlgeschlagen.');
      }

      if (!results.frontVideo) {
        console.error('❌ Kamera konnte kein Video aufnehmen.');
        return null;
      }

      console.log(`✅ Notfall-Videoaufnahme erfolgreich abgeschlossen.`);
      return results;

    } catch (error) {
      console.error('❌ Fehler bei der Videoaufnahme:', error);
      return null;
    }
  }

  /**
   * Nimmt ein 5-Sekunden-Video auf
   */
  private async recordVideo(cameraRef: any): Promise<CapturedVideo | null> {
    if (!cameraRef || typeof cameraRef.recordAsync !== 'function') {
      console.error('❌ Kamera-Referenz ist ungültig oder hat keine recordAsync Methode.');
      return null;
    }

    try {
      // Starte die Aufnahme
      console.log('🎥 Starte Videoaufnahme...');
      this.isRecording = true;
      
      const recordingPromise = cameraRef.recordAsync({
        maxDuration: this.videoDuration / 1000, // in Sekunden
        quality: '720p', // HD Qualität
        mute: false // Audio aufnehmen
      });
      
      // Stoppe die Aufnahme nach der festgelegten Zeit
      setTimeout(() => {
        if (this.isRecording) {
          cameraRef.stopRecording();
          this.isRecording = false;
          console.log('⏹️ Videoaufnahme automatisch beendet nach', this.videoDuration / 1000, 'Sekunden');
        }
      }, this.videoDuration + 500); // +500ms Puffer
      
      // Warte auf das Aufnahmeergebnis
      const video = await recordingPromise;
      this.isRecording = false;
      console.log(`  -> Video aufgenommen, URI: ${video.uri}`);
      
      if (!this.hasMediaLibraryPermission) {
        console.warn('⚠️ Keine MediaLibrary-Berechtigung. Video wird nicht gespeichert.');
        return { 
          uri: video.uri, 
          timestamp: Date.now(),
          duration: this.videoDuration
        };
      }

      // Speichere das Video in der Medienbibliothek
      const asset = await MediaLibrary.createAssetAsync(video.uri);
      const filename = `PocketGuardian_${formatDateForFilename(Date.now())}_emergency.mp4`;
      await MediaLibrary.createAlbumAsync('PocketGuardian', asset, false);
      
      console.log(`  -> Video in Album gespeichert.`);
      return { 
        uri: asset.uri, 
        timestamp: Date.now(),
        duration: this.videoDuration
      };

    } catch (error) {
      console.error('❌ Fehler beim Aufnehmen des Videos:', error);
      this.isRecording = false;
      return null;
    }
  }

  /**
   * Prüft, ob die Kamera verfügbar ist
   */
  public isAvailable(): boolean {
    return this.hasPermission;
  }

  /**
   * Gibt den Status der Berechtigungen zurück
   */
  public getPermissionStatus(): { camera: boolean; mediaLibrary: boolean } {
    return {
      camera: this.hasPermission,
      mediaLibrary: this.hasMediaLibraryPermission
    };
  }
}

export default new CameraService();
