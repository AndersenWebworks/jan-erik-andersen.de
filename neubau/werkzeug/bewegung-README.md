# bewegung.mjs: Flüssigkeitsprüfung für scrollgesteuerte Animationen

## Zweck
Misst im echten (sichtbaren) Browser mit GPU, ob eine scrollgesteuerte Seite flüssig läuft, und liefert wenige Bilder statt Video,
auf denen man Flackern, Sprünge und verschwindende Teile auf einen Blick sieht. Hintergrund: `requestAnimationFrame`-Zeitstempel finden
Ruckler exakt; Bildschirmaufnahme bei 30 fps findet sie nicht. Es wird nie der Bildschirm aufgenommen, nur Seiteninhalt per Playwright.

## Aufruf
```
node neubau/werkzeug/bewegung.mjs --url http://localhost:8000/index.html --dauer 8 --naehte 0.3,0.62
node neubau/werkzeug/bewegung.mjs --verzeichnis neubau/seite --seite index.html --query nur=eroeffnung
node neubau/werkzeug/bewegung.mjs --verzeichnis neubau/seite --hochkant          # 390x844 @2x, Touch
node neubau/werkzeug/bewegung.mjs --verzeichnis neubau/seite --stoerung 150/500  # Kontrolle: muss FEHLER ergeben
```
Optionen: `--breite --hoehe --dpr --bereich 0.2,0.6 --ausgabe <ordner> --bilder 16 --schritt 0.2 --spalten 4 --kachel 360
--max-naehte 6 --kamera-schritt 1 --ohne-bogen --ohne-kamera --kanal msedge|chrome|chromium`.
Standard-Ausgabe: `neubau/tmp/bewegung/lauf-<zeit>/` mit `bericht.json`, `zeitreihen.json` (ts, Scrollposition, Bild je Frame),
`kamerapfad.json` (falls Schnittstelle da) und `kontaktbogen_<nr>_p<pos>.png`. Rückgabewert: 0 OK, 1 WARNUNG, 2 FEHLER, 3 Werkzeugfehler.

## Ablauf
1. Sichtbares Chromium (Edge/Chrome), eigenes Fenster, `--use-angle=d3d11 --enable-gpu`, Drosselung im Hintergrund aus. Das Fenster darf
   während des Laufs nicht verdeckt oder minimiert werden. GPU-Renderer per `WEBGL_debug_renderer_info` im Bericht; Softwarerenderer
   (SwiftShader/llvmpipe) gibt WARNUNG, die Zahlen sind dann wertlos.
2. Vorwärts- und Rückwärtslauf über die Scrollstrecke, gleichmäßig per `scrollTo` in `requestAnimationFrame` in `--dauer` Sekunden.
   Je Frame: Zeitstempel, Scrollposition p (0..1), falls vorhanden `window.__neubau.bild`. Dazu `longtask`-Beobachter.
   Die ersten 5 Frames je Lauf zählen nicht. Jede Lücke wird einer Scrollposition zugeordnet.
3. Kamerapfad (nur mit Schnittstelle, s. u.): je Bildnummer abgetastet, unabhängig von der Bildrate; Tempo, Beschleunigung, Ruck,
   Drehtempo, Rollwinkel; Tempo- und Drehsprünge (Änderung von Bild zu Bild > 35 % der lokalen Spitze, ±12 Bilder) als Ausreißer.
4. Nähte: `--naehte` oder automatisch Abschnittsgrenzen, größte Kamerasprünge, längste Lücken (ohne Kameradaten: 0.25/0.5/0.75).
   Je Naht ein Kontaktbogen: 16 Bilder in Scrollschritten von 0,2 % der Strecke um die Naht (Mitte rot), jede Kachel beschriftet
   mit p und Bildnummer b. Zusammengesetzt über eine Canvas-Seite in Playwright, keine Fremdpakete.

## Schwellen
| Größe | OK | WARNUNG | FEHLER |
|---|---|---|---|
| Median Frame-Abstand | ≤ 17,5 ms | > 17,5 ms | > 33 ms |
| p99 | ≤ 33 ms | > 33 ms | |
| Lücken > 50 ms | 0 | | ≥ 1 |
Lücken > 25 ms und Long Tasks werden gezählt und berichtet, bewerten aber nicht allein. WARNUNG zusätzlich bei Softwarerenderer,
Seitenfehlern, nicht scrollbarer Seite, Kamera-Ausreißern. Das Gesamturteil ist das schlechteste der Läufe.
Die Schwellen stehen oben in `bewegung.mjs` (`SCHWELLE`).

## Kamera: eine durchgehende Fahrt (Neubau)
Für eine Folge aus Szenen und Übergängen (`posen(name, f)` mit `verschiebung`) wertet `kameraAuswerten` zusätzlich aus und meldet Fehler (`KAMERA-FEHLER`, Gesamturteil FEHLER):
- **Kombiniertes Tempo** je Bild = Ort + 0,08 je Grad Drehung + 3 je Bildverschiebung; Fehler, wenn es unter 0,004 je Bild fällt (ausgenommen die ersten und letzten 30 Bilder der ganzen Seite).
- **Ruck-Ausreißer**: dritte Differenz des Kameraorts (Vektor); Fehler, wenn der größte Wert mehr als das Achtfache des 98. Perzentils beträgt (ein Knick der Fahrtrichtung zählt mit).
- **Nähte** (Abschnittsgrenzen): Tempo und Fahrtrichtung links und rechts je über zwei Bilder; Fehler bei mehr als 12 % Tempoabweichung oder mehr als 4 Grad Richtungsknick; berichtet werden außerdem Beschleunigung links/rechts und Drehsprung.
Schwellen: Konstante `KAMERA` oben in `bewegung.mjs`.

## Schnittstelle des Abspielers (Kamera)
Gelesen wird `window.__neubau`: `bild` (aktuelles, nachgezogenes globales Bild), `ziel`, `bilder`, `abschnitte` (Name, start, frames)
und `posen(name, f)` mit `{ ort:[x,y,z], q:[x,y,z,w], rollen_grad, verschiebung }`. Fehlt etwas davon, entfällt der Kamerateil mit Hinweis;
an der Seite wird nichts verändert. Für andere Seiten reicht ein Objekt mit diesen Feldern, `posen` darf die Szene verstellen
(wird erst nach den Messläufen aufgerufen). Stand beim Bau: `posen` im Arbeitsstand von `abspieler.js` warf `ReferenceError: a is not defined`
(Rückgabe `..., a }` ohne Variable `a`); mit `a: A` läuft es.

## Grenzen
- Misst die Hauptthread-/Frame-Zeiten von rAF, nicht die tatsächliche Anzeige: GPU-Ruckler nach dem Rendern, Compositor-Verluste und
  Bildschirm-Tearing sieht rAF nur teilweise. Die Hz-Zahl des Monitors bestimmt die Untergrenze (60 Hz = 16,7 ms).
- Echtes Mausrad/Touch-Trägheit wird nicht nachgebildet (scrollTo je Frame); smooth-scroll-Effekte des Browsers fehlen.
- Läuft nur mit sichtbarem Fenster auf einem Rechner mit GPU; auf Servern ohne Bildschirm nicht sinnvoll.
- Der erste Lauf ist „kalt“ (Shader-Kompilierung, Texturen): Einmal-Ruckler am Anfang sind echt, gehören aber zur Ladephase.
- Kontaktbogen: Seiten mit eigener Nachzieh-Glättung brauchen zwischen Schritten Zeit; das Werkzeug wartet auf `bild ≈ ziel`.
- Die Kameraprüfung bewertet Glätte, nicht Gestaltung; Ausreißer können gewollte harte Schnitte sein.

## Nutzung in anderen Projekten (z. B. A Word From Afar)
Nichts installieren: Werkzeug aufrufen mit `--url` auf den lokalen Dev-Server oder `--verzeichnis` auf den Seitenordner. Playwright
kommt aus `PLAYWRIGHT_PFAD` (Ordner `node_modules` mit `playwright-core`) oder aus `C:/Andersen/Privat/Pa/node_modules`. Die Seite braucht
nur Scrollhöhe. Mit `--naehte` die Stellen der Kapitelwechsel angeben; wer die Kameraschnittstelle (oben) bereitstellt, bekommt
Tempo-/Ruckwerte und automatisch gewählte Nähte. Datei einfach kopieren, sie hängt an nichts im Neubau außer dem Standardpfad der Ausgabe
(`--ausgabe` setzen).
