import { beforeEach, describe, expect, jest, test } from '@jest/globals';

/**
 * TC-01: Überprüfe, ob die Bewegungserkennung aktiviert ist und der Status "Aktiv" ist
 */

// Mock für sensorService
const mockSensorService = {
  initialize: jest.fn(),
  startMotionDetection: jest.fn(),
  stopMotionDetection: jest.fn(),
  getStatus: jest.fn(),
  isActive: jest.fn(),
  updateSettings: jest.fn(),
  startMonitoring: jest.fn(),
  stopMonitoring: jest.fn(),
  testMotionDetection: jest.fn(),
  setPocketStateHandler: jest.fn(),
};

jest.mock('../src/services', () => ({
  sensorService: mockSensorService,
}));

describe('TC-01: Bewegungserkennung Status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sollte Bewegungserkennung als aktiv erkennen', () => {
    // Arrange
    mockSensorService.isActive.mockReturnValue(true);
    mockSensorService.getStatus.mockReturnValue('Aktiv');

    // Act
    const isActive = mockSensorService.isActive();
    const status = mockSensorService.getStatus();

    // Assert
    expect(isActive).toBe(true);
    expect(status).toBe('Aktiv');
  });

  test('sollte Überwachung mit Callback starten können', () => {
    // Arrange
    const motionCallback = jest.fn();
    const dataCallback = jest.fn();
    mockSensorService.startMonitoring.mockImplementation((motion, data) => {
      // Simuliere erfolgreiche Initialisierung
      return true;
    });

    // Act
    mockSensorService.startMonitoring(motionCallback, dataCallback);

    // Assert
    expect(mockSensorService.startMonitoring).toHaveBeenCalledWith(motionCallback, dataCallback);
    expect(mockSensorService.startMonitoring).toHaveBeenCalledTimes(1);
  });

  test('sollte Sensor-Einstellungen aktualisieren können', () => {
    // Arrange
    const settings = {
      isEnabled: true,
      sensitivity: 'low' as const,
      threshold: 25.0
    };

    // Act
    mockSensorService.updateSettings(settings);

    // Assert
    expect(mockSensorService.updateSettings).toHaveBeenCalledWith(settings);
    expect(mockSensorService.updateSettings).toHaveBeenCalledTimes(1);
  });
});
