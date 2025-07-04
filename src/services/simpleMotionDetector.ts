/**
 * Einfache Bewegungserkennung nach Aufgabenstellung
 * Erkennt Bewegungen > 2.0g und ignoriert normale Bewegungen
 */

import { Accelerometer } from 'expo-sensors';

class SimpleMotionDetector {
  private accelerometerSubscription: any | null = null;
  private isActive = false;
  private onMotionDetected: (() => void) | null = null;
  private lastMotionTime = 0;
  private cooldownTime = 5000; // 5 Sekunden Cooldown zwischen Alarmen
  
  /**
   * Startet die Bewegungserkennung
   */
  public startMonitoring(callback: () => void): void {
    if (this.isActive) {
      this.stopMonitoring();
    }
    
    this.onMotionDetected = callback;
    this.isActive = true;
    
    // Update-Intervall setzen (100ms für gute Reaktionszeit)
    Accelerometer.setUpdateInterval(100);
    
    // Auf Accelerometer-Daten lauschen
    this.accelerometerSubscription = Accelerometer.addListener(data => {
      // Berechne die Gesamtbeschleunigung
      const totalAcceleration = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
      
      // Überprüfe Cooldown-Zeit
      const currentTime = Date.now();
      if (currentTime - this.lastMotionTime < this.cooldownTime) {
        return;
      }
      
      // Wenn Beschleunigung > 2.0g, löse Alarm aus
      if (totalAcceleration > 2.0) {
        console.log(`🚨 Hohe Beschleunigung erkannt: ${totalAcceleration.toFixed(2)}g`);
        this.lastMotionTime = currentTime;
        
        if (this.onMotionDetected) {
          this.onMotionDetected();
        }
      }
    });
    
    console.log('🔄 Einfache Bewegungserkennung gestartet');
    console.log('⚙️ Schwellenwert: 2.0g, Cooldown: 5 Sekunden');
  }
  
  /**
   * Stoppt die Bewegungserkennung
   */
  public stopMonitoring(): void {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }
    
    this.isActive = false;
    console.log('⏹️ Bewegungserkennung gestoppt');
  }
  
  /**
   * Gibt zurück, ob die Bewegungserkennung aktiv ist
   */
  public isMonitoring(): boolean {
    return this.isActive;
  }
  
  /**
   * Initialisiert den Sensor
   */
  public async initialize(): Promise<boolean> {
    try {
      const { status } = await Accelerometer.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Fehler beim Initialisieren des Accelerometers:', error);
      return false;
    }
  }
}

export const simpleMotionDetector = new SimpleMotionDetector();
export default simpleMotionDetector;
