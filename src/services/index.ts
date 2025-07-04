/**
 * Service-Exports für einfache Imports
 */

export { default as audioService } from './audioService';
export { default as cameraService } from './cameraService';
export { emailService } from './emailService';
export { default as emergencyService } from './emergencyService';
export { default as notificationService } from './notificationService';
export { default as sensorService } from './sensorService';

// Mock-Services für Tests
export const mockSensorService = {
  initialize: async () => Promise.resolve(),
  startMotionDetection: async () => Promise.resolve(),
  stopMotionDetection: async () => Promise.resolve(),
  getStatus: () => 'Aktiv',
  isActive: () => true,
};

export const mockNotificationService = {
  initialize: async () => Promise.resolve(),
  sendNotification: async (message: string) => Promise.resolve(),
  scheduleNotification: async (message: string, delay: number) => Promise.resolve(),
};

