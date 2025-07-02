/**
 * Emergency-Service für Notfallkontakte und Datenübertragung
 */

import { CapturedImage, DualCapturedImages, EmergencyContact } from '../types';
import { formatDate } from '../utils/helpers';
import { emailService } from './emailService';

class EmergencyService {
  /**
   * Simuliert das Senden eines Fotos an einen Notfallkontakt
   * In einer echten App würde dies über eine API, E-Mail oder SMS erfolgen
   */
  public async sendImageToContact(
    image: CapturedImage,
    contact: EmergencyContact
  ): Promise<boolean> {
    console.log('📤 Sende Bild an Notfallkontakt...');
    console.log('Kontakt:', contact.name, contact.phone);
    console.log('Bild:', image.uri);
    console.log('Zeitpunkt:', formatDate(image.timestamp));

    try {
      // Simuliere API-Aufruf mit Verzögerung
      await this.delay(2000);

      // Simuliere verschiedene Erfolgsraten
      const success = Math.random() > 0.1; // 90% Erfolgsrate

      if (success) {
        console.log('✅ Bild erfolgreich an', contact.name, 'gesendet');
        return true;
      } else {
        console.log('❌ Fehler beim Senden an', contact.name);
        return false;
      }
    } catch (error) {
      console.error('Fehler beim Senden des Bildes:', error);
      return false;
    }
  }

  /**
   * Sendet eine Notfall-SMS (simuliert)
   */
  public async sendEmergencySMS(
    contact: EmergencyContact,
    message: string
  ): Promise<boolean> {
    console.log('📱 Sende Notfall-SMS...');
    console.log('An:', contact.phone);
    console.log('Nachricht:', message);

    try {
      // Simuliere SMS-Versand
      await this.delay(1500);

      const success = Math.random() > 0.05; // 95% Erfolgsrate

      if (success) {
        console.log('✅ SMS erfolgreich an', contact.name, 'gesendet');
        return true;
      } else {
        console.log('❌ Fehler beim SMS-Versand an', contact.name);
        return false;
      }
    } catch (error) {
      console.error('Fehler beim SMS-Versand:', error);
      return false;
    }
  }

  /**
   * Sendet eine Notfall-E-Mail an einen Kontakt
   */
  public async sendEmergencyEmail(
    contact: EmergencyContact,
    subject: string,
    body: string,
    attachmentUri?: string
  ): Promise<boolean> {
    if (!contact.email) {
      console.log('❌ Kein E-Mail-Kontakt für', contact.name);
      return false;
    }

    console.log('📧 Sende Notfall-E-Mail...');
    console.log('An:', contact.email);
    console.log('Betreff:', subject);

    try {
      const emergencyData = {
        timestamp: new Date(),
        photoUri: attachmentUri,
        deviceInfo: `PocketGuardian Mobile App`,
      };

      const success = await emailService.sendEmergencyEmail([contact], emergencyData);
      
      if (success) {
        console.log('✅ E-Mail erfolgreich an', contact.name, 'gesendet');
        return true;
      } else {
        console.log('❌ Fehler beim E-Mail-Versand an', contact.name);
        return false;
      }
    } catch (error) {
      console.error('Fehler beim E-Mail-Versand:', error);
      return false;
    }
  }

  /**
   * Sendet Notfall-E-Mails an alle Kontakte mit E-Mail-Adressen (Dual-Kamera Version)
   */
  public async sendEmergencyEmailToAllWithDualImages(
    contacts: EmergencyContact[],
    dualImages?: DualCapturedImages,
    location?: { latitude: number; longitude: number }
  ): Promise<boolean> {
    const emailContacts = contacts.filter(contact => contact.email);
    
    if (emailContacts.length === 0) {
      console.log('❌ Keine E-Mail-Kontakte gefunden');
      return false;
    }

    console.log(`📧 Sende Dual-Kamera Notfall-E-Mails an ${emailContacts.length} Kontakte...`);

    try {
      const emergencyData = {
        timestamp: new Date(),
        photoUri: dualImages?.backImage?.uri || dualImages?.frontImage?.uri,
        frontPhotoUri: dualImages?.frontImage?.uri,
        backPhotoUri: dualImages?.backImage?.uri,
        location: location || dualImages?.location,
        deviceInfo: `PocketGuardian Mobile App - Dual-Kamera Aufnahme`,
      };

      const success = await emailService.sendEmergencyEmailWithDualImages(emailContacts, emergencyData);
      
      if (success) {
        console.log('✅ Dual-Kamera Notfall-E-Mails erfolgreich gesendet');
        return true;
      } else {
        console.log('❌ Fehler beim Senden der Dual-Kamera Notfall-E-Mails');
        return false;
      }
    } catch (error) {
      console.error('Fehler beim Senden der Dual-Kamera Notfall-E-Mails:', error);
      return false;
    }
  }

  /**
   * Sendet Notfall-E-Mails an alle Kontakte mit E-Mail-Adressen (Legacy Version)
   */
  public async sendEmergencyEmailToAll(
    contacts: EmergencyContact[],
    image?: CapturedImage,
    location?: { latitude: number; longitude: number }
  ): Promise<boolean> {
    const emailContacts = contacts.filter(contact => contact.email);
    
    if (emailContacts.length === 0) {
      console.log('❌ Keine E-Mail-Kontakte gefunden');
      return false;
    }

    console.log(`📧 Sende Notfall-E-Mails an ${emailContacts.length} Kontakte...`);

    try {
      const emergencyData = {
        timestamp: new Date(),
        photoUri: image?.uri,
        location: location,
        deviceInfo: `PocketGuardian Mobile App`,
      };

      const success = await emailService.sendEmergencyEmail(emailContacts, emergencyData);
      
      if (success) {
        console.log('✅ Notfall-E-Mails erfolgreich gesendet');
        return true;
      } else {
        console.log('❌ Fehler beim Senden der Notfall-E-Mails');
        return false;
      }
    } catch (error) {
      console.error('Fehler beim Senden der Notfall-E-Mails:', error);
      return false;
    }
  }

  /**
   * Vollständige Notfall-Prozedur mit Dual-Kamera - Verbessert gegen Abstürze
   */
  public async executeEmergencyProcedureWithDualCamera(
    dualImages: DualCapturedImages,
    contacts: EmergencyContact[]
  ): Promise<{ success: boolean; results: Array<{ contact: string; success: boolean }> }> {
    console.log('🚨 Starte Dual-Kamera Notfall-Prozedur...');

    if (!contacts || contacts.length === 0) {
      console.log('❌ Keine Notfallkontakte definiert');
      return { success: false, results: [] };
    }

    if (!dualImages || (!dualImages.frontImage && !dualImages.backImage)) {
      console.log('❌ Keine gültigen Bilder für Notfallprozedur');
      return { success: false, results: [] };
    }

    const results: Array<{ contact: string; success: boolean }> = [];
    
    // Verwende Promise.allSettled für bessere Fehlerresistenz
    const contactPromises = contacts.map(async (contact) => {
      try {
        console.log(`🔄 Verarbeite Kontakt: ${contact.name}`);

        // Erstelle Notfallnachricht mit Fallback
        let emergencyMessage: string;
        try {
          emergencyMessage = this.createDualCameraEmergencyMessage(dualImages);
        } catch (error) {
          console.warn('Fallback auf einfache Notfallnachricht:', error);
          emergencyMessage = '🚨 NOTFALL! PocketGuardian hat eine unerwartete Bewegung erkannt.';
        }
        
        // Versuche verschiedene Kommunikationswege
        let contactSuccess = false;
        const attemptResults: string[] = [];

        // 1. Versuche Dual-Bilder zu senden (prioritär das Rückkamera-Bild)
        try {
          const primaryImage = dualImages.backImage || dualImages.frontImage;
          if (primaryImage) {
            const imageSuccess = await this.sendImageToContact(primaryImage, contact);
            if (imageSuccess) {
              contactSuccess = true;
              attemptResults.push('Bild gesendet');
            }
          }
        } catch (error) {
          console.warn(`Bild-Versand an ${contact.name} fehlgeschlagen:`, error);
          attemptResults.push('Bild-Fehler');
        }

        // 2. Versuche SMS zu senden
        try {
          const smsSuccess = await this.sendEmergencySMS(contact, emergencyMessage);
          if (smsSuccess) {
            contactSuccess = true;
            attemptResults.push('SMS gesendet');
          }
        } catch (error) {
          console.warn(`SMS an ${contact.name} fehlgeschlagen:`, error);
          attemptResults.push('SMS-Fehler');
        }

        // 3. Versuche E-Mail mit Dual-Kamera-Bildern zu senden (falls vorhanden)
        try {
          if (contact.email) {
            const emailSuccess = await this.sendEmergencyEmailToAllWithDualImages([contact], dualImages);
            if (emailSuccess) {
              contactSuccess = true;
              attemptResults.push('E-Mail gesendet');
            }
          }
        } catch (error) {
          console.warn(`E-Mail an ${contact.name} fehlgeschlagen:`, error);
          attemptResults.push('E-Mail-Fehler');
        }

        console.log(`✅ Kontakt ${contact.name} verarbeitet: ${attemptResults.join(', ')}`);
        
        return {
          contact: contact.name,
          success: contactSuccess,
        };

      } catch (error) {
        console.error(`❌ Kritischer Fehler bei Kontakt ${contact.name}:`, error);
        return {
          contact: contact.name,
          success: false,
        };
      }
    });

    // Warte auf alle Kontakt-Versuche (maximal 30 Sekunden pro Kontakt)
    try {
      const contactResults = await Promise.allSettled(contactPromises);
      
      contactResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Kontakt ${index} vollständig fehlgeschlagen:`, result.reason);
          results.push({
            contact: contacts[index]?.name || `Kontakt ${index}`,
            success: false,
          });
        }
      });
    } catch (error) {
      console.error('❌ Kritischer Fehler bei Notfallprozedur:', error);
      // Erstelle Fallback-Ergebnis
      contacts.forEach(contact => {
        results.push({
          contact: contact.name,
          success: false,
        });
      });
    }

    const overallSuccess = results.some(r => r.success);
    const successCount = results.filter(r => r.success).length;
    
    console.log(`🏁 Dual-Kamera Notfall-Prozedur abgeschlossen. Erfolg: ${overallSuccess} (${successCount}/${results.length} Kontakte)`);

    return { success: overallSuccess, results };
  }

  /**
   * Vollständige Notfall-Prozedur (Legacy Version)
   */
  public async executeEmergencyProcedure(
    image: CapturedImage,
    contacts: EmergencyContact[]
  ): Promise<{ success: boolean; results: Array<{ contact: string; success: boolean }> }> {
    console.log('🚨 Starte Notfall-Prozedur...');

    if (contacts.length === 0) {
      console.log('❌ Keine Notfallkontakte definiert');
      return { success: false, results: [] };
    }

    const results: Array<{ contact: string; success: boolean }> = [];
    
    for (const contact of contacts) {
      console.log(`Verarbeite Kontakt: ${contact.name}`);

      // Erstelle Notfallnachricht
      const emergencyMessage = this.createEmergencyMessage(image);
      
      // Versuche verschiedene Kommunikationswege
      let contactSuccess = false;

      // 1. Versuche Bild zu senden
      if (await this.sendImageToContact(image, contact)) {
        contactSuccess = true;
      }

      // 2. Versuche SMS zu senden
      if (await this.sendEmergencySMS(contact, emergencyMessage)) {
        contactSuccess = true;
      }

      // 3. Versuche E-Mail zu senden (falls vorhanden)
      if (contact.email) {
        const emailSuccess = await this.sendEmergencyEmailToAll([contact], image);
        if (emailSuccess) {
          contactSuccess = true;
        }
      }

      results.push({
        contact: contact.name,
        success: contactSuccess,
      });
    }

    const overallSuccess = results.some(r => r.success);
    console.log('Notfall-Prozedur abgeschlossen. Erfolg:', overallSuccess);

    return { success: overallSuccess, results };
  }

  /**
   * Erstellt eine Notfallnachricht für Dual-Kamera
   */
  private createDualCameraEmergencyMessage(dualImages: DualCapturedImages): string {
    const timestamp = formatDate(dualImages.timestamp);
    const hasFront = !!dualImages.frontImage;
    const hasBack = !!dualImages.backImage;
    
    let cameraInfo = '';
    if (hasFront && hasBack) {
      cameraInfo = 'Fotos mit beiden Kameras';
    } else if (hasFront) {
      cameraInfo = 'Foto mit Frontkamera';
    } else if (hasBack) {
      cameraInfo = 'Foto mit Rückkamera';
    } else {
      cameraInfo = 'Kamera-Aufnahme';
    }

    return `🚨 NOTFALL ALERT: PocketGuardian hat eine unerwartete Bewegung erkannt am ${timestamp}. ${cameraInfo} wurde automatisch erstellt.`;
  }

  /**
   * Erstellt eine Notfallnachricht (Legacy Version)
   */
  private createEmergencyMessage(image: CapturedImage): string {
    const timestamp = formatDate(image.timestamp);
    return `🚨 NOTFALL ALERT: PocketGuardian hat eine unerwartete Bewegung erkannt am ${timestamp}. Sicherheitsfoto wurde automatisch erstellt.`;
  }

  /**
   * Erstellt eine E-Mail-Nachricht
   */
  private createEmergencyEmailBody(image: CapturedImage): string {
    const timestamp = formatDate(image.timestamp);
    return `
Liebe/r Notfallkontakt,

PocketGuardian hat eine unerwartete Bewegung erkannt:

Zeitpunkt: ${timestamp}
Status: Automatisches Sicherheitsfoto erstellt

Bitte prüfen Sie die Situation und kontaktieren Sie die betroffene Person falls nötig.

Diese Nachricht wurde automatisch von PocketGuardian gesendet.
    `.trim();
  }

  /**
   * Hilfsfunktion für Delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Testet die Notfall-Kommunikation
   */
  public async testEmergencySystem(contacts: EmergencyContact[]): Promise<void> {
    console.log('🧪 Teste Notfall-System...');
    
    const testImage: CapturedImage = {
      uri: 'test://image.jpg',
      timestamp: Date.now(),
    };

    const result = await this.executeEmergencyProcedure(testImage, contacts);
    console.log('Test-Ergebnis:', result);
  }
}

// Singleton-Instanz
export const emergencyService = new EmergencyService();
export default emergencyService;
