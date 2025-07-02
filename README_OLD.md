# 🛡️ PocketGuardian

Eine intelligente React Native Expo-App für automatische Sicherheitsfotografie bei Bewegungserkennung.

## 📋 Funktionen

### Kernfunktionen
- **📱 Bewegungserkennung**: Automatische Erkennung unerwarteter Gerätebewegungen
- **📸 Automatische Aufnahme**: Sofortige Fotoaufnahme bei erkannter Bewegung
- **📧 E-Mail-Benachrichtigungen**: Automatische E-Mail-Versendung an Notfallkontakte
- **📱 SMS-Benachrichtigungen**: SMS-Versendung an Notfallkontakte (simuliert)
- **🌙 Dark Mode**: Vollständige Dark/Light Mode Unterstützung
- **⚙️ Anpassbare Einstellungen**: Konfigurierbare Sensor-Empfindlichkeit

### ✨ Neue E-Mail-Funktionen
- **✉️ Notfall-E-Mails**: Automatische E-Mail-Versendung mit Foto-Anhang
- **🧪 Test-E-Mails**: Test-Funktion für Notfallkontakte
- **📧 HTML-E-Mails**: Professionell formatierte E-Mail-Templates
- **📍 Standort-Information**: GPS-Koordinaten in Notfall-E-Mails (falls verfügbar)
- **⏰ Zeitstempel**: Genaue Zeitangaben für alle Notfall-Events
- **Dark Mode Support** mit angepassten Themes
- **Cross-Platform** für Android & iOS optimiert

## 🏗️ Projektstruktur

```
src/
├── components/          # Wiederverwendbare UI-Komponenten
├── screens/            # App-Bildschirme (Home, Settings, Alert, Camera)
├── services/           # Business Logic Services
│   ├── sensorService.ts      # Bewegungserkennung
│   ├── cameraService.ts      # Kamerasteuerung
│   ├── notificationService.ts # Push-Benachrichtigungen
│   ├── emergencyService.ts   # Notfallkontakte
│   └── backgroundTaskService.ts # Hintergrund-Tasks
├── navigation/         # React Navigation Setup
├── theme/             # Dark Mode & Theming
├── types/             # TypeScript Definitionen
└── utils/             # Utility-Funktionen
```

## 🚀 Installation & Setup

### Voraussetzungen

- Node.js (v16 oder höher)
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (für Android) oder Xcode (für iOS)

### Installation

1. **Projekt klonen/herunterladen**
   ```bash
   cd PocketGuardian
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **App starten**
   ```bash
   npm start
   ```

### Benötigte Berechtigungen

Die App benötigt folgende Berechtigungen:
- **Kamera**: Für automatische Fotoaufnahme
- **Accelerometer**: Für Bewegungserkennung
- **Benachrichtigungen**: Für Alarm-Meldungen
- **Medien-Zugriff**: Zum Speichern der Fotos
- **Hintergrund-Tasks**: Für kontinuierliche Überwachung

## 🔧 Konfiguration

### Sensor-Einstellungen

- **Empfindlichkeit**: Niedrig/Mittel/Hoch
- **Schwellenwerte**: Anpassbar für verschiedene Szenarien
- **Aktivierung**: Ein-/Ausschaltbar

### Notfallkontakte

- Name und Telefonnummer (erforderlich)
- E-Mail-Adresse (optional)
- Mehrere Kontakte möglich

## 📱 Verwendung

### 1. Erste Einrichtung
- Öffne die App und erlaube alle Berechtigungen
- Gehe zu "Einstellungen" und konfiguriere Notfallkontakte
- Passe Sensor-Empfindlichkeit an deine Bedürfnisse an

### 2. Aktivierung
- Gehe zum Home-Screen
- Aktiviere die "Bewegungsüberwachung"
- Die App überwacht nun kontinuierlich Bewegungen

### 3. Bei Bewegungserkennung
- Automatische Benachrichtigung über erkannte Bewegung
- 5-Sekunden Countdown für manuellen Abbruch
- Automatische Fotoaufnahme
- Versand an alle konfigurierten Notfallkontakte

## 🔍 Testing

### System-Test
- Nutze den "System-Test" Button im Home-Screen
- Testet alle Services und Benachrichtigungen
- Prüft Background-Funktionalität

### Bewegungstest
- Aktiviere die Überwachung
- Nutze "Bewegung testen" für Simulation
- Schüttle das Gerät für echte Bewegungserkennung

## 🛠️ Entwicklung

### Services

#### SensorService
```typescript
// Bewegungsüberwachung starten
sensorService.startMonitoring(onMotionDetected);

// Einstellungen aktualisieren
sensorService.updateSettings({
  sensitivity: 'high',
  isEnabled: true
});
```

#### CameraService  
```typescript
// Foto automatisch aufnehmen
const image = await cameraService.capturePhoto();

// Berechtigungen prüfen
const permissions = cameraService.getPermissionStatus();
```

#### EmergencyService
```typescript
// Notfall-Prozedur starten
const result = await emergencyService.executeEmergencyProcedure(
  image, 
  emergencyContacts
);
```

### Theme-System

Dark Mode wird automatisch basierend auf System-Einstellungen aktiviert:

```typescript
const { isDarkMode, toggleTheme } = useAppTheme();
```

## 📦 Build & Deployment

### Development Build
```bash
expo start
```

### Production Build
```bash
# Android
expo build:android

# iOS  
expo build:ios
```

### EAS Build (empfohlen)
```bash
# Einmalig: EAS CLI installieren
npm install -g eas-cli

# Build konfigurieren
eas build:configure

# Build starten
eas build --platform android
eas build --platform ios
```

## 🔒 Sicherheit & Datenschutz

- **Lokale Speicherung**: Alle Fotos werden lokal gespeichert
- **Keine Cloud-Uploads**: Bilder verlassen das Gerät nur über Notfallkontakte
- **Berechtigungen**: Minimale erforderliche Berechtigungen
- **Open Source**: Vollständig transparenter Code

## ⚠️ Bekannte Einschränkungen

- **iOS Background**: Eingeschränkte Hintergrund-Ausführung
- **Batterieoptimierung**: Kann Background-Tasks beeinträchtigen  
- **Sensor-Genauigkeit**: Abhängig von Gerätehardware
- **Netzwerkabhängigkeit**: Notfallversand benötigt Internetverbindung

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne eine Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe `LICENSE` Datei für Details.

## 🆘 Support

Bei Problemen oder Fragen:
- Öffne ein Issue auf GitHub
- Prüfe die Konsolen-Logs für Fehlermeldungen
- Teste mit "System-Test" Funktion

---

**Entwickelt mit ❤️ und React Native Expo**
