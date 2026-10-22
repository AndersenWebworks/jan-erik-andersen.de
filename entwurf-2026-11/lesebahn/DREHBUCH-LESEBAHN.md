# Drehbuch Lesebahn – Gesamtfassung (Vorlage für die Szenenumbauten)

Stand 22.10.2026. Verbindliche Vorlage für alle Helfer, die Szenen in `entwurf-2026-11/lesebahn/` auf das Lesekonzept umbauen. Ersetzt für die Lesebahn das bisherige `DREHBUCH.md` (Seitenprototyp mit 73 Bildschirmhöhen). Es wird nur Text festgelegt, kein Code geändert. Quellen: `entwurf-2026-10-b-raumtext-2/index.html` (Seitentext), `docs/FASSUNG-2026-11.md`, `docs/ENTWURFSRUNDE-2026-10.md`, `docs/KONSTRUKTE-KATALOG.md`, `entwurf-2026-11/seite/DREHBUCH.md`, die Szenenmodule in `entwurf-2026-11/lesebahn/*.js`.

Schreibweise: In den Satztabellen steht der Wortlaut so, wie er auf dem Träger stehen soll. **Fett** ist die Schlüsselgruppe, die ein Durchfliegender mitnimmt (wird auf dem Träger kräftiger gesetzt, nicht rot). Quelle: „unverändert“ = Seitentext Wort für Wort, „gekürzt“ = Seitentext mit Streichung, „VORSCHLAG neu“ = neu formuliert oder in ganze Sätze zerlegt, Original steht daneben.

---

## 1. Leitbild (in Eriks Worten)

- Ein kleiner Film, durch den man in einem Zug durchfliegt und trotzdem die Inhalte mitbekommt, denn Leute lesen sonst keine Texte.
- Text-Bild-Konsistenz und Flow zählen mehr als jeder Effekt. Fixe Strecke, keine Verzweigung, keine Tech-Demo, kein Spiel.
- Der rote Faden ist die Lesebahn. Jeder Satz steht ganz auf einem eigenen Papierträger am Faden. Der Punkt hält an jedem Satz kurz.
- Die Kamera fährt stetig nach rechts, ohne Drehen und ohne Zoomen.
- Das Pop-up-Papier (Stil „Bogen + Bastellinien“) steht als Szenerie hinter der Bahn und zeigt genau das, was der Satz gerade sagt. Generische Konstrukte lehnt Erik ab. Schreibtisch, Laptop und Rechner sind erlaubt, wenn sie passen.
- Am besten gelesen wurden Werdegang-Treppe und Leporello (der Text ist das Bauteil). Unruhig war Text auf Geräten mit Heran- und Herumzoomen.
- Der Auftritt soll zeigen, dass Erik auch gestalterisch etwas kann. Er soll Fremde in Sekunden überzeugen und sympathisch wirken. Ton: direkt, menschlich, locker, kein Marketingsprech.

## 2. Regeln, die für jede Szene gleich gelten

1. **Faden und Punkt:** Der Faden läuft am oder durch den Träger (Schnittstelle je Szene unten). Der Punkt hält am Träger, solange der Satz in Lesefenster steht. Kein Scroll-Lock: Die Kamera wird dort nur langsamer, nie null (Lehre 1).
2. **Träger:** ein ganzer Satz je Träger, dem Leser zugewandt (Flächennormale höchstens etwa 10° von der Blickrichtung), ganz im Bild, Schrift am Desktop mindestens 20 px, am Handy mindestens 16 px. Richtwert höchstens 20 Wörter je Satz, in 2 bis 3 Sekunden erfassbar. Ausnahme: unteilbare Zitatsätze (Stimmen) und die Zeilen im Werdegang (Einträge, keine Sätze).
3. **Kamera:** gleiche Neigung und gleicher Abstand wie im Lesebahn-Test Schnittstellen (`schnittstellen.js`), nur Fahrt nach rechts, kein Gieren, kein Heranzoomen. Einzige Ausnahme: In der Eröffnung hebt sich die Kamera einmal vom Podest in die Bahnhöhe. Ab dann bleibt sie in allen Szenen gleich hoch, damit die Szenengrenzen nahtlos sind. Am Handy gilt dasselbe, nur mit einem Träger pro Bild und dem Konstrukt über oder unter dem Träger.
4. **Kernaussage zuerst:** Der erste Träger jeder Szene ist der Kopf (Serife, groß, mit Kicker). Wer nur durchfliegt, liest nur die Köpfe und die fetten Schlüsselgruppen und hat trotzdem die Aussage.
5. **Satz und Bild laufen synchron:** Das Konstrukt zeigt die Aussage in dem Moment, in dem der Punkt am zugehörigen Satz hält, nicht davor und nicht danach. Netz, dann Fläche (Bastellinien, dann Einrasten) läuft in der Fahrt zwischen zwei Sätzen, im Haltefenster steht fertiges Papier.
6. **Eigene Trägerform je Szene:** 14 Szenen, 14 verschiedene Formen. Keine Form kommt zweimal vor, damit die Grenze „höchstens zweimal, nie hintereinander“ sicher eingehalten ist. Gemeinsam bleiben Papierton `#faf8f3`, Haarkante, Tinte `#303033`, Rot nur für Faden und Punkt, Newsreader für Köpfe, Schibsted Grotesk für Sätze.
7. **Nichts auf Geräten, das gezoomt werden muss:** Wo ein Gerät einen Satz trägt, steht es in Lesegröße von Anfang an da (Eröffnung). Kein Heranfahren an Bildschirme.
8. **Bleibt weg:** ClautzGPT, „Andersen Web Tools“, RPLC, Lebenslauf-PDF, erfundene Zahlen, Kunden, Zitate, Auszeichnungen (NOVUM-Cover und Audi-Motiv sind Gestaltungsarbeiten).

## 3. Gesamtablauf

Länge = Bildschirmhöhen am Desktop (1280 × 900), einschließlich der Fahrt in die Szene. Die Summe ist das Planmaß (Annahme: etwa 0,6 Bildschirmhöhen je Satz mit Lesefenster von mindestens 30 vh plus 0,5 je Szene für Anfahrt und Aufbau; wird beim Bau mit den Rechenskripten in `tmp/seite-pruefung/` nachgerechnet).

| # | Szene | Kernaussage (ein Satz) | Trägerform | Träger | Länge (vh-Höhen) | Heute |
|---|---|---|---|---|---|---|
| 1 | Eröffnung | Ich entwickle Websites und Shops, binde sie an Ihre Systeme an und betreue sie. | Podest, Bildschirm, Gerätewand | 3 | 3,4 | 5,9 |
| 2 | Gerwing | Pflaster nach Fläche bestellen: der Shop rechnet in ganze Steine und gibt an den Händler weiter. | Lieferschein-Bon | 5 + Kopf | 4,5 | 6,5 |
| 3 | Betreuung und Absicherung | Zwischen Lücke und Angriff vergehen Stunden, deshalb halte ich Ihre Seite aktuell und sehe monatlich nach. | Abreißkalender | 3 + Kopf | 3,0 | 4,3 |
| 4 | Modernisierung | Alte WordPress-Seiten kommen auf den heutigen Stand, Inhalte und Adressen bleiben. | Schieber mit Lasche | 3 + Kopf | 3,0 | 4,7 |
| 5 | Shops und Shop-Wechsel | Shops für Sonderformate, und Wechsel von Shopify zu WooCommerce, vorher durchgerechnet. | Karteikarten im Kasten | 4 + Kopf | 3,5 | 6,1 |
| 6 | Schnittstellen und eigene Werkzeuge | Ich verbinde Websites mit Ihren Systemen und baue das Passstück, wenn es keins gibt. | Fähnchen am Faden | 2 + Kopf | 2,4 | 5,6 |
| 7 | WBG Pooling | Ein Portal mit 360-Grad-Ansichten, geschütztem Bereich und Anbindung an Salesforce und Concludis. | Drehscheibe mit Fenster | 2 + Kopf | 2,4 | 5,8 |
| 8 | Gestaltung | Gestaltung gehört für mich zur Entwicklung. | Staffelei-Blätter über dem Kamm | 3 + Kopf | 3,0 | 3,9 (+ 2,6 Gloves) |
| 9 | Außerdem | Weitere Arbeiten für Praxis, Klang, Sozialorganisation und Bäckerei. | Setzkasten | 1 (Platzhalter) | 1,5 | 2,6 |
| 10 | Wie ich arbeite | Ich schaffe mit eigenen KI-Abläufen allein, wofür früher ein Team nötig war, und prüfe alles selbst. | Tunnelbuch (Prüfrahmen) | 3 + Kopf | 3,0 | 4,0 |
| 11 | Werdegang | Von Pixel Arrays bis Gerwing, acht Stationen. | Treppe | 8 Zeilen + Kopf | 4,4 | 5,7 |
| 12 | Stimmen | Kunden nennen mich verlässlich, engagiert und professionell. | Leporello | 7 + Kopf | 4,8 | 6,5 |
| 13 | Für Agenturen | Ich steige in laufende Projekte ein und halte mich an Ihre Abläufe. | Einsteckschiene | 3 + Kopf | 3,0 | 8,8 (mit Kontakt) |
| 14 | Kontakt | Schreiben Sie mir, worum es geht. | Briefumschlag mit Klappe | Überschrift + 3 Karten | 2,5 | – |
| | **Summe** | | | | **44,4** | **73,0** |

Handy (390 × 844): etwa 46, weil die Haltefenster am Handy länger sein müssen (Szenen mit kleinsten Fenstern heute: Gerwing, WBG, Stimmen, Agenturen).

### Änderungen gegenüber Seitentext und Seitenprototyp, mit Begründung

| Änderung | Begründung |
|---|---|
| WBG Pooling wandert hinter Schnittstellen (vorher nach Gestaltung). | Es ist der Beleg für den Satz davor (Salesforce, Concludis). Dieselben Geräte stehen schon, kein Wechsel des Bildes, ein Abschnitt spart die Rückfahrt. |
| Take the Gloves Off ist keine eigene Szene mehr, sondern das erste Blatt in Gestaltung. | Es ist eine Gestaltungsarbeit, das Plakat steht ohnehin als erstes Blatt auf der Staffelei. Der Satz ist noch Platzhalter, eine eigene Szene mit nur einem Schild trägt nicht. Spart etwa 1,9 vh. |
| Außerdem bleibt eine kurze Szene mit Sammelsatz, bis je Fach ein Satz vorliegt. | Platzhalter sollen nicht die Länge bestimmen. |
| Gerwing bekommt Bon-Träger und fünf Sätze statt Wand, Palette, Händler als Tafeln. | Der Lieferschein passt zu „Bestellung weiterleiten“ und gibt einen Faden zum Mitlesen. |
| Betreuung: „regelmäßig“ wird „monatlich“. | Feste Tatsache: Erik sieht bei betreuten Websites monatlich nach. Der Kalender blättert deshalb Monat für Monat. |
| Eröffnung: ein langer Satz wird zu zweien. | Der Seitensatz hat 18 Wörter, aber drei Aussagen (Bauen, Anbinden, Betreuen); jede bekommt ihren Träger und ihr Bild. |
| Reihenfolge sonst wie im Seitentext. | Gerwing leitet mit „Seitdem betreue ich den Shop“ natürlich in Betreuung über. Werdegang und Stimmen stehen kurz vor Agenturen und Kontakt, damit Vertrauen unmittelbar vor der Handlungsaufforderung liegt. |
| Länge von 73 auf 44 vh. | Ein Träger ersetzt Tafeln und Satzteile, die Fahrten zwischen den Szenen sind kürzer, weil alles auf einer Höhe und einer Neigung fährt. |

---

## 4. Eröffnung (Szene 1) – Name bleibt auf dem Podest

**Trägerform: Podest, Bildschirm, Gerätewand.** Das Podest mit dem Namen bleibt (Marke N4, Falz als Scharnier, Unterzeile auf der Vorderseite). Die drei Sätze stehen auf Flächen des Schreibtisch-Konstrukts: Bildschirm, Rechner-Seitenwand, Mappendeckel. Der Text ist das Bauteil, keine Karte davor.
**Warum die Form passt:** Der Seitensatz handelt von Dingen, die man anfassen kann: eine Website (Bildschirm), ein System (Rechner), Agentur und Direktkontakt (Mappe und Telefon). Gerätewand heißt hier: das Gerät steht in Lesegröße fest da, die Kamera zoomt nicht (Erik fand zoomenden Text auf Geräten unruhig).
**Mechanik aus dem Kern:** Faltkern mit Podest (Vorderseite, Deck, Rückseite als Parallelfalz), Bastellinien und Abdruck, Vorspann-Einrasten (`mech`) für Tischplatte, Monitor und Rechner, Kabel als Faden-Abschnitt, `K.decal` für den Bildschirminhalt (Skizze wird Seite).

**(a) Kernaussage:** Ich entwickle Websites und Shops, binde sie an Ihre Systeme an und betreue sie; Agenturen holen mich ins Projekt, Unternehmen arbeiten direkt mit mir.

**(b) Satzliste**

| Nr | Wortlaut | Quelle | Träger |
|---|---|---|---|
| E0 | Jan-Erik *Andersen*. Unterzeile: Webentwicklung · Raum Plau am See · remote | Marke N4, Seitentext Kicker | Podest (Lettern auf dem Deck, Zeile auf der Vorderseite) |
| E1 | Ich entwickle **Websites und Onlineshops**. | VORSCHLAG neu, Original: „Ich entwickle Websites und Onlineshops, binde sie an Ihre übrigen Systeme an und betreue sie, solange sie laufen.“ (zerlegt) | Bildschirm-Front |
| E2 | Ich binde sie an Ihre **übrigen Systeme** an und betreue sie, solange sie laufen. | VORSCHLAG neu, zweite Hälfte des Originals | Seitenwand des Rechners |
| E3 | **Agenturen** holen mich als Entwickler ins Projekt, **Unternehmen** arbeiten direkt mit mir. | Seitentext unverändert | Mappendeckel (Telefon daneben) |

**(c) Szenerie**

- **E0:** Beim Laden Podest und Name, wie in `eroeffnung.js` (Kamera frontal auf Stufenhöhe). Das HTML-Vorbild steht sofort. Beim ersten Scrollen hebt sich die Kamera auf Bahnhöhe, der Bogen kommt ins Bild, die Bastellinien zeichnen Tisch, Monitor, Rechner.
- **E1:** Die Skizze auf der Tischplatte wird zum Bildschirm: Kreuz-Platzhalter wird Seite, roter Knopf wird zum Warenkorb-Knopf. Zeigt „Website und Onlineshop“ in einem Bild. Satz auf der Bildschirmfront, groß, Text über der Seitenskizze.
- **E2:** Das Kabel zieht sich vom Monitor über die Tischkante zum Mini-Tower (System). Der Statuspunkt am Rechner leuchtet rot und bleibt: „betreuen, solange sie laufen“. Der Satz steht auf der Seitenwand des Rechners, der Punkt des Fadens hält am Statuspunkt.
- **E3:** Am Ende der Strecke stehen links eine Projektmappe mit Reiter (Agentur) und rechts ein Telefon mit Hörer (direkt). Das Telefon bleibt Szenerie, getragen wird der Satz vom Mappendeckel.
- **Entfällt:** Variante A (Laptop, Handy), Satzteile auf Kinn, Zarge und Deckel, der Anriss „Gerwing“, der Aufbau von 1,35 Bildschirmhöhen auf etwa 0,9 verkürzt.

**(d) Übergang:** Der Faden verlässt den Statuspunkt, läuft an der Mappe vorbei und endet mit dem Telefonkabel auf dem Bogen. Vom rechten Bildrand kommt die Gerwing-Fläche ins Bild, der Faden führt hinein.

---

## 5. Gerwing (Szene 2)

**Trägerform: Lieferschein-Bon.** Ein langer Bon (Streifen mit Lochkante) läuft aus dem Gerwing-Bildschirm, von Perforation zu Perforation ein Satz. Der Bon ist die Bestellung, die vom Kunden zum Händler wandert.
**Warum die Form passt:** Der Absatz erzählt den Weg einer Bestellung: Fläche, Steine, Gewicht und Fracht, Händler. Ein Bon macht diesen Weg zur Leseschiene und trägt den Faden durch seine Lochung.
**Mechanik aus dem Kern:** `F.slide` (Bon schiebt sich aus dem Schlitz), Falten am Perforationsknick (Faltkern), `bounce` für den Abriss, Vorspann-Einrasten für Steinreihen und Palette, `F.part` für den Rest.

**(a) Kernaussage:** Pflaster nach Fläche bestellen: Der Shop rechnet Quadratmeter in ganze Steine und gibt die Bestellung an den Händler weiter.

**(b) Satzliste**

| Nr | Wortlaut | Quelle | Träger |
|---|---|---|---|
| G0 | **Pflaster nach Fläche bestellen** (Kicker: Gerwing · WooCommerce · seit 2023) | Seitentext unverändert (Titel) | Bon-Kopf |
| G1 | Für Gerwing habe ich 2023 einen **WooCommerce-Shop** gebaut, der Pflastersteine, Terrassenplatten und Stufen nach Fläche verkauft. | gekürzt, Original: „… der Pflastersteine, Terrassenplatten und Stufen so verkauft, wie man sie bestellt: nach Fläche.“ (21 Wörter, jetzt 16) | Bon-Abschnitt 1 |
| G2 | Kunden geben ihre **Quadratmeter** ein, der Shop rechnet sie in **ganze Steine** um. | VORSCHLAG neu, Original: „Kunden geben ihre Quadratmeter ein, der Shop rechnet sie in ganze Steine um, ermittelt Gewicht und Fracht nach Postleitzahl und leitet die Bestellung an den zuständigen Händler weiter.“ (31 Wörter, in G2 bis G4 zerlegt) | Bon-Abschnitt 2 |
| G3 | Er ermittelt **Gewicht und Fracht** nach Postleitzahl. | VORSCHLAG neu (Zerlegung desselben Satzes) | Bon-Abschnitt 3 |
| G4 | Dann leitet er die Bestellung an den zuständigen **Händler** weiter. | VORSCHLAG neu (Zerlegung desselben Satzes) | Bon-Abschnitt 4 (reißt ab) |
| G5 | Seitdem **betreue ich den Shop** und entwickle ihn laufend weiter. | Seitentext unverändert | Bon-Abschnitt 5 am Schluss (Quittungsabschnitt) |

**(c) Szenerie**

- **G0 und G1:** Der Gerwing-Bildschirm klappt auf, auf ihm die echte Produktseite (`gerwing-produkt-ausschnitt`, „Tosca Antik“). Der Bon schiebt sich aus dem Schlitz unter dem Bildschirm. Der Bildschirm steht in Lesegröße, die Kamera zoomt nicht.
- **G2:** Hinter dem Bon wird eine Fläche (Umriss auf dem Bogen) in ganze Steine geteilt, Reihe für Reihe im Läuferverband. Die letzte Reihe ragt über die Kontur, weil nur ganze Steine geliefert werden. Das ist die Kernaussage „Fläche in ganze Steine“ in einem Bild (Konstrukt aus `gerwing.js`, Terrasse).
- **G3:** Die Steine stapeln sich auf der Palette. Die Palette senkt sich ein Stück (Gewicht), der Faden zeigt auf das Frachtschild mit der Postleitzahlen-Linie.
- **G4:** Die Palette fährt auf der roten Linie zum Händlerlager. Der Bonabschnitt reißt ab und fährt mit der Palette, im Lager klappt die Tür auf.
- **G5:** Der Bildschirm steht wieder im Bild (am Faden-Ende), ein Statuspunkt leuchtet: betreut, läuft weiter. Der Bon endet mit dem Quittungsabschnitt.
- **Entfällt:** Wand, Stirnsteine und Bodentext, Satz aus Wand-, Palette- und Händlerfragmenten, Zweitbild Bestellung als eigene Einblendung, Trust-Badge, der alte Gerwing-Abdruck im Bogen, den der Faden kreuzte.

**(d) Übergang:** Der Bon läuft aus, der Faden löst sich vom Quittungsabschnitt und fährt zu einem Kalenderblock am rechten Rand, der sich aus dem Bogen stellt.

---

## 6. Betreuung und Absicherung (Szene 3)

**Trägerform: Abreißkalender mit Spiralbindung.** Die Blätter blättern um (Monat für Monat), der Faden ist das Lesebändchen.
**Warum die Form passt:** Zeit ist der Inhalt: Stunden zwischen Lücke und Angriff, laufend aktuell, monatlich nachsehen. Der Katalog nennt das Zeitmoment und das Wiederkehrende als bisher nie gezeigt. Ein Kalender kann beides.
**Mechanik aus dem Kern:** `F.spin` (Blatt klappt um die Oberkante nach hinten), `dn`/`re` (Blatt klappt zurück und steht wieder auf), `bounce` (Anschlag), `F.slide` (Update-Bausteine schieben sich ein).

**(a) Kernaussage:** Zwischen Lücke und Angriff vergehen oft nur Stunden. Deshalb halte ich Ihre Seite aktuell und sehe monatlich nach.

**(b) Satzliste**

| Nr | Wortlaut | Quelle | Träger |
|---|---|---|---|
| B0 | **Betreuung und Absicherung** | Seitentext unverändert (Titel) | Kalenderdeckel |
| B1 | Zwischen dem Bekanntwerden einer Lücke in einem WordPress-Plugin und dem ersten Angriff vergehen oft **nur Stunden**. | Seitentext unverändert (16 Wörter) | Tagesblatt |
| B2 | Ich halte Ihre Seite deshalb **laufend aktuell**. | gekürzt, Original: „… deshalb laufend aktuell und sehe regelmäßig nach, ob sie sauber läuft.“ | Blatt 2 |
| B3 | Bei betreuten Websites sehe ich **monatlich** nach, ob sie sauber läuft. | VORSCHLAG neu (monatlich statt regelmäßig, Tatsache von Erik) | Monatsblatt |

**(c) Szenerie**

- **B0:** Der Kalenderdeckel mit Spirale klappt auf, der Kopf steht groß darauf.
- **B1:** Das Tagesblatt trägt eine Uhr, deren Zeiger läuft. Daneben steht ein Plugin-Baustein mit einer Lücke (im Bogen bleibt als Abdruck ein Loch). Kein Angriff wird abgebildet, kein Pfeil, keine Zahl. Bild: Lücke und laufende Zeit.
- **B2:** Eine Reihe Bausteine (Plugins, Theme) erhält nacheinander ihre Erneuerung: der alte Deckel schiebt sich heraus, der neue rastet ein. Passt zu „laufend aktuell“.
- **B3:** Die Monatsblätter blättern um, eines nach dem anderen. Auf jedem Blatt erscheint ein Häkchen („sauber“). Der Satz steht auf dem aktuellen Monatsblatt, das Blatt dahinter zeigt schon das nächste Häkchen. Die Zahl der Blätter ist kein Beleg, es sind Beispiele.
- **Entfällt:** Haus, Zaun, Ausguck, Pfosten-Austausch, Kontrollgang, Satzteile auf der Zarge.

**(d) Übergang:** Das letzte Blatt wird abgerissen und fliegt nach rechts. Der Faden läuft durch dessen Ösenloch weiter zu zwei Bildschirmgeräten (Röhre links, Flachbildschirm rechts) mit einem Papierstreifen dazwischen.

---

## 7. Modernisierung (Szene 4)

**Trägerform: Schieber mit Lasche.** Ein Schlitzkarton mit Lasche: Der Streifen läuft von alt nach neu, im Fenster wechselt das Bild. Der Satz steht auf dem Streifen.
**Warum die Form passt:** Es geht um Alt-zu-Neu mit erhaltenen Inhalten. Ein Schieber ist genau ein Vorher-nachher-Mechanismus, die Lasche lädt zum Ziehen ein, und der Inhalt bleibt auf dem Streifen.
**Mechanik aus dem Kern:** `F.slide` (der Streifen schiebt sich), `dn`/`re` (alter Teil klappt weg, neuer steht auf), Vorspann-Einrasten.

**(a) Kernaussage:** Alte WordPress-Seiten kommen technisch und gestalterisch auf den heutigen Stand, Inhalte und Adressen bleiben erhalten.

**(b) Satzliste**

| Nr | Wortlaut | Quelle | Träger |
|---|---|---|---|
| M0 | **Modernisierung** | Seitentext unverändert | Schieber-Kopf |
| M1 | Viele WordPress-Seiten laufen seit Jahren auf **veralteten Themes, Plugins und PHP-Versionen**. | Seitentext unverändert | Streifen, alter Teil |
| M2 | Ich bringe sie **technisch und gestalterisch** auf den heutigen Stand. | VORSCHLAG neu, Original: „Ich bringe sie technisch und gestalterisch auf den heutigen Stand und achte darauf, …“ (zerlegt) | Streifen, Mitte beim Ziehen |
| M3 | Dabei achte ich darauf, dass **Inhalte und Adressen erhalten bleiben**. | VORSCHLAG neu, Original: „… und achte darauf, dass Inhalte und Adressen erhalten bleiben.“ | Streifen, neuer Teil |

**(c) Szenerie**

- **M1:** Links ein Röhrenmonitor in verblasstem Papierton (alt, leicht schief) mit Blockstruktur.
- **M2:** Der Schieber wird gezogen. Die Blöcke des alten Bildschirms wandern über den Streifen in den Flachbildschirm daneben, der neu und gerade ist. Das Konstrukt ist das genaue Katalogkonstrukt (G, „Inhalte wandern mit“).
- **M3:** Die Adresszeile auf beiden Bildschirmen bleibt an der Stelle, der Weg (die Adresse) bleibt als Linie bestehen. Die Blöcke stehen am neuen Platz in derselben Reihenfolge.
- **Entfällt:** altes Haus, das sich flach legt, Flachdachbau, Fassade mit Tragwerk, die Satzkette „Ich bringe sie …“ über mehrere Träger.

**(d) Übergang:** Der Schieber wird ganz durchgezogen, die Lasche rastet ein. Der Faden läuft aus dem Fenster zu einem Karteikasten rechts, der sich aus dem Bogen stellt.

---

## 8. Shops und Shop-Wechsel (Szene 5)

**Trägerform: Karteikarten im Kasten.** Zwei Karteikästen stehen nebeneinander, die Karten ziehen sich heraus, richten sich auf und tragen je einen Satz.
**Warum die Form passt:** Ein Shop besteht aus Karten (Produkte, Kunden, Bestellungen), und der Wechsel ist ein Umzug dieser Karten von einem Kasten in den anderen. Die Karteikarte ist also zugleich Träger und Gegenstand.
**Mechanik aus dem Kern:** `F.slide` (Karte aus dem Kasten), `F.spin` (Karte kippt auf), Vorspann-Einrasten (Karte rastet im Zielkasten ein), `bounce` am Anschlag.

**(a) Kernaussage:** Ich baue WooCommerce-Shops für alles, was in kein Standardformular passt, und wechsle von Shopify zu WooCommerce, nachdem ich vorher durchgerechnet habe.

**(b) Satzliste**

| Nr | Wortlaut | Quelle | Träger |
|---|---|---|---|
| S0 | **Shops und Shop-Wechsel** | Seitentext unverändert | Reiterkarte (Kopf) |
| S1 | Ich baue WooCommerce-Shops für Produkte, die **in kein Standardformular passen**, etwa mit Mengen nach Fläche oder Fracht nach Entfernung. | gekürzt, Original: „… etwa mit Mengen nach Fläche oder Fracht nach Gewicht und Entfernung.“ (19 Wörter, Gewicht steht schon bei Gerwing) | Karte 1 |
| S2 | Wer bei Shopify mit wachsendem Umsatz immer höhere **Gebühren** zahlt, kann zu **WooCommerce wechseln**. | Seitentext unverändert | Karte 2 |
| S3 | Ich **rechne vorher durch**, ob sich das lohnt. | VORSCHLAG neu, Original: „Ich rechne vorher durch, ob sich das lohnt, und ziehe Produkte, Kunden und Bestellungen um.“ (zerlegt in S3 und S4) | Karte 3 |
| S4 | Dann ziehe ich **Produkte, Kunden und Bestellungen** um. | VORSCHLAG neu (Zerlegung desselben Satzes) | Karte 4 im Zielkasten |

**(c) Szenerie**

- **S1:** Links steht ein Karteikasten mit gleichgroßen Standardkarten. Eine Karte ist länger und breiter als alle anderen und passt nicht ins Fach (Sonderformat: Fläche, Fracht). Rechts wächst ein Fach nach Maß aus dem Bogen.
- **S2:** Am Shopify-Kasten wächst ein Stapel Gebührenkarten (ohne Beträge) mit dem Umsatz, eine Treppe aus Karten, die höher und höher wird. Der WooCommerce-Kasten daneben bleibt flach.
- **S3:** Eine Waage klappt zwischen die Kästen und kippt zur Seite von WooCommerce. Wiegt, bevor etwas bewegt wird.
- **S4:** Drei Kartenstapel (Produkte, Kunden, Bestellungen) ziehen über eine Brücke vom linken in den rechten Kasten, der große Sonderstapel zuletzt. Jeder rastet im Zielkasten ein.
- **Entfällt:** Ladenschild mit Markise, Palette mit Kiste und Unformaten, Standardregal-Modelle.

**(d) Übergang:** Die letzte Karte steckt im Zielkasten. Aus ihrem Fach zieht sich der Faden als Kabel zu einem Bildschirm rechts.

---

## 9. Schnittstellen und eigene Werkzeuge (Szene 6)

**Trägerform: Fähnchen am Faden.** Bleibt wie im Lesebahn-Test (`schnittstellen.js`): Papierfahnen, leicht zurückgelehnt, am Faden aufgereiht.
**Warum die Form passt:** Der Faden ist selbst die Schnittstelle (er verbindet die Geräte), die Fähnchen markieren die Verbindungspunkte. Die Form ist im Test schon am Faden gelesen worden.
**Mechanik aus dem Kern:** Faden mit `lin`, `F.part` und `K.panel` für die Fahne, `F.spin` für das Einstecken, Vorspann-Einrasten für das Passstück, `bounce` am Stecker.

**(a) Kernaussage:** Ich verbinde Websites und Shops mit Ihren Systemen, und wenn es kein passendes Werkzeug gibt, baue ich es.

**(b) Satzliste**

| Nr | Wortlaut | Quelle | Träger |
|---|---|---|---|
| T0 | **Schnittstellen und eigene Werkzeuge** | Seitentext unverändert | Fahnenkopf |
| T1 | Ich verbinde **Websites und Shops** mit **CRM-, ERP- und Bewerbermanagementsystemen**. | gekürzt, Original: „… Bewerbermanagementsystemen, bei WBG etwa mit Salesforce und Concludis.“ (Rest siehe W1/W2) | Fahne 1 |
| T2 | Wo ein gekauftes Werkzeug nicht zu Ihren Abläufen passt, **entwickle ich eines, das passt**. | Seitentext unverändert | Fahne 2 |

**(c) Szenerie**

- **T1:** Ein Bildschirm mit Website, daneben drei Geräte (CRM, ERP, Bewerbermanagement) mit leeren Buchsen. Die Kabel laufen vom Bildschirm zu den Geräten und stecken ein.
- **T2:** Beim ERP-Gerät passt der Stecker nicht (runde Buchse). Er stößt an, zieht sich zurück, ein rotes Adapterstück faltet sich aus dem Bogen dazwischen und rastet ein, dann steckt der Stecker. Das ist exakt „Werkzeug, das nicht passt, eines entwickeln, das passt“.
- **Entfällt:** Namen der Geräte mit Satzteilen, die zweite Instanz des Moduls als WBG-Szene nach Gestaltung (jetzt direkt dahinter, siehe W).

**(d) Übergang:** Der Faden läuft rechts an den Geräten vorbei zum Bildschirm mit Portal und Drehscheibe. Kein Kamerasprung, die Geräte bleiben im Bild und werden Szenerie von WBG.

---

## 10. WBG Pooling (Szene 7)

**Trägerform: Drehscheibe mit Fenster.** Eine Papierscheibe mit Fenster dreht sich wie ein Schiebekalender, im Fenster erscheint jeweils ein Satz. Daneben dreht sich das Produkt auf dem Drehteller.
**Warum die Form passt:** Das Portal zeigt Produkte in 360 Grad. Die Scheibe dreht sich, weil das Produkt sich dreht. Beides ist dieselbe Bewegung und erklärt sich gegenseitig.
**Mechanik aus dem Kern:** `F.spin` (Scheibe dreht, ohne Überschwingen, `lin`), Vorspann-Einrasten (das Schloss), Faden `lin` für die Kabel, `bounce` für den Bügel.

**(a) Kernaussage:** WBG Pooling ist ein Industrie- und Vertriebsportal mit 360-Grad-Produktansichten, geschütztem Bereich und Anbindung an Salesforce und Concludis.

**(b) Satzliste**

| Nr | Wortlaut | Quelle | Träger |
|---|---|---|---|
| W0 | **WBG Pooling** (Kicker: 2023 bis 2025 · für die Runden Group) | Seitentext, Kicker geändert (RPLC raus, Runden Group rein) | Scheibenkopf |
| W1 | WBG Pooling ist ein **Industrie- und Vertriebsportal** mit **360-Grad-Produktansichten**. | VORSCHLAG neu, Original (Nominalsatz): „Ein Industrie- und Vertriebsportal mit 360-Grad-Produktansichten, …“ | Scheibe, Sektor 1 |
| W2 | Es hat einen **geschützten Bereich** für den Vertrieb und **Anbindungen an Salesforce und Concludis**. | VORSCHLAG neu, Original: „… einem geschützten Bereich für den Vertrieb und Anbindungen an Salesforce und Concludis.“ | Scheibe, Sektor 2 |

**(c) Szenerie**

- **W1:** Ein Bildschirm mit Portal, davor ein Drehteller mit einem Industrieprodukt aus Papier. Der Teller dreht sich einmal ganz, solange der Punkt hält. Scheibe und Teller drehen im Gleichlauf.
- **W2:** Eine Login-Tafel mit Schloss stellt sich auf, der Bügel rastet ein (geschützter Bereich). Zwei Kabel laufen zu den Geräten, die schon aus der Szene davor stehen: das eine zum CRM (Salesforce), das andere zum Bewerbermanagement (Concludis). Die Namen stehen klein an den Steckern.
- **Entfällt:** Halle mit Sheddach, Mauer mit Tor, Darstellung als zweite Bahn nach Gestaltung.

**(d) Übergang:** Das Kabel zum Concludis-Gerät läuft aus dem Bild, der Faden steigt rechts auf eine Staffelei zu, die sich aus dem Bogen faltet.

---

## 11. Gestaltung (Szene 8, mit Take the Gloves Off)

**Trägerform: Staffelei-Blätter über dem Kamm.** Blätter in den Formaten der Arbeiten klappen nacheinander auf das Brett, jedes Blatt trägt einen Titel. Die Sätze stehen auf der Ablage und auf dem Blatt.
**Warum die Form passt:** Das Thema ist Gestaltung selbst. Die Staffelei zeigt, dass Entwurf und Umsetzung aus einer Hand kommen, die Blätter sind die Beweisstücke.
**Mechanik aus dem Kern:** Faltkern mit Scharnier am Kamm (drei Knoten am selben Scharnier A/B/C), `bounce` (Anschlag, kurz zurück, einrasten), Stütze ohne Überschwingen, Bleistiftspur für die Bildflächen.

**(a) Kernaussage:** Gestaltung gehört für mich zur Entwicklung; ich entwerfe selbst oder setze Entwürfe sorgfältig um.

**(b) Satzliste**

| Nr | Wortlaut | Quelle | Träger |
|---|---|---|---|
| D0 | **Gestaltung** | Seitentext unverändert | Ablage, Lettern |
| D1 | Für mich gehört **Gestaltung zur Entwicklung**. | Seitentext unverändert | Ablage-Front |
| D2 | Ich **entwerfe Erscheinungsbilder und Oberflächen selbst** oder setze vorhandene Entwürfe sorgfältig um. | Seitentext unverändert | Brett, über den Blättern |
| D3 | Beispiele sind das NOVUM-Cover und das Ausstellungsmotiv „100 Jahre Audi“. Nach Zustimmung: Beispiele sind Take the Gloves Off, das NOVUM-Cover und das Ausstellungsmotiv „100 Jahre Audi“. | VORSCHLAG neu, Original (Fragment): „Beispiele: [Take the Gloves Off, nach Zustimmung], das NOVUM-Cover und das Ausstellungsmotiv „100 Jahre Audi“.“ | Blatt (je eines zum Titel) |
| D4 | [Ein Satz zum Erscheinungsbild von Take the Gloves Off, nach Abstimmung] (Kicker: Ehrenamtlich) | Platzhalter, offen | Blatt 1 (Plakat) |

**(c) Szenerie**

- **D1:** Die Staffelei steht auf, das Brett lehnt, die Stütze klappt nach hinten. Auf der Ablage hängt der Satz. Das Brett ist noch leer.
- **D2:** Ein Entwurfsblatt wird zum Bildschirm: Die Skizze auf dem Brett hebt sich deckungsgleich ab (Katalogkonstrukt G, „Gestaltung = Entwicklung“). Dazu liegt ein Lineal auf der Ablage. Zeigt beide Hälften des Satzes: entwerfen und umsetzen.
- **D3:** Blätter klappen im Takt der Titel über den Kamm: NOVUM-Cover (hochkant) und „100 Jahre Audi“ (quer); das Plakat (hochkant, Take the Gloves Off) kommt als erstes Blatt dazu, sobald die Zustimmung vorliegt. Jedes Blatt hat den Titel klein am Rand. Die Bildfläche bleibt Bleistiftfläche, bis Erik Ausschnitte liefert. Keine Auszeichnung wird behauptet.
- **D4:** Platzhalter, nur Kicker „Ehrenamtlich“ auf Blatt 1, solange der Satz fehlt.
- **Entfällt:** Ablage als geschlossener Kasten, Gierwechsel (−20°, +20°, −20°), gespreizte Beine, Bildschirm aus WBG hinter dem Brett (wird der Bildschirm-Auftakt in D2), eigene Szene „Take the Gloves Off“.

**(d) Übergang:** Das letzte Blatt rastet ein. Der Faden läuft über den Kamm, am Ende senkt sich ein Setzkasten aus dem Bogen.

---

## 12. Außerdem (Szene 9, Platzhalter)

**Trägerform: Setzkasten.** Ein Kasten mit vier Fächern, in jedem Fach ein kleines Papierzeichen und, sobald der Satz da ist, ein Satzschild.
**Warum die Form passt:** Viele kleine, verschiedene Dinge, nebeneinander, jedes für sich. Das ist ein Setzkasten.
**Mechanik aus dem Kern:** Faltkern (Fächer klappen aus dem Bogen), Vorspann-Einrasten, `F.slide` (Zeichen schiebt sich ins Fach).

**(a) Kernaussage:** Es gibt weitere Arbeiten: Praxis, Klang, Verein, Bäckerei.

**(b) Satzliste**

| Nr | Wortlaut | Quelle | Träger |
|---|---|---|---|
| A1 | Außerdem habe ich für **Onkologie Laatzen**, **Mindblossom und Soundhealing Hamburg** sowie für **Seniorpartner in School** und die **Bäckerei Behrens** gearbeitet. | VORSCHLAG neu (Sammelsatz bis zu den Einzelsätzen), Original: „Außerdem: Onkologie Laatzen, Mindblossom und Soundhealing Hamburg, der digitale Wirkungsbericht für Seniorpartner in School, Bäckerei Behrens. [je ein Satz nach erneuter Sichtung]“ | Kasten-Oberkante |
| A2 | [je ein Satz pro Fach, nach erneuter Sichtung] | Platzhalter, offen | Fachschilder |

**(c) Szenerie**

- **A1:** Vier Fächer klappen aus dem Bogen: Praxis mit Vordach (Onkologie), Kuppel (Klang), Buch auf Pult (Wirkungsbericht), Bäckerei mit Ofen. Jedes Fach trägt den Namen klein.
- **A2:** Sobald die Sätze da sind, steht je ein Satz auf dem Fachschild und der Punkt hält vier Mal.
- **Entfällt:** Reihe kleiner Häuser, Platzhalterschild mit Stempel „Platzhalter“ (nur im Entwurf sichtbar).

**(d) Übergang:** Der Faden läuft zwischen den Fächern durch die Rückwand. Dahinter beginnen Rahmen aus Papier, die hintereinander aufstehen.

---

## 13. Wie ich arbeite (Szene 10)

**Trägerform: Tunnelbuch mit Prüfrahmen.** Drei Rahmen stehen als Kulissen hintereinander, jeder um ein Stück nach rechts versetzt. Der Satz steht auf dem Querbalken des Rahmens, der Faden läuft durch alle Fenster. Die Kamera fährt wie bisher seitlich nach rechts, sie schaut nicht in den Tunnel hinein.
**Warum die Form passt:** Im Satz passiert alles, was ausgeliefert wird, einen Prüfrahmen. Im Katalog war der Prüfrahmen die genaueste Lösung, das Tunnelbuch macht ihn zur Lesestrecke.
**Mechanik aus dem Kern:** Faltkern (Rahmen klappen gestaffelt hoch), Vorspann-Einrasten, `ghost` (Abdrücke des früheren Teams), Faden `lin` durch die Fenster.

**(a) Kernaussage:** Ich schaffe mit eigenen KI-Abläufen allein, wofür früher ein kleines Team nötig war. Entscheidungen und Verantwortung bleiben bei mir, ausgeliefert wird nur Geprüftes.

**(b) Satzliste**

| Nr | Wortlaut | Quelle | Träger |
|---|---|---|---|
| X0 | **Allein, wofür früher ein Team nötig war** (Kicker: Wie ich arbeite) | VORSCHLAG neu (Kopf, Seitenüberschrift „Wie ich arbeite“ als Kicker) | Rahmen 0 |
| X1 | Ich arbeite mit aktuellen **KI-Werkzeugen** und habe dafür **eigene Abläufe** entwickelt. | Seitentext unverändert | Rahmen 1 |
| X2 | Damit schaffe ich **allein** Projekte, für die früher ein kleines Team nötig war, etwa Schnittstellen oder Datenumzüge. | Seitentext unverändert (17 Wörter) | Rahmen 2 |
| X3 | Entscheidungen und Verantwortung bleiben bei mir, und **ausgeliefert wird nur, was ich geprüft habe**. | Seitentext unverändert (14 Wörter) | Rahmen 3 (Prüfrahmen mit Stempel) |

**(c) Szenerie**

- **X1:** Rahmen 1 steht, eine Schiene (Abläufe) legt sich durch das Fenster: Bastellinien werden zur Schiene. Bild für „eigene Abläufe“.
- **X2:** Hinter Rahmen 2 zeigen mehrere leere Abdrücke im Bogen Plätze eines früheren Teams (gestrichelte Silhouetten). Eine Figur steht ausgefüllt davor: Erik allein. Die Papierteile für Schnittstellen und Datenumzug laufen allein durch das Fenster.
- **X3:** Rahmen 3 ist der Prüfrahmen, am Querbalken ein roter Häkchenstempel. Nur Teile mit Häkchen kommen auf der anderen Seite heraus, ein Teil ohne Häkchen bleibt als Abdruck zurück.
- **Entfällt:** Turmdrehkran, Kanban, Rahmen mit Ticketkarten (Erik mag keinen Ticketkram), Grundrisswände ohne Aussage, der Satz über die ganze Breite.

**(d) Übergang:** Der Faden tritt aus Rahmen 3, steigt und läuft auf die erste Stufe einer Treppe.

---

## 14. Werdegang (Szene 11)

**Trägerform: Treppe** (aus `werdegang.js`, Text auf der Setzstufe, Faltzeichen auf dem Tritt). Der Faden klettert mit. Behalten wird die bestgelesene Form, wie sie ist.
**Warum die Form passt:** Ein Werdegang ist ein Aufstieg in Stufen, die Zeilen sind das Bauteil (Katalog: „Fehlt: Bezug auf die konkreten Stationen“, hier gelöst).
**Mechanik aus dem Kern:** Teleskop (Plattenhub), Setzstufe und Seitenwände klappen hoch, Vorspann-Einrasten, `F.edgeOwn(true)`, Lettern aus dem Bogen.

**(a) Kernaussage:** Von Pixel Arrays bis Gerwing: acht Stationen, die jüngste oben, im Mittelpunkt die Runden Group.

**(b) Satzliste** (Einträge, keine Sätze; von unten nach oben, älteste zuerst)

| Nr | Wortlaut | Quelle | Träger |
|---|---|---|---|
| R0 | **Werdegang** (Kicker: Vom Pixel-Raster bis zum Pflaster-Shop) | Seitentext unverändert, Kicker VORSCHLAG neu | Lettern auf der Fläche |
| R1 | 2000 bis 2006 · **Pixel Arrays** · erste Selbstständigkeit | Seitentext unverändert | Setzstufe 1 |
| R2 | 2007 bis 2010 · **HTK Hamburg** · Zertifikat Multimedia Design | Seitentext unverändert, Stufe vor Games gezogen | Setzstufe 2 |
| R3 | 2010 bis 2017 · **Games** · Spielprototypen in Flash und Haxe, danach Qualitätssicherung bei Goodgame Studios und Deep Silver FISHLABS | Fassung (22.10., Games-Stufe) | Setzstufe 3 |
| R4 | seit 2010 · **Freiberufliche Webprojekte** · seit 2018 als Andersen Webworks | Seitentext unverändert | Setzstufe 4 |
| R5 | 2017 · **YOOtheme** · Support Management | Seitentext unverändert | Setzstufe 5 |
| R6 | 2017 bis 2023 · **Tangram Werbeagentur** · Frontend-Entwicklung, unter anderem für Nissen, BIG Arbeitsschutz und EMPORE | Seitentext unverändert | Setzstufe 6 |
| R7 | 2023 bis 2025 · **Runden Group** · WBG Pooling und viele weitere Websites und Anwendungen der Firmengruppe | Fassung (22.10., ohne RPLC) | Setzstufe 7 (größerer Tritt) |
| R8 | seit 2023 · **Gerwing** · Umsetzung und laufende Betreuung des Onlineshops | Seitentext unverändert | Setzstufe 8 (Spitze) |

(HTK steht jetzt vor Games, damit die Stufen zeitlich aufsteigen; im Prototyp `werdegang.js` und im Seitentext stehen sie umgekehrt. Ab 2010 überlappen Games und freiberufliche Projekte, das bleibt so.)

**(c) Szenerie**

- **R1 bis R6:** Jede Stufe trägt oben das Faltzeichen ihrer Station, von einfach zu komplex (Zeichen wie in `werdegang.js`; Pixelkachel mit Mauszeiger bleibt für Pixel Arrays). 
- **R7:** Die Runden-Group-Stufe hat einen größeren Tritt als die anderen (Mutterfirma, viele Webseiten und Anwendungen), auf ihr ein Raster aus kleinen Fenstern. RPLC kommt nicht vor.
- **R8:** Auf der Spitze steht der Gerwing-Bildschirm klein. Der Punkt steht oben.
- **Entfällt:** Gerätegeschichte, Steg mit Teilstrichen, zusätzliche Mauer.

**(d) Übergang:** Der Faden steigt von der Spitze auf einen aufgeklappten Bericht (Leporello) zu, der sich rechts auf dem Bogen aufstellt.

---

## 15. Stimmen (Szene 12)

**Trägerform: Leporello.** Ein Faltband mit Seiten, die sich Seite für Seite aufschlagen. Satz für Satz auf je einer Seite. Zwei Bänder: SiS-Wirkungsbericht (fünf Seiten), ai-coustics (zwei Seiten, die Oberkante hat eine Zackenreihe, die glatt wird).
**Warum die Form passt:** Ein Leporello ist zugleich der Wirkungsbericht, über den SiS spricht, und es war die am besten lesbare Form bisher. Die Zackenkante wird glatt, weil „verlässlich“ der Kern der zweiten Stimme ist.
**Mechanik aus dem Kern:** Faltkern (Zickzackfalz, Seite für Seite), `ang0` (Startwinkel), Vorspann-Einrasten, `bounce`.

**(a) Kernaussage:** Kunden nennen mich verlässlich, engagiert und professionell.

**(b) Satzliste**

| Nr | Wortlaut | Quelle | Träger |
|---|---|---|---|
| Z0 | **Was Kunden sagen** (Kicker: Stimmen) | VORSCHLAG neu | Leporello-Deckel |
| Z1 | Seniorpartner in School (SiS) ist eine bundesweit agierende Sozialorganisation. | Zitat Karin, wörtlich | Seite 1 |
| Z2 | Ein gut aufgestellter **digitaler Wirkungsbericht** ist für unsere Arbeit wichtig. | Zitat, wörtlich | Seite 2 |
| Z3 | Jan-Erik und die kompetente Texterin Annemarie haben das für uns neue Format **professionell und barrierefreundlich** aufgesetzt. | Zitat, wörtlich (16 Wörter) | Seite 3 |
| Z4 | Super Teamarbeit, **verlässlich und engagiert**. | Zitat, wörtlich | Seite 4 |
| Z5 | SiS sagt **DANKE!** (Quelle auf der Rückseite: Karin, Seniorpartner in School · Google-Bewertung) | Zitat, wörtlich | Seite 5 |
| Z6 | Berufsbedingt habe ich schon mit verschiedenen Mediendesignern zusammengearbeitet und freue mich mit Andersen Webworks seit nun mehreren Jahren **einen zuverlässigen Partner** gefunden zu haben. | Zitat Corvin Jädicke, wörtlich (24 Wörter, unteilbar) | Band 2, Seite 1 |
| Z7 | Professionelles Webdesign das mich **immer wieder überrascht**, meine Vorstellungen werden ernst genommen und bekommen von Herrn Andersen den letzten Schliff, so setzt man sich von der Konkurrenz ab! (Quelle: Corvin Jädicke, ai-coustics · Google-Bewertung) | Zitat, wörtlich (28 Wörter, unteilbar) | Band 2, Seite 2 |

**(c) Szenerie**

- **Z1 bis Z5:** Der geschlossene Bericht steht auf und schlägt Seite für Seite auf. Der Faden läuft am Falz entlang (die Falzkante ist der Faden). Z3 enthält den Hinweis auf die Texterin: die Seite zeigt zwei schlichte Zeichen (Text, Gestaltung) nebeneinander.
- **Z4:** Auf der Seite wächst ein Häkchen, ruhig, ohne Rot (Rot bleibt Faden und Punkt).
- **Z5:** Die letzte Seite klappt zu, die Rückseite trägt die Quelle.
- **Z6 und Z7:** Das zweite Band steht daneben auf. Die Zackenreihe (Schallwelle, jede Zacke anders lang) klappt Zacke für Zacke hinter das Band, die Kante wird glatt: verlässlich. Dann steht aus der glatten Kante eine einzige Fahne auf: überraschend, der letzte Schliff. Die Fahne ist nur Bild für den letzten Schliff und trägt keinen Text; Z7 steht ganz auf Seite 2. Z6 und Z7 brauchen die doppelte Haltezeit.
- **Entfällt:** Satzteile über vier Halbsätze auf dem Band, Schlussfahne mit abgetrenntem Zitatrest.
- **Lesehilfe (neu):** Die fetten Schlüsselgruppen sind die Durchflieger-Version der Zitate (verlässlich und engagiert, einen zuverlässigen Partner, immer wieder überrascht).

**(d) Übergang:** Die Fahne bleibt stehen, der Faden läuft unter dem Band hindurch und nach rechts auf eine Schiene mit Steckschildern zu.

---

## 16. Für Agenturen (Szene 13)

**Trägerform: Einsteckschiene** (wie eine Schiene mit Steckschildern): eine Reihe Bauteile mit einer Lücke, in die sich das eigene Teil einsteckt.
**Warum die Form passt:** Der Satz beschreibt, wie ich in ein laufendes Projekt passe. Die Schiene zeigt genau das: ein vorhandenes System, in das sich ein neues Teil passgenau fügt (Katalog: genau).
**Mechanik aus dem Kern:** `F.slide` (das Teil schiebt sich ein), Vorspann-Einrasten (es rastet ein), `bounce`, Faltkern für die Schilder.

**(a) Kernaussage:** Ich steige in laufende Projekte ein und halte mich an Ihre Abläufe und Werkzeuge.

**(b) Satzliste**

| Nr | Wortlaut | Quelle | Träger |
|---|---|---|---|
| Y0 | **Für Agenturen** | Seitentext unverändert | Schienenkopf |
| Y1 | Ich **steige in laufende Projekte ein**. | VORSCHLAG neu, Original: „Ich steige in laufende Projekte ein, arbeite mich … ein und halte mich …“ (22 Wörter, zerlegt) | Steckschild 1 (in der Lücke) |
| Y2 | Ich arbeite mich in bestehende **Themes und Plugins** ein und halte mich an **Ihre Abläufe und Werkzeuge**. | VORSCHLAG neu, zweite Hälfte desselben Satzes | Steckschild 2 |
| Y3 | **Konditionen und freie Kapazität** nenne ich Ihnen auf Anfrage. | Seitentext unverändert | Steckschild 3 (Rückseite) |

**(c) Szenerie**

- **Y1:** Eine Reihe gleicher Bausteine (laufendes Projekt) steht auf der Schiene, an einer Stelle fehlt einer. Das Teil, das den Satz trägt, schiebt sich ein und rastet passgenau ein.
- **Y2:** Auf dem vorhandenen Raster wächst eine Aufstockung exakt in den vorhandenen Linien. Zwei Bausteine tragen die Beschriftungen „Theme“ und „Plugin“. Das neue Teil richtet sich nach Raster und Abläufen.
- **Y3:** Ein Schild hängt umgedreht an der Schiene, die Rückseite ist leer. Es steht für den Preis „auf Anfrage“, keine Zahl.
- **Entfällt:** Brücke von zwei Ufern, Teamtisch, Satzketten über mehrere Träger („arbeite mich … ein / und halte mich …“), Rastermodell ohne Beschriftung.

**(d) Übergang:** Der Faden läuft aus der Schiene, um das Schild herum und erreicht den Umschlag, der sich hinter dem Schild aus dem Bogen stellt. Zum Ende hin fährt die Kamera die letzten Meter ohne Haltepunkte zum Umschlag.

---

## 17. Kontakt (Szene 14, Ende)

**Trägerform: Briefumschlag mit Klappe.** Die Klappe öffnet sich, drei Karten fahren heraus. Der Faden endet am Siegel, der rote Punkt wird zum Siegelpunkt (der rote Schlusspunkt der Marke N4).
**Warum die Form passt:** „Schreiben Sie mir“ heißt Brief. Der Faden war die ganze Seite lang unterwegs, jetzt kommt er an. Der Schlusspunkt der Marke und der Punkt des Fadens sind derselbe rote Kreis.
**Mechanik aus dem Kern:** `F.spin` (Klappe öffnet, ohne Überschwingen), `F.slide` (Karten fahren heraus), Vorspann-Einrasten (Karten rasten ein), `K.link` (klickbare Flächen), Bleistiftspur.

**(a) Kernaussage:** Schreiben Sie mir, worum es geht. Mail, Telefon oder LinkedIn, ich antworte.

**(b) Satzliste**

| Nr | Wortlaut | Quelle | Träger |
|---|---|---|---|
| K1 | **Schreiben Sie mir, worum es geht.** | Seitentext unverändert (Überschrift) | Umschlag-Vorderseite, groß |
| K2 | Mail · **mail@andersen-webworks.de** | Seitentext | Karte 1 (`mailto:`) |
| K3 | Telefon · **+49 38733 270015** | Seitentext | Karte 2 (`tel:`) |
| K4 | LinkedIn · **andersen-erik** | Seitentext | Karte 3 (Link `https://www.linkedin.com/in/andersen-erik/`) |
| K5 | Raum Plau am See · remote · Impressum · Datenschutz | Seitentext (Kicker, Fuß) | Umschlag-Unterkante, klein |

**(c) Szenerie**

- **K1:** Der Umschlag steht quer vor der Kamera, die Klappe geht auf, der Faden endet im Siegel. Die Überschrift steht auf der Vorderseite, nicht darüber.
- **K2 bis K4:** Drei Karten fahren nacheinander heraus und stehen nebeneinander (Desktop) bzw. gestaffelt (Handy). Jede Karte ist ein echter Link, groß genug zum Antippen (Tippfläche mindestens 44 px, Schrift Desktop 22 px, Handy 18 px, heute 15 und 14).
- **K5:** Standort und Rechtliches in kleiner Zeile am Umschlag.
- **Letztes Bild (ganz im Bild, Haltefenster 40 vh):** Überschrift, Mail, Telefon, LinkedIn und Standort stehen gleichzeitig scharf im Rahmen, kein Teil angeschnitten. Die Kamera hält dort ruhig, die Karten bewegen sich nicht mehr.
- **Entfällt:** Lebenslauf-PDF, Haus mit offener Tür, kleiner Kartentext.
- **Fallback ohne WebGL:** der ganze Seitentext mit denselben Links, keine Lesebahn.

**(d) Übergang:** keiner, das ist das Ende. Der Punkt bleibt als Siegel stehen. Der Weg zurück läuft über die Pfeiltasten und die Navigation (Kontakt springt auf das letzte Bild).

---

## 18. Sprachprüfung

- Jeder Satz auf einem Träger ist ein ganzer Satz mit Verb. Ausnahmen: Köpfe (Überschriften), die Werdegang-Zeilen (Einträge), die Karten im Kontakt (Etikett plus Angabe).
- Zerlegte oder gekürzte Sätze (VORSCHLAG/gekürzt): E1/E2, G1, G2 bis G4, B2, M2/M3, S1, S3/S4, T1, W1/W2, Y1/Y2. Die Zerlegung verändert keine Aussage und fügt nichts Neues hinzu. Ausnahmen sind B3 (monatlich) und A1 (Sammelsatz), siehe Entscheidungen.
- Kommas: Nebensätze mit Komma („…, die in kein Standardformular passen“, „…, dass Inhalte und Adressen erhalten bleiben“, „…, ob sich das lohnt“). Aufzählungen ohne Komma vor „und“. Hauptsatzreihung mit Komma (G2).
- Die Zitate bleiben wörtlich, auch mit der fehlenden Kommasetzung bei „Professionelles Webdesign das mich …“.
- Länge: alle Sätze außerhalb der Zitate haben höchstens 20 Wörter (längster: A1 mit 20, danach S1 mit 19), die Zitate Z6 und Z7 mit 24 und 28 Wörtern sind unteilbar (siehe Entscheidungen).
- Ton: Ich-Form, direkt, keine Floskeln. Kein „Web-Betreuer“, kein „im Web seit …“, keine Arztvergleiche.
- Fakten: Runden Group im Zentrum, kein RPLC. Games 2010 bis 2017. Betreuung monatlich. Kein Lebenslauf-PDF. Raum Plau am See, remote. NOVUM-Cover und Audi-Motiv als Gestaltungsarbeiten, keine Auszeichnungen. ClautzGPT und „Andersen Web Tools“ erscheinen nirgends.

---

## 19. Offene Entscheidungen für Erik

| # | Frage | Empfehlung |
|---|---|---|
| 1 | Vierzehn verschiedene Trägerformen oder weniger? | Alle vierzehn, aber zuerst drei Prototypen (Kalender, Bon, Karteikarten) bauen und mit Werdegang-Treppe und Leporello vergleichen. Gemeinsame Regeln (Papier, Kante, Faden) halten die Szenen zusammen. |
| 2 | Eröffnung: Text auf Bildschirm und Rechnerwand statt Satzteile. | Ja, aber in Lesegröße ohne Zoom. Wenn es unruhig wirkt, Fallback: drei Tischaufsteller-Karten am Podest. |
| 3 | Eröffnungssatz in zwei Sätze zerlegen. | Ja, drei Aussagen (Bauen, Anbinden, Betreuen) bekommen je ihr Bild, einzelne Sätze sind schneller erfasst als ein Satz mit 18 Wörtern. |
| 4 | Betreuung: „monatlich“ statt „regelmäßig“. | Ja, entspricht der Tatsache, der Kalender blättert dann monatlich. |
| 5 | Take the Gloves Off: Zustimmung von Lilith liegt noch nicht vor. | Bis dahin nur Blatt mit „Ehrenamtlich“ und leerer Fläche, im Satz D3 nicht nennen. Danach Namen und Platzhaltersatz einsetzen. |
| 6 | Echte Arbeitsproben für die drei Staffelei-Blätter (Plakat, NOVUM-Cover, Audi-Motiv). | Erik liefert drei freigestellte Ausschnitte, sonst bleiben die Blätter Bleistiftflächen. Die Gestaltung ist der Beweis, leere Blätter beweisen nichts. |
| 7 | Außerdem: Einzelsätze fehlen. | Sammelsatz A1 bis dahin, Setzkasten bleibt. Wenn kein Satz kommt, Szene streichen (1,5 vh). |
| 8 | WBG: Läuft die Seite noch online? | Prüfen vor Veröffentlichung. Wenn nicht, keine Adresse nennen und keinen Bildschirm mit Seitenfoto zeigen, nur Papierkonstrukt. |
| 9 | Gerwing: Faktencheck der Funktionsbeschreibung (Gewicht und Fracht nach PLZ, Weiterleitung an den Händler). | Vor dem Bau prüfen, G3 und G4 hängen daran. |
| 10 | Stimmen: Zitate Z6 und Z7 (24 und 28 Wörter) sind zu lang für 2 bis 3 Sekunden. | Wörtlich lassen, Haltezeit verdoppeln, Schlüsselgruppen fett. Keine Auslassung. Das Fehlen des Kommas im Zitat nicht korrigieren. |
| 11 | SiS Satz Z1 (Organisationsbeschreibung) behalten? | Ja, fünf kurze Seiten, passt zum Leporello. |
| 12 | Reihenfolge: WBG hinter Schnittstellen, Take the Gloves Off in Gestaltung, Werdegang und Stimmen vor Agenturen und Kontakt. | Ja, wie oben begründet. |
| 13 | Schlüsselgruppen fett auf den Trägern. | Ja, das ist die Durchflieger-Spur. Nicht rot, Rot gehört dem Faden. |
| 14 | Werdegang: Treppe liest chronologisch aufwärts, Seitentext zeigt neueste zuerst. | Treppe aufwärts, weil Aufstieg und Leserichtung nach rechts passen. Neueste Stufe ist die Spitze. |
| 15 | Werdegang-Kicker „Vom Pixel-Raster bis zum Pflaster-Shop“. | Prüfen, ob der Ton passt, sonst „Acht Stationen, die jüngste oben“. |
| 16 | „Allein, wofür früher ein Team nötig war“ als Kopf der Szene Arbeitsweise. | Ja, kein Marketingsprech, steht so im Absatz. Alternative: nur „Wie ich arbeite“. |
| 17 | Mensch im Bild: Porträtfoto fehlt weiter (Grundsatz 5 der Fassung). | Aktuelles Foto als kleine Foto-Ecke am Kontakt-Umschlag, sobald ein Bild da ist. Bis dahin kein Platzhalter-Bild. |
| 18 | Länge 44 vh (Handy etwa 46). | Planmaß, nach dem ersten gebauten Durchlauf nachrechnen. Wenn Lesefenster knapp werden, zuerst Außerdem und Modernisierung kürzen, nicht Gerwing. |
| 19 | Fahrt in der Eröffnung: einmalige Hebung der Kamera vom Podest, danach starr. | Ja. Alles andere würde das Bild des Namens auf dem Podest brechen. |

## Stand 22.10.2026, nachts (Arbeitsstand zur Korrektur)

Umgebaut nach Lesebahn (Satzträger am Faden, Kamera Gier 0, Neigung 38° zentral `K.PITCH`, Punkt hält an jedem Satz):
- Gerwing: Lieferschein-Bon aus dem Papiermaul, Szenerie Terrasse → Steine → Palette → Händler → Laptop
- Betreuung: Abreißkalender (Monatsblätter), Szenerie Bildschirm mit Lücke, Uhr, Aufstellkalender
- Modernisierung: Schieber mit Lasche, Streifen altert von alt zu neu
- Schnittstellen: Anhänger mit zwei Ösen
- Wie ich arbeite: Prüfrahmen mit Tunnelrahmen
- Stimmen: SiS-Leporello am Faden, ai-coustics-Zitat in ganzen Sätzen auf zweitem Leporello
- Für Agenturen: Einsteckschiene mit Steckschildern
- Kontakt: Umschlag mit Überschrift und Standort, drei Karten als Links, Faden endet im roten Siegel; Handy als Briefbogen

Noch im bisherigen Aufbau (laufen, aber ohne Lesebahn): Eröffnung (bewusst, nur Doppelbild behoben), Shop, WBG, Gestaltung/Staffelei, Platzhalter, Werdegang.

Systemisch behoben: Nachbarträger stehen an Lesestellen ganz draußen (Abstand aus Bildbreite berechnet); fremde Szenen liegen im Lesebild im Dunst (Flächen, Linien, Drucke, Faden); Horizont oben, kein leeres oberes Drittel; Übergänge ohne Drehsprünge; Eröffnung ohne Doppelbild (HTML-Startbild deckungsgleich, Ablösung in 0,12 s); Konstruktionsphase (Spur, Gerüst) in allen Szenen gleich dicht.

Gesehen im Browser: Schnittstellen, Betreuung, Modernisierung, Gerwing, Kontakt (Desktop), Stimmen. Rechnerisch: alle Lesestellen Desktop 1280 × 900 und Handy 390 × 844 ganz im Rahmen, keine frühere Szene im Vordergrund.

Offen für die nächste Runde:
- Shop (Karteikarten), WBG (Drehscheibe), Gestaltung, Außerdem (Setzkasten), Werdegang an den Faden auf die Lesebahn umbauen; in diesen alten Szenen dreht die Kamera noch (bis 2,7 °/vh).
- Stimmen: Punkt sitzt mitten auf der Zitatseite statt am Fadenende; Leporello-Seiten stehen schräg.
- Wie ich arbeite: breite Prüfrahmen schneiden an zwei Lesestellen den Nachbarträger an.
- Fette Schlüsselgruppen auf den Trägern (Kern kennt keinen Teilfettdruck).
- Gesamtlänge noch rund 65 Bildschirmhöhen Desktop, 71 Handy (Ziel 40–50); kürzer wird es mit dem Umbau der alten Szenen.
- Offene Inhaltsfragen mit Empfehlung: siehe Abschnitt „Offene Entscheidungen“ oben.
