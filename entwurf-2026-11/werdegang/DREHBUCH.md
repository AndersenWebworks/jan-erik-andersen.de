# Drehbuch Werdegang (Szene 11/12)

Ordner `entwurf-2026-11/werdegang/`, Zustände `#p=0…1`, Handy `#p=…&w=390&h=844`. Technik aus `entwurf-2026-11/bogen/` (Faltkern `falt.js` unverändert, `kern.js` mit zwei kleinen Änderungen, siehe unten).

## Kernaussage

Acht Stationen von Pixel Arrays (2000) bis Gerwing (seit 2023), neueste oben. Text wörtlich aus `entwurf-2026-10-b-raumtext-2/index.html`, Section `#werdegang` (Überschrift „Werdegang“, acht Listeneinträge mit Jahr, Station und Zusatz).

## Konstrukt: Treppe aus dem Bogen, auf jeder Stufe das Zeichen ihrer Station

Aus dem Bogen klappt eine Treppe mit acht Stufen. Unten steht die älteste Station, oben Gerwing: Die Reihenfolge der Liste (neueste oben) wird zur Höhe. Jede Setzstufe trägt Jahr, Station und Zusatz wörtlich; auf der Trittstufe darüber steht ein kleines Faltzeichen genau dieser Station. Der rote Faden klettert Stufe für Stufe mit und endet bei Gerwing.

Warum eine Treppe und keine Zeitachse: Der Abschnitt ist eine Liste, die von oben nach unten rückwärts in die Zeit läuft. Eine Treppe ordnet sie nach Höhe, ohne Jahreszahlen zu skalieren (die Jahre sind ungleich lang, eine Station hat noch keine Jahre). Sie ist ein Gegenstand, kein Gebäude: keine Wände, kein Dach, nur Stufen mit ihren Seitenwänden.

Warum Zeichen auf den Stufen: Bisher fehlte in allen Fassungen der Bezug auf die konkreten Stationen (Katalog). Jedes Zeichen kommt aus dem Wortlaut seiner Zeile, nichts ist dazugedichtet:

| Stufe | Text (wörtlich) | Zeichen | Begründung aus dem Text |
|---|---|---|---|
| 1 | 2000 bis 2006 · Pixel Arrays · erste Selbstständigkeit | Pixelkachel: stehende Kachel mit einem Mauszeiger aus Pixeln | der Name „Pixel Arrays“ |
| 2 | [Jahre] · Games · QA bei Goodgame Studios und Deep Silver FISHLABS, PahuPahu mit rund 25 Spielprototypen in Flash und Haxe, Gamersunity | Gamepad als ausgeschnittene Silhouette mit Steuerkreuz und Knöpfen | Spiele (QA, Prototypen) |
| 3 | 2007 bis 2010 · HTK Hamburg · Zertifikat Multimedia Design | Urkunde, leicht zurückgelehnt, mit Siegel | „Zertifikat“ |
| 4 | seit 2010 · Freiberufliche Webprojekte · seit 2018 als Andersen Webworks | aufgeklappter Laptop mit Website auf dem Bildschirm | eigene Webprojekte |
| 5 | 2017 · YOOtheme · Support Management | zwei Sprechblasen (Frage, Antwort) | Support |
| 6 | 2017 bis 2023 · Tangram Werbeagentur · Frontend-Entwicklung, unter anderem für Nissen, BIG Arbeitsschutz und EMPORE | Tangram-Quadrat aus sieben Teilen | der Name „Tangram“ |
| 7 | 2023 bis 2025 · Runden Group über RPLC · WBG Pooling und weitere Websites und Anwendungen | zwei gestaffelte Browserfenster | „Websites und Anwendungen“ |
| 8 | seit 2023 · Gerwing · Umsetzung und laufende Betreuung des Onlineshops | Palette mit Pflastersteinen, daneben der Shop als kleiner Bildschirm | Pflaster aus dem Gerwing-Abschnitt, „Onlineshop“ |

Satz für Satz am Bauteil: Überschrift „Werdegang“ steht als Lettern rechts vorn neben der Treppe aus dem Bogen auf (wie der Name in der Eröffnung) und blendet aus, während die Kamera in den Überblick steigt (b 0,06–0,09), bevor sie aus dem Bildrand liefe; so liegt sie nie vor oder halb hinter Text. Jede Zeile der Liste steht auf ihrer Setzstufe, linksbündig (Desktop) bzw. mit gemeinsamer Kante, breitester Block mittig (Handy); das Zeichen steht rechts daneben auf der Trittstufe (Desktop) bzw. mittig dahinter (Handy).

## Faltplan (Pop-up)

- **Seitenwände (Korrektur nach Sichtprüfung):** keine hohen Wangen mehr (sie ragten oben aus dem Bild und rahmten eine weiße Lücke). Jede Stufe hat zwei Seitenwände in Stufenhöhe, die wie die Setzstufe als innere Lage unter der Platte liegen und mit ihr hochklappen; die Seiten wachsen Stufe für Stufe mit.
- **Stufen als Teleskop:** Stufe k ist eine Platte, die sich um eine Stufenhöhe über die Stufe darunter hebt (Hubknoten). Danach klappt ihre Setzstufe hoch und rastet ein; die Setzstufe liegt in Ruhe als innere Lage unter der Platte (keine eigenen Bastellinien, so kreuzt keine Linie das Zeichen).
- **Zeichen:** liegen in Ruhe flach auf ihrer Trittstufe, klappen nach dem Einrasten der Setzstufe hoch.
- **Mechanik:** Vorspann-Lauf (anfahren, abbremsen, kurz überschwingen, einrasten), Überschwingen Platte 3 %, Setzstufe 3,5 %, Zeichen 5 %.

## Schläge (b = Baufortschritt; Bildschirmhöhen BH gerechnet, Spur 560 vh, also 4,6 BH Scrollweg)

| Schlag | b | BH | Kamera (Desktop / Handy) | Was passiert |
|---|---|---|---|---|
| Start | 0 | 0 | Neigung 14° / 16°, Abstand 10 / 11,8, Überschrift 125 px / 55 px Schriftgröße (em) | „Werdegang“ steht beim Laden aus dem Bogen auf (rund 1 s), Bogen leer |
| Bastellinien | 0–0,104 | 0–0,34 | steigt auf 50° / 56°, Abstand 31 / 34 | Schnitt- und Falzlinien der acht Stufen (ab 0,019) und acht Zeichen (bis 0,104); Überschrift blendet aus |
| Abstieg | 0,1–0,12 | 0,34–0,59 | senkt sich auf 28° / 34°, Abstand 17 / 19, vor die Treppe | Stufe 1 beginnt sich zu heben |
| Stufe k (1–8) | 0,12 + (k−1)·0,095, je 0,095 | erste Lesestelle 0,99, dann alle 0,44–0,45 BH (1,43 / 1,88 / 2,32 / 2,77 / 3,21 / 3,66 / 4,11) | Lesestelle je Setzstufe: Neigung 32° (Desktop und Handy), Gier Desktop von −6° bis −0,4° wandernd; Zusatztext Desktop 19–21 px, Handy 16 px | Platte hebt sich (0–45 % des Fensters), Setzstufe und Seitenwände klappen hoch (38–70 %), Text erscheint (ab 66 %), Zeichen klappt hoch (60–92 %); Lesestelle bei 100 %, der rote Punkt steht dann an der Oberkante der Setzstufe |
| Überblick | 0,93–1 | 4,11–4,6 | zieht sich auf 31 / 40 zurück, 24° / 26°, Gier −30° / −24° | ganze Treppe mit allen acht Zeichen, der Faden liegt bis Gerwing |

Bildaufteilung an den Lesestellen (Korrektur nach Sichtprüfung): Regel „Textträger ganz im Bild (64 px unter dem oberen Rand, 70 px über dem unteren) oder ganz draußen“. Der Text der Stufe steht im oberen Bildteil, der Text der Stufe darunter ganz im Bild über der Entwurfsleiste, die Stufe davor ganz draußen. Die senkrechte Lage (sy) ist je Fensterhöhe aus einer Tabelle interpoliert (Desktop 720–1440 px, Handy 667–915 px), jeweils die Mitte des gerechneten gültigen Bereichs. Waagerecht steht die Stufe mittig (Desktop: Text links, Zeichen rechts; in 4:3-Fenstern bleibt die Textkante drin, das Zeichen darf rechts anschneiden). Blickwinkel auf den Text höchstens rund 36° (Kosinus ≥ 0,81), Text kaum gestaucht. An der Lesestelle sinkt das Bahntempo auf rund ein Drittel (Zeitverzerrung aus `kern.js`), nie auf null.

## Kernänderungen (nur in den Kopien)

- `kern.js`: Vorgabeszene ist der erste Eintrag (vorher fest „a“); `def.thread.lin` lässt den Punkt gleichmäßig laufen (sonst weich), damit er mit den Stufen Schritt hält.
- `falt.js`: Haarkanten, Falz- und Schnittlinien folgen der Bewegung relativ zur eigenen Fläche (`nd.mvo`). Vorher erschienen die Kanten aller Teile auf einer Platte, sobald die Platte sich hob; bei der Teleskop-Treppe hätten dann die verdeckten Setzstufen und die noch liegenden Zeichen ihre Kanten auf der Trittfläche gezeigt und ihre Falzlinien verloren, bevor sie selbst hochklappen.

## Rechnerische Prüfung (`_pruefung/`, nicht im Repo)

- `pruef.mjs`: Faltplan (keine Überlappung von Teilen auf derselben Fläche, keine Schnitt- oder Falzlinie durch ein fremdes Teil), Kollision Setzstufe gegen Platte, Lesestellen (Schriftgröße, Textbox, Zeichen im Bild, Verdeckung) bei 1280 × 900, 1366 × 768, 1920 × 1080, 390 × 844, 360 × 740.
- `bahn.mjs`: ganze Bahn in Schritten von 0,005 p, jeder sichtbare Textträger ganz drin oder ganz draußen, Überschrift nie vor Text. `such.mjs`: Suche der Bildlage, Prüfung an jeder Lesestelle und ±0,01 / ±0,02 p (langsamer Bereich, Bahntempo dort 37–48 % des Höchsttempos).
- `rahmen.mjs`: Lage von Bau und Überschrift in den Fahrtschlüsseln. `faden.mjs`: Zeitpunkt und Lage des roten Punkts, Abstand zur Treppe. `zeichnen.mjs`: alle Canvas-Drucke mit Attrappen-Kontext ausgeführt.
