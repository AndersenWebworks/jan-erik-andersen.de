# Entwurf B Raumtext 2 · Konzept

Grundsatz: Es gibt keine Karten, Tafeln, Rückflächen oder Schatten unter Text. Jeder Text ist auf eine Fläche des Modells gedruckt. Diese Fläche ist Papier des Modells (gleiche Füllung, gleiche Haarlinienkante), hängt im selben Faltbaum und klappt mit ihm aus dem Bogen hoch. Die Schrift ist echter 3D-Text (troika, SDF) und hat dieselbe Perspektive wie die Fläche.

Technik: Faltmodelle wie in Konstruktion 7 (jede Fläche hängt an einem Scharnier ihrer Elternfläche, Faltzustand 0 = flach, 1 = aufgerichtet). Der Faltzustand hängt am Scrollfortschritt; beim Zurückscrollen faltet sich alles zurück. Textgruppen sind Kinder eines Faltknotens.

Kamera: eine einzige stetige Bahn durch alle Lesestellungen und Zwischenpunkte (Hermite-Spline, C1). Scroll wird gedämpft (zwei Exponentialstufen, Trägheit spürbar) und über eine Zeitverzerrung auf die Bahn gelegt: An den Lesestellungen ist die Geschwindigkeit klein (3 % des Mittels, nie null), zwischen ihnen schneller. Es gibt kein Ruheplateau, kein Einrasten, kein Einfrieren. Vor/Zurück gleitet weich zur nächsten Lesestellung, das Mausrad bricht ab.

Lesestellung: Die Kamera wird aus der Textfläche berechnet: nahezu frontal (Gierwinkel 6–12°, Neigung 6–9° nach unten), Abstand so, dass Fließtext 19 px (Desktop 900 px Höhe), 21 px (1440 px Höhe) bzw. 16 px (Handy) groß ist. Textblock auf dem Desktop links oder rechts im Inhaltsbereich (höchstens 1600 px breit), das übrige Modell auf der Gegenseite und in der Tiefe. Handy: Text unten, Modell darüber und dahinter.

Roter Faden: rote Linie am Boden durch alle Abschnitte, ein schlichter roter Punkt (einfarbige Scheibe) läuft mit dem Scroll vorneweg.

## Abschnitte

| # | Abschnitt | Modell | Überschrift | Fließtext | Kamera hinein / hinaus |
|---|-----------|--------|-------------|-----------|------------------------|
| 0 | Einstieg | Bogen mit Website (große Seite mit Kopfleiste), Shop (Faltschachtel mit rot-weißer Markise) und angebundenem System (schmaler Turm), am Boden rote Verbindungen | „Jan-Erik“ und „Andersen“ als ausgeschnittene Lettern in zwei gestaffelten Reihen, die sich aus dem Bogen aufrichten; im Bogen bleibt ihr Abdruck | Kicker, Absatz und Links auf der Website-Seite selbst (die Seite ist die Website) | hinein: beim Laden senkt sich die Kamera aus der Höhe (Intro); hinaus: steigt über die Oberkante der Website-Seite und gleitet über den Shop hinweg |
| 1 | Gerwing | Gartenterrasse am Haus: Pflaster im Läuferverband legt sich Reihe für Reihe, Zickzack-Treppe faltet sich hoch, Terrasse richtet sich auf, Hauswand dahinter; auf der Terrasse klappt ein Laptop mit dem echten Shop auf, daneben ein Handy mit der Bestellung | „Gerwing“ in großen Lettern auf der Hauswand | Meta, Titel, zwei Absätze, Link, Bildunterschrift auf der Hauswand links | hinein: sinkt hinter dem Shop des Einstiegs ab; hinaus: Bogen um die Terrasse, dicht am Laptopbildschirm vorbei |
| 2 | Betreuung und Absicherung | Haus mit Satteldach, rundum klappt ein Zaun Feld für Feld hoch, an der Ecke ein Ausguck mit rotem Fenster, rote Kontrolllinie am Zaun | „Was ich mache“ auf der Hausfront | Titel und Absatz auf der Hausfront, über dem Zaun | hinaus: um die Hausecke am Ausguck vorbei |
| 3 | Modernisierung | altes Haus legt sich flach, an seiner Stelle faltet sich ein heutiger Flachdachbau auf; der Weg (Adressen) bleibt | Titel auf der neuen Fassade | Absatz auf der neuen Fassade links, große Fenster rechts | hinaus: steigt über die Dachkante und gleitet über das Flachdach |
| 4 | Shops und Shop-Wechsel | Ladenfront mit Markise und Ladenschild, davor eine Palette mit großer Kiste, daneben Pakete in Formaten, die in keine Norm passen (lang, flach, hoch) | „Shops und Shop-Wechsel“ als Schriftzug auf dem Ladenschild | Absatz auf der Seitenfläche der Kiste | hinaus: Slalom zwischen Kiste und Paketen hindurch |
| 5 | Schnittstellen | drei Türme, Zugbrücken klappen aus den Wänden und treffen sich, rote Linie läuft über die Brücken | Titel auf dem mittleren Turm | Absatz auf dem mittleren Turm | hinaus: unter den Brücken hindurch |
| 6 | Gestaltung | goldener Schnitt als Schachtelfolge mit roter Spirale auf den Deckeln, daneben ein Zeichenbrett, das sich schräg aufrichtet | Titel auf dem Blatt | Absatz und Belegzeile auf dem Blatt auf dem Zeichenbrett | hinaus: steigt in die Aufsicht über die Spirale |
| 7 | WBG Pooling | Drehteller mit Produkt, das sich auffaltet und mit dem Scroll dreht; dahinter die Mauer des geschützten Bereichs mit Tor | „Weitere Arbeit“ auf der Mauer | Meta, Titel, Absatz auf der Mauer | hinaus: durch das Tor |
| 8 | Take the Gloves Off | Plakatfolge auf einem Podest, jedes Format mit eigenem Zeichen | Titel auf dem großen Plakat | Meta und Platzhalter auf dem großen Plakat | hinaus: seitlich am Podest vorbei |
| 9 | Außerdem | Straße kleiner, verschiedener Häuser, eins nach dem anderen | – | Absatz auf der Straßenmauer vorn | hinaus: die Straße entlang |
| 10 | Wie ich arbeite | Grundriss am Boden, die Wände richten sich auf | „Wie ich arbeite“ auf der Rückwand | großer Serifenabsatz auf der Rückwand (Innenseite), Blick über die niedrigen Vorderwände | hinaus: durch die Türöffnung |
| 11 | Werdegang 1 | Weg mit acht Stationen, jede faltet sich aufwendiger als die vorige; lange Mauer am Weg | „Werdegang“ auf der Mauer | Zeilen 1–4 auf der Mauer | weiter: Seitwärtsfahrt entlang der Mauer |
| 12 | Werdegang 2 | wie 11 | – | Zeilen 5–8 auf der Mauer | hinaus: Bogen nach außen |
| 13 | Stimme 1 | Leporello (Wirkungsbericht) richtet sich auf und entfaltet sich Seite für Seite | „Stimmen“ auf der Titelseite | Zitat auf der Titelseite | weiter: am Leporello entlang |
| 14 | Stimme 2 | Faltfächer steht auf und öffnet sich zum Halbrund, daneben ein Blatt mit umgeknickter Ecke | – | Zitat auf dem Blatt | hinaus: über den Fächer |
| 15 | Für Agenturen | Reihe gleicher Bauten mit einer Lücke, das neue Teil (rotes Dach) faltet sich passgenau hinein, dahinter ein langer Bau | „Für Agenturen“ auf dem langen Bau | zwei Absätze auf dem langen Bau | hinaus: über die Dächer |
| 16 | Kontakt | Haus, dessen rote Tür aufschwingt; die rote Linie endet an der Tür | „Schreiben Sie mir, worum es geht.“ auf der Hausfront | Kontaktzeilen (anklickbar) und Fußzeile auf der Hausfront links der Tür | Ende |

Umfangsregel: Abschnitte 0–4 werden voll ausgearbeitet, 5–16 nach demselben Prinzip vereinfacht.
