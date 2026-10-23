# Drehbuch Neubau – jan-erik-andersen.de

Stand: 23.10.2026. Verdichtet aus `docs/FASSUNG-2026-11.md` (Entscheidungen vom 21. bis 23.10.2026) und dem Seitentext in `entwurf-2026-11/seite/index.html`. Hier steht nur noch, was heute gilt. Wo sich Entscheidungen widersprochen haben, gilt die jüngere; strittige Punkte stehen unter „Offen“ und werden vor dem Bau mit Erik geklärt.

Die Fassung bleibt als Protokoll erhalten. `entwurf-2026-11/seite/` bleibt als Bestand liegen und ist Teilelager, nicht Grundlage.

---

## 1 Wofür die Seite da ist

- **Leser:** Projektvermittler, Recruiter, Agenturen und Unternehmen mit ausgeschriebener Stelle. Sie kommen aus Eriks Bewerbungen oder von seinen Profilen bei freelancermap und freelance.de, oft am Handy, vergleichen und entscheiden schnell. Kaltakquise gibt es nicht.
- **Zielgruppen:** Agenturen und Projektgeber, Mittelstand als Direktkunde, Arbeitgeber mit befristeter Remote-Mitarbeit.
- **Fünf-Sekunden-Maßstab:** wer, was, Niveau. Jede Szene muss dem Leser helfen zu verstehen, was Erik kann, und ihn zum Anschreiben bringen.
- **Aushängeschild, keine Tech-Demo:** Die Gestaltung zeigt Eriks gestalterisches Können als Gegensatz zum technischen Profil. Sie dient dem Inhalt.
- **Ton:** Sie-Anrede ohne Steifheit, Problem, Lösung, konkret, keine Slogans. Nichts erfinden: keine Zahlen, Zeiträume oder Verfügbarkeiten außerhalb der Quellen.
- **Ausschlüsse:** kein RPLC, kein ClautzGPT, keine Web-Tools als Arbeitsprobe, keine SEO- oder GEO-Versprechen, kein Lebenslauf-PDF, HTK ist ein Zertifikat, kein Stundensatz auf der Seite.

## 2 Feste Regeln

### Bild und Material
- **Papierwelt:** Alles ist gefaltetes Papier auf einem gemeinsamen Bogen. Teile schneiden sich aus dem Bogen frei, klappen hoch und rasten ein; im Bogen bleibt ihr Abdruck. Kein Raster im leeren Raum, keine frei schwebenden Teile.
- **Physikalisch richtig:** Jede Klappe hat ein Scharnier, jedes Teil eine Stütze, nichts überlappt in der Ruhelage, nichts taucht durch den Bogen.
- **Palette „Mirror's Edge mit Papier“:** kühles, fast reines Weiß, Flächen über feine kühle Grautöne abgesetzt, Schatten leicht bläulich, klar und weich umrandet, Dunst zu sehr hellem Himmelblau, kein Himmelsbild. Rot `#d40235` ist die einzige kräftige Farbe und gehört dem Weg (Faden, Punkt) und wenigen echten Akzenten. Schrift dunkel und kontrastreich.
- **Post-Processing:** Tonemapping (helles, leicht überstrahltes Weiß), zarte Umgebungsverdeckung, Bloom praktisch aus, SMAA, kühle Abstimmung, kaum sichtbare Vignette. Keine Tiefen- oder Bewegungsunschärfe, keine Linseneffekte. Am Handy nur Tonemapping und SMAA.
- **Marke N4:** „Jan-Erik *Andersen*“ in Newsreader, „Andersen“ kursiv in Tinte `#303033`, roter runder Schlusspunkt, Lettern auf einer gestrichelten Falzlinie. Favicon: kleines a mit rotem Punkt. Vorhanden in `wortmarke.js` und `marke/`.

### Text
- **Ganzer Satz auf eigenem Träger:** Jeder Satz steht in einem Stück auf einem Bauteil, das selbst der Träger ist (Maßstab: Treppe im Werdegang, Leporello). Kein Satz auf Bildschirmen, Geräten oder Kinnen. Bildschirme zeigen Bilder, keine Sätze.
- **Trägerformen wechseln je Szene** und passen zum Thema; keine Zettelparade.
- **Text verschwindet nie schlagartig.** Er bleibt stehen, solange sein Bauteil im Bild ist, und blendet sonst weich aus.
- **Lesbar:** Desktop rund 20 px, Handy mindestens 16 px, frontal, vollständig im Bild. Ein Satz muss in zwei bis drei Sekunden erfassbar sein; je Szene die Kernaussage zuerst.

### Faden und Punkt
- Ein roter Faden mit Punkt läuft vom Namen bis zum Kontakt, durch jede Szene hindurch, nicht nur zwischen den Szenen.
- **Form:** weich geschwungen, stetige Krümmung, ruhige große Bögen. Keine Ecken, Stufen, Schlaufen, Zickzack.
- **Lage:** flach auf dem Papier, nie durch oder über Bauteile. Eintritt vorn mittig in eine Szene, Austritt hinten in Laufrichtung.
- **Tempo:** gleich je Scrollweg; an Lesestellen wird der Punkt weich langsamer und fließt weiter, kein harter Halt, keine Ringe.

### Kamera
- **Die Kamera folgt dem Punkt.** Eine durchgehende Bahn, kein Schnitt, kein Überblicksflug, kein Abheben zur Karte zwischen den Szenen.
- **Zwischen den Szenen Mausperspektive:** knapp über dem Papier hinter dem Punkt, Blick entlang des Fadens, die Szenen ragen auf; weicher Aufstieg in die nächste Szene. Füllung entlang des Fadens: niedrige weiße Papierblöcke, ohne Text, ohne Rot, nie höher als die Szenen.
- **In den Szenen:** wenige Stellungen, eine Fahrtrichtung, kein Pendeln, Umkreisen oder Zwischenüberblick. Lesestellen frontal und still.
- **Stetig:** Position, Blickziel und Abstand ohne Sprünge, kein zackiger Zoom. Gedämpftes Nachziehen zwischen Scrollen und Kamera. Kein Kamera-Atem, die Kamera bewegt sich nur beim Scrollen.
- **Kein Scroll-Lock, kein Hijack.** Animationen langsam genug zum Ansehen.

### Startbild
- Beim Laden steht **nur der Name**, scharf, auf großen Bildschirmen nicht zu groß. Kamera flach vor der Marke, man sieht keine Fläche.
- Ortszeile, Kernsatz und Podest kommen erst mit dem Scrollen, ohne dass sich etwas durch die Buchstaben schiebt.
- Nie zwei Namen übereinander (HTML-Vorbild und 3D), keine Animation über dem Startbild. Name und Text laden sofort, das 3D darf nachladen.

### Karte
- Am Schluss zieht die Kamera heraus in eine Draufsicht; die Seite wird zur Karte, jede Szene ist anklickbar. Ein Knopf „Übersicht“ springt jederzeit dorthin.
- **Form „Flusslauf mit Höhenlinien“:** Der Faden fließt in gleichmäßigen, ruhigen Mäandern, im Papier zarte Höhenlinien, die Szenen liegen als runde Inseln an den Außenseiten der Biegungen. Der Fluss mündet im roten Schlusspunkt der Wortmarke.
- Weicher Horizont statt Kante, Licht und Schatten, Raster höchstens ganz zart.

### Rahmen
- Kopfzeile mit Marke, Navigation (Projekte, Leistungen, Kontakt), Kontakt von überall mit einem Klick.
- Vollständiger Seitentext ohne 3D (gleicher Wortlaut wie im 3D), SEO-Kopf, JSON-LD, Vorschaubild, Skip-Link, zugängliches Kontaktblatt: vorhanden in `seite/index.html`, wird übernommen.
- Links zu Live-Projekten überall, wo ein Projekt genannt wird, im 3D anklickbar.
- Handy ist bei jeder Szene Teil der Abnahme.

## 3 Ablauf der Seite

Reihenfolge, Kernaussage, Text, Bild. Texte wörtlich wie heute im Seitentext.

### 1 Eröffnung
- **Kernaussage:** Wer ich bin und was ich mache.
- **Text:** Name; Ortszeile „Webentwicklung · Raum Plau am See · remote“; Kernsatz „Ich entwickle Websites und Onlineshops, binde sie an Ihre übrigen Systeme an und betreue sie, solange sie laufen.“ Danach drei Sätze: „Agenturen holen mich als Entwickler ins Projekt.“ · „Unternehmen arbeiten direkt mit mir.“ · „Auf Wunsch arbeite ich auch befristet im Team mit.“
- **Bild:** Name steht auf einem Pop-up-Podest aus dem Bogen; Kernsatz auf dessen Vorderseite. Beim Scrollen hebt sich die Kamera, aus dem Bogen baut sich der Schreibtisch auf (Variante C: Skizze auf der Platte wird zum Bildschirm, Rechner mit Statuspunkt und Kabel). Auf dem Tisch Leben: Grafiktablett, Tasse, Pflanze, Tastatur, Maus, Lampe, Stiftebecher. Die drei Sätze erscheinen nacheinander auf dem Grafiktablett, gesetzt, nicht als Handschrift.
- **Übergang:** Der Punkt startet am Statuspunkt des Rechners und läuft zu Gerwing.

### 2 Gerwing (Leitreferenz)
- **Kernaussage:** Ein Shop, der verkauft wie man bestellt: nach Fläche.
- **Text:** „Für Gerwing habe ich 2023 einen WooCommerce-Shop gebaut, der Pflastersteine, Terrassenplatten und Stufen so verkauft, wie man sie bestellt: nach Fläche.“ · „Kunden geben ihre Quadratmeter ein, der Shop rechnet sie in ganze Steine um, ermittelt Gewicht und Fracht nach Postleitzahl und leitet die Bestellung an den zuständigen Händler weiter. Seitdem betreue ich den Shop und entwickle ihn laufend weiter.“
- **Bild, in dieser Folge:** große Wand mit „Gerwing“ in großen Lettern und dem ganzen Text → Laptop und Handy mit dem echten Shop → Stationen der Bestellung in Laufrichtung (Fläche, ganze Steine, Palette mit Gewicht, Fracht nach PLZ, Weiche zum Händler). Ein Lieferschein reist mit dem Punkt und bekommt an jeder Station einen Stempel mit dem Ergebnis, erkennbar Beispielwerte, beim Händler ein roter Haken → am Ende das Haus mit fertiger Terrasse, Deko (Pflanzkübel, Gartenmöbel, Wandlampe), letzter Stein, ruhiges Zurückziehen.

### 3 Betreuung und Absicherung
- **Text:** „Zwischen dem Bekanntwerden einer Lücke in einem WordPress-Plugin und dem ersten Angriff vergehen oft nur Stunden.“ · „Ich halte Ihre Seite deshalb laufend aktuell und sehe regelmäßig nach, ob sie sauber läuft.“
- **Bild:** Bildschirm mit Plugin-Liste. An einer Zeile springt ein rotes Schild „Update verfügbar“ auf, die Uhr rast; ein Fortschrittsbalken läuft durch, das Schild wird zum Haken, die Uhr beruhigt sich. Der Kalender blättert Monat für Monat, jedes Blatt mit echtem Tagesraster, auf dem neuen Monat wieder ein Haken. Satz 1 auf der Uhr, Satz 2 auf dem Kalender.

### 4 Modernisierung
- **Text:** „Viele WordPress-Seiten laufen seit Jahren auf veralteten Themes, Plugins und PHP-Versionen.“ · „Ich bringe sie technisch und gestalterisch auf den heutigen Stand und achte darauf, dass Inhalte und Adressen erhalten bleiben.“
- **Bild:** Inhaltsblöcke wandern vom Röhrenmonitor in einen Flachbildschirm, die Kamera sieht aus ruhiger Distanz zu. Am Ende legt sich der alte Monitor flach in den Bogen; auf seiner Fläche stehen beide Sätze, eine Lesestelle. Ausdrücklich ruhig.

### 5 Shops und Shop-Wechsel
- **Text:** „Ich baue WooCommerce-Shops für Produkte, die in kein Standardformular passen, etwa mit Mengen nach Fläche oder Fracht nach Gewicht und Entfernung.“ · „Wer bei Shopify mit wachsendem Umsatz immer höhere Gebühren zahlt, kann zu WooCommerce wechseln. Ich rechne vorher durch, ob sich das lohnt, und ziehe Produkte, Kunden und Bestellungen um.“
- **Bild, links nach rechts:** Regal nach Maß mit sperrigem Gut, Satz 1 darauf. Daneben der Wechsel: Shopify-Karton mit wachsendem Gebührenstapel, drei Karten (Produkte, Kunden, Bestellungen) wandern über eine Brücke ins Regal nach Maß; die Wechselsätze an diesem Teil. Kein Standardregal, keine Waage, kein Lagerrundgang.

### 6 Schnittstellen und WBG Pooling (eine Szene)
- **Text:** „Ich verbinde Websites und Shops mit CRM-, ERP- und Bewerbermanagementsystemen, bei WBG etwa mit Salesforce und Concludis.“ · „Wo ein gekauftes Werkzeug nicht zu Ihren Abläufen passt, entwickle ich eines, das passt.“ · WBG Pooling, „2023 bis 2025 · für die Runden Group“: „Ein Industrie- und Vertriebsportal mit 360-Grad-Produktansichten, einem geschützten Bereich für den Vertrieb und Anbindungen an Salesforce und Concludis.“
- **Bild:** Drei Geräte (CRM, ERP, Bewerbermanagement) auf einem gemeinsamen Brett, Kabel ohne Kreuzung, ein rotes Adapterstück rastet ein. Daneben Portal, Drehteller (360 Grad) und Schloss. Vor dem Brett faltet sich ein Leporello auf: Seite 1 Anbindungen, Seite 2 eigenes Werkzeug (sobald der Adapter einrastet), Seite 3 Kopf „WBG Pooling“ mit dem WBG-Satz vor dem Portal. Gelesen links nach rechts.

### 7 Gestaltung
- **Text:** „Für mich gehört Gestaltung zur Entwicklung.“ · „Ich entwerfe Erscheinungsbilder und Oberflächen selbst oder setze vorhandene Entwürfe sorgfältig um.“ Bildunterschriften: „Take the Gloves Off · Logo und Styleguide, ehrenamtlich“, „NOVUM · Cover“, „100 Jahre Audi · Ausstellungsmotiv“.
- **Bild:** hohe Atelier-Staffelei, deutlich höher als die Blätter, mit schmaler Malerleiste. Dahinter ein hohes Papierfenster in einer Wand, draußen ein Baum aus gefaltetem Papier. Auf dem Deckblatt die beiden Sätze, daneben zeichnet sich eine Bleistiftskizze des Baums ab; danach klappen die drei echten Arbeiten darüber, Blattformat nach dem echten Bild.
- **Bildquellen:** NOVUM `C:\Archiv\(bis 2018)\Design\Privat\Studium\In.D\Novum\Entwurf2.5.tif`; Audi `…\Studium\HTK\MMD\100 Jahre Audi.tif`; Take the Gloves Off Titelblatt von `take-the-gloves-off/03_unsere_arbeit/styleguide/TTGO_Styleguide_2026-10.pdf`.
- **Maßstab:** Niveau von Treppe und Leporello. Der heutige Stand gilt als „alpha“.

### 8 Außerdem
- **Text, je Gerät:** Onkologie Laatzen: „Für die hämatologisch-onkologische Praxis in Laatzen betreue ich die Website und passe sie laufend an.“ · Mindblossom: „Für Mindblossom und Soundhealing Hamburg habe ich Website und WooCommerce-Shop umgesetzt und betreue beides.“ · SiS-Wirkungsbericht: „Für Seniorpartner in School habe ich ehrenamtlich den digitalen Wirkungsbericht 2025 mit interaktiver Karte gebaut, die Texte kamen von Annemarie Andersen.“ · Bäckerei Behrens: „Für die Bäckerei Behrens in Plau am See habe ich die neue Website gebaut und betreue sie.“
- **Bild:** Wand aus Papiergeräten (Monitor, Laptop, Tablet, Handy) mit echten Bildschirmfotos der Live-Seiten; unter jedem Gerät ein Sockel mit Name, Satz und Link. Die Kamera gleitet an der Wand entlang.

### 9 Wie ich arbeite
- **Text:** „Ich arbeite mit aktuellen KI-Werkzeugen und habe dafür eigene Abläufe entwickelt.“ · „Damit schaffe ich allein Projekte, für die früher ein kleines Team nötig war, etwa Schnittstellen oder Datenumzüge.“ · „Auf diese Weise arbeite ich mich auch schnell in fremden oder älteren Code ein.“ · „Wo es passt, bekommen Sie statt eines Angebots ein Konzept und einen klickbaren Entwurf, an dem Sie sehen, wie Ihre Seite wird.“ · „Entscheidungen und Verantwortung bleiben bei mir, und ausgeliefert wird nur, was ich geprüft habe.“
- **Bild:** Fließband. Arme legen je eine Karte mit einem ganzen Satz auf ein Papierband, die Karten laufen durch einen Prüfrahmen und bekommen einen roten Haken. Der Verantwortungssatz steht auf dem Balken des Prüfrahmens, die letzte Karte trägt Konzept und klickbaren Entwurf. Links nach rechts.

### 10 Werdegang
- **Text, je Stufe von oben nach unten:** seit 2023 Gerwing – Umsetzung und laufende Betreuung des Onlineshops · 2023 bis 2025 Runden Group – WBG Pooling und viele weitere Websites und Anwendungen der Firmengruppe · 2017 bis 2023 Tangram Werbeagentur – Frontend-Entwicklung, unter anderem für Nissen und EMPORE, für BIG Arbeitsschutz das Shop-Frontend · 2017 YOOtheme – Support Management · seit 2010 Freiberufliche Webprojekte – seit 2018 als Andersen Webworks · 2010 bis 2017 Games – Spielprototypen in Flash und Haxe, danach Qualitätssicherung bei Goodgame Studios und Deep Silver FISHLABS · 2007 bis 2010 HTK Hamburg – Zertifikat Multimedia Design · 2000 bis 2006 Pixel Arrays – erste Selbstständigkeit (mit Pixelkachel).
- **Oben auf der Treppe „Womit ich arbeite“, drei Gruppen:** Plattformen WordPress, WooCommerce, YOOtheme Pro · Anbindungen Salesforce, Concludis, CRM- und ERP-Systeme, Umzug von Shopify · Frontend HTML, CSS, JavaScript. Typografie wie die Stufen (Überschrift Marke, Gruppennamen gesperrte Versalien, Einträge Grotesk), am Desktop eine Zeile je Gruppe. Arbeitsweise und Sprachen nur im Text ohne 3D.
- **Bild:** die Treppe, je Stufe ein Satz, dem Leser zugewandt, gleichmäßige Fahrt in eine Richtung. Funktioniert heute schon am besten.

### 11 Zusammenarbeit und Kontakt
- **Text:** Überschrift „Zusammenarbeit“. „Agenturarbeit kenne ich von innen: sechs Jahre bei Tangram, danach als freier Partner der Runden Group.“ · „Ich steige in laufende Projekte ein, arbeite mich in bestehende Themes und Plugins ein und halte mich an Ihre Abläufe und Werkzeuge.“ · „Sie haben ein eigenes Webteam und brauchen für eine Weile Verstärkung? Dann arbeite ich auch angestellt in Teilzeit mit, vollständig remote und gern befristet.“ · „Ob Projekt, Betreuung oder Mitarbeit auf Zeit: Derzeit habe ich Kapazität frei. Konditionen nenne ich Ihnen auf Anfrage.“ Danach „Schreiben Sie mir, worum es geht.“ mit Mail, Telefon, LinkedIn.
- **Ton:** Anstellung ist ein möglicher Weg, keine aktive Stellensuche.
- **Bild:** drei Arbeitsplätze mit Schreibtischdingen wie in der Eröffnung, je Platz anders gemischt, ohne Text. Dahinter eine Kanban-Tafel: Erledigt (Tangram, Runden Group), In Arbeit (Einstieg in laufende Projekte, auch befristet im Team), Als Nächstes (freie Kapazität, Konditionen auf Anfrage). Kontakt als Schlussbild mit allen drei Wegen, groß genug lesbar.
- **Danach:** Zug heraus zur Karte, der Fluss mündet im Schlusspunkt der Wortmarke.

**Gestrichen:** Stimmen (Leporello bleibt als Werkzeug), Eröffnung Variante A und B, Lesebahn-Neubau, Setzkasten-Raster und goldene Spirale als Kartenform, Flicken in Betreuung, Waage und Standardregal im Shop, zweite Abspielung WBG.

## 4 Bauweise für den Neubau

Die Lehre aus `seite/`: Die Nähte und die lange Abstimmzeit kamen daher, dass jede Szene ihre eigene Kamerabahn hatte und der gemeinsame Kern aus allen Szenen-Kopien zusammengeflickt wurde. Der Neubau dreht das um.

1. **Erst das Level, dann die Szenen.** Eine Stationstabelle legt fest: Lage jeder Insel, Bahnabschnitte, Lesestellen mit Scrollposition. Darauf liegt eine durchgehende glatte Bahn für Faden, Punkt und Kamera.
2. **Ein Kamera-Rig für alles.** Abstand, Höhe, Vorausschau und Blickziel sind weiche Parameterkurven über der Bahn. Szenen haben keine eigene Kamera; sie melden nur ihre Lesestellen.
3. **Szenen sind Beschreibungen.** Teile, Faltplan, Text, Zeitfenster relativ zur eigenen Bahnstrecke. Eine Datei je Szene, ohne Sonderwege im Kern.
4. **Ein schlanker Kern** mit klaren Modulen: Bühne und Licht, Papier und Falten, Text auf Flächen, Bahn und Rig, Karte, Fallback.
5. **Messflug von Anfang an:** gleichmäßig gescrollt, je Bild Tempo, Beschleunigung, Ruck und Drehung der Kamera, Ruck im Abstand, Punkt im Bild bei Wechseln, je Lesestelle Schriftgröße, Vollständigkeit, Standzeit und Schräge. Desktop und Handy. Die Abnahme einer Szene ist der Messflug plus Ansehen.

**Aus dem Bestand übernommen, geprüft statt kopiert:** `wortmarke.js`, Faltmechanik und Einrasten aus `falt.js`, Palette und Post-Processing aus `kern.js`, Schreibtischdinge aus `schreibtisch.js`, Leporello-Faltung aus `stimmen.js`, Gerwing-Bilder aus `bilder/`, Schriften, `vendor/`, Kopf und Fallback aus `index.html`, Weg auf main (`docs/weg-auf-main.sh`).

**Ort:** neuer Ordner neben `seite/`. Der Weg auf main zeigt erst nach Eriks Abnahme auf den Neubau. Push nur nach Eriks Klick.

## 5 Offen – vor dem Bau mit Erik klären

Eine Frage nach der anderen, Entscheidung hier eintragen.

1. **Bastelbogen in jeder Szene?** Heute läuft die volle Konstruktionsphase (Schnitt- und Falzlinien, Raster, Gerüst mit Mehrfachstrichen, Bleistiftspur, dann Hochklappen) in allen Szenen. Das ist ein großer Teil von Länge und Unruhe. Volle Phase nur in der Eröffnung und danach ein kürzeres Aufklappen, oder überall gleich?
2. **Länge:** Richtwert war 40 bis 50 Bildschirmhöhen (der Bestand hat über 70). Zugleich sollen Animationen langsamer werden und mehr Scrollweg bekommen. Beides geht nur, wenn Szenen weniger zeigen. Gilt der Richtwert?
3. **Grafiktablett in der Eröffnung:** Erik wünschte die drei Sätze auf dem Tablett mit Heranfahren. Das ist Text auf einem Gerät mit Zoom, was die Regel „kein Satz auf Geräten, ruhige Kamera“ sonst ausschließt. Bleibt das Tablett als bewusste Ausnahme?
4. **Handy:** Einige Sätze (WBG, Außerdem, „Damit schaffe ich …“, Werdegang-Stufen) sind bei 16 px breiter als 390 px. Am Handy anders umbrechen auf höheren Trägern, oder kürzere Handyfassungen der Sätze?
5. **Bewegungssprache:** mechanisch (anfahren, abbremsen, leicht überschwingen, einrasten) für alle Teile, nur langsamer als bisher?
6. **Bildschirmfotos für „Außerdem“:** selbst von den Live-Seiten aufnehmen (Desktop und Handy) oder liefert Erik sie?
7. **Reihenfolge für den Bau:** Eröffnung und Gerwing zuerst bis zur Abnahme, danach die übrigen Szenen, oder erst das ganze Level mit einfachen Platzhaltern und dann Szene für Szene?
