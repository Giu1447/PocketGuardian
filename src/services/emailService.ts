/**
 * E-Mail-Service für PocketGuardian
 * Sendet automatisch E-Mails an Notfallkontakte
 */

import * as MailComposer from 'expo-mail-composer';
import { Alert } from 'react-native';
import { EmergencyContact } from '../types';

export interface EmailData {
  to: string[];
  subject: string;
  body: string;
  attachment?: string; // Base64 encoded image
}

export interface EmergencyEmailData {
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  photoUri?: string;
  frontPhotoUri?: string;
  backPhotoUri?: string;
  deviceInfo?: string;
}

class EmailService {
  private static instance: EmailService;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Prüft ob E-Mail-Versendung verfügbar ist
   */
  async isAvailable(): Promise<boolean> {
    try {
      return await MailComposer.isAvailableAsync();
    } catch (error) {
      console.error('E-Mail-Verfügbarkeit prüfen fehlgeschlagen:', error);
      return false;
    }
  }

  /**
   * Sendet eine Notfall-E-Mail mit Dual-Kamera-Bildern an alle Kontakte
   */
  async sendEmergencyEmailWithDualImages(
    contacts: EmergencyContact[], 
    emergencyData: EmergencyEmailData
  ): Promise<boolean> {
    try {
      const emailContacts = contacts.filter(contact => contact.email);
      
      if (emailContacts.length === 0) {
        Alert.alert(
          'Keine E-Mail-Kontakte',
          'Keine Notfallkontakte mit E-Mail-Adressen gefunden.'
        );
        return false;
      }

      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        Alert.alert(
          'E-Mail nicht verfügbar',
          'E-Mail-Versendung ist auf diesem Gerät nicht verfügbar.'
        );
        return false;
      }

      const subject = '🚨 NOTFALL - PocketGuardian Dual-Kamera Alert';
      const body = this.generateDualCameraEmergencyEmailBody(emergencyData);
      
      const emailAddresses = emailContacts.map(contact => contact.email!);

      const options: MailComposer.MailComposerOptions = {
        recipients: emailAddresses,
        subject: subject,
        body: body,
        isHtml: true,
      };

      // Füge beide Fotos als Anhänge hinzu, falls vorhanden
      const attachments: string[] = [];
      
      if (emergencyData.frontPhotoUri && emergencyData.frontPhotoUri.length > 0) {
        try {
          const uri = emergencyData.frontPhotoUri;
          if (uri.startsWith('file://') || uri.startsWith('content://')) {
            attachments.push(uri);
          }
        } catch (error) {
          console.warn('⚠️ Front-Kamera Foto-Anhang konnte nicht hinzugefügt werden:', error);
        }
      }

      if (emergencyData.backPhotoUri && emergencyData.backPhotoUri.length > 0) {
        try {
          const uri = emergencyData.backPhotoUri;
          if (uri.startsWith('file://') || uri.startsWith('content://')) {
            attachments.push(uri);
          }
        } catch (error) {
          console.warn('⚠️ Back-Kamera Foto-Anhang konnte nicht hinzugefügt werden:', error);
        }
      }

      if (attachments.length > 0) {
        options.attachments = attachments;
      }

      const result = await MailComposer.composeAsync(options);
      
      if (result.status === MailComposer.MailComposerStatus.SENT) {
        console.log('✅ Dual-Kamera Notfall-E-Mail erfolgreich gesendet');
        return true;
      } else if (result.status === MailComposer.MailComposerStatus.CANCELLED) {
        console.log('Dual-Kamera E-Mail-Versendung abgebrochen');
        return false;
      } else {
        console.log('Dual-Kamera E-Mail-Versendung fehlgeschlagen');
        return false;
      }

    } catch (error) {
      console.error('❌ Fehler beim Senden der Dual-Kamera Notfall-E-Mail:', error);
      Alert.alert(
        'E-Mail-Fehler',
        'Die Dual-Kamera Notfall-E-Mail konnte nicht gesendet werden.'
      );
      return false;
    }
  }

  /**
   * Sendet eine Notfall-E-Mail an alle Kontakte (Legacy Version)
   */
  async sendEmergencyEmail(
    contacts: EmergencyContact[], 
    emergencyData: EmergencyEmailData
  ): Promise<boolean> {
    try {
      const emailContacts = contacts.filter(contact => contact.email);
      
      if (emailContacts.length === 0) {
        Alert.alert(
          'Keine E-Mail-Kontakte',
          'Keine Notfallkontakte mit E-Mail-Adressen gefunden.'
        );
        return false;
      }

      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        Alert.alert(
          'E-Mail nicht verfügbar',
          'E-Mail-Versendung ist auf diesem Gerät nicht verfügbar.'
        );
        return false;
      }

      const subject = '🚨 NOTFALL - PocketGuardian Alert';
      const body = this.generateEmergencyEmailBody(emergencyData);
      
      const emailAddresses = emailContacts.map(contact => contact.email!);

      const options: MailComposer.MailComposerOptions = {
        recipients: emailAddresses,
        subject: subject,
        body: body,
        isHtml: true,
      };

      // Füge Foto als Anhang hinzu, falls vorhanden
      if (emergencyData.photoUri && emergencyData.photoUri.length > 0) {
        try {
          // Überprüfe ob die Datei existiert und lesbar ist
          const uri = emergencyData.photoUri;
          if (uri.startsWith('file://') || uri.startsWith('content://')) {
            options.attachments = [uri];
          } else {
            console.warn('⚠️ Ungültige Foto-URI, überspringe Anhang:', uri);
          }
        } catch (attachmentError) {
          console.warn('⚠️ Foto-Anhang konnte nicht hinzugefügt werden:', attachmentError);
        }
      }

      const result = await MailComposer.composeAsync(options);
      
      if (result.status === MailComposer.MailComposerStatus.SENT) {
        console.log('✅ Notfall-E-Mail erfolgreich gesendet');
        return true;
      } else if (result.status === MailComposer.MailComposerStatus.CANCELLED) {
        console.log('E-Mail-Versendung abgebrochen');
        return false;
      } else {
        console.log('E-Mail-Versendung fehlgeschlagen');
        return false;
      }

    } catch (error) {
      console.error('❌ Fehler beim Senden der Notfall-E-Mail:', error);
      Alert.alert(
        'E-Mail-Fehler',
        'Die Notfall-E-Mail konnte nicht gesendet werden.'
      );
      return false;
    }
  }

  /**
   * Sendet eine Test-E-Mail
   */
  async sendTestEmail(email: string): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        Alert.alert(
          'E-Mail nicht verfügbar',
          'E-Mail-Versendung ist auf diesem Gerät nicht verfügbar.'
        );
        return false;
      }

      const options: MailComposer.MailComposerOptions = {
        recipients: [email],
        subject: '✅ PocketGuardian Test-E-Mail',
        body: this.generateTestEmailBody(),
        isHtml: true,
      };

      const result = await MailComposer.composeAsync(options);
      return result.status === MailComposer.MailComposerStatus.SENT;

    } catch (error) {
      console.error('❌ Fehler beim Senden der Test-E-Mail:', error);
      return false;
    }
  }

  /**
   * Validiert eine E-Mail-Adresse
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generiert den HTML-Body für eine Dual-Kamera Notfall-E-Mail
   */
  private generateDualCameraEmergencyEmailBody(data: EmergencyEmailData): string {
    const timestamp = data.timestamp.toLocaleString('de-DE');
    const locationText = data.location 
      ? `📍 Standort: ${data.location.latitude.toFixed(6)}, ${data.location.longitude.toFixed(6)}`
      : '📍 Standort: Nicht verfügbar';

    const hasFrontImage = data.frontPhotoUri && data.frontPhotoUri.length > 0;
    const hasBackImage = data.backPhotoUri && data.backPhotoUri.length > 0;
    
    let imageInfo = '';
    if (hasFrontImage && hasBackImage) {
      imageInfo = '📸 Beide Kameras (Vorder- und Rückkamera) haben Fotos aufgenommen';
    } else if (hasFrontImage) {
      imageInfo = '📸 Vorderkamera hat ein Foto aufgenommen';
    } else if (hasBackImage) {
      imageInfo = '📸 Rückkamera hat ein Foto aufgenommen';
    } else {
      imageInfo = '📸 Keine Fotos verfügbar';
    }

    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ff3b30; text-align: center;">
              🚨 NOTFALL-ALARM (Dual-Kamera)
            </h1>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h2>PocketGuardian hat eine unerwartete Bewegung erkannt!</h2>
              
              <p><strong>⏰ Zeitpunkt:</strong> ${timestamp}</p>
              <p><strong>${locationText}</strong></p>
              <p><strong>📱 Gerät:</strong> ${data.deviceInfo || 'Unbekannt'}</p>
              <p><strong>${imageInfo}</strong></p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <p><strong>Was ist passiert?</strong></p>
              <p>PocketGuardian hat eine verdächtige Bewegung des Geräts registriert und automatisch diese Benachrichtigung mit Dual-Kamera-Aufnahme ausgelöst.</p>
              ${hasFrontImage && hasBackImage ? '<p><strong>Hinweis:</strong> Diese E-Mail enthält Fotos von beiden Kameras (Vorder- und Rückkamera) als Anhang.</p>' : ''}
            </div>
            
            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; border-left: 4px solid #0dcaf0; margin-top: 15px;">
              <p><strong>Was sollten Sie tun?</strong></p>
              <ul>
                <li>Kontaktieren Sie die Person sofort</li>
                <li>Prüfen Sie den angegebenen Standort</li>
                <li>Betrachten Sie die angehängten Fotos</li>
                <li>Bei Bedarf kontaktieren Sie die örtlichen Behörden</li>
              </ul>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
            
            <p style="font-size: 12px; color: #6c757d; text-align: center;">
              Diese Nachricht wurde automatisch von PocketGuardian gesendet.<br>
              Bitte antworten Sie nicht auf diese E-Mail.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generiert den HTML-Body für eine Notfall-E-Mail (Legacy Version)
   */
  private generateEmergencyEmailBody(data: EmergencyEmailData): string {
    const timestamp = data.timestamp.toLocaleString('de-DE');
    const locationText = data.location 
      ? `📍 Standort: ${data.location.latitude.toFixed(6)}, ${data.location.longitude.toFixed(6)}`
      : '📍 Standort: Nicht verfügbar';

    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ff3b30; text-align: center;">
              🚨 NOTFALL-ALARM
            </h1>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h2>PocketGuardian hat eine unerwartete Bewegung erkannt!</h2>
              
              <p><strong>⏰ Zeitpunkt:</strong> ${timestamp}</p>
              <p><strong>${locationText}</strong></p>
              <p><strong>📱 Gerät:</strong> ${data.deviceInfo || 'Unbekannt'}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <p><strong>Was ist passiert?</strong></p>
              <p>PocketGuardian hat eine verdächtige Bewegung des Geräts registriert und automatisch diese Benachrichtigung ausgelöst.</p>
            </div>
            
            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; border-left: 4px solid #0dcaf0; margin-top: 15px;">
              <p><strong>Was sollten Sie tun?</strong></p>
              <ul>
                <li>Kontaktieren Sie die Person sofort</li>
                <li>Prüfen Sie den angegebenen Standort</li>
                <li>Bei Bedarf kontaktieren Sie die örtlichen Behörden</li>
              </ul>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
            
            <p style="font-size: 12px; color: #6c757d; text-align: center;">
              Diese Nachricht wurde automatisch von PocketGuardian gesendet.<br>
              Bitte antworten Sie nicht auf diese E-Mail.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generiert den HTML-Body für eine Test-E-Mail
   */
  private generateTestEmailBody(): string {
    const timestamp = new Date().toLocaleString('de-DE');
    
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #007aff; text-align: center;">
              ✅ PocketGuardian Test-E-Mail
            </h1>
            
            <div style="background-color: #d4edda; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h2>Test erfolgreich!</h2>
              <p>Diese Test-E-Mail bestätigt, dass PocketGuardian erfolgreich E-Mails an diese Adresse senden kann.</p>
              <p><strong>⏰ Zeitpunkt:</strong> ${timestamp}</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
              <p><strong>Wichtige Informationen:</strong></p>
              <ul>
                <li>E-Mail-Versendung funktioniert korrekt</li>
                <li>Diese Adresse wird bei Notfällen benachrichtigt</li>
                <li>Stellen Sie sicher, dass diese E-Mails nicht im Spam-Ordner landen</li>
              </ul>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
            
            <p style="font-size: 12px; color: #6c757d; text-align: center;">
              Diese Test-Nachricht wurde von PocketGuardian gesendet.
            </p>
          </div>
        </body>
      </html>
    `;
  }
}

// Export als Singleton
export const emailService = EmailService.getInstance();
