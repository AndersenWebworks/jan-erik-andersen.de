# bildpruefung: messbare Bildfehler statt Augenmaß

Fünf Prüfungen an einer three.js-Szene: Anschnitt, Verdeckung, Bildschirm (Blickwinkel, Anteil am Bild), Füllgrad, Platzierung.
Der Browser misst, Python bewertet. Ausgabe je Prüfung OK / WARNUNG / FEHLER mit Teilname, Zeitpunkt, Format (breit/hochkant) und Zahl.

| Datei | Aufgabe | Neubau-Begriffe? |
|---|---|---|
| `messkern.js` | misst (ES-Modul, importiert nichts; three kommt über den Szenenzugriff herein) | nein |
| `bewertung.py` | Grenzwerte als benannte Konstanten, Bewertung, Zusammenfassung, Selbsttest-Urteil | nein |
| `anbindung-neubau.js` | baut den Szenenzugriff aus `window.__neubau.messung` (Abspieler) und löst Zeitpunkte auf (Einstellungen, Druckflächen) | ja, dünn |
| `../browser.mjs` (`pruefen`, `selbsttest`), `../../bauen.py` (`bild_bewerten`, `selbsttest`) | Aufruf, Ausgabe, Exitcode | ja, dünn |

## Aufruf im Neubau
```
python neubau/bauen.py modernisierung          # Vollbau: Bildprüfung läuft nach der Textprüfung im selben Browserlauf
python neubau/bauen.py pruefen eroeffnung      # nur Browserprüfung (Text und Bild), ohne Blender
python neubau/bauen.py selbsttest eroeffnung   # je Prüfung ein provozierter Fehler muss erkannt werden, danach muss die Messung wieder die alte sein
... --ohne-bildpruefung                        # Bildprüfung auslassen
```
Fehler der Bildprüfung setzen den Exitcode 2, Warnungen erscheinen als `Hinweis: Warnung ...`.

## Deklaration in der Szenendatei: `pruefung.bild`
Liegt in `pruefung` (Browser-Teil, ändert den `form_hash` nicht, also kein Blender-Bau nötig). Alles optional; was fehlt, wird nicht geprüft.
```json
"pruefung": { "bild": {
  "teile":  { "tower": ["T_*"], "tischplatte": ["D_Platte"] },            // Aliase; Namen und Muster (*) von Knoten im glb
  "wichtig": [ { "teil": "tower", "bei": { "breit": ["D5"], "hochkant": ["H5"] }, "grenzen": { "rand": 0.03 } } ],
  "sichtbar": [ { "teil": "name", "bei": [0, 12, 26] }, { "flaeche": "titel", "bei": [0] } ],
  "bildschirme": [ { "name": "Monitor", "nur": "breit", "flaechen": ["m_seite", "m_hero"], "grenzen": { "anteil_min": 0.35 } } ],
  "regeln": [ { "teil": "tower", "unter": "tischplatte", "neben": "tischbein_rechts",
                "front": { "flaeche": "T_Front", "zur": "kamera" }, "aufrecht": "T_Boden" } ]
} }
```
- **`bei`** (Zeitpunkte, lokale Bilder der Szene): Zahl, Anfang des Namens einer Einstellung (`"D4b"`), `"einstellungen"` (alle), oder je Anordnung `{ "breit": [...], "hochkant": [...] }`.
  Vorgaben: `wichtig` alle Einstellungen, `sichtbar` Bild 0 (Startbild), `bildschirme` die `pruefen.bilder` ihrer Druckflächen, `regeln` letztes Bild.
- **`nur`**: Eintrag gilt nur in `breit` oder `hochkant`. **`grenzen`**: überschreibt Grenzwerte dieses Eintrags (Schlüssel in der Tabelle).
- **`wichtig`**: `teil` (Alias/Knoten/Muster, auch Liste). Alle sichtbaren Netze des Teils (ohne Bau-Linien, Schiene) müssen mit Rand im Bild liegen.
- **`sichtbar`**: `teil` (Knoten; Messpunkte nach Fläche verteilt, nur kamerazugewandte) oder `flaeche` (Druckfläche; Messpunkte entlang der Textzeilen). Strahl Kamera zu Messpunkt; getroffen wird jede sichtbare, nicht durchsichtige Geometrie außer dem Ziel selbst, Bau-Linien, Schiene, Boden, Himmel. `ignorieren: [Teile]` nimmt weitere aus.
- **`bildschirme`**: `flaechen` (Druckflächen; die erste gibt Lage und Normale vor, alle zusammen den Inhalt). Winkel zwischen Sichtlinie zur Mitte und Normale der Vorderseite, Anteil der Fläche am Bild (am Bildrand gekappt), Füllgrad aus den gezeichneten Ebenen. `"fuellung": false` lässt den Füllgrad aus (Flächen ohne Seitenanspruch). Füllgrad zählt nur Zeitpunkte, an denen alle Ebenen eingeblendet sind.
- **`regeln`** (Szenenkoordinaten x rechts, y Tiefe, z oben; Zeitpunkt wie `bei`): `unter`, `auf`, `innerhalb`, `neben` (+ `grenzen.abstand: [min, max]`), `links_von`, `rechts_von`, `vor`, `hinter` (Bezug: Alias/Knoten); `front: { flaeche, zur }` (Knoten der Frontplatte; `zur` = `"kamera"` oder Vektor `[x,y,z]`; Abweichung des Azimuts); `aufrecht` (Knoten der Bodenplatte: ihre Normale muss senkrecht stehen und die Platte unten liegen). Teile als Achsen-Quader der Netze, Platten über die Hauptachsen der Punktwolke.

## Grenzwerte (`bewertung.py`, Schlüssel in `grenzen`)
| Konstante | Wert | Schlüssel | Urteil |
|---|---|---|---|
| `ANSCHNITT_RAND_MIN` | 3 % der Bildkante | `rand` | darunter FEHLER (ragt hinaus: Überstand wird genannt); WARNUNG bis + `ANSCHNITT_WARN_ZUSCHLAG` 1,5 % |
| `VERDECKUNG_FEHLER` | 2 % der sichtbaren Messpunkte | `verdeckt_max` | ab da FEHLER, darunter jeder verdeckte Punkt WARNUNG; weniger als `VERDECKUNG_PUNKTE_MIN` 8 Punkte im Bild: FEHLER (nicht beurteilbar) |
| `BLICKWINKEL_MAX` | 25 Grad | `winkel_max` | darüber FEHLER, ab Grenze minus 3 Grad WARNUNG; Rückseite im Blick: FEHLER |
| `BILDSCHIRM_ANTEIL_MIN` | 10 % des Bildes | `anteil_min` | darunter FEHLER, bis + 2 % WARNUNG |
| `FUELLGRAD_MIN` | 70 % der Fläche | `fuell_min` | darunter FEHLER, bis + 5 % WARNUNG |
| `PLATZ_TOL`, `PLATZ_UEBERLAPPUNG_MIN`, `PLATZ_NEBEN_MAX` | 0,02 Einheiten, 90 %, 0,6 | `toleranz`, `ueberlappung_min`, `abstand` | Regel verletzt: FEHLER |
| `FRONT_TOL_GRAD`, `AUFRECHT_TOL_GRAD` | 10, 3 Grad | `front_toleranz`, `aufrecht_toleranz` | FEHLER |

Messparameter (keine Grenzwerte) stehen als `MESS` oben in `messkern.js`: Messpunkte der Verdeckung (400), Raster des Füllgrads (320 Spalten), Farbabstand zum Hintergrund (12 von 255), Lücke, die noch als gefüllt gilt (4 % der Breite: Absatzabstände und Ränder um Blöcke zählen mit; sonst wäre jede Textseite „leer“). Der Füllgrad wird aus den gezeichneten Ebenen gerechnet, nicht aus dem Bild: unabhängig von Licht und Perspektive.

## Selbsttest
`bauen.py selbsttest <szene>` verdirbt die gebaute Welt im Speicher (nichts auf der Platte): Teil 40 Einheiten aus dem Bild, Platte zwischen Kamera und Ziel, Kamera 60 Grad von der Normale weg, Bildschirminhalt leer, Teil verschoben und gekippt. Jede Messung muss FEHLER ergeben; danach misst ein weiterer Lauf dieselben Zahlen wie vor den Provokationen. Geprüft wird je der erste passende Eintrag der Deklaration.

## Nutzung in einem anderen three.js-Projekt
`messkern.js` und `bewertung.py` kopieren. Ein Szenenzugriff `z` liefert `THREE`, `wurzel`, `kamera`, `stelle(zeit)` (Pflicht), optional `welt`, `name(o)`, `hilfsgeometrie(o)`, `sichtbar(o)`, `flaeche(name)` (Schnittstelle am Kopf von `messkern.js`). Die Deklaration hat dieselben Schlüssel ohne `pruefung.bild`-Hülle, `bei` enthält fertige Zeitpunkte (`{ zeit, name }` oder Zahlen); `const r = await messen(z, deklaration)`, dann in Python `bewertung.bewerte(r, "format")`. Szenen, die im Code gebaut sind, brauchen nur `wurzel` (Gruppe mit benannten Teilen), `kamera` und ein `stelle`, das Animation und Kamera setzt und `updateMatrixWorld(true)` aufruft. `anbindung-neubau.js` ist das Beispiel.

## Grenzen
- Die Messung sitzt in einem Browser (Canvas für den Füllgrad, Raycaster für die Verdeckung); ohne DOM geht nur Anschnitt, Bildschirm, Platzierung, Verdeckung.
- Gemessen wird nur an den deklarierten Zeitpunkten; dazwischen (Kamerafahrt) nicht. Ein Teil kann also zwischen zwei Einstellungen ins Anschneiden geraten.
- Anschnitt, Verdeckung und Platzierung arbeiten auf der Geometrie (Eckpunkte, Strahlen), nicht auf dem gerenderten Bild: Schatten, Nebel, Einblendungen per Shader (Alpha) und Texturen zählen nicht als verdeckend oder sichtbar. Ein noch nicht eingeblendetes Teil gilt als da.
- Verdeckung prüft Messpunkte (400 je Teil, 10 je Textzeile), keine Fläche lückenlos; kleine Verdecker zwischen den Punkten fallen durch. Durchsichtige Materialien (`transparent`) verdecken nie.
- Platzierung rechnet mit Achsen-Quadern in Szenenkoordinaten; gedrehte oder schräge Teile haben dann zu große Quader (`neben`, `unter` werden dabei eher zu streng). Die Hauptachsen-Normale gilt nur für flache Platten.
- Der Blickwinkel gilt für die Sichtlinie zur Bildschirmmitte; am Rand des Bildschirms ist der Winkel größer (bei 25 Grad Mittenwinkel und sehr nahem Bildschirm spürbar).
- Neutralität: die Schlüssel der Deklaration sind deutsch benannt; `T2B` (three y oben nach z oben) ist fest; `bewertung.py` trägt Standardwerte, die für den Neubau gewählt sind (z. B. `BILDSCHIRM_ANTEIL_MIN`); die Aufrufschicht (`browser.mjs`, `bauen.py`) ist Neubau-spezifisch.
