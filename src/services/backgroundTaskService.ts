/**
 * Background-Task-Service für Hintergrundausführung
 * SICHERHEITSMODUS: Vereinfacht für maximale Stabilität
 * ERWEITERT: Lichtsensor-Überwachung für Pocket-Erkennung
 */

import * as BackgroundFetch from 'expo-background-fetch';
import { LightSensor } from 'expo-sensors';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_MOTION_TASK = 'background-motion-detection';
const BACKGROUND_LIGHT_TASK = 'background-light-sensor-fetch';
const DARK_THRESHOLD = 3; // Lux-Wert für "im Pocket" - auf 3 reduziert (noch sensibler)

// Speichern des Pocket-Zustands und Callback
let currentPocketState = false;
let onPocketStateChangedCallback: ((inPocket: boolean) => void) | null = null;

// Vereinfachter Background-Task für Bewegungserkennung
TaskManager.defineTask(BACKGROUND_MOTION_TASK, async ({ data, error }) => {
  try {
    console.log('🔄 Background-Task ausgeführt (vereinfacht):', new Date().toISOString());
    
    if (error) {
      console.error('Background-Task Fehler:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
    
    // Minimale Hintergrundaktivität ohne Service-Abhängigkeiten
    console.log('✅ Hintergrundüberwachung läuft');
    return BackgroundFetch.BackgroundFetchResult.NoData;

  } catch (error) {
    console.error('❌ Kritischer Fehler im Background-Task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// NEU: Background-Task für Lichtsensor (Pocket-Erkennung)
TaskManager.defineTask(BACKGROUND_LIGHT_TASK, async ({ data, error }) => {
  const now = new Date();
  console.log(`💡 [${now.toISOString()}] Background Lichtsensor-Task läuft...`);

  try {
    if (error) {
      console.error('Lichtsensor Background-Task Fehler:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    // Berechtigungen prüfen
    const { status } = await LightSensor.getPermissionsAsync();
    if (status !== 'granted') {
      console.warn('⚠️ Lichtsensor-Berechtigung nicht erteilt für Background-Task.');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Lichtsensor-Wert lesen (mit Timeout)
    const getLightReading = new Promise<number>((resolve, reject) => {
      let subscription: any;
      const timeout = setTimeout(() => {
        subscription?.remove();
        reject(new Error('Timeout beim Lesen des Lichtsensors.'));
      }, 2000); // 2 Sekunden Timeout

      subscription = LightSensor.addListener(({ illuminance }) => {
        clearTimeout(timeout);
        subscription.remove();
        resolve(illuminance);
      });
    });

    const lightLevel = await getLightReading;
    console.log('💡 Background: Lichtstärke:', lightLevel.toFixed(2), 'lux');

    // Prüfe, ob sich der Pocket-Status geändert hat
    const newPocketState = lightLevel < DARK_THRESHOLD;
    const stateChanged = newPocketState !== currentPocketState;
    
    if (newPocketState) {
      console.log('🌑 Gerät ist in dunkler Umgebung (im Pocket?) - Lichtstärke:', lightLevel.toFixed(2));
      
      // Aktualisiere den Pocket-Status
      currentPocketState = true;
      
      // Aufruf des Callbacks für die Pocket-Erkennung (nur wenn sich der Status geändert hat)
      if (onPocketStateChangedCallback && stateChanged) {
        try {
          onPocketStateChangedCallback(true);
          console.log('✅ Pocket-Status-Callback mit true aufgerufen');
        } catch (error) {
          console.error('❌ Fehler beim Ausführen des Pocket-Callbacks:', error);
        }
      }
      
    } else {
      console.log('🌞 Gerät ist in heller Umgebung - Lichtstärke:', lightLevel.toFixed(2));
      
      // Aktualisiere den Pocket-Status
      currentPocketState = false;
      
      // Aufruf des Callbacks für die Nicht-Pocket-Erkennung (nur wenn sich der Status geändert hat)
      if (onPocketStateChangedCallback && stateChanged) {
        try {
          onPocketStateChangedCallback(false);
          console.log('✅ Pocket-Status-Callback mit false aufgerufen');
        } catch (error) {
          console.error('❌ Fehler beim Ausführen des Pocket-Callbacks:', error);
        }
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('❌ Lichtsensor Background-Task fehlgeschlagen:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class BackgroundTaskService {
  private isRegistered = false;
  private isLightSensorRegistered = false;
  private onPocketStateChanged: ((inPocket: boolean) => void) | null = null;

  /**
   * Registriert Background-Tasks - Vereinfacht für Stabilität
   */
  public async registerBackgroundTasks(): Promise<boolean> {
    try {
      // Prüfe, ob Background-Fetch verfügbar ist
      const status = await BackgroundFetch.getStatusAsync();
      if (status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
          status === BackgroundFetch.BackgroundFetchStatus.Denied) {
        console.warn('⚠️ Background-Fetch nicht verfügbar. Status:', status);
        return false;
      }

      // Prüfe, ob Task bereits registriert ist
      const isAlreadyRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_MOTION_TASK);
      if (isAlreadyRegistered) {
        console.log('ℹ️ Background-Task bereits registriert');
        this.isRegistered = true;
        return true;
      }

      // Registriere Background-Fetch mit minimaler Konfiguration
      await BackgroundFetch.registerTaskAsync(BACKGROUND_MOTION_TASK, {
        minimumInterval: 60000, // 1 Minute für Stabilität
        stopOnTerminate: false,
        startOnBoot: false, // Deaktiviert für Stabilität
      });

      this.isRegistered = true;
      console.log('✅ Background-Tasks erfolgreich registriert (vereinfacht)');
      return true;

    } catch (error) {
      console.error('❌ Fehler beim Registrieren der Background-Tasks:', error);
      this.isRegistered = false;
      return false;
    }
  }

  /**
   * Deregistriert Background-Tasks
   */
  public async unregisterBackgroundTasks(): Promise<void> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_MOTION_TASK);
      if (isRegistered) {
        await TaskManager.unregisterTaskAsync(BACKGROUND_MOTION_TASK);
        console.log('✅ Background-Tasks deregistriert');
      }
      this.isRegistered = false;
    } catch (error) {
      console.error('❌ Fehler beim Deregistrieren der Background-Tasks:', error);
    }
  }

  /**
   * Startet Background-Überwachung - Vereinfacht
   */
  public async startBackgroundMonitoring(): Promise<void> {
    try {
      console.log('🚀 Starte Hintergrundüberwachung (vereinfacht)...');
      
      if (!this.isRegistered) {
        const success = await this.registerBackgroundTasks();
        if (!success) {
          console.warn('⚠️ Background-Tasks nicht verfügbar');
          return;
        }
      }
      
      console.log('✅ Hintergrundüberwachung aktiv');
    } catch (error) {
      console.error('❌ Fehler beim Starten der Hintergrundüberwachung:', error);
    }
  }

  /**
   * Stoppt Background-Überwachung
   */
  public async stopBackgroundMonitoring(): Promise<void> {
    try {
      console.log('⏹️ Stoppe Hintergrundüberwachung...');
      // Behalte Tasks registriert, aber deaktiviere Überwachung
      console.log('✅ Hintergrundüberwachung pausiert');
    } catch (error) {
      console.error('❌ Fehler beim Stoppen der Hintergrundüberwachung:', error);
    }
  }

  /**
   * Gibt den aktuellen Status zurück
   */
  public async getBackgroundStatus(): Promise<{ available: boolean, registered: boolean, status: string }> {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_MOTION_TASK);
      
      return {
        available: status === BackgroundFetch.BackgroundFetchStatus.Available,
        registered: isRegistered,
        status: status ? this.getStatusString(status) : 'Unbekannt'
      };
    } catch (error) {
      console.error('❌ Fehler beim Abrufen des Background-Status:', error);
      return {
        available: false,
        registered: false,
        status: 'Fehler'
      };
    }
  }

  /**
   * Konvertiert Status zu String
   */
  private getStatusString(status: BackgroundFetch.BackgroundFetchStatus): string {
    switch (status) {
      case BackgroundFetch.BackgroundFetchStatus.Available:
        return 'Verfügbar';
      case BackgroundFetch.BackgroundFetchStatus.Denied:
        return 'Verweigert';
      case BackgroundFetch.BackgroundFetchStatus.Restricted:
        return 'Eingeschränkt';
      default:
        return 'Unbekannt';
    }
  }

  /**
   * Gibt den aktuellen Pocket-Status zurück
   */
  public isInPocket(): boolean {
    return currentPocketState;
  }
  
  /**
   * Gibt den aktuellen Status des Lichtsensors zurück
   */
  public isLightSensorRunning(): boolean {
    return this.isLightSensorRegistered;
  }
  
  /**
   * Führt einen einmaligen Lichtsensor-Scan durch und gibt den Wert zurück
   */
  public async getCurrentLightLevel(): Promise<number | null> {
    try {
      // Berechtigungen prüfen
      const { status } = await LightSensor.getPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️ Lichtsensor-Berechtigung nicht erteilt');
        return null;
      }
      
      // Lichtsensor-Wert lesen (mit Timeout)
      const getLightReading = new Promise<number>((resolve, reject) => {
        let subscription: any;
        const timeout = setTimeout(() => {
          subscription?.remove();
          reject(new Error('Timeout beim Lesen des Lichtsensors.'));
        }, 2000); // 2 Sekunden Timeout

        subscription = LightSensor.addListener(({ illuminance }) => {
          clearTimeout(timeout);
          subscription.remove();
          resolve(illuminance);
        });
      });

      const lightLevel = await getLightReading;
      console.log('💡 Lichtstärke (manueller Scan):', lightLevel.toFixed(2), 'lux');
      
      return lightLevel;
    } catch (error) {
      console.error('❌ Fehler beim Lesen des Lichtsensors:', error);
      return null;
    }
  }

  /**
   * Setzt den Callback für Pocket-Status-Änderungen
   */
  public setPocketStateCallback(callback: ((inPocket: boolean) => void) | null): void {
    this.onPocketStateChanged = callback;
    onPocketStateChangedCallback = callback;
    console.log('✅ Pocket-State-Callback konfiguriert');
  }

  /**
   * Registriert den Lichtsensor-Background-Task
   */
  public async registerLightSensorTask(): Promise<boolean> {
    try {
      // Prüfe Lichtsensor-Berechtigung
      const { status } = await LightSensor.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️ Lichtsensor-Berechtigung nicht erteilt');
        return false;
      }

      // Prüfe, ob Background-Fetch verfügbar ist
      const fetchStatus = await BackgroundFetch.getStatusAsync();
      if (fetchStatus === BackgroundFetch.BackgroundFetchStatus.Restricted ||
          fetchStatus === BackgroundFetch.BackgroundFetchStatus.Denied) {
        console.warn('⚠️ Background-Fetch nicht verfügbar. Status:', fetchStatus);
        return false;
      }

      // Prüfe, ob Task bereits registriert ist
      const isAlreadyRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LIGHT_TASK);
      if (isAlreadyRegistered) {
        console.log('ℹ️ Lichtsensor-Background-Task bereits registriert');
        this.isLightSensorRegistered = true;
        return true;
      }

      // Registriere Background-Fetch für Lichtsensor
      await BackgroundFetch.registerTaskAsync(BACKGROUND_LIGHT_TASK, {
        minimumInterval: 15, // 15 Sekunden
        stopOnTerminate: false,
        startOnBoot: true, // Nach Neustart des Geräts starten (nur Android)
      });

      console.log('✅ Lichtsensor-Background-Task erfolgreich registriert');
      this.isLightSensorRegistered = true;
      
      // Setze minimales Intervall (für Android)
      await BackgroundFetch.setMinimumIntervalAsync(15);
      
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Registrieren des Lichtsensor-Tasks:', error);
      return false;
    }
  }

  /**
   * Deregistriert den Lichtsensor-Background-Task
   */
  public async unregisterLightSensorTask(): Promise<void> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LIGHT_TASK);
      if (isRegistered) {
        await TaskManager.unregisterTaskAsync(BACKGROUND_LIGHT_TASK);
        console.log('✅ Lichtsensor-Background-Task deregistriert');
      }
      this.isLightSensorRegistered = false;
    } catch (error) {
      console.error('❌ Fehler beim Deregistrieren des Lichtsensor-Tasks:', error);
    }
  }

  /**
   * Startet die Pocket-Erkennung via Lichtsensor
   */
  public async startPocketDetection(): Promise<boolean> {
    try {
      console.log('🚀 Starte Pocket-Erkennung via Lichtsensor...');
      
      if (!this.isLightSensorRegistered) {
        const success = await this.registerLightSensorTask();
        if (!success) {
          console.warn('⚠️ Lichtsensor-Task konnte nicht registriert werden');
          return false;
        }
      }
      
      console.log('✅ Pocket-Erkennung aktiv');
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Starten der Pocket-Erkennung:', error);
      return false;
    }
  }

  /**
   * Stoppt die Pocket-Erkennung via Lichtsensor
   */
  public async stopPocketDetection(): Promise<void> {
    try {
      console.log('⏹️ Stoppe Pocket-Erkennung...');
      await this.unregisterLightSensorTask();
      console.log('✅ Pocket-Erkennung gestoppt');
    } catch (error) {
      console.error('❌ Fehler beim Stoppen der Pocket-Erkennung:', error);
    }
  }

  /**
   * Gibt Debug-Informationen zurück
   */
  public getDebugInfo(): object {
    return {
      isRegistered: this.isRegistered,
      isLightSensorRegistered: this.isLightSensorRegistered,
      motionTaskName: BACKGROUND_MOTION_TASK,
      lightTaskName: BACKGROUND_LIGHT_TASK,
      darkThreshold: DARK_THRESHOLD,
      currentPocketState,
      note: 'Erweiterte Version mit Lichtsensor-Unterstützung'
    };
  }
}

// Singleton-Instanz
export const backgroundTaskService = new BackgroundTaskService();
export default backgroundTaskService;
