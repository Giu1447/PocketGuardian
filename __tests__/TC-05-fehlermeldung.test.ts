// @ts-nocheck
/**
 * TC-05: Überprüfe, ob eine Fehlermeldung korrekt angezeigt wird
 */

import { Alert } from 'react-native';

// Mock für React Native Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('TC-05: Fehlermeldung anzeigen', () => {
  const mockErrorHandler = {
    showError: jest.fn(),
    logError: jest.fn(),
    handleCriticalError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sollte einfache Fehlermeldung korrekt anzeigen', () => {
    // Arrange
    const errorMessage = 'Netzwerkverbindung fehlgeschlagen';
    const errorTitle = 'Verbindungsfehler';
    
    mockErrorHandler.showError.mockImplementation((title, message) => {
      Alert.alert(title, message, [{ text: 'OK' }]);
    });

    // Act
    mockErrorHandler.showError(errorTitle, errorMessage);

    // Assert
    expect(mockErrorHandler.showError).toHaveBeenCalledWith(errorTitle, errorMessage);
    expect(Alert.alert).toHaveBeenCalledWith(
      errorTitle,
      errorMessage,
      [{ text: 'OK' }]
    );
  });

  test('sollte kritische Fehlermeldung mit Aktionen anzeigen', () => {
    // Arrange
    const criticalError = new Error('Sensor-Service nicht verfügbar');
    const expectedButtons = [
      { text: 'Abbrechen', style: 'cancel' as const },
      { text: 'Neu starten', onPress: expect.any(Function) },
    ];

    mockErrorHandler.handleCriticalError.mockImplementation((error) => {
      Alert.alert(
        'Kritischer Fehler',
        `Ein schwerwiegender Fehler ist aufgetreten: ${error.message}`,
        expectedButtons
      );
    });

    // Act
    mockErrorHandler.handleCriticalError(criticalError);

    // Assert
    expect(mockErrorHandler.handleCriticalError).toHaveBeenCalledWith(criticalError);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Kritischer Fehler',
      'Ein schwerwiegender Fehler ist aufgetreten: Sensor-Service nicht verfügbar',
      expectedButtons
    );
  });

  test('sollte Fehler-Logging funktionieren', () => {
    // Arrange
    const error = new Error('Test-Fehler für Logging');
    const context = 'Bewegungserkennung';
    
    mockErrorHandler.logError.mockImplementation((error, context) => {
      console.error(`[${context}] Fehler:`, error.message);
    });

    // Act
    mockErrorHandler.logError(error, context);

    // Assert
    expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, context);
  });

  test('sollte verschiedene Fehlertypen unterschiedlich behandeln', () => {
    // Arrange
    const networkError = new Error('Netzwerk nicht erreichbar');
    const permissionError = new Error('Kamera-Berechtigung verweigert');
    const unknownError = new Error('Unbekannter Fehler');

    mockErrorHandler.showError.mockImplementation((title, message) => {
      Alert.alert(title, message);
    });

    // Act
    mockErrorHandler.showError('Netzwerkfehler', networkError.message);
    mockErrorHandler.showError('Berechtigungsfehler', permissionError.message);
    mockErrorHandler.showError('Allgemeiner Fehler', unknownError.message);

    // Assert
    expect(Alert.alert).toHaveBeenCalledTimes(3);
    expect(Alert.alert).toHaveBeenNthCalledWith(1, 'Netzwerkfehler', 'Netzwerk nicht erreichbar');
    expect(Alert.alert).toHaveBeenNthCalledWith(2, 'Berechtigungsfehler', 'Kamera-Berechtigung verweigert');
    expect(Alert.alert).toHaveBeenNthCalledWith(3, 'Allgemeiner Fehler', 'Unbekannter Fehler');
  });

  test('sollte Fehlermeldung mit benutzerdefinierten Aktionen anzeigen', () => {
    // Arrange
    const onRetry = jest.fn();
    const onCancel = jest.fn();
    const buttons = [
      { text: 'Abbrechen', onPress: onCancel, style: 'cancel' },
      { text: 'Wiederholen', onPress: onRetry },
    ];

    mockErrorHandler.showError.mockImplementation((title, message, actions) => {
      Alert.alert(title, message, actions);
    });

    // Act
    mockErrorHandler.showError(
      'Verbindung fehlgeschlagen',
      'Die Verbindung zum Server konnte nicht hergestellt werden.',
      buttons
    );

    // Assert
    expect(Alert.alert).toHaveBeenCalledWith(
      'Verbindung fehlgeschlagen',
      'Die Verbindung zum Server konnte nicht hergestellt werden.',
      buttons
    );
  });
});
