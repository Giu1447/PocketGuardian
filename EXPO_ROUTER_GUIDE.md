# PocketGuardian - Expo Router Struktur

## App-Struktur mit Expo Router

### Navigation
Die App verwendet jetzt Expo Router für die Navigation:

```
app/
├── _layout.tsx          # Root Layout mit Service-Initialisierung
├── (tabs)/              # Tab Navigation
│   ├── _layout.tsx      # Tab Layout
│   ├── index.tsx        # Home Screen (Tab 1)
│   └── explore.tsx      # Settings Screen (Tab 2)
├── alert.tsx            # Alert Screen (außerhalb Tabs)
├── camera.tsx           # Camera Screen (außerhalb Tabs)
└── +not-found.tsx       # 404 Page
```

### Screens

#### 1. Home Screen (`app/(tabs)/index.tsx`)
- **Route**: `/` (Standard Tab)
- **Features**:
  - Service-Status-Anzeige
  - Überwachung ein/ausschalten
  - System-Test-Funktionen
  - Button zur Kamera
- **Navigation**: 
  - Alert Screen: `router.push('/alert')`
  - Kamera: `router.push('/camera')`

#### 2. Settings Screen (`app/(tabs)/explore.tsx`)
- **Route**: `/explore` (Settings Tab)
- **Features**:
  - App-Einstellungen (Dark Mode, Auto-Capture)
  - Sensor-Konfiguration
  - Notfallkontakte verwalten
  - Test-E-Mail-Funktion

#### 3. Alert Screen (`app/alert.tsx`)
- **Route**: `/alert?type=motion&timestamp=123456789`
- **Features**:
  - Countdown und automatische Fotoaufnahme
  - Notfall-E-Mail-Versendung
  - Status-Anzeige und Fehlerbehandlung
- **Navigation**: 
  - Zurück: `router.back()` oder `router.replace('/')`

#### 4. Camera Screen (`app/camera.tsx`)
- **Route**: `/camera`
- **Features**:
  - Manuelle Fotoaufnahme
  - Optional als Notfall senden
- **Navigation**:
  - Alert Screen: `router.push('/alert')`
  - Zurück: `router.back()`

### Parameter-Übergabe

#### Alert Screen
```typescript
router.push({
  pathname: '/alert',
  params: {
    type: 'motion' | 'manual',
    timestamp: string
  }
});
```

#### Empfangen der Parameter
```typescript
const params = useLocalSearchParams();
const type = params.type as 'motion' | 'manual';
const timestamp = parseInt(params.timestamp as string);
```

### Services Integration
Alle bestehenden Services aus `src/services/` sind vollständig integriert:
- Email Service (E-Mail-Versendung)
- Emergency Service (Notfall-Prozeduren)
- Camera Service (Kamera-Berechtigung)
- Sensor Service (Bewegungserkennung)
- Notification Service (Push-Benachrichtigungen)
- Background Task Service (Hintergrund-Überwachung)

### E-Mail-Funktionalität
- **Test-E-Mail**: Settings Screen → E-Mail-Button bei Kontakten
- **Notfall-E-Mail**: Automatisch bei Bewegungserkennung via Alert Screen
- **HTML-Templates**: Professionelle E-Mail-Vorlagen mit Styling

### Besonderheiten

#### 1. Tab-Navigation
- **Tab 1**: Home (Hauptfunktionen)
- **Tab 2**: Einstellungen (früher "Explore")

#### 2. Stack-Navigation
- Alert und Camera Screens sind außerhalb der Tabs
- Vollbildschirm-Darstellung für wichtige Aktionen

#### 3. Bewegungserkennung
- Home Screen registriert Bewegung → automatisch zu Alert Screen
- Alert Screen führt Countdown durch → Foto → E-Mail-Versendung

#### 4. Deep Linking
Expo Router unterstützt automatisch Deep Links:
- `pocketguardian://alert?type=motion&timestamp=123456789`
- `pocketguardian://camera`

### Entwicklung & Testing

#### App starten
```bash
npm start
# oder 
npx expo start
```

#### Plattformen
- **Web**: Drücke 'w' im Terminal
- **iOS**: Drücke 'i' oder scanne QR-Code
- **Android**: Drücke 'a' oder scanne QR-Code

#### Build
```bash
# Development Build
npx expo run:ios
npx expo run:android

# Production Build
eas build --platform all
```

## Vorteile von Expo Router

1. **File-based Routing**: Intuitive Struktur
2. **TypeScript-Integration**: Bessere Type-Sicherheit
3. **Automatic Linking**: Deep Links funktionieren automatisch  
4. **Performance**: Optimierte Bundle-Aufteilung
5. **Developer Experience**: Hot Reload, besseres Debugging

Die App ist jetzt vollständig auf Expo Router umgestellt und alle Features sind verfügbar!
