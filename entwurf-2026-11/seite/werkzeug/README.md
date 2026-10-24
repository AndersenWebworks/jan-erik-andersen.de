# Kamera aus Erzähllisten (Beats)

Pro Szene eine kurze Liste: welches Motiv der Punkt in welcher Reihenfolge zeigt. Daraus entstehen die Route des Punktes (`kamera/routen.js`) und die Kamera-Stützstellen (`kamera/<szene>.js`), getrennt für Breitbild (d, 1440x900) und hochkant (n, 390x844). Das Motiv steht ganz im Bild, der Text ist Bildunterschrift, der Punkt steht im Bild.

## Eine Korrektur

1. `werkzeug/beats/<szene>.mjs` öffnen, Zeile ändern (Beispiel unten).
2. Im Seitenordner `entwurf-2026-11/seite/` ausführen:
   `node werkzeug/kamera-bauen.mjs ausserdem` (mehrere: `ausserdem,gestaltung`; alle Szenen mit Beats: `alle`).
3. Ausgabe lesen, Bilder ansehen. Kein Rückbau nötig: der Lauf überschreibt `kamera/<szene>.js` und `kamera/routen.js` (beide sind „ERZEUGT“, nicht von Hand ändern).

Optionen: `--tag name` (Bildpräfix, Standard `nachher`), `--ohne-fotos`, `--nur-fotos`, `--modus d` oder `n` (nur ein Format, Schnelllauf zum Prüfen der Route, rund 20 s). Voraussetzung: Playwright mit Chromium im Projekt (`node_modules/playwright`).

## Aufbau einer Beat-Datei

```js
export default {
  szene: "ausserdem",
  blick: { az: 0, el: 9 },                    // Standardblick: az = von rechts (Grad), el = von oben (Grad); je Beat überschreibbar
  motive: { d: { onkologie: { box: [[-8.3, 0, -2], [-4.3, 4.2, -.7]], text: .13 } }, n: { ... } },   // Boxen in Szenenkoordinaten (vorn = +z); text = kleinste Schrifthöhe
  beats: [
    { zeigt: "onkologie", stop: 1, punkt: { d: [-6.3, .9], n: [-5.55, 1] } },   // Motiv, Nummer der Lesestelle, wo der Punkt stehen soll [x, z]
    { zeigt: ["roehre", "flach"], u: [.12, .23], blick: { el: 24 } }  // ohne stop: Zeitfenster u von Hand (mit punkt: Wegpunkt und Fenster um die Annäherung)
  ],
  faden: { stW: 60, rMin: 2.85, a2: .05 },    // optional: Fadenparameter der Szene (stärkerer Zug zu den Stationen)
  weg: [[x, z, nach-k-Lesestellen, Gewicht]]  // optional: weitere Wegpunkte
};
```

`zeigt` nimmt ein Motiv oder eine Liste (dann zählt die Gesamtbox). Weitere Beat-Felder: `halb` (halbe Fensterbreite in u bei Beats ohne Lesestelle), `gewicht` (Zug eines Wegpunkts, Standard 8), `ohnePunkt: true` oder `{ n: true }` (Punkt darf aus dem Bild laufen, setzt `o: 1`). Nach dem Lauf rückt der Anlauf der Folgeszene hinter den letzten Halt (die Kurve der Folgeszene übernimmt sonst die Kamera). `behalten: true` lässt die vorhandenen Stützstellen des Beats unverändert. Maße der Szene: `node werkzeug/messen.mjs d <szene>` schreibt die Boxen nach `_pruefung/motiv/messung-*.json`, `node werkzeug/zeige.mjs <szene> d` listet sie lokal; `node werkzeug/ueber.mjs` macht eine freie Übersichtsansicht.

## Ausgabe und Bilder

Je Szene und Format: Stationen (Abstand des Fadens zur Station), je Beat Abstand L, Schriftgröße in Pixeln, Zeitfenster. Je Beat und Format ein Bild `_pruefung/motiv/<tag>-<szene>-<nr>-<motiv>-<d|n>.png` mit Zeile „motiv ganz im Bild / ABGESCHNITTEN“, freiem Rand in Prozent, Lage des Punkts und Abweichung Kamera-Ist/Soll (über die echte Kamera der Seite gemessen). Die Bilder sind Prüfmaterial, nicht committen.

## Laufzeit und Schonung

Rund 1 bis 1,5 Minuten je Szene, je Format ein Seitenaufbau. Ein einziger Chromium, auf 12 von 16 Kernen und niedrige Priorität begrenzt; Server und Browser werden am Ende beendet.

## Dateien

`kamera-kern.mjs`: reine Rechnung (Rahmung, Stützstellen), ohne Seitenbezug, auch für andere Projekte nutzbar. `seite-anbindung.mjs`: Server, Browser, Messen, Fotos. `kamera-bauen.mjs`: Seitenregeln und Schreiben der Dateien. `stationen.js` mischt `kamera/routen.js` über die Grundwerte.
