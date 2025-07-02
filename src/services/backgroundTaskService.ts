/**
 * Background-Task-Service für Hintergrundausführung
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { notificationService } from './notificationService';
import { sensorService } from './sensorService';

const BACKGROUND_MOTION_TASK = 'background-motion-detection';

// Definiere den Background-Task - Verbessert für Zuverlässigkeit
TaskManager.defineTask(BACKGROUND_MOTION_TASK, async ({ data, error }) => {
  try {
    console.log('🔄 Background-Task ausgeführt:', new Date().toISOString());
    
    if (error) {
      console.error('Background-Task Fehler:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
    
    // Prüfe, ob Sensor aktiv sein sollte
    if (sensorService.isMonitoring()) {
      console.log('✅ Bewegungsüberwachung aktiv im Hintergrund');
      
      // Zeige gelegentlich Hintergrund-Status
      const shouldShowStatus = Math.random() < 0.1; // 10% Chance für Status-Update
      
      if (shouldShowStatus) {
        await notificationService.showLocalNotification({
          title: '🔄 PocketGuardian aktiv',
          body: 'Hintergrundüberwachung läuft...',
          data: { type: 'background_check', timestamp: Date.now() }
        });
      }
      
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      console.log('⏸️ Überwachung pausiert');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

  } catch (error) {
    console.error('❌ Kritischer Fehler im Background-Task:', error);
    
    // Benachrichtige User bei kritischen Fehlern
    try {
      await notificationService.showLocalNotification({
        title: '⚠️ Hintergrund-Fehler',
        body: 'Background-Überwachung funktioniert nicht korrekt. App erneut öffnen.',
        data: { type: 'background_error', error: String(error) }
      });
    } catch (notifError) {
      console.error('Auch Notification fehlgeschlagen:', notifError);
    }
    
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class BackgroundTaskService {
  private isRegistered = false;

  /**
   * Registriert Background-Tasks - Verbessert für Zuverlässigkeit
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

      // Registriere Background-Fetch mit verbesserter Konfiguration
      await BackgroundFetch.registerTaskAsync(BACKGROUND_MOTION_TASK, {
        minimumInterval: 30000, // 30 Sekunden (statt 60 für bessere Reaktivität)
        stopOnTerminate: false, // Läuft weiter auch wenn App beendet wird
        startOnBoot: true, // Startet beim Geräte-Neustart
      });

      this.isRegistered = true;
      console.log('✅ Background-Tasks erfolgreich registriert');
      
      // Benachrichtige Benutzer über erfolgreiche Aktivierung
      await notificationService.showLocalNotification({
        title: '🛡️ Hintergrundschutz aktiv',
        body: 'PocketGuardian überwacht nun auch im Hintergrund.',
        data: { type: 'background_activated' }
      });
      
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Registrieren der Background-Tasks:', error);
      
      // Zeige detaillierten Fehler
      await notificationService.showLocalNotification({
        title: '⚠️ Background-Setup fehlgeschlagen',
        body: 'Hintergrundüberwachung konnte nicht aktiviert werden.',
        data: { type: 'background_failed' }
      });
      
      return false;
    }
  }

  /**
   * Deregistriert Background-Tasks
   */
  public async unregisterBackgroundTasks(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_MOTION_TASK);
      this.isRegistered = false;
      console.log('❌ Background-Tasks deregistriert');
    } catch (error) {
      console.error('Fehler beim Deregistrieren der Background-Tasks:', error);
    }
  }

  /**
   * Überprüft den Status der Background-Tasks
   */
  public async getBackgroundStatus(): Promise<{
    available: boolean;
    registered: boolean;
    status: string;
  }> {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_MOTION_TASK);

      let statusText = 'Unbekannt';
      switch (status) {
        case BackgroundFetch.BackgroundFetchStatus.Available:
          statusText = 'Verfügbar';
          break;
        case BackgroundFetch.BackgroundFetchStatus.Denied:
          statusText = 'Verweigert';
          break;
        case BackgroundFetch.BackgroundFetchStatus.Restricted:
          statusText = 'Eingeschränkt';
          break;
      }

      return {
        available: status === BackgroundFetch.BackgroundFetchStatus.Available,
        registered: isTaskRegistered,
        status: statusText,
      };
    } catch (error) {
      console.error('Fehler beim Abrufen des Background-Status:', error);
      return {
        available: false,
        registered: false,
        status: 'Fehler',
      };
    }
  }

  /**
   * Startet die Hintergrundüberwachung
   */
  public async startBackgroundMonitoring(): Promise<boolean> {
    if (!this.isRegistered) {
      const success = await this.registerBackgroundTasks();
      if (!success) {
        return false;
      }
    }

    // Starte Sensor-Überwachung
    if (!sensorService.isMonitoring()) {
      sensorService.startMonitoring(() => {
        console.log('Bewegung im Hintergrund erkannt');
      });
    }

    console.log('🛡️ Hintergrundüberwachung gestartet');
    return true;
  }

  /**
   * Stoppt die Hintergrundüberwachung
   */
  public async stopBackgroundMonitoring(): Promise<void> {
    sensorService.stopMonitoring();
    await this.unregisterBackgroundTasks();
    console.log('⏹️ Hintergrundüberwachung gestoppt');
  }

  /**
   * Gibt den Registrierungsstatus zurück
   */
  public isBackgroundTasksRegistered(): boolean {
    return this.isRegistered;
  }

  /**
   * Testet Background-Funktionalität
   */
  public async testBackgroundFunctionality(): Promise<void> {
    console.log('🧪 Teste Background-Funktionalität...');
    
    const status = await this.getBackgroundStatus();
    console.log('Background-Status:', status);

    if (status.available) {
      await notificationService.showLocalNotification({
        title: '✅ Background-Test',
        body: 'Background-Tasks sind verfügbar und funktionsfähig.',
        data: { type: 'background_test' }
      });
    } else {
      await notificationService.showLocalNotification({
        title: '⚠️ Background-Warnung',
        body: 'Background-Tasks sind nicht verfügbar. Funktionalität eingeschränkt.',
        data: { type: 'background_warning' }
      });
    }
  }
}

// Singleton-Instanz
export const backgroundTaskService = new BackgroundTaskService();
export default backgroundTaskService;
