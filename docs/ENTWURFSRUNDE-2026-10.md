# Entwurfsrunde Oktober 2026 – Erkenntnisse aus allen Varianten

Stand: 21.10.2026. Grundlage für die nächste Iteration der Startseite von jan-erik-andersen.de.
Alle Entwürfe bleiben als Referenz liegen und werden nicht überschrieben. Neue Fassungen entstehen immer in einem eigenen Ordner.

Vorschau im Webchat: `/api/project-preview/?projectId=jea-website&path=<ordner>%2Findex.html`

## Festgelegt (Inhalt)

- Eine Seite unter jan-erik-andersen.de statt zwei Auftritten. Zielgruppen: Agenturen und Projektgeber, Mittelstand, Arbeitgeber für Remote-Teilzeit.
- Das obere Ende führt. Fünf getrennte Leistungsfelder: Betreuung und Absicherung, Modernisierung bestehender Seiten, Shops und Shop-Migration, Schnittstellen und eigene Werkzeuge, Gestaltung und Erscheinungsbild.
- Erfahrung zeigt sich über Referenzen aus allen Zeiten, nicht über Jahreszahlen-Slogans.
- Gerwing steht direkt nach dem Einstieg. Große Referenzen bekommen eigene Projektseiten (Gerwing-Seite noch nicht begonnen).
- Stundensatz nur auf Anfrage. Englisch erst nach dem Start. Sie-Anrede, aber ohne Steifheit.
- Gerwing: seit 2023 selbst gebaut und betreut; das Grundlayout kam aus einem Entwurf, Produktseiten, Mengenrechner und Bestellablauf sind selbst gestaltet. Keine Agentur, kein Wechsel, keine interne Vorgeschichte auf der Seite.
- Texte in Eriks eigenem Stil: Problem, Lösung, konkret. Keine Slogans, keine gespiegelten Werbesätze (abgelehnt: „seit 2000 im Web, heute mit den Werkzeugen von heute“). Annemarie liest die Endfassung.

## Festgelegt (Gestaltung)

- Editorial mit Tiefe. three.js dient der Schrift und dem Inhalt, nicht als Effekt daneben.
- Hintergrund knallweiß #ffffff, Text #303033, Akzent Rot #d40235. Serife für Überschriften, Grotesk für Fließtext, Schriften lokal.
- Kein Pixel-Anklang. Kein Glow, nirgends. Keine Maße, Achsbuchstaben oder Planziffern im Raum.
- Auf großen Bildschirmen (27") nicht die ganze Breite nutzen.
- Mobil kompatibel, smooth. Vor/Zurück-Knöpfe als „Slides“ pro Thema zusätzlich zum Scrollen.
- Roter Faden mit schlichtem, einfarbigem rotem Punkt läuft durch die ganze Seite.

## Harte Lehren (nie wieder)

1. **Kein Scroll-Lock, auch nicht verdeckt.** Mischung 2 hatte Snapping, Raumtext ein Ruheplateau von 60 % je Halt, in dem die Kamera einfriert. Beides fühlt sich gleich an: Man scrollt, nichts passiert, dann ruckt es. Scroll muss kontinuierlich und gedämpft auf die Kamera wirken; an Lesestellen wird die Bahn nur langsamer, nie null.
2. **Fahrten nicht zusammenpressen.** Wenn Ruhephasen den Scrollweg fressen, werden die Fahrten hastig. Animationen langsam und an den Scrollfortschritt gekoppelt, rückwärts baut zurück.
3. **Tiefe muss in der Lesephase sichtbar bleiben.** Frontal-flache Ansichten wurden zweimal verworfen (Konstruktion 2, Blatt).
4. **Text ist kein Fremdkörper.** Schwebende Tafeln mit Schatten (Raumtext) wirken wie Folien vor dem Raum. Text gehört auf Flächen der Konstruktion selbst.
5. **Modelle erzählen den Absatz.** Maßstab ist der Gerwing-Abschnitt der Papierfaltung: Treppe und Terrasse bauen sich, die echte Referenz läuft auf einem Gerät daneben. Allgemeine Bauten („Haus mit Gerüst“) reichen nicht.
6. **Gefüllte Papierflächen statt Drahtgitter.** Drahtgitter wirkt unruhig und billig.
7. **Kamera ruhig, aber mit Mut zwischen den Abschnitten.** Halbe Schwenks, keine Richtungswechsel innerhalb eines Abschnitts; zwischen den Abschnitten filmische Fahrten um, durch oder über eine Konstruktion.
8. **Vorschau ist abgeschottet.** Die Webchat-Vorschau läuft im sandboxed iframe ohne allow-same-origin und mit `worker-src 'none'`: keine Web-Worker, kein localStorage, kein Nachladen per fetch/XHR. Schriften inline einbetten. Lokal mit `http.server` zu testen reicht nicht.
9. **Komplexe 3D-Modelle auf Opus bauen**, nicht auf dem Standard-Helfer.
10. **Prüfen in der Vorschau:** Das Browserwerkzeug kann im abgeschotteten Vorschau-iframe weder Knöpfe drücken noch die Konsole lesen. Zwischenstände deshalb über einen Anker wie `#p=0.4` ansteuerbar machen (Ankerwechsel lädt nicht neu); Knopf und Konsole lokal in einem nachgebauten Sandbox-iframe testen. Gewicht und Timing von Bewegung sieht man nur in Bewegung, nicht auf Standbildern.
11. **Text an kleinen, zugehörigen Flächen** (Ladenschild, Lettern, einrastende Wand mit Überschrift) trägt. Langer Fließtext auf großen Wänden wird wieder zur Tafel (Raumtext 2).
12. **Keine Headless-Edge mit SwiftShader.** `--use-angle=swiftshader` rechnet WebGL auf dem Prozessor; zwei solche Läufe parallel haben am 21.10.2026 den Rechner voll ausgelastet und den Webchat-Server mitgerissen. Prüfbilder über das Browserwerkzeug des Webchats; ist lokal doch ein Headless-Lauf nötig, dann höchstens einer, mit Grafikkarte, niedriger Priorität und beendet direkt nach dem Bild.
13. **Kamera berechnen, nicht erraten.** Lesestellungen nie durch Zahlenprobieren mit Prüfbild-Schleifen finden (kostete am 21.10.2026 eine Dreiviertelstunde, über 30 Renders und den Rechner). Die Stellung wird aus der Textfläche berechnet: Mittelpunkt, Normale und Höhe der Fläche, gewünschte Fließtextgröße in Pixeln (Desktop 18–21 px, Handy 16 px), Sichtfeld, Gier- und Neigungswinkel. Vorlage: `readingPose()` in `entwurf-2026-10-b-raumtext-2/raum.js` (ab Z. 117, mit `FOV`/`FS` in Z. 25, Zeitverzerrung in Z. 185 ff.). Danach höchstens ein Kontrollbild je Stelle.
14. **Helfer bekommen den Weg, nicht nur das Ziel.** Wer einen Bau abgibt, schreibt Rechenweg, Prüfweg (Webchat-Browser, ein Bild nach dem anderen) und eine Obergrenze für Prüfbilder in den Auftrag. Pakete für 3D-Arbeit sind so klein, dass sie in einem Zug prüfbar sind.

## Die Varianten

| Ordner | Idee | Was trägt | Was nicht trägt |
|---|---|---|---|
| `entwurf-2026-10` | Serife, rote Kante, nummerierte Kapitel | – | Vorlagen-Look, Tiefe nur als Effekt, „grundsätzlich anders“ verworfen |
| `entwurf-2026-10-a` | Partikel: Wörter aus Punkten, die sich neu zusammensetzen | Schrift als Material | nicht weiterverfolgt |
| `entwurf-2026-10-b` | Dunkler Raum, Kamerafahrt durch Kapitel in der Tiefe | **Die Kamerafahrt ist der Kern aller späteren Fassungen** | dunkel |
| `entwurf-2026-10-c` | Plakat, rotes Farbfeld, Linse | – | zu laut |
| `entwurf-2026-10-b-hell` | B hell, reinweiß | Weiß und Rot stehen gut | Tiefe lebt nur vom Verblassen, wirkt flach |
| `entwurf-2026-10-b-linie` | Flache Stiftlinie wie Architektenplan, ohne three.js | Linie als roter Faden | flach, falsch verstanden: Architektur sollte in den Raum |
| `entwurf-2026-10-b-konstruktion` | Bauten aus Haarlinien entstehen im Raum | **Ansatz „ziemlich geil“**: Tunnel, Haus | Maße und Achsbuchstaben verwirren |
| `entwurf-2026-10-b-konstruktion-2` | Konstruktion je Abschnitt, flach | Thematische Zuordnung | flach, „total falsch verstanden“ |
| `entwurf-2026-10-b-konstruktion-3` | Bauten wieder als 3D im Hintergrund, synchron zum Text | Tiefe zurück | zu unruhig, Überlagerungen |
| `entwurf-2026-10-b-konstruktion-4` | ruhiger, mobil, Slides | Vor/Zurück-Knöpfe | Bauten noch zu allgemein |
| `entwurf-2026-10-b-konstruktion-5` | Bauten thematisch genauer | bessere Zuordnung | Überlagerungen bei Stimmen, Modernisierung, WBG |
| `entwurf-2026-10-b-geraete` | Arbeitsgeräte statt Bauten: Laptop, Tablet, Zeichenbrett, Kanban | **Echter Shop auf dem Bildschirm** erklärt mehr als jeder Bau | einzelne Geräte unaufgeräumt |
| `entwurf-2026-10-b-konstruktion-6` | Arbeitsobjekte als Linienmodelle (anderer Chat, committet) | – | – |
| `entwurf-2026-10-b-konstruktion-7` | **Papierfaltung**: Modelle klappen aus der Fläche hoch (committet) | **Favorit.** Schönste Bildsprache, gefüllte Flächen, Gerwing-Abschnitt (Treppe, Terrasse, Gerät daneben) ist der Maßstab | Faltung noch nicht in allen Abschnitten so detailliert |
| `entwurf-2026-10-b-mischung` | Bauten plus Geräte, filmische Fahrten | Mischung trägt | Kamera zu unruhig, Animationen zu schnell |
| `entwurf-2026-10-b-mischung-2` | ruhige Kamerabahn, gefüllte Flächen, drei Phasen je Abschnitt | **Favorit.** Funktioniert als Seite, ruhige Bahn, Geräte bei Gerwing | Scroll-Lock zu aggressiv, zerstört die Kamera-Smoothness; Typo liegt über allem, braucht Glow, Überlappungen |
| `entwurf-2026-10-b-blatt` | Jedes Thema ein Blatt im Raum, Modell faltet sich aus dem Blatt | Lesbarkeit, Ruhe, Handy | in der Ruhelage wieder flach, Fahrten leer |
| `entwurf-2026-10-b-raumtext` | Kamerafahrt aus Mischung 2, Texte als 3D-Karten an Trägern | Tiefe zurück, Fahrt Gerwing → Betreuung | Karten wie Fremdkörper mit Schatten, verdeckter Scroll-Lock (Ruheplateau), Fahrten hastig, Modelle nicht verbessert |
| `entwurf-2026-10-b-raumtext-2` | Text auf Flächen der Faltmodelle, stetige Kamerabahn ohne Plateau (Konzept in `KONZEPT.md`) | Kein Scroll-Lock mehr (Kamera nie still), Einstieg mit Lettern auf Stufen und Text auf der Website-Seite, Ladenschild bei Shops, läuft in der Vorschau | Textwände wirken noch wie Tafeln mit Rahmenstreifen; Modelle eher Klötze als Papierfaltung; Boden beige statt weiß; Fahrten zeigen viel Leere, keine filmische Kamera; ab Abschnitt 5 nur vereinfacht; am Handy Text auf einem Pult |
| `entwurf-2026-10-test-vorspann` | Einzeltest: Gerwing-Terrasse baut sich mechanisch wie im Game-of-Thrones-Vorspann. Grundriss → Pfosten und Wände → Zahnradkette mit roter Welle → sechs Plattenreihen klappen mit Anfahren, Abbremsen, Überschwingen, Einrasten → Stufen fahren teleskopartig aus → Palette → Wand mit Überschrift steigt aus einem Schlitz. Kamera im Bogen von hoch-schräg-hinten auf Augenhöhe. Scroll gedämpft ohne Lock, Knopf „Abspielen“ (12 s), Zustände per `#p=0…1` | Erik: „ziemlich cool“. **Überschrift auf einer einrastenden Wand des Modells wirkt deutlich besser als jede schwebende Karte.** Mechanisches Einrasten mit Gewicht ist eine starke Bewegungssprache | Zahnradwerk zu klein, in der Ecke, Räder überlagern sich, treibt die Scharniere nicht sichtbar an; Endbild wirkt wie Podest mit Schild, Frontfläche leer (Idee: als Schaufenster ins Werk öffnen), viel Weißraum darüber; frisch aufgestiegene Reihen wirken wie Lamellen; mobil Überschrift klein, Treppe angeschnitten, braucht eigenen Hochkant-Ausschnitt |

## Offene Fragen

- Take the Gloves Off: Zustimmung von Lilith, ob es gezeigt werden darf.
- Aktuelles Porträtfoto.
- Einstiegspreis Betreuung.
- Jahre der Games-Zeit.
- Sätze zu den kleineren Referenzen.
- WBG: vor Veröffentlichung prüfen, ob die Seite noch online ist.
- Gerwing: Faktencheck der Funktionsbeschreibung.
- Welche Elemente aus welchen Entwürfen in die nächste Fassung übernommen werden.
- Ob die mechanische Vorspann-Bewegung auf alle Abschnitte übertragen wird oder nur auf Gerwing.
