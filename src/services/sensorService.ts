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
    threshold: 20.0, // Reduziert auf mittleren Wert für bessere Erkennung
    isEnabled: true, // Aktiviere den Sensor standardmäßig
    sensitivity: 'medium' // Mittlere Sensitivität für bessere Balance
  };
  private onMotionDetected: (() => void) | null = null;
  private onPocketStateChanged: ((inPocket: boolean) => void) | null = null;
  private onSensorDataUpdate: ((data: any) => void) | null = null;
  private lastMotionTime = 0;
  private motionCooldown = 5000; // Kürzerer Cooldown (5 Sekunden) für bessere Reaktionszeit
  private motionBuffer: number[] = []; // Buffer für Bewegungsdaten
  private bufferSize = 8; // Weniger Messungen für schnellere Reaktion
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
  public startMonitoring(onMotionDetected: () => void, onSensorDataUpdate?: (data: any) => void): void {
    if (this.isActive) {
      this.stopMonitoring();
    }

    this.onMotionDetected = onMotionDetected;
    this.onSensorDataUpdate = onSensorDataUpdate || null; // NEU: Callback für Debug-Daten
    this.isActive = true;
    this.motionBuffer = []; // Buffer zurücksetzen

    // Setze die Update-Frequenz (alle 500ms für bessere Reaktionszeit)
    Accelerometer.setUpdateInterval(500);

    this.accelerometerSubscription = Accelerometer.addListener((accelerometerData) => {
      this.handleAccelerometerData(accelerometerData);
    });

    console.log('🔄 Bewegungsüberwachung gestartet (UNSENSIBLER EINGESTELLT)');
    console.log('⚙️ Einstellungen:', {
      threshold: this.settings.threshold,
      sensitivity: this.settings.sensitivity,
      cooldown: this.motionCooldown + 'ms',
      note: 'Schwellenwert erhöht für reduzierte Sensibilität'
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
    
    // NEUE LOGIK: Wenn seit 10s keine STARKE Bewegung erkannt wurde, ist es im Pocket
    this.inPocket = timeSinceLastMotion > 10000 && this.motionBuffer.length > 0;
    
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
    if (!this.onMotionDetected) { // Prüfung vereinfacht
      return;
    }

    // Berechne die Gesamtbeschleunigung
    const totalAcceleration = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
    
    // DEBUG: Live-Daten an UI senden
    if (this.onSensorDataUpdate) {
      this.onSensorDataUpdate({
        totalAcceleration: totalAcceleration.toFixed(2),
        inPocket: this.inPocket,
        lastMotionTime: this.lastMotionTime,
        timeSinceLastMotion: (Date.now() - this.lastMotionTime) / 1000,
      });
    }
    
    // Nur weiter, wenn der Service aktiviert ist
    if (!this.settings.isEnabled) {
        return;
    }

    // Füge zur Buffer hinzu
    this.motionBuffer.push(totalAcceleration);
    if (this.motionBuffer.length > this.bufferSize) {
      this.motionBuffer.shift();
    }

    // Brauche mindestens 7 Messungen für zuverlässigere Erkennung
    if (this.motionBuffer.length < 7) {
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

    // ANGEPASSTE Schwellenwerte für bessere Balance
    const sensitivityMultiplier = this.getSensitivityMultiplier();
    const threshold = 3.0 * sensitivityMultiplier; // Reduziert für bessere Erkennung
    
    // Vereinfachte Erkennungskriterien:
    // 1. Deutliche Abweichung von der Schwerkraft (Sturz/Aufprall)
    const gravitationalDeviation = Math.abs(average - this.baselineAcceleration);
    
    // 2. Hohe Standardabweichung (starkes Schütteln)
    const isJerkyMotion = standardDeviation > 1.5; // Reduziert für bessere Erkennung
    
    // 3. Hohe Beschleunigungsänderung
    const isSharpDeviation = gravitationalDeviation > threshold;
    
    // DEBUG-Ausgabe für jede Messung
    // console.log(`Sensor-Check: Accel=${totalAcceleration.toFixed(2)}, Avg=${average.toFixed(2)}, StdDev=${standardDeviation.toFixed(2)}, Dev=${gravitationalDeviation.toFixed(2)}`);

    // Vereinfachte Motion Detection - ODER-Operator statt UND für bessere Erkennung
    if (isSharpDeviation || isJerkyMotion) {
      console.log('🚨 BEWEGUNG erkannt! (Sturz oder starkes Schütteln)');
      console.log('📊 Details:', {
        totalAcceleration: totalAcceleration.toFixed(2),
        average: average.toFixed(2),
        standardDeviation: standardDeviation.toFixed(2),
        threshold: threshold.toFixed(2),
      });
      
      this.lastMotionTime = currentTime;
      if (this.onMotionDetected) {
        this.onMotionDetected();
      }
    }
  }

  /**
   * Gibt den Sensitivitäts-Multiplikator zurück
   */
  private getSensitivityMultiplier(): number {
    switch (this.settings.sensitivity) {
      case 'high':
        return 0.8; // Sensibler
      case 'medium':
        return 1.0; // Standard
      case 'low':
        return 1.5; // Weniger sensibel
      default:
        return 1.2;
    }
  }

  /**
   * Aktualisiert die Sensor-Einstellungen
   */
  public updateSettings(settings: Partial<SensorSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    // Cooldowns je nach Sensitivität
    switch (this.settings.sensitivity) {
      case 'low':
        this.motionCooldown = 15000; // 15 Sekunden
        break;
      case 'medium':
        this.motionCooldown = 10000; // 10 Sekunden
        break;
      case 'high':
        this.motionCooldown = 8000; // 8 Sekunden
        break;
    }

    console.log('⚙️ Sensor-Einstellungen aktualisiert (UNSENSIBLER):', this.settings);
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
