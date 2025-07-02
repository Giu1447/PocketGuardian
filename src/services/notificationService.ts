/**
 * Benachrichtigungs-Service für Push-Nachrichten
 */

import * as Notifications from 'expo-notifications';
import { CapturedImage, EmergencyContact, NotificationData } from '../types';

// Konfiguriere Benachrichtigungsverhalten
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Initialisiert den Benachrichtigungs-Service
   */
  public async initialize(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Keine Berechtigung für Benachrichtigungen');
        return false;
      }

      // Push-Token abrufen (falls verfügbar)
      try {
        const token = await Notifications.getExpoPushTokenAsync();
        this.expoPushToken = token.data;
        console.log('Push-Token erhalten:', this.expoPushToken);
      } catch (error) {
        console.warn('Push-Token konnte nicht abgerufen werden:', error);
      }

      return true;
    } catch (error) {
      console.error('Fehler beim Initialisieren der Benachrichtigungen:', error);
      return false;
    }
  }

  /**
   * Zeigt eine lokale Benachrichtigung an
   */
  public async showLocalNotification(data: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data || {},
          sound: 'default',
        },
        trigger: null, // Sofort anzeigen
      });
      console.log('Lokale Benachrichtigung gesendet:', data.title);
    } catch (error) {
      console.error('Fehler beim Senden der lokalen Benachrichtigung:', error);
    }
  }

  /**
   * Benachrichtigung bei Bewegungserkennung
   */
  public async notifyMotionDetected(): Promise<void> {
    await this.showLocalNotification({
      title: '🚨 Bewegung erkannt!',
      body: 'PocketGuardian hat eine unerwartete Bewegung erkannt und macht ein Foto.',
      data: { type: 'motion_detected', timestamp: Date.now() },
    });
  }

  /**
   * Benachrichtigung nach erfolgreicher Fotoaufnahme
   */
  public async notifyPhotoTaken(image: CapturedImage): Promise<void> {
    await this.showLocalNotification({
      title: '📸 Foto aufgenommen',
      body: 'Ein Sicherheitsfoto wurde automatisch erstellt und gespeichert.',
      data: { 
        type: 'photo_taken', 
        timestamp: image.timestamp,
        uri: image.uri 
      },
    });
  }

  /**
   * Benachrichtigung bei erfolgreichem Versand an Notfallkontakt
   */
  public async notifyEmergencyContactSent(contact: EmergencyContact): Promise<void> {
    await this.showLocalNotification({
      title: '📤 Notfallkontakt benachrichtigt',
      body: `${contact.name} wurde über die Bewegungserkennung informiert.`,
      data: { 
        type: 'emergency_sent', 
        contact: contact.id,
        timestamp: Date.now() 
      },
    });
  }

  /**
   * Benachrichtigung bei Fehler
   */
  public async notifyError(message: string): Promise<void> {
    await this.showLocalNotification({
      title: '⚠️ Fehler',
      body: message,
      data: { type: 'error', timestamp: Date.now() },
    });
  }

  /**
   * Benachrichtigung für App-Start im Hintergrund
   */
  public async notifyBackgroundModeActive(): Promise<void> {
    await this.showLocalNotification({
      title: '🛡️ Schutz aktiviert',
      body: 'PocketGuardian überwacht nun Bewegungen im Hintergrund.',
      data: { type: 'background_active', timestamp: Date.now() },
    });
  }

  /**
   * Teste Benachrichtigungen
   */
  public async testNotification(): Promise<void> {
    await this.showLocalNotification({
      title: '✅ Test-Benachrichtigung',
      body: 'PocketGuardian-Benachrichtigungen funktionieren korrekt!',
      data: { type: 'test', timestamp: Date.now() },
    });
  }

  /**
   * Gibt den Push-Token zurück
   */
  public getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Registriert einen Listener für eingehende Benachrichtigungen
   */
  public addNotificationListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Registriert einen Listener für Benachrichtigungs-Interaktionen
   */
  public addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

// Singleton-Instanz
export const notificationService = new NotificationService();
export default notificationService;
