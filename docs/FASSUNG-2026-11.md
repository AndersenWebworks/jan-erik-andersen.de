# Fassung 2026-11 – Festlegungen aus der Szenenabstimmung

Ordner der Fassung: `entwurf-2026-11/` (noch nicht angelegt). Grundlage: `docs/ENTWURFSRUNDE-2026-10.md` (Regeln und harte Lehren, Pflichtlektüre) und `docs/KONSTRUKTE-KATALOG.md` (alle bisherigen Konstrukte je Abschnitt mit Passung).
Jede Entscheidung von Erik wird hier eingetragen, bevor gebaut wird.

## Arbeitsweise mit Erik

- Szene für Szene, je Entscheidung eine Auswahlkarte mit Knöpfen, `why` und `hint` je Option und einer Empfehlung mit Grund. Eine Frage nach der anderen, nie mehrere tiefe Fragen auf einmal.
- Erst bauen, wenn eine Szene festgelegt ist. Bauen in kleinen Schritten, einzeln oder in kleinen Gruppen.
- Vor jedem Link an Erik das Ergebnis selbst ansehen (Lese- und Fahrtbilder, Desktop und Handy).

## Grundsätze

1. **Netz, dann Fläche (21.10.2026, Erik):** Jedes Konstrukt zeichnet zuerst nur seine Kanten als feine Haarlinien, ohne Füllnetz. Danach klappen die Papierflächen hinein und rasten ein. Die Linie bleibt als Haarkante der Fläche. Im Lesebild steht nur fertiges Papier, das Netz ist eine Bauphase.
2. **Konstrukt ist, was der Text sagt (21.10.2026, Erik):** Kein Zwang zur Architektur. Häuser, Treppen und Terrassen waren nur Beispiele. Ein Konstrukt kann genauso ein Schreibtisch, ein Laptop oder ein Rechner sein, Hauptsache, es passt exakt zum Thema des Abschnitts. Die bisherigen Fassungen waren Technik- und Stiltests; thematisch gebaute Konstrukte gibt es noch nicht.
3. **Erst an der echten Eröffnungsszene testen (21.10.2026, Erik):** Fließtext, Netz-dann-Fläche und Bewegung werden am realen Einstieg aus dem Seitentext erprobt, nicht abstrakt entschieden.
4. **Aushängeschild, keine Tech-Demo (21.10.2026, Erik):** Kundenorientiert denken. Die Gestaltung soll beeindrucken und zeigen, dass Erik gestalterisch etwas kann, als Gegensatz zu seinem sonst sehr technischen Profil. Sie dient dem Besucher, nicht dem Effekt. Für die Eröffnung werden drei Varianten mit unterschiedlichem Stil und Ansatz getestet.

## Eröffnung: drei Varianten (21.10.2026, Erik)

Erik hat „So bauen“ gewählt. Gebaut in `entwurf-2026-11/`, umschaltbar über `#v=a|b|c`, Zustände über `#p=0…1`. Echter Einstiegstext, der Name steht von Anfang an lesbar.

- **A – Arbeitsplatz aus Papier:** Laptop, Handy, kleiner Rechner, Kabel, roter Statuspunkt; Projektmappe (Agenturen) und Telefon (direkt). Satzteile auf den Gegenständen.
- **B – Die Seite baut sich selbst:** Die Website hebt sich in Papierschichten aus der Fläche, hinten führt eine Leitung zu einem System; Satz zwei auf zwei Knöpfen.
- **C – Vom Entwurf zur Technik:** Eine Haarlinienskizze auf dem Tisch wird zum Bildschirm, ein Kabel führt zum Rechner.

**Stand 21.10.2026 abends:** Alle drei gebaut und am Desktop geprüft (Startbild und mehrere Lesestellen je Variante), A und B auch im Handy-Ausschnitt (`#…&w=390&h=844`, Prüfhilfe in `kern.js`). Gemeinsames Gerüst in `kern.js`, Druckbilder in `zeichnungen.js`. Beim Laden baut sich das Startbild in rund fünf Sekunden selbst auf (Netz, dann Flächen, bei A klappt der Laptop auf), damit der erste Eindruck fertiges Papier ist; beim Scrollen erscheinen die Satzteile an ihren Bauteilen, danach verlässt der rote Punkt den Statuspunkt und läuft auf der Messlinie zum Anriss „Gerwing“. Bekannte Schwächen: am Handy ist das Startbild klein (Name rund 30 px, viel Leerraum oben und unten); Gewicht und Tempo der Bewegung sind nur in Bewegung beurteilbar, nicht auf Standbildern.

**Erik, 21.10.2026:** B ist raus. A und C bleiben, aber ihr Aufbau ist „halb verloren gegangen“: Sie sollen sich richtig aufbauen, wie in den früheren Fassungen mit den stärkeren Netz- und Gitterideen (Haarlinien-Konstruktion, mechanisches Einrasten aus dem Vorspann-Test). Vor dem Umbau wollte er alle Varianten noch einmal vergleichen.

**Entscheidung Erik, 21.10.2026: Haarlinien + Einrasten.** Der Aufbau von A und C läuft über das Scrollen, nicht als Intro beim Laden. Erst wachsen die Kanten Linie für Linie als Haarlinien im Raum (Vorbild `entwurf-2026-10-b-konstruktion/`, Konstruktion 1), dann klappen die Papierflächen hinein und rasten mit Gewicht ein (anfahren, abbremsen, kurz überschwingen, einrasten; Vorbild `entwurf-2026-10-test-vorspann/`). Der Name steht beim Laden sofort lesbar da, das Modell davor nur als feiner Anriss. Kein Scroll-Lock, Kamera stetig und zügig. Damit ist auch die Bewegungssprache für die Eröffnung entschieden (mechanisch); ob sie für alle Abschnitte gilt, bleibt offen.

Für alle drei gilt (Erik): Bahn wie in der Mischung (`entwurf-2026-10-b-mischung/`): rote Linie mit Punkt am Boden, kein Scroll-Lock, kein Hijack, smoothes Durchlaufen. **Pacing:** Die Kamera fährt immer zügig und gedämpft weiter. An Lesestellen wird sie langsamer, aber nie so langsam, dass es stockt, denn die ganze Seite darf später nicht zäh werden.

**Stand 21.10.2026 spät: Haarlinien + Einrasten gebaut (A und C).** Kein Auftakt beim Laden mehr: Name und Unterzeile stehen sofort, vom Modell nur der Anriss (Eckmarken der Grundrisse und eine Fluchtlinie, Idee aus der Gerwing-Szene von `entwurf-2026-10-b-blatt/`). Scrollgekoppelt Phase 1 (Baufortschritt b 0–0,2, rund 0,5 Bildschirmhöhen): ruhiges Bauraster am Boden (jede vierte Linie kräftiger), dann wachsen die Kanten Linie für Linie, von links nach rechts gestaffelt, auslaufend gezeichnet, die Linie im Entstehen etwas kräftiger, mit Konstruktionsüberstand über die Ecken (Konstruktion 1). Phase 2 (b 0,2–0,42, fertig nach rund 1 Bildschirmhöhe): die Flächen schwenken aus ihren Scharnierkanten herein und rasten mit der Vorspann-Mechanik ein (anfahren, abbremsen, überschwingen), als Welle von links nach rechts (Idee aus `b-blatt`); die Überstände ziehen sich dabei zurück, Raster und Anriss verblassen. A: Laptop klappt auf, Kabel zieht sich. C: auf dem Blatt entsteht in Phase 1 die Website-Skizze, in Phase 2 klappt das Blatt hoch, der Standfuß hebt es, die Skizze wird zum Bildschirm. Der Name am Boden blendet aus, sobald der Bau steht. Erste Lesestelle bei rund 1,4–1,6 Bildschirmhöhen. Am Handy Name zweizeilig (rund 70 statt 30 px). Variante B nicht nachgezogen. Geprüft mit 16 Standbildern (Desktop und Handy) in `entwurf-2026-11/_pruefung/` (nicht im Repo); Tempo und Gewicht der Mechanik nur in Bewegung beurteilbar, noch offen.

**Erik, 21.10.2026 nach Ansicht:** `entwurf-2026-10-b-raumtext-2/` kam besser rüber, trotz der falschen Modelle, weil alles wie auf einer Karte oder einem Grundstück steht und daraus hochklappt. Befund Clautz: Dort kommt alles aus einem Papierbogen (Pop-up-Buch, im Bogen bleibt der Abdruck); A und C stehen dagegen auf einem endlosen Raster im leeren Raum und wirken wie ein CAD-Programm statt wie ein gebautes Objekt.

**Entscheidung Erik, 21.10.2026: Bogen + Bastellinien.** Grundlage der Eröffnung wird Raumtext 2 (Bogen, Faltbaum, Kamera, Lettern aus dem Papier mit Abdruck, Text auf den Flächen). Die Modelle werden die thematischen aus A (Laptop, Handy, Rechner, Kabel, roter Statuspunkt, Mappe, Telefon) bzw. C (Skizze auf dem Tisch wird Bildschirm, Kabel zum Rechner). „Netz, dann Fläche“ bleibt, aber als Bastelbogen: Erst zeichnen sich auf dem Bogen die Schnitt- und Falzlinien, dann schneidet sich das Teil frei, klappt hoch und rastet mechanisch ein (Vorspann-Mechanik). Das Raster im leeren Raum entfällt. Ersetzt den Stand „Haarlinien + Einrasten“ im Raum.

## Fließtext: Test vom 21.10.2026

Testszene `entwurf-2026-11-test-fliesstext/` (Gerwing-Terrasse aus dem Vorspann-Test, echter Seitentext), umschaltbar über `#v=a` / `#v=b`, Zustände über `#p=0…1`. Vorschau: `/api/project-preview/?projectId=jea-website&path=entwurf-2026-11-test-fliesstext%2Findex.html#v=a`.

- **A – Satz für Satz am Bauteil:** trägt. Einstiegssatz auf der Front der Terrasse (löst zugleich „Frontfläche leer“), „Quadratmeter“ und „ganze Steine“ auf den Stirnkanten der Steinreihen, „laufend weiter“ Stufe für Stufe auf den Setzstufen (stärkste Stelle). Schwächen: Palettenetikett hat Rand und wirkt wie eine kleine Karte (ohne Rand direkt auf die oberste Platte drucken); in den Lesestellungen bleibt oben ein Drittel leer (Ausschnitt enger); am Handy Text gut, Modell kaum sichtbar.
- **B – Lesespalte:** sauber und am Handy am robustesten, aber das Modell steht daneben wie eine Illustration.
- **Empfehlung Clautz: A** als Prinzip für alle Abschnitte. **Eriks Entscheidung steht noch aus** und ist die erste Frage der neuen Sitzung.

## Offen (in dieser Reihenfolge abfragen)

1. Fließtext: A oder B (siehe oben)
2. Bewegungssprache: mechanisch wie im Vorspann (anfahren, abbremsen, überschwingen, einrasten) für alle Abschnitte oder nur für Gerwing
3. Welche Abschnitte ein eigenes Konstrukt brauchen
4. Szenen je Abschnitt (Kernaussagen und bisherige Konstrukte im Katalog)
