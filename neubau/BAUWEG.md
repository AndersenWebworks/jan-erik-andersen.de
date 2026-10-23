# Bauweg des Neubaus

Drei Schichten, damit kleine Änderungen keinen Blender-Lauf brauchen.

1. **Szenendatei** `neubau/szenen/<szene>.json`: einzige Quelle für alle Inhaltswerte.
2. **Blender** (`blender/<szene>.py`, gemeinsame Basis `blender/basis.py`, `blender/szene.py`): baut Form, Animation, Kamera und exportiert glb. Text druckt Blender nicht; es legt benannte, leere Druckflächen an (`druck:titel`, `druck:lesestelle`, Kind des Trägers, mit UV; Maße `w`/`h` und Name in den Node-Extras `neubau`).
3. **Browser** (`seite/abspieler.js`): liest `assets/<szene>.szene.json`, zeichnet den Text mit Canvas (Schriften Newsreader / Schibsted Grotesk aus `seite/schriften/`, Auflösung nach `devicePixelRatio`, Mipmaps, Anisotropie), legt ihn als Textur auf die Druckflächen und blendet ihn zum genannten Zeitpunkt ein. Setzt außerdem Versatz/Drehung der Gegenstände neu und prüft den Text.

## Befehle (python ist `python`)

```
python neubau/bauen.py modernisierung              # Vollbau: Blender breit+hochkant (parallel), glb, Prüfungen, Blender-Probebilder, Browserprüfung
python neubau/bauen.py modernisierung --nur-text   # ohne Blender: Szenendatei -> seite/assets, HTML-Text, Browserprüfung
python neubau/bauen.py pruefen modernisierung      # nur Browserprüfung
```
Optionen: `--ohne-proben`, `--bilder` (Browser-Bilder p=0.15/0.4/0.7/0.95 nach `proben/<szene>/browser/`), `--trotzdem` (`--nur-text` trotz geänderter Form). Am Ende steht eine kurze Zusammenfassung; Exitcode 0 = ok, 2 = Prüfung fehlgeschlagen, 3 = Blender nötig.
Einzelwerkzeug: `node neubau/werkzeug/browser.mjs bilder|pruefen ...` (playwright-core aus einem vorhandenen `node_modules`, Edge/Chrome; kurzer lokaler Server nur für die Dauer des Laufs). Ankerlink der Seite: `index.html#p=0.4` setzt den Fortschritt.
Blender-Probebilder liegen in `proben/<szene>/blender/` (nur Form und Bewegung, ohne Text), Browserbilder in `proben/<szene>/browser/`.

## Aufbau der Szenendatei

| Schlüssel | Inhalt |
|---|---|
| `bilder`, `bogen` | Länge in Bildern, Papierbogen |
| `gegenstaende.<name>` | `form` (Maße), `lage.breit/hochkant`, `versatz` [x,y,z], `drehung_z` (Grad um den Gegenstandsmittelpunkt) |
| `druckflaechen.<name>` | `traeger`, `seite`, `grund`, `aufloesung` (px je Einheit bei dpr 1), `einblenden` [von, bis] oder null, `elemente` (Text, Absätze, Linien; Maße in Einheiten der Fläche, von oben links), `rahmen` (Textblock, nur zum Rahmen der Kamera), `pruefen.bilder` (Prüfbilder) |
| `zeiten`, `bloecke` | Zeitpunkte von Konstruktion, Aufklappen, Umlegen, Lesen; Blöcke (alte Lage, Zeitfenster, Schweben/Anheben) |
| `faden` | Stützpunkte je Ausrichtung, Verlauf des Punkts |
| `kamera.breit/hochkant` | `vfov`, `aspekt`, Einstellungsliste (`von`, `bis`, `neigung`, `gier`, `rand`, `rahmt`) |
| `eingang`, `ausgang` | je Ausrichtung: Fadenpunkt `punkt` [x,y], `richtung_grad` (0 = nach +y, 90 = nach +x) und Kamera-Pose (`ort`, `neigung`, `gier`, `vfov`, `verschiebung`) |
| `pruefung` | `min_em_px` (16) |

## Was ohne Blender geht (`--nur-text`)

- Text, Sätze, Schrift, Größe, Zeilenabstand, Linien in den Druckflächen, `einblenden`, `aufloesung`, `pruefen`
- Versatz und Drehung (`versatz`, `drehung_z`) der Gegenstände `alter_monitor`, `neuer_monitor`, `titelkarte`: der Abspieler setzt die Gruppenknoten neu; die wandernden Blöcke folgen (Start dem alten, Ende dem neuen Gerät; dazwischen linear nach dem Zeitfenster des Blocks).

Grenzen dieser Browser-Übernahme: Kamera bleibt wie gebaut (große Versätze können Teile aus dem Bild schieben, der Gegenstand liegt dann nicht mehr im gerahmten Ausschnitt); Bau-Linien (Schnitt, Raster, Gerüst) und Faden bleiben an der alten Stelle; Kollisionen werden nicht neu geprüft; die Blockbahn zwischen den Enden ist nur genähert (Enden exakt). Gedacht für Verschiebungen im Bereich von Zehntel-Einheiten und wenige Grad. Dann Vollbau.

## Was Blender braucht

Alles andere: Maße, Lagen (`form`, `lage`), Zeiten, Blöcke, Faden, Kamera, Träger der Druckflächen, `rahmen`. `bauen.py` merkt das selbst: `form_hash` (Szenendatei ohne die Browser-Teile, siehe `blender/szene.py`) wird mit dem des letzten Baus (`assets/<szene>.bau.json`) verglichen; bei Abweichung bricht `--nur-text` mit Hinweis ab.

## Textprüfung im Browser

`window.__neubau.pruefeText(fläche, bild)` an den Lesestellen, breit 1440x900 und hochkant 390x844 (dpr 2): je Zeile Geviert in CSS-Pixeln (Versalhöhe / 0,72) >= `min_em_px`, 10 Punkte je Zeile im Bild, nicht verdeckt (Strahl von der Kamera trifft zuerst die Fläche), Zeile liegt auf der Fläche, Text gezeichnet und eingeblendet, Schriften geladen. Der Zeilenumbruch kommt aus der Browser-Schrift (mit Kerning); `breite` der Lesestelle ist so gewählt, dass der Umbruch dem früheren Rasterdruck gleicht.

## Eingang und Ausgang

Jede Szene legt in `eingang`/`ausgang` fest, wo der Faden mit dem roten Punkt beginnt und endet (Punkt, Richtung) und wo die Kamera dann steht (Pose, Bild 0 bzw. letztes Bild). Der Vollbau schreibt die gebauten Werte in die glb-Extras (`uebergang`) und warnt, wenn sie von der Szenendatei um mehr als 0,06 abweichen. Ein späterer Übergang verbindet den Ausgang einer Szene mit dem Eingang der nächsten (Faden fortsetzen, Kamera von der einen Pose in die andere fahren); die Werte beider Szenen müssen dann übereinstimmen.
