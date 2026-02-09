# Game Development Guide - Centro Console

Dieses Dokument dient als Referenz für die Erstellung neuer Spiele für die Centro Console. Es beschreibt die technische Struktur, die Design-Sprache und die Integrationsregeln.

## 1. Projektstruktur & Dateiorganisation

Jedes Spiel muss modular aufgebaut sein, um eine saubere Trennung vom Hauptsystem zu gewährleisten.

- **Einzelne JS-Datei**: Für einfache Spiele kann eine `[GameName].js` Datei im Ordner `js/games/` erstellt werden.
- **Ordner-Struktur**: Für komplexere Spiele wird ein eigener Ordner unter `js/games/[GameName]/` empfohlen, der folgendes enthalten kann:
  - `game.js` (Logik)
  - `style.css` (Spiel-spezifische Stile)
  - `assets/` (Bilder, Sounds)

## 2. Design Language (Retro-Stil)

Alle Spiele müssen dem konsistenten Retro-Look der Centro Console folgen.

### Visuelle Grundlagen
- **Pixelated Look**: Alles basiert auf einem Grid (Standard: 10px Tiles).
- **Farbpalette**:
  - Hintergrund: `var(--display-bg)` (#c3f0ca)
  - Primär-Elemente (Spieler): `var(--display-text)` (#2d4a35)
  - Gefahren/Gegner: `#ff3333`
  - Belohnungen/Items: `#ffd700`
- **Typografie**:
  - Hauptschriftart: `'Press Start 2P'` (für alles Lesbare).
  - Sekundärschriftart: `'VT323'` (für kleine technische Details).

### UI-Elemente
Jedes Spiel muss folgende Bildschirme/Elemente implementieren:
- **Header**: Immer 20px hoch, `border-bottom: 2px solid var(--display-text)`.
- **Score-Anzeige**: Oben rechts im Header (`SCORE: 000`).
- **Highscore-Anzeige**: Ebenfalls oben rechts, links neben dem Score (`HI: 000`).
- **Game Over Screen**: Ein Overlay (`.rb-overlay` Stil) mit:
  - Text "GAME OVER" in rot (#ff3333).
  - Finaler Score-Anzeige.
  - Blinkender Text "PRESS A TO RESTART".

## 3. Steuerung & Movement

Die Spiele müssen auf die physischen Buttons der Konsole optimiert sein.

- **D-Pad (Up, Down, Left, Right)**: Grid-basiertes Movement. Kontinuierlicher Input muss unterstützt werden (Hold-to-move).
- **A-Button**: Bestätigen, Starten, Springen oder Interagieren.
- **B-Button**: Zurück zum Menü oder Abbrechen.
- **Start-Button**: Pausieren oder sofortiger Rückzug ins Hauptmenü.
- **Keyboard-Fallback**: Pfeiltasten für D-Pad, 'Enter' oder 'Space' für A, 'Escape' oder 'Backspace' für B.

## 4. Technische Implementierung

### Grid-System
```javascript
const tileSize = 10;
const cols = Math.floor(gameAreaWidth / tileSize);
const rows = Math.floor(gameAreaHeight / tileSize);
```

### Rendering
Verwende absolute Positionierung für Spiel-Entitäten innerhalb der `game-area`.
```css
.entity {
    position: absolute;
    width: 10px;
    height: 10px;
}
```

### Integration in die App
- Das Spiel sollte über eine `init()` Funktion verfügen, die vom `app.js` aufgerufen wird.
- Der State (Highscore) sollte über den `storageManager` (in `js/storage.js`) gespeichert werden.

## 5. Checkliste für neue Spiele
- [ ] Eigener Namespace oder Modul-Struktur verwendet.
- [ ] Scanlines-Effekt bleibt sichtbar (Z-Index beachten).
- [ ] Soundeffekte über `audioEngine` (in `js/audio-engine.js`) eingebunden.
- [ ] Highscore wird lokal gespeichert.
- [ ] Responsive Design (funktioniert auf der festen Displaygröße der Konsole).
