# Kameradrehbuch Gerwing (Bogen + Bastellinien)

Stand 22.10.2026. Erst als Plan geschrieben, dann gebaut und rechnerisch nachgeprüft (Projektion in Node, Prüfskripte in `tmp/gerwing/`, nicht im Repo). Alle Zahlen unten sind die nachgerechneten Werte des gebauten Stands. Keine Browser-Prüfbilder, die Sichtprüfung steht noch aus.

## Aussage und Kette

Kernaussage: Pflaster nach Fläche bestellen; der Shop rechnet m² in ganze Steine, Gewicht und Fracht nach PLZ und leitet an den Händler weiter.
Eine Kette auf einem Bogen, von links nach rechts gelesen. Die Kamera blickt durchgehend leicht nach rechts (Gier −4° bis −20°) und wechselt nie die Richtung.

| Teil | Bauteil | Satz (wörtlich, Seitentext aus dem Fließtext-Test) |
|---|---|---|
| 1 | Wand mit Überschrift, liegt anfangs flach im Bogen (Anschluss an den Anriss der Eröffnung), steht auf und rastet ein | Kennzeile „Gerwing · WooCommerce · seit 2023“, Überschrift „Pflaster nach Fläche bestellen“, darunter Satz 1 |
| 2 | Kontur der Fläche mit Eckmarken, davor flach gedruckt | „Kunden geben ihre Quadratmeter ein,“ |
| 3 | Ganze Steine (0,6 × 0,3, Verhältnis 25 × 15 cm wie im Shop) im Läuferverband, Reihe für Reihe; die letzte Reihe ragt eine halbe Steinbreite über die Kontur | auf den Stirnkanten der vordersten Reihe: „der Shop rechnet sie in ganze Steine um,“ |
| 4 | Terrasse mit Plattenfugen: Platte hebt sich, Wände schwenken herab, Treppe faltet sich Stufe für Stufe aus der Vorderkante | – (Satz 1 nennt Terrassenplatten und Stufen) |
| 5 | Steinstapel auf Palette mit Lattung: Wände stehen auf, Deckel (oberste Lage) schließt | ohne Rand auf der obersten Lage: „ermittelt Gewicht und Fracht nach Postleitzahl“ |
| 6 | Rote Linie mit Punkt über eine Weiche, Haarlinien zu zwei Händlern, rot zum zuständigen; drei Lagerhallen mit Rolltoren heben sich | über den Toren der zuständigen Halle: „und leitet die Bestellung an den zuständigen Händler weiter.“ |
| 7 | Laptop: Gehäuse hebt sich, Bildschirm klappt auf und zeigt die echte Produktseite (`gerwing-produkt-ausschnitt.jpg`) | auf der Handballenauflage: „Seitdem betreue ich den Shop und entwickle ihn laufend weiter.“ |

Satz 1: „Für Gerwing habe ich 2023 einen WooCommerce-Shop gebaut, der Pflastersteine, Terrassenplatten und Stufen so verkauft, wie man sie bestellt: nach Fläche.“

## Tempo

- Spur 680 vh, Scrollweg 5,8 Bildschirmhöhen (BH) für die ganze Szene.
- Lesestellen bremsen die Bahn auf rund ein Drittel (Zeitverzerrung aus `kern.js`), nie auf null: kleinster Kameraweg 0,10 Welteinheiten je 1 % Scroll (Lesestelle Satz 1), größter 3,5. Bezogen auf den Kameraabstand liegt die schnellste Stelle beim rund 3,2-Fachen der ruhigsten Fahrt (Desktop), am Handy beim 3,5-Fachen.
- Teile: anfahren, abbremsen, Überschwingen 2–6 %, einrasten (`mech` aus dem Vorspann-Test). Setz- und Trittstufe einer Stufe teilen sich ein Zeitfenster (−θ / +θ): die Trittstufen bleiben immer waagerecht, nichts taucht unter den Bogen.

## Bauereignisse (b = Baufortschritt, Scroll in Bildschirmhöhen)

| Ereignis | b | Scroll (BH) |
|---|---|---|
| Wand: Bastellinien | 0–0,03 | 0–0,09 |
| Wand steht auf, rastet ein | 0,03–0,095 | 0,09–0,36 |
| Kontur mit Eckmarken | 0,105–0,15 | 0,45–1,03 |
| Steinlinien Reihe für Reihe | 0,125–0,22 | 0,78–1,56 |
| Zehn Steinreihen heben sich nacheinander | 0,20–0,405 | 1,49–2,06 |
| Terrasse: Bastellinien | 0,37–0,43 | 1,95–2,20 |
| Platte hebt sich | 0,44–0,51 | 2,28–2,59 |
| Wände schwenken herab | 0,48–0,55 | 2,49–2,71 |
| Treppe, vier Stufen (je 0,016 versetzt) | 0,52–0,618 | 2,62–2,92 |
| Palette: Bastellinien | 0,54–0,59 | 2,68–2,84 |
| Palette: Wände, Deckel | 0,59–0,69 | 2,84–3,25 |
| Händler: Bastellinien | 0,66–0,72 | 3,08–3,58 |
| Drei Hallen heben sich | 0,72–0,815 | 3,58–3,95 |
| Weiche und Haarlinien | 0,805–0,845 | 3,92–4,07 |
| Rote Linie mit Punkt | 0,81–0,875 | 3,93–4,30 |
| Laptop: Bastellinien | 0,82–0,87 | 3,97–4,24 |
| Laptop-Gehäuse | 0,875–0,91 | 4,30–4,71 |
| Bildschirm klappt auf, Shopbild | 0,895–0,955 | 4,59–4,97 |

## Schläge (Kamera)

Blickhöhe / Gier / Abstand; Überblicksschläge aus den Teilegrenzen eingepasst (1280 × 900 bzw. 390 × 844), Lesestellen über `readingPose()` aus der Textfläche.

| Schlag | p | Scroll (BH) | b | Desktop | Handy | Bild |
|---|---|---|---|---|---|---|
| 0 Start | 0 | 0 | 0 | 52° / 0° / 11,3 | 54° / 0° / 14,9 | Wand liegt flach, Kennzeile und Überschrift lesbar |
| 1 Wand steht | 0,038 | 0,22 | 0,07 | 22° / −6° / 11,0 | 22° / −4° / 14,2 | Wand rastet ein |
| L1 Satz 1 | 0,105 | 0,61 | 0,115 | 9° / −10° / 11,1 | 10° / −6° / 9,1 | Satz 1 an der Wand, Überschrift darüber |
| L2 Quadratmeter | 0,211 | 1,23 | 0,165 | 58° / −6° / 10,3 | 60° / −4° / 9,0 | Satz 2a vor der Kontur, Steinlinien zeichnen sich |
| 3 Steine | 0,307 | 1,78 | 0,30 | 40° / −8° / 9,2 | 46° / −4° / 12,7 | Reihen rasten ein |
| L3 ganze Steine | 0,385 | 2,24 | 0,435 | 13° / −16° / 5,7 | 14° / −8° / 4,7 | Satz 2b auf den Stirnkanten, rechts die Terrasse im Anriss |
| 4 Terrasse | 0,478 | 2,77 | 0,57 | 30° / −18° / 10,8 | 32° / −12° / 18,0 | Platte oben, Wände herab, Treppe faltet |
| 5 Palette | 0,530 | 3,08 | 0,66 | 32° / −14° / 16,3 | 34° / −10° / 13,0 | Terrasse fertig, Palette schließt |
| L4 Gewicht | 0,607 | 3,52 | 0,715 | 58° / −8° / 9,0 | 60° / −6° / 7,5 | Satz 2c auf dem Deckel |
| 6 Fracht | 0,690 | 4,00 | 0,83 | 40° / −10° / 17,3 | 44° / −6° / 23,7 | Hallen stehen, rote Linie läuft |
| L5 Händler | 0,766 | 4,44 | 0,885 | 11° / −10° / 8,9 | 12° / −6° / 7,3 | Satz 2d an der zuständigen Halle |
| 7 Laptop | 0,847 | 4,92 | 0,945 | 26° / −12° / 7,2 | 28° / −8° / 11,0 | Bildschirm klappt auf |
| L6 Betreuung | 0,914 | 5,30 | 0,985 | 56° / −6° / 7,4 | 58° / −4° / 9,8 | Satz 3 unten, darüber der ganze Bildschirm |
| Endbild | 1 | 5,80 | 1 | 28° / −20° / 19,4 | 34° / −14° / 29,0 | Palette, Weiche, Hallen, Laptop mit Shop; Terrasse links im Hintergrund |

## Nachgerechnet

- **Schriftgröße an den Lesestellen** (senkrecht gemessen, also mit Verkürzung): 1280 × 900: 19,4 / 20,2 / 19,5 / 19,4 / 19,6 / 20,7 px. 1366 × 768: 18,9 / 19,6 / 19,0 / 18,9 / 19,1 / 18,8 px. 1920 × 1080: 20,1–21,5 px. Handy 390 × 844: 15,7–15,9 px. Liegende Drucke werden steiler (56–60°) und 15 % größer angesetzt, damit sie auch verkürzt rund 19–20 px haben (vorher 15 px).
- **Druckfelder** an allen Lesestellen frei (mindestens 16 px seitlich, 56 px oben unter der Kopfzeile, 70 px unten über den Knöpfen), Leserichtung überall links nach rechts und aufrecht.
- **Bildausschnitt:** Wand, Fläche, Palette und Laptop an ihren Lesestellen ganz im Bild (Laptop bei 1280 × 900 von 72 bis 834 px, bei 1366 × 768 von 61 bis 746 px, am Handy 10 bis 386 px breit). An der Stirnkante der Steine (L3) und an der Halle (L5) sind Nachbarteile seitlich angeschnitten, die lesbare Fläche nicht.
- **Bogen:** keine Überlappung von Teilen in Ruhe, keine Schnitt- oder Falzlinie durch fremde Teile, kein Punkt unter dem Bogen über den ganzen Bau (tiefster Punkt 0,0005). Die Kontur der Fläche liegt gewollt unter den Steinen (die Steine sind aus ihr geschnitten).
- **Kamera** fährt nie durch Bauteile (Umgrenzung + 0,25), tiefste Kamerahöhe 1,6 (1366 × 768) bis 2,1.
- **Textbreiten** mit den eingebetteten Schriften vermessen: alle Drucke passen auf ihre Bauteile (z. B. Überschrift 5,6 auf der Wand von 6,4, Satz 2b 1,41 breit und 0,10 hoch auf 0,12 hoher Stirnkante).

## Offen

- Am Handy sind die Überblicke klein (Hochkantbild nur rund 21° breit): Händler-Überblick Abstand 23,7, Endbild 29. Die Pflasterfläche ist dort schon schmaler und tiefer (6 × 14 statt 9 × 10 Steine); für mehr bräuchte das Handy einen eigenen Faltplan der rechten Hälfte.
- Gewicht und Tempo der Mechanik nur in Bewegung beurteilbar.
