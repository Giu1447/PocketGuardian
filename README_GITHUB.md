# 🛡️ PocketGuardian

**Eine intelligente React Native Expo App für persönliche Sicherheit mit Dual-Kamera-Notfallerkennung**

PocketGuardian ist eine innovative Sicherheits-App, die mithilfe von Bewegungssensoren und Dual-Kamera-Technologie automatisch Notfallsituationen erkennt und entsprechende Maßnahmen einleitet.

## ✨ Hauptfeatures

### 🔒 **Intelligente Pocket-Erkennung**
- **Auto-Mode**: Automatische Aktivierung, wenn das Handy in der Tasche ist
- **Bewegungsmuster-Analyse**: Erkennt ohne echten Lichtsensor, ob sich das Gerät in der Tasche befindet
- **Smart-Deaktivierung**: Schaltet sich automatisch ab, wenn das Handy verwendet wird

### 📱 **Dual-Kamera-Notfallsystem**
- **Vorder- und Rückkamera**: Simultane Aufnahme für vollständige Dokumentation
- **Crash-resistente Aufnahme**: Fallback-Mechanismen, falls eine Kamera nicht verfügbar ist
- **Intelligente Kamera-Erkennung**: Automatische Anpassung an verfügbare Hardware

### 🔄 **Extrem unempfindliche Bewegungserkennung**
- **Hochschwelliger Sensor**: Nur kräftiges Schütteln löst Alarm aus (Threshold: 25.0)
- **Strenge Kriterien**: Mehrere Bedingungen müssen gleichzeitig erfüllt sein
- **Cooldown-System**: Verhindert Fehlalarme durch längere Wartezeiten

### 📧 **E-Mail-Notfallsystem**
- **Notfallkontakte**: Verwaltung von E-Mail-Notfallkontakten
- **Automatischer Versand**: Sofortiger E-Mail-Versand mit Foto-Anhängen
- **Test-Funktionalität**: Möglichkeit, das E-Mail-System zu testen

### 🎨 **Modernes UI/UX Design**
- **Material Design 3**: Mit React Native Paper
- **Responsive Design**: Optimiert für verschiedene Bildschirmgrößen
- **SafeArea-Support**: Sichere Darstellung auf allen Geräten
- **Statusanzeigen**: Echtzeitinformationen über alle Systemzustände

## 🏗️ Architektur

### **Modulare Service-Architektur**
```
src/
├── services/           # Core-Services
│   ├── sensorService.ts       # Bewegungssensor & Pocket-Erkennung
│   ├── cameraService.ts       # Dual-Kamera-Management
│   ├── emergencyService.ts    # Notfall-Koordination
│   ├── emailService.ts        # E-Mail-Versand
│   ├── notificationService.ts # Push-Benachrichtigungen
│   └── backgroundTaskService.ts # Background-Tasks
├── components/         # UI-Komponenten
├── screens/           # App-Screens
├── utils/             # Hilfsfunktionen & Tests
└── types/             # TypeScript-Definitionen
```

### **Background-Task-Unterstützung**
- **expo-background-fetch**: Kontinuierliche Überwachung im Hintergrund
- **expo-task-manager**: Effizientes Task-Management
- **Längere Intervalle**: Optimiert für Batterieverbrauch

## 🚀 Installation & Setup

### Voraussetzungen
- Node.js 18+
- Expo CLI
- React Native Development Environment

### Installation
```bash
# Repository klonen
git clone https://github.com/IhrUsername/PocketGuardian.git
cd PocketGuardian

# Dependencies installieren
npm install

# Expo-Entwicklungsserver starten
npx expo start
```

### Entwicklung
```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Web-Version
npx expo start --web
```

## 📱 Unterstützte Plattformen

- ✅ **iOS** (iPhone 6s+)
- ✅ **Android** (API Level 21+)
- ✅ **Expo Go** (für Entwicklung)
- ✅ **Development Builds**

## 🔧 Konfiguration

### Notfallkontakte einrichten
1. App öffnen
2. Zu "Einstellungen" navigieren
3. E-Mail-Kontakte hinzufügen
4. Test-E-Mail versenden zur Überprüfung

### Sensitivität anpassen
- **Auto-Mode**: Für automatische Pocket-Erkennung
- **Bewegungsschwelle**: Vorkonfiguriert für optimale Erkennung
- **Debug-Modus**: Verfügbar für Entwickler

## 🧪 Testing

### Integrierte Test-Tools
```javascript
// Konsolen-Tests verfügbar
global.NewFeaturesTester.testPocketDetection();
global.NewFeaturesTester.testCameraDual();
global.AppTester.testEmergencyFlow();
```

### E-Mail-System testen
- Test-Button in der App verwenden
- Dummy-Fotos werden angehängt
- Überprüfung der Kontakt-Konfiguration

## 📚 Dokumentation

- [`KOMPONENTEN_UEBERSICHT.md`](./KOMPONENTEN_UEBERSICHT.md) - Vollständige Architektur-Dokumentation
- [`NEUE_FEATURES.md`](./NEUE_FEATURES.md) - Feature-Übersicht
- [`UPDATES.md`](./UPDATES.md) - Changelog

## 🔧 Technische Details

### Dependencies
```json
{
  "expo": "~52.0.0",
  "react-native": "0.76.1",
  "expo-router": "~4.0.0",
  "react-native-paper": "^5.12.5",
  "expo-camera": "~16.0.0",
  "expo-sensors": "~14.0.0",
  "expo-mail-composer": "~13.0.0",
  "expo-background-fetch": "~13.0.0",
  "expo-task-manager": "~12.0.0"
}
```

### Schlüssel-Features in der Entwicklung
- **TypeScript**: Vollständige Typsicherheit
- **Expo Router**: File-based Routing
- **React Native Paper**: Material Design 3 UI
- **Modular Architecture**: Saubere Trennung von Concerns

## 🤝 Contributing

1. Fork das Repository
2. Feature-Branch erstellen: `git checkout -b feature/AmazingFeature`
3. Änderungen committen: `git commit -m 'Add AmazingFeature'`
4. Branch pushen: `git push origin feature/AmazingFeature`
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt steht unter der [MIT Lizenz](LICENSE).

## 👨‍💻 Entwicklung

Entwickelt mit ❤️ unter Verwendung von:
- **React Native** mit **Expo**
- **TypeScript** für Typsicherheit
- **React Native Paper** für Material Design
- **Expo Router** für Navigation
- **expo-sensors** für Bewegungserkennung
- **expo-camera** für Dual-Kamera-Support
- **expo-mail-composer** für E-Mail-Integration

## 🆘 Support

Bei Fragen oder Problemen:
- GitHub Issues erstellen
- [Expo-Dokumentation](https://docs.expo.dev) konsultieren
- [React Native Paper Docs](https://reactnativepaper.com) für UI-Komponenten

## 📊 Status

- ✅ **Core-Funktionalität**: Vollständig implementiert
- ✅ **Dual-Kamera-System**: Funktionsfähig mit Fallbacks
- ✅ **Pocket-Erkennung**: Auto-Mode implementiert
- ✅ **E-Mail-Integration**: Voll funktionsfähig
- ✅ **Background-Tasks**: Optimiert für Batterieverbrauch
- ✅ **UI/UX**: Material Design 3 implementiert

---

**⚠️ Wichtiger Hinweis**: Diese App ist für Entwicklungs- und Demonstrationszwecke konzipiert. Für produktive Sicherheitsanwendungen sollten zusätzliche Sicherheitsmaßnahmen und Tests implementiert werden.
