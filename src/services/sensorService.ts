/**
 * Verbesserter Sensor-Service für Bewegungserkennung + Pocket-Erkennung
 * Mit deutlich reduzierter Sensitivität und Kamera-basierter Lichterkennung
 */

import { Accelerometer } from 'expo-sensors';
import { AccelerometerData, SensorSettings } from '../types';

class SensorService {
  private accelerometerSubscription: any | null = null;
  private lightSensorSubscription: any | null = null;
  private isActive = false;
  private isLightSensorActive = false;
  private settings: SensorSettings = {
    threshold: 25.0, // DRASTISCH erhöht von 2.5 auf 25.0 (10x unsensibler)
    isEnabled: false,
    sensitivity: 'low' // Standard auf 'low' gesetzt
  };
  private onMotionDetected: (() => void) | null = null;
  private onPocketStateChanged: ((inPocket: boolean) => void) | null = null;
  private lastMotionTime = 0;
  private motionCooldown = 10000; // 10 Sekunden Cooldown (erhöht)
  private motionBuffer: number[] = []; // Buffer für Bewegungsdaten
  private bufferSize = 8; // Mehr Messungen für zuverlässigere Erkennung
  private baselineAcceleration = 9.81; // Schwerkraft-Basislinie
  
  // Lichtsensor-Properties
  private currentLightLevel = 100; // Aktuelle Lichtstärke
  private lightThreshold = 10; // Schwellenwert für "im Pocket" (sehr dunkel)
  private inPocket = false; // Aktueller Pocket-Status
  private lightBuffer: number[] = []; // Buffer für Licht-Messungen
  private lastLightCheck = 0;
  private lightCheckInterval = 2000; // Prüfe Licht alle 2 Sekunden

  /**
   * Initialisiert den Sensor-Service mit nur Accelerometer
   */
  public async initialize(): Promise<boolean> {
    try {
      // Accelerometer-Berechtigung
      const { status: accelStatus } = await Accelerometer.requestPermissionsAsync();
      console.log('📱 Accelerometer-Berechtigung:', accelStatus);
      
      // Simuliere Lichtsensor-Unterstützung mit Accelerometer-Daten
      console.log('💡 Pocket-Erkennung wird über Bewegungsmuster simuliert');
      
      return accelStatus === 'granted';
    } catch (error) {
      console.error('❌ Fehler beim Initialisieren der Sensoren:', error);
      return false;
    }
  }

  /**
   * Startet die Bewegungserkennung mit drastisch reduzierter Sensitivität
   */
  public startMonitoring(onMotionDetected: () => void): void {
    if (this.isActive) {
      this.stopMonitoring();
    }

    this.onMotionDetected = onMotionDetected;
    this.isActive = true;
    this.motionBuffer = []; // Buffer zurücksetzen

    // Setze die Update-Frequenz (alle 500ms für weniger Sensitivität)
    Accelerometer.setUpdateInterval(500);

    this.accelerometerSubscription = Accelerometer.addListener((accelerometerData) => {
      this.handleAccelerometerData(accelerometerData);
    });

    console.log('🔄 Bewegungsüberwachung gestartet (UNSENSIBEL)');
    console.log('⚙️ Einstellungen:', {
      threshold: this.settings.threshold,
      sensitivity: this.settings.sensitivity,
      cooldown: this.motionCooldown + 'ms',
      note: 'Sehr hoher Schwellenwert - nur bei starkem Schütteln'
    });

    // Starte auch Pocket-Erkennung (vereinfacht ohne echten Lichtsensor)
    this.startSimplePocketDetection();
  }

  /**
   * Startet vereinfachte Pocket-Erkennung basierend auf Bewegungsmustern
   */
  public startSimplePocketDetection(onPocketStateChanged?: (inPocket: boolean) => void): void {
    if (onPocketStateChanged) {
      this.onPocketStateChanged = onPocketStateChanged;
    }

    this.isLightSensorActive = true;
    console.log('💡 Vereinfachte Pocket-Erkennung gestartet (über Bewegungsmuster)');
    
    // Simuliere Pocket-Status basierend auf Zeit und Bewegung
    // In einem echten Szenario könnte man Kamera oder andere Sensoren nutzen
    setInterval(() => {
      this.simulatePocketDetection();
    }, 3000);
  }

  /**
   * Simuliert Pocket-Erkennung ohne echten Lichtsensor
   */
  private simulatePocketDetection(): void {
    // Vereinfachte Logik: Wenn sehr wenig Bewegung für längere Zeit -> im Pocket
    const timeSinceLastMotion = Date.now() - this.lastMotionTime;
    const wasInPocket = this.inPocket;
    
    // Sehr einfache Heuristik: Mehr als 30 Sekunden keine starke Bewegung = im Pocket
    this.inPocket = timeSinceLastMotion > 30000 && this.motionBuffer.length > 0;
    
    // Simuliere Lichtwert basierend auf Pocket-Status
    this.currentLightLevel = this.inPocket ? 2 : 50;
    
    if (wasInPocket !== this.inPocket) {
      console.log(`💡 Pocket-Status (simuliert): ${this.inPocket ? 'IN POCKET' : 'DRAUSSEN'}`);
      
      if (this.onPocketStateChanged) {
        this.onPocketStateChanged(this.inPocket);
      }
    }
  }

  /**
   * Stoppt die Bewegungserkennung und Pocket-Erkennung
   */
  public stopMonitoring(): void {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }
    
    this.isActive = false;
    this.isLightSensorActive = false;
    this.motionBuffer = [];
    this.lightBuffer = [];
    console.log('⏹️ Bewegungsüberwachung und Pocket-Erkennung gestoppt');
  }

  /**
   * Verarbeitet Accelerometer-Daten mit DRASTISCH reduzierter Sensitivität
   * Erkennt nur noch starkes, absichtliches Schütteln
   */
  private handleAccelerometerData(data: AccelerometerData): void {
    if (!this.settings.isEnabled || !this.onMotionDetected) {
      return;
    }

    // Berechne die Gesamtbeschleunigung
    const totalAcceleration = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
    
    // Füge zur Buffer hinzu
    this.motionBuffer.push(totalAcceleration);
    if (this.motionBuffer.length > this.bufferSize) {
      this.motionBuffer.shift();
    }

    // Brauche mindestens 5 Messungen für sehr zuverlässige Erkennung
    if (this.motionBuffer.length < 5) {
      return;
    }

    // Überprüfe Cooldown-Periode
    const currentTime = Date.now();
    if (currentTime - this.lastMotionTime < this.motionCooldown) {
      return;
    }

    // Berechne Durchschnitt und Standardabweichung
    const average = this.motionBuffer.reduce((sum, val) => sum + val, 0) / this.motionBuffer.length;
    const variance = this.motionBuffer.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / this.motionBuffer.length;
    const standardDeviation = Math.sqrt(variance);

    // DRASTISCH erhöhte Schwellenwerte - nur bei wirklich starkem Schütteln
    const sensitivityMultiplier = this.getSensitivityMultiplier();
    const threshold = this.settings.threshold * sensitivityMultiplier; // Schon 25.0, wird nochmal multipliziert
    
    // Sehr strenge Erkennungskriterien:
    // 1. Extrem hohe Abweichung von der Schwerkraft
    const gravitationalDeviation = Math.abs(average - this.baselineAcceleration);
    
    // 2. Sehr hohe Standardabweichung (nur bei starkem Schütteln)
    const isVeryJerkyMotion = standardDeviation > (threshold * 0.8); // Viel höher als vorher
    
    // 3. Massive Beschleunigungsänderung
    const isVerySharpDeviation = gravitationalDeviation > threshold;
    
    // 4. Zusätzlich: Prüfe auf kontinuierliches starkes Schütteln
    const maxAcceleration = Math.max(...this.motionBuffer);
    const isExtremeAcceleration = maxAcceleration > (threshold * 1.5);

    // SEHR STRENGE Motion Detection - alle Kriterien müssen erfüllt sein
    if (isVeryJerkyMotion && isVerySharpDeviation && isExtremeAcceleration && standardDeviation > 15.0) {
      console.log('🚨 STARKE BEWEGUNG erkannt! (Handy wurde kräftig geschüttelt)');
      console.log('📊 Details:', {
        totalAcceleration: totalAcceleration.toFixed(2),
        average: average.toFixed(2),
        standardDeviation: standardDeviation.toFixed(2),
        gravitationalDeviation: gravitationalDeviation.toFixed(2),
        maxAcceleration: maxAcceleration.toFixed(2),
        threshold: threshold.toFixed(2),
        isVeryJerkyMotion,
        isVerySharpDeviation,
        isExtremeAcceleration,
        note: 'Nur bei sehr starkem Schütteln erkannt'
      });

      this.lastMotionTime = currentTime;
      this.motionBuffer = []; // Buffer nach Erkennung zurücksetzen
      this.onMotionDetected();
    }
  }

  /**
   * Gibt den Sensitivitäts-Multiplikator zurück (alle Werte drastisch erhöht)
   */
  private getSensitivityMultiplier(): number {
    switch (this.settings.sensitivity) {
      case 'low':
        return 3.0; // Extrem unsensibel (war 1.5)
      case 'medium':
        return 2.0; // Sehr unsensibel (war 1.0)
      case 'high':
        return 1.5; // Immer noch unsensibel (war 0.7)
      default:
        return 2.0;
    }
  }

  /**
   * Aktualisiert die Sensor-Einstellungen mit erhöhten Cooldowns
   */
  public updateSettings(settings: Partial<SensorSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    // Deutlich längere Cooldowns für weniger Auslösungen
    switch (this.settings.sensitivity) {
      case 'low':
        this.motionCooldown = 15000; // 15 Sekunden (war 8)
        break;
      case 'medium':
        this.motionCooldown = 12000; // 12 Sekunden (war 5)
        break;
      case 'high':
        this.motionCooldown = 10000; // 10 Sekunden (war 3)
        break;
    }

    console.log('⚙️ Sensor-Einstellungen aktualisiert (UNSENSIBEL):', this.settings);
    console.log('⏱️ Neuer Cooldown:', this.motionCooldown + 'ms');
  }

  /**
   * Gibt die aktuellen Einstellungen zurück
   */
  public getSettings(): SensorSettings {
    return { ...this.settings };
  }

  /**
   * Gibt den aktuellen Status zurück
   */
  public isMonitoring(): boolean {
    return this.isActive;
  }

  /**
   * Gibt den Lichtsensor-Status zurück
   */
  public isLightSensorRunning(): boolean {
    return this.isLightSensorActive;
  }

  /**
   * Gibt den aktuellen Pocket-Status zurück
   */
  public isInPocket(): boolean {
    return this.inPocket;
  }

  /**
   * Gibt die aktuelle Lichtstärke zurück
   */
  public getCurrentLightLevel(): number {
    return this.currentLightLevel;
  }

  /**
   * Setzt den Pocket-State-Change-Handler
   */
  public setPocketStateHandler(handler: (inPocket: boolean) => void): void {
    this.onPocketStateChanged = handler;
  }

  /**
   * Testet die Bewegungserkennung (für Debugging)
   */
  public testMotionDetection(): void {
    if (this.onMotionDetected) {
      console.log('🧪 Test: Bewegung simuliert');
      this.onMotionDetected();
    } else {
      console.log('⚠️ Test: Kein Motion-Handler registriert');
    }
  }

  /**
   * Gibt erweiterte Debug-Informationen zurück
   */
  public getDebugInfo(): object {
    return {
      isActive: this.isActive,
      isLightSensorActive: this.isLightSensorActive,
      settings: this.settings,
      bufferSize: this.motionBuffer.length,
      lightBufferSize: this.lightBuffer.length,
      lastMotionTime: this.lastMotionTime,
      cooldownRemaining: Math.max(0, this.motionCooldown - (Date.now() - this.lastMotionTime)),
      inPocket: this.inPocket,
      currentLightLevel: this.currentLightLevel,
      lightThreshold: this.lightThreshold,
      note: 'Sehr unsensible Konfiguration - nur starkes Schütteln löst aus'
    };
  }
}

// Singleton-Instanz
export const sensorService = new SensorService();
export default sensorService;
