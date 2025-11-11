# Favicon Setup – Anleitung

## Schritt 1: PNG-Dateien generieren

1. Öffne `generate-favicon-pngs.html` im Browser
2. Die Seite generiert automatisch alle benötigten PNG-Größen
3. Klicke auf "Alle herunterladen" oder lade einzelne Dateien herunter
4. Speichere folgende Dateien im Root-Verzeichnis:
   - `favicon-16x16.png`
   - `favicon-32x32.png`
   - `favicon-180x180.png` (Apple Touch Icon)
   - `favicon-192x192.png` (Android/PWA)
   - `favicon-512x512.png` (PWA)

## Schritt 2: Dateien überprüfen

Stelle sicher, dass folgende Dateien vorhanden sind:

```
/
├── favicon.svg                 ✅ Vorhanden
├── favicon-16x16.png          ⏳ Generieren über HTML-Tool
├── favicon-32x32.png          ⏳ Generieren über HTML-Tool
├── favicon-180x180.png        ⏳ Generieren über HTML-Tool
├── favicon-192x192.png        ⏳ Generieren über HTML-Tool
├── favicon-512x512.png        ⏳ Generieren über HTML-Tool
├── site.webmanifest           ✅ Vorhanden
└── browserconfig.xml          ✅ Vorhanden
```

## Schritt 3: HTML-Links überprüfen

Die notwendigen Links sind bereits in `index.html` eingetragen:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png">
<link rel="manifest" href="/site.webmanifest">
```

## Schritt 4: Browser-Cache leeren

Nach dem Upload:
1. Drücke `Ctrl + Shift + R` (Hard Reload)
2. Oder: DevTools → Application → Clear Storage

## Schritt 5: Testen

### Desktop:
- Chrome: Tab-Icon sollte blau mit weißem "A" sein
- Firefox: Tab-Icon sollte sichtbar sein
- Safari: Tab-Icon sollte sichtbar sein

### Mobile:
- iOS Safari: "Zum Home-Bildschirm hinzufügen" → Icon prüfen
- Android Chrome: "Zum Startbildschirm hinzufügen" → Icon prüfen

## Design-Details

**Farben:**
- Hintergrund: Blau-Gradient (#0066ff → #00ccff)
- Symbol: Weißes "A"
- Akzent: Subtile Tech-Balken unten rechts

**Optimierungen:**
- Klares, großes "A" → auch bei 16×16 lesbar
- Hoher Kontrast (weiß auf blau) → maximale Sichtbarkeit
- Abgerundete Ecken → modernes Design
- Schatten-Filter → mehr Tiefe

## Alternative: Online-Tool

Falls das HTML-Tool nicht funktioniert, nutze:
- https://realfavicongenerator.net/
- Lade `favicon.svg` hoch
- Lade das generierte Paket herunter
