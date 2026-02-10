# ✅ Checkliste für Updates & Deployment

Diese Liste MUSS vor jedem `git push` geprüft werden, um Deployment-Probleme, Caching-Fehler und Bugs zu vermeiden.

## 🛠️ Service Worker & Cache (KRITISCH!)
Der Service Worker (`sw.js`) ist das Herzstück der Offline-Funktionalität. Wenn er nicht aktualisiert wird, sehen Nutzer **alte Versionen** der App, auch nach dem Deployment.

- [ ] **Cache-Version bumpen**: In `sw.js` IMMER die `CACHE_NAME` Variable hochzählen (z.B. `v3` -> `v4`).
- [ ] **Neue Dateien registrieren**: Wurden neue Bilder, CSS- oder JS-Dateien hinzugefügt?
    - Füge sie zum `ASSETS` Array in `sw.js` hinzu.
    - Achte auf korrekte Pfade (z.B. `./styles/games/neues-spiel.css`).
- [ ] **Strategie prüfen**: Für Entwicklung/Beta ist `NetworkFirst` sicherer als `CacheFirst`, um Updates sofort sichtbar zu machen.

## 📱 Mobile & Touch Issues
Da die App als PWA auf Handys läuft:

- [ ] **Hitboxen prüfen**: Haben alle neuen Buttons (`.btn`, `.d-btn`, etc.) ein `::before`/`::after` Pseudo-Element mit mind. 20-30px negativen Margins?
    ```css
    .mein-button { position: relative; }
    .mein-button::before { content: ''; position: absolute; ... }
    ```
- [ ] **Viewport Meta-Tag**: Ist `user-scalable=no` gesetzt, um Zoom-Probleme zu verhindern?

## 🌐 GitHub Pages Deployment
GitHub Pages hostet die Seite oft in einem Unterverzeichnis (z.B. `/Centro/`).

- [ ] **Relative Pfade**:
    - `manifest.json`: Icons und Start-URL sollten relative Pfade nutzen (`./` statt `/`).
    - `index.html`: Ressourcen wie `<script src="js/app.js">` (ohne führenden Slash) einbinden.
    - **Service Worker Registrierung**: MUSS `./sw.js` sein, NICHT `/sw.js`.

## 🧪 Quick Smoke-Test
Bevor gepusht wird, kurz lokal testen:

1.  Öffne die `index.html` im Browser.
2.  Öffne DevTools -> Application -> Service Workers.
3.  Setze "Update on reload" (nur für Dev).
4.  Prüfe Konsole auf Fehler (404 Not Found für Assets?).
