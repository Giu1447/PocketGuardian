/**
 * Utility-Funktionen für die PocketGuardian App
 */

/**
 * Formatiert ein Datum in ein benutzerfreundliches Format
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Formatiert ein Datum für Dateinamen (ohne Sonderzeichen)
 */
export const formatDateForFilename = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toISOString().replace(/[:.]/g, '-').slice(0, -5);
};

/**
 * Berechnet die Magnitude eines 3D-Vektors
 */
export const calculateMagnitude = (x: number, y: number, z: number): number => {
  return Math.sqrt(x * x + y * y + z * z);
};

/**
 * Überprüft, ob eine Bewegung die Schwelle überschreitet
 */
export const isMotionDetected = (
  x: number,
  y: number,
  z: number,
  threshold: number
): boolean => {
  const magnitude = calculateMagnitude(x, y, z);
  // Subtrahiere die Erdbeschleunigung (~9.81) um nur die Bewegung zu messen
  const motionMagnitude = Math.abs(magnitude - 9.81);
  return motionMagnitude > threshold;
};

/**
 * Konvertiert Sensitivity-String zu numerischem Schwellenwert
 */
export const getSensitivityThreshold = (sensitivity: 'low' | 'medium' | 'high'): number => {
  switch (sensitivity) {
    case 'low':
      return 2.0;
    case 'medium':
      return 1.0;
    case 'high':
      return 0.5;
    default:
      return 1.0;
  }
};

/**
 * Validiert eine Telefonnummer (einfache Validierung)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Validiert eine E-Mail-Adresse
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generiert eine eindeutige ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
