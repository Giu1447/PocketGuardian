/**
 * Audio-Service zum Abspielen von Sounds in der PocketGuardian App
 */

import { Audio } from 'expo-av';

// Der Sound wird direkt im Code geladen
// Wichtig: Bei Expo/React Native müssen Asset-Pfade statisch sein

class AudioService {
  private sound: Audio.Sound | null = null;
  private isPlaying: boolean = false;

  /**
   * Lädt und spielt den Alarm-Sound
   */
  public async playAlarmSound(loop: boolean = true): Promise<boolean> {
    try {
      console.log('🔔 Spiele Alarm-Sound ab...');
      
      // Stoppe eventuell laufenden Sound
      await this.stopSound();
      
      try {
        // Verwende eine integrierte Sound-Ressource statt einer externen Datei
        // Diese Methode ist robuster und vermeidet Pfadprobleme
        console.log('🔊 Versuche integrierten Sound zu laden...');
        
        // Verwende einen festen String als Fallback anstatt einer Datei
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' },
          { shouldPlay: true, isLooping: loop, volume: 1.0 }
        );
        
        this.sound = sound;
        this.isPlaying = true;
        
        // Event-Listener für Sound-Ende
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('isLoaded' in status && status.isLoaded && status.didJustFinish && !status.isLooping) {
            this.isPlaying = false;
            this.sound = null;
          }
        });
        
        console.log('✅ Alarm-Sound wird abgespielt');
        return true;
      } catch (error) {
        console.error('❌ Fehler beim Laden des Alarm-Sounds:', error);
        console.warn('⚠️ Alarm-Sound konnte nicht abgespielt werden');
        return false;
      }
    } catch (error) {
      console.error('❌ Fehler beim Abspielen des Alarm-Sounds:', error);
      return false;
    }
  }

  /**
   * Stoppt den aktuell spielenden Sound
   */
  public async stopSound(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
        this.isPlaying = false;
        console.log('⏹️ Sound gestoppt');
      }
    } catch (error) {
      console.error('❌ Fehler beim Stoppen des Sounds:', error);
    }
  }

  /**
   * Prüft, ob ein Sound gerade abgespielt wird
   */
  public isSoundPlaying(): boolean {
    return this.isPlaying;
  }
  
  /**
   * Initialisiert den Audio-Service
   */
  public async initAudio(): Promise<void> {
    try {
      // Audio-Mode setzen für bessere Kompatibilität
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
      console.log('✅ Audio-Service initialisiert');
    } catch (error) {
      console.error('❌ Fehler beim Initialisieren des Audio-Service:', error);
    }
  }
}

// Singleton-Instanz
export const audioService = new AudioService();
export default audioService;
