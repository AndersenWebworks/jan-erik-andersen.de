# QA-Vergleich: aktuelle Seite vs. Claude Design Referenz

> Issue #18 · Erstellt 2026-05-07 · Bezugsdateien: `index.html`, `docs/reference-design.html`

Methodik: Playwright-Spec (`tests/design-reference-compare.spec.ts`) lädt beide Seiten bei 1280 × 900 px, neutralisiert Funnel-Overlay, Typewriter-Animationen und Reveal-Klassen, scrollt zu jeder Section und schiesst Viewport-Clip. Die 18 Bilder liegen in `qa-screenshots/design-compare/`.

Die zugrundeliegende Soll-Analyse ist `docs/design-analyse-claude-referenz.md`. Bewusst abgewandelte Elemente (Fraunces statt Inter, Typewriter-H1, echte Projekt-Screenshots, Funnel-First, Portrait-Hero) sind dort begründet und nicht Teil dieser QA. Hier wird nur dokumentiert, was vom Design-Soll abweicht, ohne dort als Begründung zu stehen.

---

## Findings (priorisiert)

### F1 · Section-Heads sind zentriert + kompakt, Referenz hat plakative left-aligned H2s

**Status:** Strukturelles Layout-Defizit. Betrifft alle 7 Section-Heads (Projekte, Schwerpunkte, Stimmen, Prozess, Über, Preise, FAQ, Kontakt).

**Soll (Referenz):**
- H2 left-aligned, 2 Zeilen, sehr gross (vergleichbar mit Hero-H1, ~3 rem)
- H2 wirkt wie eigener Sub-Hero pro Section
- Eyebrow oberhalb der H2
- Lead-Text linksbündig direkt unter der H2

Beispiele:
- „50+ Projekte in 27 Jahren. Drei davon im Detail."
- „Verifizierte Stimmen von Google. Ungekürzt, unbearbeitet."
- „Ein kurzer Call klärt, ob wir zusammenpassen."
- „Sie sprechen mit dem Entwickler. Und der macht auch die Arbeit."
- „Festpreise nach Erstgespräch. Sie wissen vorher, was Sie zahlen."
- „Die vier Fragen, die in jedem Erstgespräch kommen."

**Ist (aktuell):**
- H2 zentriert, kürzere Headline („Ausgewählte Projekte", „Was Kunden sagen", „Wie es läuft", „Wer dahinter steckt", „Was es kostet", „Häufige Fragen")
- Lead darunter ebenfalls zentriert
- Eyebrow + Dot zentriert oberhalb

**Wirkung:**
Die Referenz benutzt die Section-Heads als zweites Storytelling-Layer (was passiert, warum, wie). Die aktuelle Umsetzung reduziert sie zu Etiketten. Die plakativen H2s der Referenz tragen mehr Marken-Eigensinn und mehr Crawler-Nutzen für GEO/AVO.

**Empfehlung:**
Section-Heads umstellen auf left-aligned + zweizeilig + grosse Type. Headlines nach Vorbild Referenz neu schreiben (nicht 1:1 übernehmen, da bewusst Erik-Tonfall). CSS-Aenderung in `css/components.css` `.section-header` von `text-align: center` auf `text-align: left` + Type-Scale auf `var(--text-4xl)` o. ä.

---

### F2 · Schwerpunkte-Layout: 4 Spalten (3 Cards + Sidebar) statt 3 Spalten + Außerdem-Block

**Status:** Layout-Defizit. Cards werden zu schmal zum Lesen.

**Ist:** Bei 1280 px ergeben sich 3 Focus-Cards à ~246 px Breite + Sidebar `.services-quicknav` rechts. Die Cards sind so eng, dass Body-Copy zu eng wrappt; die Sidebar hat 2 Spalten („Schwerpunkte" + „Außerdem") und nimmt zusätzlichen Raum.

**Soll (Referenz):**
- 3 Focus-Cards in voller Drittel-Breite (~350 px)
- „Außerdem"-Block separat unterhalb der Cards (volle Breite, 2 Spalten: „Außerdem" + „Standard bei jedem Projekt")

**Empfehlung:**
`.services-layout` umstrukturieren: `.focus-grid` voll breit (3 Spalten), `.services-quicknav` als separater Block unter den Cards (statt rechts daneben). Prüfen, ob Quicknav auf Homepage überhaupt nötig ist – könnte auf `/leistungen/` verschoben werden.

---

### F3 · Primary-CTA-Buttons: rotbraun in Section-Bodies, Referenz schwarz

**Status:** Stilfrage. Wahrscheinlich bewusste Marken-Entscheidung, aber nicht in der Design-Analyse dokumentiert.

**Ist:** `.btn-primary` mit `background: var(--color-accent)` (rotbraun) durchgängig.

**Soll (Referenz):** Primary-CTAs in Section-Bodies (Projekte, Stimmen, Prozess, Über) sind **schwarz/Ink**. Akzent-Rot bleibt für Hero-CTA, Header-CTA und Kontakt-Card-CTA reserviert.

**Wirkung:** Die Referenz nutzt Akzent sparsamer; das Auge findet den primären Conversion-Pfad (Hero → Kontakt) klarer. Im Ist konkurrieren ~6 rote Buttons miteinander.

**Empfehlung:**
Diskussion: Soll Akzent-Rot der einzige CTA-Stil bleiben (Markenfarbe) oder gibt es eine Hierarchie (Hero-CTA + Kontakt-CTA rot, alle anderen Section-CTAs ink)? Klären, dann konsistent durchziehen. Variante mit `.btn-primary--ink` Modifier prüfen.

---

### F4 · Header-Nav nur sichtbar nach Funnel-Abschluss

**Status:** Bewusst (Funnel-First-Konzept). Kein Bug.

**Ist:** Header-Nav-Links sind initial `opacity: 0` und werden erst eingeblendet, wenn der Funnel geschlossen oder beendet ist (`<html>` verliert `funnel-active`-Klasse, JS toggelt `has-nav` auf `<header>`).

**Hinweis:** Beim QA-Vergleich war zu beachten, dass die Referenz die Nav permanent zeigt – die aktuelle Lösung blendet sie kontrolliert ein. Das ist ein Konzept-Unterschied, keine Diskrepanz.

**Empfehlung:** Keine Änderung. Doku-Eintrag in CLAUDE.md/PROJECT_OVERVIEW, dass Nav „Funnel-aware" ist, damit künftige Auditoren das nicht als Bug klassifizieren.

---

### F5 · Funnel-Reopen-Button bleibt nach Funnel-Abschluss im Hero

**Status:** Klein. Vorhandener „Was brauchen Sie? Kurz-Check starten" Button (`#funnel-reopen`) wird sichtbar, sobald Funnel weg ist – steht über dem Erstgespräch-CTA.

**Hinweis:** Vermutlich gewünscht (Re-Entry). Aber visuell konkurriert er mit dem Primary-CTA.

**Empfehlung:** Stilistisch zurücknehmen (Ghost-Button statt Primary), kleiner positionieren, oder erst bei wiederholtem Besuch zeigen (Cookie/Storage).

---

### F6 · Über-Section: Punktliste vs. Portrait-Frame

**Status:** Bewusst abgewandelt (laut Design-Analyse, Abschnitt 2).

**Ist:** Card mit 2 Spalten – links Headline + Lead, rechts strukturierte 4-Punkt-Liste mit `border-left` Akzent.

**Soll (Referenz):** Headline links, Card mit Portrait-Frame links + Bodytext rechts.

**Hinweis:** Begründung in `docs/design-analyse-claude-referenz.md`: Portrait ist im Hero, doppeln wäre redundant. OK so.

---

## Quintessenz

Die Übernahme der Referenz ist auf Element-Ebene fast vollständig (Tokens, Typo-Scale, Cards, Pills, Stats, Eyebrows, Process-Badges, FAQ-Items, Kontakt-Card). Was fehlt, ist das **Section-Head-Pattern** (F1) – die plakativen, left-aligned, zweizeiligen H2s, die die Referenz zu mehr als einer Card-Sammlung machen. Plus das **Schwerpunkte-Layout** (F2), das durch die Sidebar zu eng wird. Diese beiden Punkte heben den Eindruck am stärksten.

F3 (CTA-Farben) ist Markenfrage, F4/F5/F6 sind dokumentierte Konzept-Entscheidungen.

---

## Folge-Issues

Aus der QA werden zwei Folge-Issues erstellt:
- **F1 → Issue:** Section-Heads auf left-aligned + plakativ umstellen
- **F2 → Issue:** Schwerpunkte-Layout entzerren (Sidebar unter die Cards)

F3 wird als Diskussionspunkt für Erik vermerkt, nicht als Issue (Markenfrage).
