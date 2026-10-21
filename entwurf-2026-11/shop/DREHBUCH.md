# Shop-Szene „Shops und Shop-Wechsel“ – Kameradrehbuch

Stand 22.10.2026, Entwurf in `entwurf-2026-11/shop/` (eigenständige Seite, Bogen + Bastellinien).
Zustände über `#p=0…1`, Handy-Ausschnitt über `#p=…&w=390&h=844`.

## Text (wörtlich)

Quelle: Absatz „Shops und Shop-Wechsel“ in `entwurf-2026-10-b-raumtext-2/index.html` (Z. 173), gleichlautend in `entwurf-2026-10-b-blatt/index.html` (Z. 131 f.) und allen Fassungen seit `entwurf-2026-10`.

- Überschrift: „Shops und Shop-Wechsel“
- S1: „Ich baue WooCommerce-Shops für Produkte, die in kein Standardformular passen, etwa mit Mengen nach Fläche oder Fracht nach Gewicht und Entfernung.“
- S2: „Wer bei Shopify mit wachsendem Umsatz immer höhere Gebühren zahlt, kann zu WooCommerce wechseln.“
- S3: „Ich rechne vorher durch, ob sich das lohnt, und ziehe Produkte, Kunden und Bestellungen um.“ (zwei Satzteile an zwei Bauteilen)

## Konstrukt: was der Text sagt, was gebaut wird

Ein kleines Lager aus dem Bogen (Vorbild für Modelle und Reihenfolge: `entwurf-2026-10-b-blatt/modelle.js`, „3 Shops und Shop-Wechsel“; dort Draufsicht, hier stehende Pop-up-Regale).

| Text | Bauteil | Was es tut |
|---|---|---|
| Überschrift | Lagerschild auf zwei Stützen hinter den Regalen | liegt beim Start flach und lesbar im Bogen, steht als erstes Teil auf |
| S1 (WooCommerce, kein Standardformular, Fläche, Gewicht, Entfernung) | Regal nach Maß rechts, Satz auf seiner Blende oben | Böden in drei Höhen nach dem Gut: unten schwerer Block mit Gewichtszeichen (Gewicht), Mitte flaches breites Fach mit Plattenstapel (Fläche), oben freier Platz. Daneben auf dem Bogen ein Paket, von dem eine gestrichelte Strecke zu einer Fahne läuft (Entfernung) |
| S2 (Shopify, wachsender Umsatz, immer höhere Gebühren, kann wechseln) | Standardregal links mit gleichförmigen Fächern (3 × 3), Satz auf seiner Blende; links daneben Preisschild und Gebührenstapel | Gebührenstapel wächst während der Lesestelle Stufe für Stufe (vier Säulen, eine nach der anderen) |
| S3a „Ich rechne vorher durch, ob sich das lohnt,“ | Waage vorn in der Mitte (hochkant weiter vorn), Satz auf der Vorderseite ihres Sockels | Waagebalken pendelt während der Lesestelle nach beiden Seiten und kommt waagerecht zur Ruhe, ohne Ergebnis anzudeuten (Entscheidung Clautz, 22.10.2026) |
| S3b „und ziehe Produkte, Kunden und Bestellungen um.“ | Brücke zwischen den Regalen, Satz auf ihrer Blende | drei Pakete (Zeichen: Produkt, Kunde, Bestellliste) fahren als Zug aus dem Standardregal über die Brücke ins Regal nach Maß und rasten ein; an der Lesestelle stehen alle drei mittig auf und an der Brücke; im Standardregal bleibt ihr Abdruck |

Kein Gerät mit Shopbild: Der Absatz nennt keinen bestimmten Shop (das Gerwing-Bild gehört zum Gerwing-Abschnitt).

## Bauphasen (Baufortschritt b) und Scrollstelle

Scrollstelle in Bildschirmhöhen (BH) ab Seitenanfang, gerechnet mit `_pruefung/tempo.mjs` (Spur 620 vh, also 5,2 BH Scrollweg; gleich für Desktop und Handy).

| b | BH | Was passiert |
|---|---|---|
| 0 | 0 | blanker Bogen, Überschrift liegt flach gedruckt auf dem Schild |
| 0 – 0,18 | 0 – 0,40 | Bastellinien: Schnitt (durchgezogen) und Falz (gestrichelt), Teil für Teil von hinten nach vorn |
| 0,18 – 0,26 | 0,40 – 0,70 | Lagerschild steht auf (Überschwingen 0,03) |
| 0,24 – 0,32 | 0,62 – 1,16 | Regale: alle Böden heben sich gemeinsam wie eine Ziehharmonika (Überschwingen 0,02), Standardregal zuerst, Regal nach Maß 0,03 später |
| 0,29 – 0,43 | 0,9 – 1,6 | Leisten, Stützen schwenken herab (erst wenn der obere Boden steht, rechnerisch nie unter dem Bogen), Fachteiler stehen auf, Brücke hebt sich, Blenden stehen auf |
| 0,36 – 0,45 | 1,3 – 1,7 | Sockel der Waage hebt sich, Waage steht auf; Pakete falten sich aus dem obersten Boden des Standardregals |
| 0,44 – 0,53 | 1,7 – 2,2 | Inhalt Regal nach Maß (schwerer Block, Plattenstapel), Paket, Strecke, Fahne; S1 erscheint bei 0,47 (1,93 BH) |
| 0,52 – 0,68 | 2,1 – 3,5 | Preisschild; Gebührenstapel Stufe für Stufe ab 0,575 (2,88 BH), fertig 0,68 (3,51 BH); S2 erscheint bei 0,55 |
| 0,70 – 0,80 | 3,59 – 4,21 | Waage pendelt (erst rund 6° zur einen, dann rund 2° zur anderen Seite) und kommt waagerecht zur Ruhe; S3a erscheint bei 0,69 |
| 0,866 – 0,956 | 4,5 – 5,05 | die drei Pakete fahren gemeinsam über die Brücke und rasten ein (bei b 0,9 mittig auf der Brücke); S3b erscheint bei 0,82 |

## Kamera (gerechnet)

Sichtfeld Breitbild 32°, hochkant 44° (wie Eröffnung C). Kein Lock; die Zeitverzerrung des Kerns senkt das Tempo an Lesestellen auf 0,34 des Mittels, nie auf null. Bildfluss (Verschiebung relativ zum Abstand plus Drehung) Desktop 7,8 bis 193 °/BH, Handy 7,4 bis 278 °/BH (Spitzen beim Zurückziehen aus dem Startbild und beim Anflug auf S1).

| Schlag | BH | b | Desktop 1280 × 900: Blickhöhe, Gier, Abstand | Handy 390 × 844 | Was man sieht |
|---|---|---|---|---|---|
| Start | 0 | 0 | 55°, 0°, 13,0; Überschrift flach 564 × 49 px | 55°, 0°, 14,5; 336 × 29 px | Anriss: die Überschrift im Bogen |
| Bastellinien | 0,39 | 0,18 | 59°, 0°, 22,6 (alle Teile 70 bis 810 px) | 59°, 0°, 29,1 | Linien zeichnen sich |
| Lesestelle Überschrift | 1,05 | 0,31 | `readingPose()`, Neigung 22°, Überschrift 29 px oben im Bild, Abstand 22,0 | Neigung 22°, 24 px, Abstand 18,3 | Schild steht, Regale fahren hoch |
| Aufbau fertig | 1,71 | 0,45 | 22°, −9°, 18,7 (ganzes Lager 30 bis 1250 px) | 20°, −6°, 15,7 (Regal nach Maß und Brücke) | Lager steht |
| S1 | 2,43 | 0,50 | Neigung 14°, Gier −8°, Text links (sx −0,45) und oben, 19,9 px, Abstand 9,5 | 14°, 0°, 16,4 px, Abstand 7,8 | Regal nach Maß, Paket, Strecke, Fahne |
| S2 | 3,22 | 0,64 | Neigung 14°, Gier +10°, Text rechts (sx +0,2), 19,9 px | 14°, 0°, 16,4 px | Gebührenstapel wächst (Handy: Stapel vor dem Regal) |
| S3a | 3,95 | 0,76 | Neigung 18°, Text unten (sy −0,5), 19,8 px, Abstand 8,7 | 18°, 16,0 px | Waage pendelt über dem Text |
| S3b | 4,67 | 0,90 | Neigung 15°, Text unter der Mitte, 19,8 px, Abstand 9,1; Pakete von 29 bis 1264 px | 16°, 15,9 px | Pakete fahren von links nach rechts |
| Schluss | 5,2 | 1 | 24°, +5°, 19,0 | 26°, +3°, 28,1 | fertiges Lager |

Weitere Fenster: 1366 × 768 Lesestellen 19,2 bis 19,4 px, 1920 × 1080 20,5 px. Alle Textblöcke liegen frei (nicht angeschnitten, nicht unter Kopfzeile oder Leiste).

Richtung der Fahrt: Überblick Mitte, S1 rechts, S2 links (ein halber Schwenk über die Mitte), S3a und S3b vorn in der Mitte. Die Pakete fahren in Leserichtung von links (Shopify) nach rechts (WooCommerce).

## Faltplan (gerechnet mit `_pruefung/plan.mjs`)

- Keine Überlappung zweier Teile in der Ruhelage auf derselben Trägerfläche (Bogen oder gehobener Boden), Desktop- und Hochkantlayout. Ausnahme mit Absicht: die Böden eines Regals liegen gestapelt auf derselben Grundfläche und heben sich parallel (Hubknoten wie die Tischplatte in C).
- Keine Schnitt- oder Falzlinie durch ein fremdes Teil.
- Kein Teil taucht während des Baus unter den Bogen (tiefster Punkt −0,002, die Ruhelage selbst).
- Pakete am Ende x 1,67 bis 3,73, y 1,45 bis 1,73: zwischen den Stützen (z 0 und −1,3), unter dem oberen Boden (y 2,0).

## Lagerschild an den Lesestellen (gerechnet mit `_pruefung/schild.mjs`)

Regel (Clautz, 22.10.2026): An Lesestellen ist die Tafel ganz im Bild (unterhalb der Kopfzeile, oberste 64 px frei) oder ganz draußen, nie angeschnitten. Dafür stehen die Stützen höher (Desktop 4,6, hochkant 5,6 statt 3,3), die Tafel liegt an S1 bis S3b über dem oberen Bildrand; S3b ist steiler (Neigung 21° statt 15°). Ergebnis für 1280 × 900, 390 × 844, 1366 × 768 und 1920 × 1080: an der Überschrift ganz im Bild (Oberkante 186 bis 283 px), an S1, S2, S3a, S3b ganz draußen.

An S3b (b 0,9) stehen die drei Pakete auf und an der Brücke: Desktop 461 bis 867 px, Handy 50 bis 378 px. Die Waage liegt am Handy hinter der Kamera dieser Lesestelle (0 von 52 Ecken im Bild), am Desktop unter der Brücke im Vordergrund, ohne sie zu kreuzen.
