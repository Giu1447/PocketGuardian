# PocketGuardian GitHub Setup

## GitHub Repository erstellen und Code hochladen

### 1. GitHub Repository erstellen
- Gehen Sie zu https://github.com
- Klicken Sie auf "+" → "New repository"
- Name: "PocketGuardian"
- Description: "Intelligente React Native Expo App für persönliche Sicherheit mit Dual-Kamera-Notfallerkennung"
- Visibility: Public oder Private (Ihre Wahl)
- ❗ WICHTIG: Lassen Sie alle Checkboxen LEER (README, .gitignore, license)

### 2. Remote hinzufügen und pushen
```powershell
# Ersetzen Sie "IhrUsername" mit Ihrem GitHub-Benutzernamen
git remote add origin https://github.com/IhrUsername/PocketGuardian.git

# Code hochladen
git push -u origin master
```

### 3. Verifizierung
Nach dem Push sollten Sie alle Dateien auf GitHub sehen, einschließlich:
- Professionelle README.md
- MIT License
- Vollständiger Source Code
- Dokumentation (KOMPONENTEN_UEBERSICHT.md, etc.)

### 4. Weitere Befehle für spätere Updates
```powershell
# Neue Änderungen hinzufügen
git add .
git commit -m "Beschreibung der Änderungen"
git push origin master
```

## Repository-Features aktivieren

Nach dem Upload können Sie auf GitHub aktivieren:
- Issues (für Bug-Reports)
- Wiki (für erweiterte Dokumentation)
- Projects (für Projektmanagement)
- Actions (für CI/CD)

## Repository-URL
Nach der Erstellung finden Sie Ihr Repository unter:
https://github.com/IhrUsername/PocketGuardian
