# Bauweg des Neubaus

Drei Schichten, damit kleine Änderungen keinen Blender-Lauf brauchen.

1. **Szenendatei** `neubau/szenen/<szene>.json`: einzige Quelle für alle Inhaltswerte.
2. **Blender** (`blender/<szene>.py`, gemeinsame Basis `blender/basis.py`, `blender/szene.py`): baut Form, Animation, Kamera und exportiert glb. Text druckt Blender nicht; es legt benannte, leere Druckflächen an (`druck:titel`, `druck:lesestelle`, Kind des Trägers, mit UV; Maße `w`/`h` und Name in den Node-Extras `neubau`).
3. **Browser** (`seite/abspieler.js`): liest `assets/<szene>.szene.js` (ES-Modul mit `export default`, erzeugt aus der Szenendatei; die Webvorschau liefert keine .json aus), zeichnet den Text mit Canvas (Schriften Newsreader / Schibsted Grotesk aus `seite/schriften/`, Auflösung nach `devicePixelRatio`, Mipmaps, Anisotropie), legt ihn als Textur auf die Druckflächen und blendet ihn zum genannten Zeitpunkt ein. Setzt außerdem Versatz/Drehung der Gegenstände neu und prüft den Text.

## Befehle (python ist `python`)

```
python neubau/bauen.py eroeffnung                  # Vollbau einer Szene (ebenso modernisierung): Blender breit+hochkant (parallel), glb, Prüfungen, Blender-Probebilder, Browserprüfung
python neubau/bauen.py uebergang eroeffnung modernisierung   # Übergangsstück aus Ausgang der ersten und Eingang der zweiten Szene
python neubau/bauen.py seite                       # ganze Seite: alle Szenen aus szenen/folge.json, alle Übergänge dazwischen, assets/folge.js, Prüfungen, Nahtmessung
python neubau/bauen.py seite --nur-neu             # nur, was sich geändert hat (Szenendatei bzw. Tore)
python neubau/bauen.py modernisierung --nur-text   # ohne Blender: Szenendatei -> seite/assets, HTML-Text, Browserprüfung
python neubau/bauen.py pruefen modernisierung      # nur Browserprüfung
python neubau/bauen.py selbsttest eroeffnung        # Selbsttest der Bildprüfungen (je Prüfung ein provozierter Fehler muss erkannt werden)
```
Optionen: `--ohne-bildpruefung` (Anschnitt/Verdeckung/Bildschirm/Füllgrad/Platzierung auslassen), `--ohne-proben`, `--bilder` (Browser-Bilder p=0.15/0.4/0.7/0.95 nach `proben/<szene>/browser/`), `--trotzdem` (`--nur-text` trotz geänderter Form). Am Ende steht eine kurze Zusammenfassung; Exitcode 0 = ok, 2 = Prüfung fehlgeschlagen, 3 = Blender nötig.
Einzelwerkzeug: `node neubau/werkzeug/browser.mjs bilder|pruefen ...` (playwright-core aus einem vorhandenen `node_modules`, Edge/Chrome; kurzer lokaler Server nur für die Dauer des Laufs). Ankerlink der Seite: `index.html#p=0.4` setzt den Fortschritt.
Blender-Probebilder liegen in `proben/<szene>/blender/` (nur Form und Bewegung, ohne Text), Browserbilder in `proben/<szene>/browser/`.

## Aufbau der Szenendatei

| Schlüssel | Inhalt |
|---|---|
| `bilder`, `bogen` | Länge in Bildern, Papierbogen |
| `gegenstaende.<name>` | `form` (Maße), `lage.breit/hochkant`, `versatz` [x,y,z], `drehung_z` (Grad um den Gegenstandsmittelpunkt) |
| `texte` | Wortlaut der Seite als Schlüssel -> Satz (z. B. `ort`, `kern`, `satz1`). Elemente verweisen mit `ref`, der Text steht nur hier |
| `druckflaechen.<name>` | `traeger`, `seite` (`vorn`, `hinten`, `oben`), `grund`, `aufloesung` (px je Einheit bei dpr 1), `einblenden` [von, bis] oder null, `transparent` (Überlagerung mit Alphakanal, erscheint als Ganzes weich; `ebene` ordnet mehrere Überlagerungen übereinander), `nur` (`breit` oder `hochkant`: Fläche gibt es nur in dieser Anordnung), `elemente` (`text`/`absaetze` mit `text` oder `ref`, `rechteck`, `kreis`, `linie`; Maße in Einheiten der Fläche, von oben links; ein Element mit `anordnung` gilt nur dort), `rahmen` (Textblock, nur zum Rahmen der Kamera), `pruefen.bilder` (Prüfbilder) |
| `zeiten`, `bloecke` | Zeitpunkte von Konstruktion, Aufklappen, Umlegen, Lesen; Blöcke (alte Lage, Zeitfenster, Schweben/Anheben) |
| `faden` | Stützpunkte je Ausrichtung, Verlauf des Punkts |
| `kamera.zeitlupe` | `fenster` (Lesestellen als [von, bis] in Bildern), `faktor` (Tempofaktor, 0,22 bis 0,27), `rampe` (Bilder weich hinein und heraus) |
| `kamera.breit/hochkant` | `vfov`, `aspekt`, Stützposen (`bild` = Durchgangsbild, `von`/`bis` = Fenster, in dem der Inhalt im Bild sein muss, `neigung`, `gier`, `rand`, `rahmt`, optional `x_fest`, `z_fest`, `mittel`/`anflug`/`folgt` für Posen, die aus anderen abgeleitet werden) |
| `eingang`, `ausgang` | je Ausrichtung: Fadenpunkt `punkt` [x,y], `richtung_grad` (0 = nach +y, 90 = nach +x), `kamera_tempo` (Tempo der Kamera am Anschluss in Einheiten je Bild, Richtung = Fadenrichtung) und Kamera-Pose (`ort`, `neigung`, `gier`, `vfov`, `verschiebung`) |
| `skizze` | Haarlinien der Seite (`rect`, `line`, `circ`, Einheiten der Anzeige von oben links), die sich vor dem Einschalten auf dem Gerät zeichnen |
| `pruefung` | `min_em_px` (16), `tempo_min`, `bild` (Bildprüfungen: `teile`, `wichtig`, `sichtbar`, `bildschirme`, `regeln`; siehe `werkzeug/bildpruefung/README.md`) |

## Was ohne Blender geht (`--nur-text`)

- Text, Sätze, Schrift, Größe, Zeilenabstand, Linien in den Druckflächen, `einblenden`, `aufloesung`, `pruefen`
- Versatz und Drehung (`versatz`, `drehung_z`) der Gegenstände `alter_monitor`, `neuer_monitor`, `titelkarte`: der Abspieler setzt die Gruppenknoten neu; die wandernden Blöcke folgen (Start dem alten, Ende dem neuen Gerät; dazwischen linear nach dem Zeitfenster des Blocks).

Grenzen dieser Browser-Übernahme: Kamera bleibt wie gebaut (große Versätze können Teile aus dem Bild schieben, der Gegenstand liegt dann nicht mehr im gerahmten Ausschnitt); Bau-Linien (Schnitt, Raster, Gerüst) und Faden bleiben an der alten Stelle; Kollisionen werden nicht neu geprüft; die Blockbahn zwischen den Enden ist nur genähert (Enden exakt). Gedacht für Verschiebungen im Bereich von Zehntel-Einheiten und wenige Grad. Dann Vollbau.

## Was Blender braucht

Alles andere: Maße, Lagen (`form`, `lage`), Zeiten, Blöcke, Faden, Kamera, Träger der Druckflächen, `rahmen`. `bauen.py` merkt das selbst: `form_hash` (Szenendatei ohne die Browser-Teile, siehe `blender/szene.py`) wird mit dem des letzten Baus (`assets/<szene>.bau.json`) verglichen; bei Abweichung bricht `--nur-text` mit Hinweis ab.

## Textprüfung im Browser

`window.__neubau.pruefeText(fläche, bild)` an den Lesestellen, breit 1440x900 und hochkant 390x844 (dpr 2): je Zeile Geviert in CSS-Pixeln (Versalhöhe / 0,72) >= `min_em_px`, 10 Punkte je Zeile im Bild, nicht verdeckt (Strahl von der Kamera trifft zuerst die Fläche), Zeile liegt auf der Fläche, Text gezeichnet und eingeblendet, Schriften geladen. Der Zeilenumbruch kommt aus der Browser-Schrift (mit Kerning); `breite` der Lesestelle ist so gewählt, dass der Umbruch dem früheren Rasterdruck gleicht.

## Eingang und Ausgang

Jede Szene legt in `eingang`/`ausgang` fest, wo der Faden mit dem roten Punkt beginnt und endet (Punkt, Richtung), wo die Kamera dann steht (Pose, Bild 0 bzw. letztes Bild) und mit welchem Tempo sie dort fährt (`kamera_tempo`, entlang der Fadenrichtung, Drehraten 0, Beschleunigung 0). Der Vollbau schreibt die gebauten Werte in die glb-Extras (`uebergang`) und warnt, wenn sie von der Szenendatei um mehr als 0,06 abweichen. Ein späterer Übergang verbindet den Ausgang einer Szene mit dem Eingang der nächsten (Faden fortsetzen, Kamera von der einen Pose in die andere fahren); die Werte beider Szenen müssen dann übereinstimmen.

## Kamera: eine durchgehende Fahrt (`basis.kamerafahrt`)

Die Einstellungen der Szenendatei sind Stützposen, durch die eine einzige Fahrt fließt (kein Halten). Ort, Neigung, Gier und Bildverschiebung laufen als C2-Kurve (kubischer Spline durch die Posen, Parameter = Sehnenlänge im gemischten Raum; Gewicht der Winkel 0,08 je Grad, der Verschiebung 3 je NDC-Einheit, `KAMERA_MASS`). Am Anschluss zum Übergang hat die Kurve eine vorgegebene Tangente (Fadenrichtung) und Beschleunigung 0 (die Randspanne ist ein Quintik-Hermite). Die Zeit läuft über die Bogenlänge: Tempo v(f) = c(f) mal B(f); c = Zeitlupe an den Lesestellen (`kamera.zeitlupe`, weich hinein und heraus, nie null), B = mittleres Tempo je Spanne zwischen den Stützposen, an den Spannengrenzen mit smootherstep überblendet. Die Spannentempi werden iterativ so bestimmt, dass jede Stützpose genau in ihrem Bild erreicht wird; am Seitenanfang läuft die Kamera aus der Ruhe an (smootherstep über 36 Bilder), an Anschlüssen beginnt/endet sie mit `kamera_tempo`. Nie Rollen (nur Neigung und Gier). Regeln beim Entwerfen der Posen: keine Umkehr der Fahrtrichtung (die Fahrt zum Lesen endet entlang der Blickachse, `anflug`), Lesestoff bleibt im Bild, solange die Zeitlupe läuft; die Fahrt am Handy folgt dem Gerät von oben nach unten (`teil`: Anteile der Höhe der Fläche, die gerahmt werden).

Im Baubefehl geprüft (je Anordnung, Blender-Seite): kleinstes Kameratempo (kombiniertes Maß: Ort plus gewichtete Drehung, Grenze `pruefung.tempo_min` = 0,004 je Bild, ohne die ersten 30 Bilder am Seitenanfang), Anschlusstempo gegen die Szenendatei, Ruck-Ausreißer (größter Ruck des Ortsvektors höchstens das Achtfache des 98. Perzentils), Inhalt der Stützposen im Bild. Im Browser (`werkzeug/bewegung.mjs`, siehe README dort): dieselben Größen an der gebauten Welt samt Nähten.

## Konstruktionsphase (`basis.Konstruktion`)

Gleiche Abfolge in jeder Szene, gestrafft: Schnitt (gestrichelte Linie) und Falz (Strich-Punkt-Linie) zeichnen sich auf dem Bogen (Umriss jedes Teils in der flachen Lage), das Raster (Schneidematte) folgt, dann das Gerüst der Bauform im Raum, dann die Bleistiftspur (Eckmarken) auf den Flächen, dann klappt das Teil hoch. Wo ein Teil den Bogen verlässt, bleibt sein Abdruck: der Schnitt wird zu einem dünnen Umriss, die Fläche färbt sich (`flaeche`) und bekommt eine Schraffur (`schraffur`). Bausteine: `gestrichelt`, `schraffur`, `flaeche`, `strich`; `Konstruktion(skala=...)` verbreitert die Striche (am Handy 1,7). Striche sind breit genug für die Entfernung der Übersichtseinstellungen (0,02 bis 0,035 Einheiten, Tinte `#2a3a58`). Die Skizze der Seite zeichnet sich nach `skizze` auf dem Gerät, das sie trägt.

## Mockup (Eröffnung)

**Soll ab 23.10.2026 (Drehbuch, Eröffnung):** Mockup nur auf dem Monitor, in Desktop- und Mobilansicht; das Smartphone in der Szene zeigt keinen Text. Der folgende Absatz beschreibt den gebauten Zwischenstand, der mit dem Neubau der Eröffnung ersetzt wird.

Der Name steht allein als Papierlettern auf dem Bogen (Wortmarke aus `schriften/NewsreaderMarke*.ttf`, gestrichelte Falzlinie darunter). Ortszeile, Kernsatz und die drei Sätze erscheinen als Website auf dem Monitor (Desktop) bzw. auf dem Smartphone, das flach auf dem Tisch liegt (Hochkant, `druckflaeche_oben`). Jede Fläche ist eine durchsichtige Überlagerung auf dem Bildschirm (`m_seite` Rahmen der Seite, `m_hero`, `m_satz1..3`, am Handy `h_*`), die der Browser aus der Szenendatei zeichnet und zum genannten Zeitpunkt weich einblendet; die Textquelle ist nur der Block `texte`. Das Gerät, das den Text nicht trägt, zeigt die Seite ohne Text (Monitor: Platzhalterbalken) bzw. bleibt dunkel (Handy am Desktop).

## Schiene (Faden und Punkt)

Die ganze Bahn des Fadens liegt als flaches Band (Mesh mit Attribut `_s` = Bogenlänge) vorher hellgrau auf dem Papier, in jeder Szene und jedem Übergang. Der Abspieler färbt sie nach dem Scrollfortschritt: hinter dem Punkt rot, davor grau (Uniform `uFill`, exakt am Punkt, ohne Nachlauf, bei Rückwärtsscrollen wieder weniger). Der Füllstand kommt aus `faden_s` (Bogenlänge des Punkts je Bild, Extras der glb); Abschnitte vor dem aktiven sind ganz rot, danach ganz grau. Der Punkt ist nur im aktiven Abschnitt sichtbar. Die Bahn ist ein offener kubischer B-Spline (C2); an den Toren liegen die ersten/letzten drei Kontrollpunkte auf einer Geraden in Torrichtung, die Krümmung ist dort genau 0. Zwei Bahnen mit gleichem Torpunkt und gleicher Richtung gehen damit mit gleicher Richtung und gleicher Krümmung (G2) ineinander über. Szenendatei: `faden.kontrolle.<anordnung>` (Kontrollpunkte zwischen den Toren), `faden.tor_schritt`, `eingang/ausgang.<anordnung>.faden` {punkt, richtung_grad} (Tore; 0 = nach +y, 90 = nach +x). Prüfung im Baubefehl je Bahn: Krümmung an den Toren (<= 0,01), größte Krümmungsänderung (<= 6 je Einheit), kleinster Radius (Fehler < 0,5, Hinweis < 1,5), Wendepunkte (<= 1).

## Übergänge (Generator `blender/uebergang.py`)

Ein Übergang ist ein eigenes glb im Bezugssystem der ersten Szene: `uebergang-<von>-<nach>-<breit|hochkant>.glb`. Eingabe sind nur die gemessenen Tore beider Szenen (`assets/<szene>.bau.json`, Schlüssel `tore`: Fadenpunkt, Richtung, Kamerapose, Hüllrechteck). Dieselbe Regel für jedes Paar (Konstanten `REGEL` im Skript): Szene B steht 34 Einheiten vor dem Ausgang von A in Laufrichtung, 6 nach rechts versetzt, mit derselben Laufrichtung. Daraus entstehen die Schiene als G2-S-Kurve (ein Wendepunkt), die Platzierung von B (`uebergang.ziel`: versatz, drehung_grad, steht in den Extras der glb; der Abspieler setzt B dort ein), ein Streifen Bogen zwischen den Szenen, niedrige weiße Papierblöcke als Füllung (ohne Text, ohne Rot, mit Abstand zur Schiene und zu den Hüllrechtecken der Szenen) und die Kamerafahrt: eine durchgehende Fahrt (siehe oben) durch die Pose am Ausgang von A (Tempo und Richtung wie in A), fünf Posen in Mausperspektive auf der Schiene (Höhe 2,4 bis 4,2 über dem Papier, Blick entlang der Schiene leicht nach unten, Ort stetig vorwärts) und die Pose am Eingang von B (Tempo und Richtung wie in B); Position, Neigung, Gier und Bildverschiebung stetig, auch Tempo und Beschleunigung an den Nähten, nie Rollen. Die Füllblöcke sind höchstens 0,55 hoch und lassen einen Sichtkorridor vor B (20 Einheiten, 6 breit) und hinter A frei, damit der Titel am Eingang unverdeckt bleibt. Der Punkt fährt mit Ruhe an beiden Enden (Szenen verlassen und betreten ihn ebenfalls aus der Ruhe). `bauen.py seite` verbindet die Szenen nach `folge.json` selbst neu: `tore_hash` im Manifest des Übergangs; ändern sich die Tore einer Szene nicht, bleibt der Übergang gültig. Umsortieren in `folge.json` genügt, ein Befehl baut jeden Übergang neu.

## Welt der Folge (Abspieler)

`spieleFolge(buehne, {segmente})`: alle Abschnitte stehen zugleich in einer Welt; ein Abschnitt hat die Kamera (`start`, `frames`), an den Nähten haben beide dieselbe Pose. Boden und Himmelsverlauf folgen der Kamera, der Sonnenschatten folgt dem Blickpunkt (aufs Texelraster gerastet). Anker `#p=0.4` (Anteil der ganzen Folge) oder `#g=860` (globales Bild). `index.html?nur=<szene>` spielt eine einzelne Szene (Prüfung, Entwicklung), sonst die ganze Folge. Werte der Szenendatei können je Anordnung getrennt stehen: `{"breit": 0.27, "hochkant": 0.38}` (Textgröße, Breite, Lage der Druckelemente und Maße der Gegenstände).

## Prüfungen und Messungen

- `node neubau/werkzeug/browser.mjs naht`: Messung an jeder Naht in der gebauten Welt (Kameraort, Drehung, Bildverschiebung, Rollen, Punkt, Schienenpunkt, Richtung und Krümmung links/rechts) und Bilder um die Naht. `bauen.py seite` ruft das auf und meldet Fehler bei Kamerasprung > 0,01 oder Schienensprung > 0,02 / 0,3 Grad.
- `node neubau/werkzeug/browser.mjs bilder --nur <szene> --g 0,100,340 ...`: Bilder an globalen Bildern; `fps`: Bildrate beim gleichmäßigen Scrollen; `node neubau/werkzeug/bewegung.mjs --verzeichnis neubau/seite --naehte 0.45,0.69`: Flüssigkeitsprüfung (Lücken, Kamerapfad).
- Textprüfung: `window.__neubau.pruefeText("<szene>:<fläche>", bild)` (siehe oben); die Ortszeile, der Kernsatz und die drei Sätze der Eröffnung laufen wie alle Sätze über Druckflächen (Mockup auf Monitor bzw. Smartphone). Der Name ist die Ausnahme: Papierlettern (Newsreader-Marke aus `schriften/NewsreaderMarke*.ttf`, erzeugt mit `werkzeug/schriften.py`) als Geometrie auf dem Bogen, weil ein Druck bei flacher Kamera einen Träger (Folie) bräuchte.
- Bausteine in `basis.py`: `bahn_g2`, `schiene`, `faltpanel`, `gefaess`, `zylinder`, `lettern`, `huelle_xy`, `druckflaeche_oben`, `kamerafahrt` (`Kurve`), `Konstruktion.gestrichelt/schraffur/flaeche`; Szenen: `blender/eroeffnung.py`, `blender/modernisierung.py`, `blender/uebergang.py`.
- Farbe: Palette in `basis.PAL` (Bogen `#f4f7fc`, Boden `#c2d1e4`, Dunst `#d4e6fa`, Himmel `#6fa9e6`, Verlauf über `HIMMEL_STEIL`), im glb unter `pal` und `licht`; der Abspieler liest sie von dort.

## Bildprüfungen (Anschnitt, Verdeckung, Bildschirm, Füllgrad, Platzierung)

Messbar statt Augenmaß; `werkzeug/bildpruefung/` (Messkern im Browser, Bewertung in Python, Grenzwerte als benannte Konstanten in `bewertung.py`). Die Szenendatei deklariert in `pruefung.bild`, was wichtig ist, welche Titel/Flächen unverdeckt sein müssen, welche Bildschirme lesbar stehen müssen und wo Teile liegen; geprüft wird für breit und hochkant an den Einstellungen bzw. Lesestellen. Läuft im Browserlauf der Textprüfung mit (+0,1 bis 0,5 s), braucht keinen Blender-Bau (`pruefung` gehört zum Browser-Teil) und setzt bei Fehlern den Exitcode 2. Einzelheiten, Grenzwerte, Deklarationsformat und Grenzen: `werkzeug/bildpruefung/README.md`.
