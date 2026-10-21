# Drehbuch – Prototyp der ganzen Seite (Fassung 2026-11)

Alle Einzelszenen aus `entwurf-2026-11/*/` laufen hier auf einer gemeinsamen Kamerabahn hintereinander, von der Eröffnung bis zum Kontakt. Stil „Bogen + Bastellinien“, Regeln aus `docs/FASSUNG-2026-11.md` und `docs/ENTWURFSRUNDE-2026-10.md`. Zustände über `#p=0…1`, Szenenanfänge über `#s=<name>`, Handy-Ansicht in der Vorschau über `&w=390&h=844`.

## Aufbau

- `index.html`: Marke N4 im Header, Navigation (Projekte, Leistungen, Kontakt), Vor/Zurück zu den Szenenanfängen, HTML-Vorbild mit Name und Unterzeile (steht sofort, bis die Lettern im 3D stehen). Ohne WebGL der ganze Seitentext mit Kontaktlinks.
- `main.js`: Start, WebGL-Erkennung, Schriften, Bilder.
- `folge.js`: Szenenfolge, Länge je Szene in Bildschirmhöhen, Ausschnitte, Fadenstücke.
- `kern.js`, `falt.js`: gemeinsamer Baukasten aus allen Szenen-Kopien (Konfliktliste unten).
- Szenenmodule: `eroeffnung.js` (Variante C, ohne Anriss Gerwing), `gerwing.js`, `betreuung.js`, `modernisierung.js`, `shop.js`, `schnittstellen.js` (auch WBG Pooling), `staffelei.js` (Gestaltung, neu), `platzhalter.js` (`gloves`, `ausserdem`, neu), `werdegang.js`, `stimmen.js`, `abschluss.js` (Wie ich arbeite, Für Agenturen, Kontakt).

## Gesamtablauf

Die Szenen liegen in Seitenreihenfolge so in der Welt, dass die Kamera immer vorwärts fährt und nie eine frühere Szene im Vordergrund steht. Zwischen zwei Szenen fährt die Kamera stetig weiter; Anfang und Ende jeder Szene sind langsam, dort schließt die Fahrt an. Ein roter Faden mit Punkt läuft von der Eröffnung bis zum Kontakt-Umschlag; Szenen mit eigenem Faden übernehmen ihr Stück, in den anderen wartet der Punkt am Eingang. Die Konstruktionsphase (Raster auf dem Bogen, Gerüst mit Überständen und Mehrfachstrichen, Bleistiftspur) läuft in allen Szenen.

Schnittstellen und WBG Pooling sind ein Modul, im Seitentext steht Gestaltung dazwischen: Das Modul steht deshalb zweimal in der Welt (Schnittstellen b 0–0,55, WBG ab b 0,556). Ebenso Abschluss: „Wie ich arbeite“ (Bogen x bis 8,5, b bis 0,36) und nach Werdegang und Stimmen „Für Agenturen“ mit Kontakt (x ab 8,5, b ab 0,37).

| # | Szene (`#s=`) | Fahrt hinein (#p) | Szene (#p) | Lesestellen Desktop (#p) | Bildschirmhöhen (Szene + Fahrt) |
|---|---|---|---|---|---|
| 1 | eroeffnung | – | 0,000–0,081 | 0,000 (Podest) · 0,026 · 0,036 · 0,045 · 0,056 · 0,065 | 5,90 |
| 2 | gerwing | 0,081–0,090 | 0,090–0,170 | 0,100 · 0,108 · 0,121 · 0,138 · 0,150 · 0,162 | 5,80 + 0,70 |
| 3 | betreuung | 0,170–0,181 | 0,181–0,229 | 0,198 · 0,205 · 0,213 · 0,222 | 3,52 + 0,82 |
| 4 | modernisierung | 0,229–0,239 | 0,239–0,293 | 0,252 · 0,263 · 0,281 | 3,96 + 0,70 |
| 5 | shop | 0,293–0,306 | 0,306–0,377 | 0,321 · 0,339 · 0,350 · 0,359 · 0,368 | 5,20 + 0,94 |
| 6 | schnittstellen | 0,377–0,388 | 0,388–0,454 | 0,394 · 0,413 · 0,448 | 4,81 + 0,79 |
| 7 | gestaltung | 0,454–0,462 | 0,462–0,506 | 0,482 · 0,490 · 0,499 | 3,24 + 0,61 |
| 8 | wbg | 0,506–0,516 | 0,516–0,586 | 0,527 · 0,543 · 0,553 · 0,562 · 0,572 · 0,581 | 5,09 + 0,71 |
| 9 | gloves (Platzhalter) | 0,586–0,595 | 0,595–0,621 | 0,613 | 1,92 + 0,68 |
| 10 | ausserdem (Platzhalter) | 0,621–0,631 | 0,631–0,657 | 0,648 | 1,92 + 0,69 |
| 11 | arbeitsweise | 0,657–0,666 | 0,666–0,712 | 0,671 · 0,683 · 0,695 · 0,708 | 3,33 + 0,68 |
| 12 | werdegang | 0,712–0,723 | 0,723–0,790 | 0,727 · 0,740 bis 0,782 in Schritten von 0,006 | 4,90 + 0,79 |
| 13 | stimmen | 0,790–0,803 | 0,803–0,879 | 0,809 · 0,830 · 0,840 · 0,861 · 0,874 | 5,60 + 0,94 |
| 14 | agenturen + Kontakt | 0,879–0,890 | 0,890–1,000 | 0,899 · 0,916 · 0,925 · 0,933 · 0,942 · 0,960 (Kontakt) · 1,000 | 8,01 + 0,79 |

Gesamt: 73,0 Bildschirmhöhen am Desktop (1280 × 900), 73,9 am Handy (390 × 844). `#s=kontakt` springt auf 0,950 (Handy 0,943). Handy-eigene Lesestellen (WBG, Stimmen, Agenturen) stehen in `tmp/seite-pruefung/n.json`.

Gekürzt wurde nur, wo die Lesefenster reichlich waren (Betreuung, Modernisierung, Gestaltung, Platzhalter). Die übrigen Szenen laufen im Tempo der Einzelszenen, weil ihre kleinsten Lesefenster schon knapp sind (Handy: Gerwing und WBG 12 vh, Agenturen 13 vh, Stimmen 4 vh).

## Neue Abschnitte

- **Gestaltung – Staffelei:** Ablage und Brett klappen aus dem Bogen, die Stütze nach hinten. Drei leere Blätter in den Formaten der Arbeiten (Plakat Take the Gloves Off A1 hochkant, NOVUM-Cover 230 × 297, „100 Jahre Audi“ quer 3 : 2 – Formate angenommen, in keiner Quelle gefunden) klappen nacheinander über den Kamm aufs Brett, schlagen an, federn 5° zurück und rasten ein. Titel klein am Blattrand, Bildfläche als Bleistift-Platzhalter. Die beiden Sätze aus dem Seitentext stehen auf der Ablage.
- **Take the Gloves Off, „Außerdem“:** je ein aufgestelltes Papierschild mit Stütze, Überschrift, vorhandenem Seitentext bzw. Vermerk aus der Quelle und Bleistift-Stempel „Platzhalter“.

## Baukasten: Konflikte und Auflösung

1. `F.spin`: schnittstellen (Knoten eine Ebene höher, Achse wählbar, ohne Überschwingen) gegen shop (Ebene der Elternfläche, Achse senkrecht) → eine Funktion mit `opt.axis` und `opt.lv` (Vorgabe eine höher); shop übergibt `lv: par.lvl`.
2. `mvOwn` (schnittstellen) und `fresh` (shop) bedeuten dasselbe → beide Namen wirken, `K.box` reicht beide durch.
3. `mvo` (werdegang) ersetzte die Bewegung aller Haarkanten → wirkt jetzt nur nach `F.edgeOwn(true)`, das nur werdegang aufruft.
4. Mehrere Laufoptionen zugleich → Vorrang ease, lin, bounce, mech; danach `dn`/`re` und `ang0` auf den Winkel.
5. Höhe der Bastellinien: Regel aus betreuung (mindestens eine Ebene über dem Besitzer) und `lift` aus stimmen gelten zusammen.
6. Abdruck der Lettern bei `clock: "b"`: abschluss schloss immer (+0,03), schnittstellen nur mit `close` (+0,012), betreuung/modernisierung nie → mit `closeB` nach dessen Wert, sonst mit `close` nach 0,012, sonst bleibt er.
7. `pr.sched` (modernisierung) übersprang die Rahmenregel → sched liefert die Deckkraft, die Rahmenregel gilt danach trotzdem.
8. `F.geruest` und Bleistiftspur: beliebig viele Aufrufe mit eigenem Zeitfenster und optionalem Filter.
9. Unverändert übernommen: `s.face`, `s.fb`, Schlüssel mit `slow`, `K.link`, Faden mit `lin`, `K.add`, `paperMaterial`, `edgeMaterial`, `opt.on`/`opt.over`, `bounce`, `ghost`, `dn`/`re`, `ang0`, `part lift`, Text blendet aus, solange sein Träger angeschnitten ist.
10. Entfallen: Variantenwahl der Einzelszenen; die Fäden der Einzelszenen sind Stücke des gemeinsamen Fadens.
11. Neu für die Seite: Shader mit Szenenursprung und Ausschnitt; Lettern mit Uhr „t“ stehen auf, wenn ihre Szene erreicht wird; langsame Szenenränder; optionale Anfahrt/Rückzug an Lesestellen am Szenenrand (`lead`/`tail`); Kameraatem an Lesestellen auf 15 % gedämpft.
12. Konstruktionsphase in allen 14 Szenen; ergänzt in gerwing, shop, schnittstellen, werdegang, stimmen und abschluss, betreuung bekam eine Bleistiftspur.
13. Korrekturen in den Kopien: abschluss s1–s4 erst nach dem Einblenden lesbar; schnittstellen „Concludis“ mit kürzerer Blende; stimmen Handy-Lesestelle l2 etwas später.

## Prüfung

Rechenskripte in `tmp/seite-pruefung/` (git-ignoriert), Aufruf `node --import ./reg.mjs rechnen.mjs 1280 900 d.json`, ebenso `fenster.mjs`, `faden.mjs`, `rauch.mjs`, `nah.mjs`. Ergebnis: alle Lesestellen (63 Desktop, 71 Handy) ganz im Rahmen, auch ±0,0015 daneben; 4000 Proben ohne frühere Szene im Bild; Kamera in Fahrten mindestens 2 Einheiten über Bauteilen. Sichtprüfung: siehe Stand in `docs/FASSUNG-2026-11.md`.

## Korrekturen nach der Sichtprüfung (22.10.2026)

- HTML-Vorbild: lag bei Einstieg mitten auf der Seite (Anker, wiederhergestellte Scrollposition) über der Szene, bis three.js geladen war. Jetzt blendet `vorbild.js` (klassisches Skript direkt nach dem Vorbild) es sofort aus, wenn der Einstieg nicht am Anfang liegt.
- Raster: stand in Gerwing, Modernisierung, Shop, Schnittstellen und Wie ich arbeite noch an der ersten Lesestelle. Ausblenden jeweils vor die erste Lesestelle gezogen (Gerwing .055, Modernisierung .29, Shop .24, Schnittstellen .13, Abschluss .05). WBG und Für Agenturen ohne Raster (zwischen Szenenanfang und erster Lesestelle kein Platz für eine Bauphase), Gerüst und Spur bleiben.
- Staffelei: Titel und Vermerk eines Blatts schienen durch das nächste Blatt; sie gehen jetzt, während das nächste Blatt darüberklappt.
- Kopf: Bauteile und Linien späterer Szenen liefen durch Marke und Navigation; Lichthof (`text-shadow`) um die Schrift.
- Faden: endete im Schlussbild links außerhalb des Umschlags am Bildrand; letzter Punkt liegt jetzt auf dem Umschlag.
- Kontaktkarten: Die Rahmenregel galt nur für Textdrucke, nicht für die als Bild gedruckten Karten; am Handy standen Mail und Telefon im Schlussbild angeschnitten. Karten tragen jetzt `textual`, die Regel gilt auch für sie.

Sichtprüfung über den Webchat-Browser, 26 Bilder (`#p` an Lesestellen aller Szenen am Desktop 1280 × 900, Handy 390 × 844 an Startbild, Gerwing, Gestaltung, Stimmen und Schluss, zwei Übergänge). Rechenprüfung danach erneut: 63 bzw. 70 Lesestellen ohne Befund, keine frühere Szene im Vordergrund. Konsolenfehler lassen sich in der Vorschau nicht auslesen; geprüft sind `node --check` aller Module und ein fehlerfreier Lauf des echten Kerns in Node über alle Zustände.

## Bekannte Schwächen

- Länge 73 Bildschirmhöhen; weiter kürzen geht nur über engere Lesefenster in den Einzelszenen.
- An Szenengrenzen ist die Fahrtrichtung begrenzt (keine Schleifen, nicht unter den Bogen); dadurch möglicher kleiner Richtungswechsel, nur in Bewegung beurteilbar.
- Faden: kreuzt bei Gerwing Abdrücke im Bogen; in Szenen ohne eigenen Faden wartet der Punkt am Eingang; in Agenturen beginnt er am Boden statt am Statuspunkt.
- Handy: einige Lesestellen mit nur 5–9 px Rand (Textbreiten ohne Unterschneidung gerechnet); auf 360-px-Geräten blenden die Leporello-Lesestellen in Stimmen aus.
- Laden: HTML-Vorbild liegt kurz über den aufstehenden Lettern (Lage geschätzt); die übrigen Szenen bauen sich nach dem ersten Bild nacheinander auf.
- Staffelei: oberste Blattkante rechnerisch bis 3,6 mm hinter dem Brett (Kopfleiste kaschiert); Blatttitel klein (14/12 px).
- Übergänge: Zwischen zwei Szenen zieht der Faden durch leeren weißen Raum, das Bild ist dort fast leer.
- Staffelei wirkt von vorn wie eine Tafel oder Wand, nicht wie eine Staffelei (Beine nur von der Seite sichtbar); hinter dem Brett steht oben der Bildschirm aus WBG wie aufgesetzt.
- Handy: Gerwing und Stimmen kopflastig, untere Bildhälfte leer; im Schlussbild steht nur LinkedIn ganz im Bild (Mail und Telefon an den Lesestellen davor).
- Satzketten über mehrere Träger aus den Einzelszenen (Modernisierung „Ich bringe sie …“, Agenturen „arbeite mich … ein / und halte mich …“) zeigen an einer Lesestelle nur einen Satzteil.
