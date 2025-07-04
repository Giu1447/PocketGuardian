/**
 * Gemeinsame Typdefinitionen für die PocketGuardian App
 */

export interface SensorSettings {
  threshold: number;
  isEnabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface AppSettings {
  darkMode: boolean;
  emergencyContacts: EmergencyContact[];
  sensorSettings: SensorSettings;
  autoCapture: boolean;
}

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface CapturedImage {
  uri: string;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  camera?: 'front' | 'back';
}

export interface CapturedVideo {
  uri: string;
  timestamp: number;
  duration: number; // Dauer in Millisekunden
}

export interface EmergencyData {
  frontVideo?: CapturedVideo;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

export type RootStackParamList = {
  MainTabs: undefined;
  Camera: undefined;
  Alert: {
    type: 'motion' | 'manual';
    timestamp: number;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Settings: undefined;
};
