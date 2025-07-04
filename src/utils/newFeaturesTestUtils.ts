/**
 * Test-Script für neue PocketGuardian Features
 * - Sehr unsensible Bewegungserkennung
 * - Pocket-Erkennung
 * - Verbesserte Kamera-Logik
 */

import { cameraService, sensorService } from '../services';

export class NewFeaturesTester {
  /**
   * Testet die neue unsensible Bewegungserkennung
   */
  static async testUnsensitiveMotionDetection() {
    console.log('🧪 Teste UNSENSIBLE Bewegungserkennung...');
    
    const debugInfo = sensorService.getDebugInfo();
    console.log('Debug Info:', debugInfo);
    
    // Prüfe Einstellungen
    const settings = sensorService.getSettings();
    console.log('Aktuelle Einstellungen:', settings);
    
    if (settings.threshold < 20.0) {
      console.warn('⚠️ Schwellenwert zu niedrig! Sollte >= 25.0 sein');
      return false;
    }
    
    if (settings.sensitivity !== 'low') {
      console.warn('⚠️ Sensitivität sollte auf "low" stehen');
      return false;
    }
    
    console.log('✅ Bewegungserkennung ist korrekt unsensibel konfiguriert');
    return true;
  }

  /**
   * Testet die Pocket-Erkennung
   */
  static testPocketDetection() {
    console.log('🧪 Teste Pocket-Erkennung...');
    
    const isLightSensorActive = sensorService.isLightSensorRunning();
    const inPocket = sensorService.isInPocket();
    const lightLevel = sensorService.getCurrentLightLevel();
    
    console.log('Pocket-Status:', {
      lightSensorActive: isLightSensorActive,
      inPocket,
      lightLevel
    });
    
    if (!isLightSensorActive) {
      console.warn('⚠️ Lichtsensor/Pocket-Erkennung nicht aktiv');
      return false;
    }
    
    console.log('✅ Pocket-Erkennung funktioniert');
    return true;
  }

  /**
   * Testet Kamera-Bereitschaft
   */
  static async testCameraReadiness() {
    console.log('🧪 Teste Kamera-Bereitschaft...');
    
    const isAvailable = cameraService.isAvailable();
    const permissions = cameraService.getPermissionStatus();
    
    console.log('Kamera-Status:', {
      isAvailable,
      permissions
    });
    
    if (!permissions.camera) {
      console.error('❌ Keine Kamera-Berechtigung');
      return false;
    }
    
    if (!isAvailable) {
      console.error('❌ Kamera nicht verfügbar');
      return false;
    }
    
    console.log('✅ Kamera-System bereit');
    return true;
  }

  /**
   * Simuliert starkes Schütteln um zu testen ob Schwellenwert hoch genug ist
   */
  static simulateStrongShaking() {
    console.log('🧪 Simuliere starkes Schütteln...');
    console.log('📱 SCHÜTTELN SIE DAS HANDY JETZT KRÄFTIG!');
    console.log('💡 Nur sehr starkes Schütteln sollte einen Alarm auslösen');
    
    // Zeige Debug-Infos für 10 Sekunden
    const interval = setInterval(() => {
      const debugInfo = sensorService.getDebugInfo();
      console.log('Debug:', debugInfo);
    }, 1000);
    
    setTimeout(() => {
      clearInterval(interval);
      console.log('🧪 Schüttel-Test beendet');
    }, 10000);
  }

  /**
   * Führt alle Tests aus
   */
  static async runAllNewFeatureTests() {
    console.log('🧪 Starte Tests für neue Features...');
    
    const results = {
      motionDetection: await this.testUnsensitiveMotionDetection(),
      pocketDetection: this.testPocketDetection(),
      cameraReadiness: await this.testCameraReadiness(),
    };
    
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    console.log(`📊 Neue Features Test-Ergebnisse: ${passed}/${total} bestanden`);
    console.log('Details:', results);
    
    if (passed === total) {
      console.log('🎉 Alle neuen Features funktionieren!');
      console.log('💡 Tipp: Versuchen Sie das Handy kräftig zu schütteln um die unsensible Erkennung zu testen');
    } else {
      console.log('⚠️ Einige Features funktionieren nicht korrekt');
    }
    
    return results;
  }
}

// Development-Helper
if (__DEV__) {
  (global as any).NewFeaturesTester = NewFeaturesTester;
  console.log('🧪 NewFeaturesTester verfügbar über global.NewFeaturesTester');
}
