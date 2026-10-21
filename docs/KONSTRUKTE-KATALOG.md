# Konstrukte-Katalog – alle Szenen aus den Entwürfen Oktober 2026

Stand: 21.10.2026. Grundlage für die Szene-für-Szene-Abstimmung der Fassung `entwurf-2026-11/`.
Quellen: Kopfkommentare der Modell-Einheiten in `konstruktion.js` bzw. `szene.js`, `vorspann.js`, `modelle.js` der jeweiligen Ordner, dazu `docs/ENTWURFSRUNDE-2026-10.md`. Zeilenangaben beziehen sich auf den Stand dieses Tages.

Passung: **genau** = das Modell tut, was im Absatz steht (Maßstab Gerwing: Fläche → ganze Steine). **teils** = trifft einen Teil der Aussage. **Bild** = allgemeine Metapher, die zu fast jedem Thema passen würde.

## Familien

Viele Ordner teilen sich denselben Modellsatz. Damit die Tabellen nicht doppeln, steht jede Familie einmal:

| Kürzel | Ordner | Stil | Bewegung | Text |
|---|---|---|---|---|
| K1 | `b-konstruktion` | Haarlinien (LineSegments), Maße und Achskreise | Linien wachsen mit dem Kapitel (Shader `uProg`) | DOM daneben |
| K2 | `b-konstruktion-2` | Haarlinien, frontal flach | Linien wachsen, Schriftlinien laufen in den Rahmen | DOM |
| K3/4 | `b-konstruktion-3`, `-4` (gleicher Satz) | Haarlinien, 3D im Hintergrund | Linien wachsen, Teile wandern auf Bögen | DOM, bei 4 Slides |
| K5 | `b-konstruktion-5`, `b-mischung` (Abschnitte 2–6, 10–15 gleich) | Haarlinien, thematisch genauer | wie K3, ein Fortschritt je Abschnitt | DOM |
| M2 | `b-mischung-2`, `b-raumtext` (gleicher Satz) | Linien plus fast weiße Füllflächen (Hidden-Line), Geräte mit Fotos | Linien wachsen, Flächen füllen nach | M2: DOM mit Snapping; Raumtext: Karten an Trägern |
| G | `b-geraete` | Linien, Bildschirme mit echten Fotos | Linien wachsen, Teile wandern | DOM |
| K6 | `b-konstruktion-6` | Linienmodelle von Arbeitsobjekten | Wachsen im Shader | DOM |
| K7 | `b-konstruktion-7` | **Papierfaltung**, gefüllte Flächen, Haarlinienkante | Scharniere klappen mit Faltzustand 0→1, Drehteller, Schlitten | DOM |
| RT2 | `b-raumtext-2` | Papierfaltung (Technik aus K7) | Faltung am Scroll, stetige Kamerabahn ohne Plateau | troika-Text auf Modellflächen |
| BL | `b-blatt` | Papierfaltung aus einem Blatt | Faltung, Scroll-Tween zwischen Blättern (Ruhelage flach) | Text auf den Blattflächen |
| VS | `test-vorspann` | Papier plus Zahnräder | **mechanisch**: anfahren, abbremsen, überschwingen, einrasten (`mech`, Z. 11) | Überschrift auf einrastender Wand |

Ohne Konstrukte (nur Technik-Referenz): `entwurf-2026-10` (Name als 22 gestaffelte Ebenen, Wellen-Shader), `-a` (Wörter aus ~14.000 Partikeln), `-b` (dunkle Kamerafahrt, Wort-Planes, Fotos, roter Faden – Kern aller späteren Fahrten), `-b-hell` (wie b, weiß), `-b-linie` (SVG-Stiftlinie ohne three.js), `-c` (Plakat mit Linse).

## Szenen je Abschnitt

Abschnitte nach dem aktuellen Seitentext (`b-raumtext-2/index.html`). Kernaussage in einem Satz, danach alle bisherigen Konstrukte.

### 0 Einstieg
Kernaussage: Ich entwickle Websites und Shops, binde sie an Ihre Systeme an und betreue sie; Agenturen holen mich ins Projekt, Unternehmen arbeiten direkt mit mir.

| Fassung | Konstrukt | Passung |
|---|---|---|
| K1 | Grundraster mit Achsen, erster Rahmen erhebt sich (Z. 162) | Bild |
| K2 | Grundlinie und Versalhöhe des Namens werden Sockel und Balken (Z. 201) | Bild, Schrift als Material |
| K3/4 | Baugrund, erster Rahmen (Z. 258/261) | Bild |
| K5, M | Haus auf dem Sockel der Überschrift, Stege zu zwei Nachbarbauten, rotes Element (Z. 280) | teils (entwickeln, anbinden, betreuen) |
| G | Schreibtisch an der Grundlinie des Namens, Monitor, Laptop, Handy, Kabel, roter Statuspunkt (Z. 408) | teils |
| K6 | Arbeitsplatz mit Bildschirm, Tastatur, Laptop, Lampe (Z. 597) | Bild |
| K7 | Website, Shop und angebundenes System falten sich aus einem Bogen (Z. 225) | **genau** (die drei Verben des Satzes) |
| RT2 | wie K7, Name als ausgeschnittene Lettern auf Stufen, Text auf der Website-Seite (Z. 28) | **genau**, Lettern tragen |
| BL | Haus mit Nachbarbauten und Stegen, Tür wird rot (`modelle.js` Z. 9) | teils |

### 1 Gerwing
Kernaussage: Pflaster nach Fläche bestellen; der Shop rechnet m² in ganze Steine, Gewicht und Fracht nach PLZ und leitet an den Händler weiter.

| Fassung | Konstrukt | Passung |
|---|---|---|
| K1 | Pflasterraster mit gestuften Terrassenkörpern (Z. 179) | teils |
| K2 | Fläche wird in Steine geteilt, Stufen, Bilder hängen wie Pläne (Z. 237) | teils |
| K3/4 | Fläche teilt sich Reihe für Reihe in Steine, Stufen daneben (Z. 271) | genau (m² → Steine) |
| K5 | Fläche → ganze Steine, letzte Reihe ragt über die Kontur → Palette auf Ladefläche → fährt auf der roten Linie zum Händlerhaus (Z. 310) | **genau, vollständigste Kette** (Fläche, ganze Steine, Gewicht, Händler) |
| M2, G | Laptop und Handy mit echten Shopbildern, Steinstapel, rote Linie Handy → Palette → Paket (Z. 562/439) | teils, echte Referenz trägt |
| K6 | Laptop mit Produktseite, Steinstapel (Z. 609) | teils |
| K7 | Steine im Läuferverband Reihe für Reihe, Treppe zur Terrasse, Gerät daneben (Z. 244) | **genau**, Maßstab |
| RT2 | Hauswinkel mit Glastüren, Terrasse mit hochklappenden Wänden, Laptop und Handy mit echtem Shop (Z. 88) | genau |
| BL | Fläche umrissen, Läuferverband, Terrasse mit Treppe, Steinstapel auf Palette, Fracht nach PLZ zu Händlern (rote Linie), Laptop/Handy (`modelle.js` Z. 71) | **genau**, ganze Kette |
| VS | Grundriss → Pfosten und Wände → Zahnradkette mit roter Welle → sechs Plattenreihen klappen mechanisch → Teleskoptreppe → Palette → Wand mit Überschrift steigt aus Schlitz | **genau**, beste Bewegung; Werk zu klein, Endbild wie Podest |

### 2 Betreuung und Absicherung
Kernaussage: Zwischen Bekanntwerden einer Plugin-Lücke und erstem Angriff vergehen oft Stunden; ich halte die Seite laufend aktuell und sehe regelmäßig nach.

| Fassung | Konstrukt | Passung |
|---|---|---|
| K1 | Skelettbau mit Geschossen (für alle Leistungen, Z. 192) | Bild |
| K2, K3/4 | Gerüst und Einhausung um einen Baukörper (Z. 280/282) | Bild |
| K5, M2 | Haus hinter Pfostenzaun, ein Pfosten fehlt und wird eingesetzt, Kontrollgang (Z. 331/589) | teils (Lücke schließen, Nachsehen) |
| G | Statusdashboard, Server-Rack mit Einschub, Vorhängeschloss schließt sich rot (Z. 466) | teils |
| K6 | Serverschrank, Bildschirm mit Prüfliste (Z. 621) | teils |
| K7, RT2 | Haus, Zaun klappt Feld für Feld hoch, Ausguck an der Ecke, rote Kontrolllinie (Z. 261/163) | teils; „Haus“ ist das, was Erik kritisiert |

Fehlt bisher: das Zeitmoment (Lücke bekannt → Stunden → Angriff) und das Regelmäßige (wiederkehrender Rundgang).

### 3 Modernisierung
Kernaussage: Alte WordPress-Seiten auf veralteten Themes, Plugins und PHP technisch und gestalterisch auf heutigen Stand bringen, Inhalte und Adressen bleiben erhalten.

| Fassung | Konstrukt | Passung |
|---|---|---|
| K2, K3/4 | neuer klarer Bau vor/über einem schiefen alten (Z. 306/289) | Bild |
| K5, M2 | Fassade bleibt, dahinter wird schiefes Tragwerk durch neues ersetzt (Z. 373/634) | teils (Erhalt + Austausch) |
| G | Röhrenmonitor, dessen Blockstruktur in einen Flachbildschirm wandert (Z. 497) | **genau** (Inhalte wandern mit) |
| K6 | Bildschirm, alte Seite verschwindet, neue entsteht (Z. 631) | teils |
| K7, RT2 | altes Haus legt sich flach, Flachdachbau faltet sich auf, der Weg (Adressen) bleibt (Z. 280/206) | teils; Adressen-Weg ist genau, Haus nicht |

### 4 Shops und Shop-Wechsel
Kernaussage: Shops für Produkte, die in kein Standardformular passen (Fläche, Gewicht, Entfernung); Wechsel von Shopify zu WooCommerce, vorher durchgerechnet, Produkte, Kunden, Bestellungen ziehen um.

| Fassung | Konstrukt | Passung |
|---|---|---|
| K2, K3/4 | Bauteile wandern von einem Baukörper in den anderen (Z. 334/307) | teils (Umzug) |
| K5, M2 | Standardregal links, Bau nach Maß rechts, Teile wandern, das sperrige zuletzt (Z. 400/662) | teils (Sonderformat) |
| G | zwei Tablets, Produkt-, Kunden- und Bestellkarten wandern vom linken ins rechte (Z. 530) | **genau** für den Wechsel (die drei Dinge des Satzes) |
| BL | Preisschild mit wachsendem Gebührenstapel, Standardregal, Fächer nach Maß, Waage, drei Karten über eine Brücke, sperriges Teil rastet ein (`modelle.js` Z. 153) | **genau**, deckt beide Hälften ab (Gebühren, Durchrechnen, Umzug, Sonderformat) |
| K6 | Produkte wandern von einem Tablet aufs neue (Z. 642) | teils |
| K7, RT2 | Ladenfront mit Markise und Ladenschild, Palette mit Kiste, Pakete in Unformaten (Z. 291/245) | teils; Ladenschild als Überschrift trägt |

### 5 Schnittstellen und eigene Werkzeuge
Kernaussage: Websites und Shops mit CRM, ERP, Bewerbermanagement verbinden (WBG: Salesforce, Concludis); wo gekaufte Werkzeuge nicht passen, ein eigenes bauen.

| Fassung | Konstrukt | Passung |
|---|---|---|
| K2, K3/4 | getrennte Bauten, durch Stege verbunden (Z. 366/329) | Bild |
| K5, M2 | drei Bauten, Leitungen mit Flanschen, laufende Segmente, eigenes Formstück dazwischen (Z. 435/697) | **genau** (verbinden + Eigenbau) |
| G | drei Geräte, Stecker passt nicht, eigenes rotes Adapterstück entsteht (Z. 562) | **genau**, sehr direkt |
| K6 | drei Fenster (Website, CRM, Werkzeug) mit Kabeln (Z. 665) | teils |
| K7, RT2 | drei Türme, Zugbrücken klappen aus den Wänden, rote Linie darüber (Z. 302/313) | teils (verbinden; Eigenbau fehlt) |

### 6 Gestaltung
Kernaussage: Gestaltung gehört zur Entwicklung; Erscheinungsbilder und Oberflächen selbst entwerfen oder Entwürfe sorgfältig umsetzen. Belege: Take the Gloves Off, NOVUM-Cover, „100 Jahre Audi“.

| Fassung | Konstrukt | Passung |
|---|---|---|
| K2, K3/4 | Proportionsraster legt sich auf eine Fassade (Z. 395/340) | Bild |
| K5, M2 | flacher Plan, Bau wächst exakt über den Planlinien (Z. 459/721) | teils (Entwurf → Umsetzung) |
| G | Zeichenbrett, Layout entsteht und hebt sich deckungsgleich als Bildschirm ab (Z. 601) | **genau** (Gestaltung = Entwicklung) |
| K6 | Reißbrett mit Lineal und Dreieck (Z. 678) | Bild |
| K7, RT2 | goldener Schnitt als Schachtelfolge, rote Spirale auf den Deckeln, Zeichenbrett (Z. 318/328) | Bild; schön, aber nicht aus dem Text |

### 7 Weitere Arbeit: WBG Pooling
Kernaussage: Industrie- und Vertriebsportal mit 360-Grad-Produktansichten, geschütztem Vertriebsbereich, Anbindung an Salesforce und Concludis.

| Fassung | Konstrukt | Passung |
|---|---|---|
| K3/4 | Halle mit Sheddach und Drehteller (Z. 350) | teils |
| K5 | Halle, Drehteller mit Objekt, abgetrennter Bereich mit Tor, zwei Leitungen zu entfernten Blöcken (Z. 480) | **genau** (alle drei Funktionen) |
| M2, G | Monitor mit Portal, Produkt auf Drehteller, Login-Fenster mit Schloss, zwei Kabel (Z. 743/645) | **genau** |
| K6 | Bildschirm mit Portal und Drehteller (Z. 685) | teils |
| K7, RT2 | Produkt faltet sich auf dem Drehteller und dreht sich mit dem Scroll, Mauer mit Tor (Z. 339/347) | genau (360° + geschützt; Anbindung fehlt) |

### 8 Weitere Arbeit: Take the Gloves Off
Kernaussage: Erscheinungsbild für ein Ehrenamt (Satz und Zustimmung von Lilith offen).

| Fassung | Konstrukt | Passung |
|---|---|---|
| K3/4 | offener Pavillon auf Podest (Z. 366) | Bild |
| K5, M2 | Boxring mit Podest, Eckpfosten, Seilen, ein Eckpolster rot (Z. 517/773) | Name wörtlich genommen |
| G | Staffelei mit Plakat, Boxhandschuhe (Z. 675) | teils |
| K6 | Staffelei mit Plakat (Z. 694) | teils |
| K7, RT2 | Plakatfolge auf Podest, jedes Format mit eigenem Zeichen (Z. 354/361) | **genau** (Erscheinungsbild = Formate) |

### 9 Außerdem
Kernaussage: Onkologie Laatzen, Mindblossom und Soundhealing, SiS-Wirkungsbericht, Bäckerei Behrens (Sätze offen).

| Fassung | Konstrukt | Passung |
|---|---|---|
| K3/4, K7, RT2 | Reihe/Straße kleiner verschiedener Häuser (Z. 380/366/370) | Bild, „Häuser“ |
| K5 | vier Bauten je Referenz: Praxis mit Vordach, Kuppelpavillon (Klang), Buch auf Pult, Bäckerei mit Ofen (Z. 533) | **genau** (je Referenz ein Zeichen) |
| M2, G | vier Geräte mit je anderer Seitenstruktur, Tablet mit Bericht (Z. 800/708) | teils |
| K6 | Referenzen auf Smartphone, Tablet, Laptop (Z. 701) | teils |

### 10 Wie ich arbeite
Kernaussage: Mit eigenen KI-Abläufen schaffe ich allein, wofür früher ein kleines Team nötig war; Entscheidungen und Verantwortung bleiben bei mir, ausgeliefert wird nur Geprüftes.

| Fassung | Konstrukt | Passung |
|---|---|---|
| K1, K2, K7, RT2 | Grundriss am Boden, Wände richten sich auf (Z. 216/426/377/381) | Bild |
| K5, M2 | Turmdrehkran setzt Bauteile, jedes Teil passiert einen Prüfrahmen, Bau wächst Geschoss für Geschoss (Z. 569/817) | **genau** (Werkzeug hebt, ich prüfe, dann ausgeliefert) |
| G, K6 | Kanban, Karten laufen bis „geprüft“, Prüfrahmen, roter Haken (Z. 725/710) | **genau**, aber Kanban widerspricht Eriks Abneigung gegen Ticketkram |

### 11/12 Werdegang
Kernaussage: acht Stationen von Pixel Arrays (2000) bis Gerwing (seit 2023), neueste oben.

| Fassung | Konstrukt | Passung |
|---|---|---|
| K1 | Steg mit Teilstrichen (Z. 235) | Bild |
| K2, K3/4, K5, M2 | Steg mit Stationen von einfach zu komplex, jede erscheint mit ihrer Zeile (Z. 456/422/604/853) | teils |
| G | Geräte entlang einer Zeitachse, neueste vorn (Z. 765) | teils (Gerätegeschichte, nicht Eriks Stationen) |
| K6 | Geräte von früher bis heute auf langem Tisch (Z. 717) | teils |
| K7, RT2 | Weg mit sechs bzw. acht Stationen, jede faltet sich aufwendiger, lange Mauer (Z. 394/398) | teils |

Fehlt bisher: Bezug auf die konkreten Stationen (Pixel Art, Flash-Spiele, Agentur, Shop).

### 13/14 Stimmen
Kernaussage 1 (SiS): Wirkungsbericht als neues Format, professionell und barrierefreundlich, gemeinsam mit Annemarie. Kernaussage 2 (ai-coustics): seit Jahren verlässlich, Vorstellungen ernst genommen, der letzte Schliff überrascht.

| Fassung | Konstrukt | Passung |
|---|---|---|
| K1, K2, K3/4, K5, M2 | Gewölberippen, Bogenhälften mit rotem Schlussstein, Arkade (Z. 254/491/435/629/879) | Bild |
| G | zwei Laptops an einem Tisch mit gemeinsamem Dokument; Ordnerreihe füllt sich Jahr für Jahr (Z. 803/819) | teils (Teamarbeit, mehrere Jahre) |
| K6 | Tablet und Handy mit dem Wirkungsbericht; Bildschirm plus Grafiktablett für den letzten Schliff (Z. 733/741) | **genau** |
| K7, RT2 | Leporello entfaltet sich Seite für Seite (Bericht); Faltfächer öffnet sich zum Halbrund (Z. 407/423) | Stimme 1 **genau**, Stimme 2 Bild |

### 15 Für Agenturen
Kernaussage: Ich steige in laufende Projekte ein, arbeite mich in bestehende Themes und Plugins ein, halte mich an Ihre Abläufe und Werkzeuge.

| Fassung | Konstrukt | Passung |
|---|---|---|
| K1, K3/4 | Brücke wächst von beiden Ufern (Z. 269/463) | Bild |
| K5, M2 | bestehendes Gebäude mit Raster, Aufstockung wächst exakt im vorhandenen Raster (Z. 667/917) | **genau** (in Bestehendes einfügen) |
| G | Teamtisch, ein weiterer Platz im selben Raster (Z. 837) | **genau** |
| K6 | zwei Bildschirme mit laufenden Projekten (Z. 750) | teils |
| K7, RT2 | Reihe gleicher Bauten mit Lücke, neues Teil faltet sich passgenau hinein (Z. 435) | genau (Einsteigen in Laufendes) |

### 16 Kontakt
Kernaussage: Schreiben Sie mir, worum es geht. Mail, Telefon, LinkedIn, Lebenslauf.

| Fassung | Konstrukt | Passung |
|---|---|---|
| K1–K5, M2, K7, RT2 | Haus mit offener Tür, rote Linie endet auf der Schwelle (Z. 288/527/481/692/943/446/444) | Bild, schlüssiges Ende des Fadens |
| G | Briefumschlag und Telefon, Linie endet am Umschlag (Z. 861) | **genau** („schreiben“) |
| K6 | Smartphone mit geöffneter Nachricht, Briefumschlag (Z. 771) | **genau** |

## Beobachtungen

- Die genauesten Konstrukte stammen oft aus den Linien- und Gerätefassungen (K5, G), die schönste Bildsprache und Bewegung aus K7 und dem Vorspann. Die nächste Fassung kann die Inhalte von dort mit der Faltung und Mechanik von hier verbinden.
- „Haus“ kommt in Einstieg, Betreuung, Modernisierung, Außerdem und Kontakt vor. Ohne Haus genau sind bisher nur Gerwing (Terrasse ist das Produkt) und Kontakt (Tür als Endpunkt des Fadens) zu begründen.
- Drei Abschnitte haben in keiner Fassung ein wirklich genaues Konstrukt: Betreuung (Zeit und Regelmäßigkeit), Werdegang (konkrete Stationen) und Stimme 2.
- Text im Modell: Lettern (RT2 Einstieg), Ladenschild (RT2 Shops) und die einrastende Wand (VS) tragen. Lange Absätze auf großen Wänden (RT2 ab Betreuung) wirken als Tafel.
