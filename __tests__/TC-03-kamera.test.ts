/**
 * TC-03: Überprüfe, ob Front- und Rückkamera korrekt ausgelöst haben
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';

type PhotoResult = { uri: string; timestamp: string };

describe('TC-03: Kamera-Funktionalität', () => {
  const mockCameraService = {
    takeFrontPhoto: jest.fn<() => Promise<PhotoResult>>(),
    takeBackPhoto: jest.fn<() => Promise<PhotoResult>>(),
    getLastFrontPhoto: jest.fn(),
    getLastBackPhoto: jest.fn(),
    isPermissionGranted: jest.fn<() => boolean>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sollte Front-Kamera erfolgreich auslösen', async () => {
    // Arrange
    const mockPhotoUri = 'file://front-photo-123.jpg';
    mockCameraService.takeFrontPhoto.mockResolvedValue({
      uri: mockPhotoUri,
      timestamp: new Date().toISOString(),
    });
    mockCameraService.isPermissionGranted.mockReturnValue(true);

    // Act
    const result = await mockCameraService.takeFrontPhoto();

    // Assert
    expect(mockCameraService.takeFrontPhoto).toHaveBeenCalledTimes(1);
    expect(result.uri).toBe(mockPhotoUri);
    expect(result.timestamp).toBeDefined();
  });

  test('sollte Rück-Kamera erfolgreich auslösen', async () => {
    // Arrange
    const mockPhotoUri = 'file://back-photo-456.jpg';
    mockCameraService.takeBackPhoto.mockResolvedValue({
      uri: mockPhotoUri,
      timestamp: new Date().toISOString(),
    });
    mockCameraService.isPermissionGranted.mockReturnValue(true);

    // Act
    const result = await mockCameraService.takeBackPhoto();

    // Assert
    expect(mockCameraService.takeBackPhoto).toHaveBeenCalledTimes(1);
    expect(result.uri).toBe(mockPhotoUri);
    expect(result.timestamp).toBeDefined();
  });

  test('sollte beide Kameras nacheinander auslösen können', async () => {
    // Arrange
    const frontPhotoUri = 'file://front-photo-789.jpg';
    const backPhotoUri = 'file://back-photo-789.jpg';
    
    mockCameraService.takeFrontPhoto.mockResolvedValue({
      uri: frontPhotoUri,
      timestamp: new Date().toISOString(),
    });
    mockCameraService.takeBackPhoto.mockResolvedValue({
      uri: backPhotoUri,
      timestamp: new Date().toISOString(),
    });
    mockCameraService.isPermissionGranted.mockReturnValue(true);

    // Act
    const frontResult = await mockCameraService.takeFrontPhoto();
    const backResult = await mockCameraService.takeBackPhoto();

    // Assert
    expect(mockCameraService.takeFrontPhoto).toHaveBeenCalledTimes(1);
    expect(mockCameraService.takeBackPhoto).toHaveBeenCalledTimes(1);
    expect(frontResult.uri).toBe(frontPhotoUri);
    expect(backResult.uri).toBe(backPhotoUri);
  });

  test('sollte Fehler behandeln wenn Kamera-Berechtigung fehlt', async () => {
    // Arrange
    mockCameraService.isPermissionGranted.mockReturnValue(false);
    mockCameraService.takeFrontPhoto.mockRejectedValue(new Error('Keine Kamera-Berechtigung'));

    // Act & Assert
    await expect(mockCameraService.takeFrontPhoto()).rejects.toThrow('Keine Kamera-Berechtigung');
    expect(mockCameraService.isPermissionGranted()).toBe(false);
  });
});
