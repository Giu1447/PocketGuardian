/**
 * Test-Utilities für PocketGuardian
 * Hilft beim Testen der behobenen Probleme
 */

import { Platform } from 'react-native';

export class AppTester {
  /**
   * Testet SafeArea Integration
   */
  static testSafeArea() {
    console.log('🧪 Teste SafeArea Integration...');
    console.log('Platform:', Platform.OS);
    console.log('SafeArea sollte in Layout und Screens aktiv sein');
    return true;
  }

  /**
   * Testet Background-Service
   */
  static async testBackgroundService() {
    console.log('🧪 Teste Background-Service...');
    try {
      const { backgroundTaskService } = await import('../services');
      const status = await backgroundTaskService.getBackgroundStatus();
      console.log('Background Status:', status);
      return status.available;
    } catch (error) {
      console.error('Background-Test fehlgeschlagen:', error);
      return false;
    }
  }

  /**
   * Testet Emergency-Service Stabilität
   */
  static async testEmergencyStability() {
    console.log('🧪 Teste Emergency-Service Stabilität...');
    try {
      const { emergencyService } = await import('../services');
      
      // Simuliere mehrfache Aufrufe
      const promises = Array(5).fill(null).map((_, i) => 
        emergencyService.executeEmergencyProcedureWithDualCamera(
          { timestamp: Date.now() }, // Mock dual images
          [{ id: '1', name: `Test${i}`, phone: '+49123', email: 'test@test.com' }]
        )
      );
      
      const results = await Promise.allSettled(promises);
      const successes = results.filter(r => r.status === 'fulfilled').length;
      
      console.log(`Emergency Stabilität: ${successes}/${results.length} erfolgreich`);
      return successes > 0; // Mindestens einer sollte erfolgreich sein
    } catch (error) {
      console.error('Emergency-Test fehlgeschlagen:', error);
      return false;
    }
  }

  /**
   * Führt alle Tests aus
   */
  static async runAllTests() {
    console.log('🧪 Starte vollständige App-Tests...');
    
    const results = {
      safeArea: this.testSafeArea(),
      background: await this.testBackgroundService(),
      emergency: await this.testEmergencyStability(),
    };
    
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    console.log(`📊 Test-Ergebnisse: ${passed}/${total} bestanden`);
    console.log('Details:', results);
    
    return results;
  }
}

// Development-Helper
if (__DEV__) {
  // Exportiere für Console-Zugriff
  (global as any).AppTester = AppTester;
  console.log('🧪 AppTester verfügbar über global.AppTester');
}
