# PocketGuardian - Vollständige Komponenten-Übersicht

## 🏗️ App-Architektur

### 📱 Expo Router Screens (app/)
```
app/
├── _layout.tsx                 # Root Layout mit SafeAreaProvider, Services-Init
├── +not-found.tsx             # 404 Error Screen
├── alert.tsx                  # 🚨 Notfall-Screen (Modal)
├── camera.tsx                 # 📸 Kamera-Screen (Modal)
└── (tabs)/
    ├── _layout.tsx            # Tab Navigation Layout
    ├── index.tsx              # 🏠 Home Screen (Hauptbildschirm)
    └── explore.tsx            # ⚙️ Einstellungen Screen
```

### 🧩 UI-Komponenten (components/)
```
components/
├── Collapsible.tsx            # Ausklappbare Sektion
├── ExternalLink.tsx           # Externe Link-Komponente  
├── HapticTab.tsx              # Tab mit Haptik-Feedback
├── HelloWave.tsx              # Animierte Welle-Komponente
├── ParallaxScrollView.tsx     # Parallax-Scroll-Container
├── ThemedText.tsx             # Theme-aware Text-Komponente
├── ThemedView.tsx             # Theme-aware View-Komponente
└── ui/
    ├── IconSymbol.tsx         # Plattform-spezifische Icons
    ├── IconSymbol.ios.tsx     # iOS-spezifische Icons
    ├── TabBarBackground.tsx   # Tab Bar Hintergrund
    └── TabBarBackground.ios.tsx # iOS Tab Bar Hintergrund
```

### 🔧 Services (src/services/)
```
src/services/
├── index.ts                   # Service-Exports
├── sensorService.ts           # 📱 Sensor & Pocket-Erkennung
├── cameraService.ts           # 📸 Dual-Kamera-Funktionalität
├── emergencyService.ts        # 🚨 Notfall-Prozeduren
├── emailService.ts            # 📧 E-Mail-Versand
├── notificationService.ts     # 🔔 Push-Benachrichtigungen
└── backgroundTaskService.ts   # 🔄 Hintergrund-Tasks
```

### 🎨 Legacy Screens (src/screens/) - Nicht verwendet
```
src/screens/
├── index.ts                   # Screen-Exports
├── HomeScreen.tsx             # Legacy Home (ersetzt durch app/tabs/index.tsx)
├── AlertScreen.tsx            # Legacy Alert (ersetzt durch app/alert.tsx)
├── CameraScreen.tsx           # Legacy Kamera (ersetzt durch app/camera.tsx)
└── SettingsScreen.tsx         # Legacy Settings (ersetzt durch app/tabs/explore.tsx)
```

### 🗂️ Typen & Utilities
```
src/
├── types/
│   └── index.ts               # TypeScript-Typen (SensorSettings, DualCapturedImages, etc.)
├── utils/
│   ├── helpers.ts             # Hilfsfunktionen (formatDate, validation, etc.)
│   ├── testUtils.ts           # Test-Utilities für App-Features
│   └── newFeaturesTestUtils.ts # Test für neue Sensor/Pocket-Features
├── components/
│   ├── index.ts               # Legacy Komponenten-Exports
│   └── StatusIndicator.tsx    # Status-Anzeige-Komponente
└── navigation/
    └── AppNavigation.tsx      # Legacy Navigation (ersetzt durch Expo Router)
```

### ⚙️ Konfiguration & Hooks
```
constants/
└── Colors.ts                  # Farbschema-Definitionen

hooks/
├── useColorScheme.ts          # Color Scheme Hook
├── useColorScheme.web.ts      # Web-spezifischer Color Scheme
└── useThemeColor.ts           # Theme-Farben Hook
```

## 🎯 Hauptkomponenten im Detail

### 🏠 Home Screen (app/(tabs)/index.tsx)
- **Bewegungsüberwachung** Ein/Aus-Schalter
- **Auto-Mode** für Pocket-Erkennung
- **Status-Anzeigen** (Services, Pocket-Status, Sensitivität)
- **Test-Buttons** (Bewegung testen, System-Test, Kamera öffnen)
- **Service-Initialisierung** und Background-Status

### 🚨 Alert Screen (app/alert.tsx)
- **Dual-Kamera-View** (Front & Back parallel)
- **Countdown-Timer** (5 Sekunden)
- **Automatische Fotoaufnahme** bei Countdown-Ende
- **Notfall-Nachrichten-Versand** an alle Kontakte
- **Fehlerbehandlung** gegen App-Abstürze
- **Status-Updates** während Aufnahme und Versand

### 📸 Kamera Screen (app/camera.tsx)
- **Manuelle Dual-Kamera-Aufnahme**
- **Kamera-Ready-Status** Anzeige
- **Foto-Vorschau** der letzten Aufnahmen
- **Galerie-Zugang** Button

### ⚙️ Einstellungen Screen (app/(tabs)/explore.tsx)
- **Notfallkontakte** verwalten (Name, Telefon, E-Mail)
- **Sensor-Einstellungen** (Sensitivität, Schwellenwert)
- **E-Mail-Test** Funktionalität
- **Auto-Capture** Ein/Aus
- **Kontakt hinzufügen/entfernen/bearbeiten**

## 🔧 Services im Detail

### 📱 SensorService
- **Drastisch unsensible Bewegungserkennung** (Threshold: 25.0)
- **Pocket-Erkennung** über Bewegungsmuster
- **Auto-Aktivierung/Deaktivierung** basierend auf Pocket-Status
- **Accelerometer-Management** mit 500ms Update-Intervall
- **Debug-Informationen** und Test-Modi

### 📸 CameraService
- **Dual-Kamera-Aufnahme** (Front + Back parallel)
- **Kamera-Ready-Detection** mit verbessertem Timeout (10s)
- **Fallback-Strategien** wenn eine Kamera ausfällt
- **MediaLibrary-Integration** für Galerie-Speicherung
- **Permissions-Management**

### 🚨 EmergencyService
- **Crash-resistente Notfall-Prozeduren** mit Promise.allSettled
- **Parallele Kontakt-Verarbeitung** ohne Blockierung
- **Multiple Kommunikationswege** (SMS, E-Mail, Bild-Upload)
- **Fallback-Strategien** bei Service-Ausfällen
- **Detaillierte Ergebnis-Berichte**

### 📧 EmailService
- **Expo MailComposer** Integration
- **Dual-Bild-Anhänge** Support
- **HTML-formatierte** Notfall-E-Mails
- **Geräte-Informationen** in E-Mails
- **Verfügbarkeits-Prüfung**

### 🔔 NotificationService
- **Lokale Push-Benachrichtigungen**
- **Hintergrund-Status** Updates
- **Notfall-Benachrichtigungen**
- **Auto-Mode Status** Nachrichten
- **Test-Benachrichtigungen**

### 🔄 BackgroundTaskService
- **Expo Background Fetch** Integration
- **Verbesserte Zuverlässigkeit** mit 30s Intervallen
- **Fehlerbehandlung** und User-Feedback
- **Status-Monitoring** und Auto-Recovery
- **Permissions-Management**

## 🎨 UI-Framework

- **React Native Paper** (Material Design 3)
- **Expo Router** (File-based Navigation)
- **SafeAreaProvider** (iPhone-Optimierung)
- **TypeScript** (Type Safety)
- **Haptik-Feedback** (iOS/Android)

## 📊 Datenfluss

1. **Home Screen** → Service-Initialisierung
2. **SensorService** → Bewegungserkennung → **Alert Screen**
3. **Alert Screen** → **CameraService** → Dual-Aufnahme
4. **EmergencyService** → **EmailService** → Kontakt-Benachrichtigung
5. **BackgroundTaskService** → Kontinuierliche Überwachung
6. **Pocket-Erkennung** → Auto-Aktivierung/Deaktivierung

## 🧪 Test-Components

- **AppTester** (src/utils/testUtils.ts)
- **NewFeaturesTester** (src/utils/newFeaturesTestUtils.ts)
- **Debug-Console** Zugriff über global.AppTester
- **Service Debug-Info** für alle Services verfügbar

Die App verwendet eine **moderne, modulare Architektur** mit klarer Trennung von UI, Business Logic und Services! 🛡️
