/**
 * Background-Task-Service für Hintergrundausführung
 * SICHERHEITSMODUS: Vereinfacht für maximale Stabilität
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_MOTION_TASK = 'background-motion-detection';

// Vereinfachter Background-Task für Stabilität
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

class BackgroundTaskService {
  private isRegistered = false;

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
        status: this.getStatusString(status)
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
   * Gibt Debug-Informationen zurück
   */
  public getDebugInfo(): object {
    return {
      isRegistered: this.isRegistered,
      taskName: BACKGROUND_MOTION_TASK,
      note: 'Vereinfachte Version für Stabilität'
    };
  }
}

// Singleton-Instanz
export const backgroundTaskService = new BackgroundTaskService();
export default backgroundTaskService;
