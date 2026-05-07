# Design-Analyse: Claude Design Referenz

> Issue #2 · Erstellt 2026-05-07 · Bezugsdatei: `reference-design.html`

Die Referenz ist ein einseitiger Design-Entwurf, generiert mit dem Omelette-Tooling von claude.ai. Sie liefert eine vollständige Single-Page mit Header, Hero, Projekten, Schwerpunkten, Stimmen, Ablauf, Über, Preisen, FAQ, Kontakt und Footer. Stilistisch: warme Off-Whites, ein einziger Akzent (rotbraun `#a83a3a`), Inter als Body-Font, JetBrains Mono als Akzent, kräftige Cards mit weichen Schatten.

Diese Analyse vergleicht die Referenz mit der aktuellen Umsetzung in `index.html` und dokumentiert, was übernommen, was bewusst abgewandelt und was verworfen wurde.

---

## 1. Übernommen (1:1 oder mit kleinen Anpassungen)

| Referenz-Element                          | Umsetzung                            | Issue   |
|-------------------------------------------|--------------------------------------|---------|
| Warme Farbpalette (Off-White, Akzent rotbraun) | `css/tokens.css` mit `--bg`, `--ink`, `--accent` | #3      |
| JetBrains Mono als Akzent-Font            | Eyebrows, Pills, Numerik, Tags       | #4      |
| `clamp()`-Type-Scale für H1/H2            | `css/base.css`                       | #4      |
| Frosted-Glass-Header mit Backdrop-Blur    | `css/header.css`                     | #5      |
| Dropdown-Subtitles unter Nav-Items        | `<span>` + `<small>`                 | #5      |
| Eyebrow-Label mit Akzent-Dot              | `.eyebrow` plus `.dot`               | #6, #13 |
| Hero-Pills (BFSG, KI, WooCommerce, DSGVO) | `.hero-pills`                        | #6      |
| Stats-Leiste (4 Spalten, eingerahmt)      | `.hero-stats` mit `27+ / 50+ / 14+ / 20+` | #6  |
| Schwerpunkte als 3 Focus-Cards mit Nummer 01–03 | `.focus-grid`, `.focus-card`   | #7      |
| Proof-Box pro Focus-Card                  | `.proof` mit Beleg-Link              | #7      |
| Project-Cards mit Hover-Lift, Tags, Pfeil-Animation | `.project-card`                | #8      |
| Testimonials mit Avatar-Initialen, Akzent-Anführungszeichen | `.testimonial-*`     | #9      |
| 4-Schritte-Prozess mit roten Nummer-Badges | `.process-step` mit `.process-number` | #10  |
| FAQ mit nativen `<details>`/`<summary>` und rotierendem Plus-Icon | `.faq-item` | #11    |
| Kontakt-Section als invertierte Dark-Card | `.contact-card`                      | #12     |
| Promises-Liste mit Akzent-Border-Left     | `.contact-promise`                   | #12     |
| CTA-Button-System (Primary/Secondary)     | `.btn-primary`, `.btn-secondary`     | #14     |
| Preise als Card-Grid                      | `.pricing-grid`                      | #15     |
| Über-mich als 2-Spalten-Card              | `.about-teaser-card`                 | #16     |
| Portrait als Card-Komponente im Hero      | `.portrait-card`                     | #17     |

---

## 2. Bewusst abgewandelt

### Body-Font: Fraunces statt Inter
Die Referenz nutzt Inter (geometrische Grotesque). Wir setzen weiter auf **Fraunces** (Serif mit optischen Größen). Begründung: Editorial-Charakter passt zur Positionierung als Web-Betreuer und Lektorats-Werkstatt. Inter wäre austauschbar; Fraunces ist Wiedererkennung. JetBrains Mono ist von der Referenz übernommen worden und liefert den technischen Kontrapunkt.

### Hero-Headline: rotierender Typewriter statt statischer Akzent-Wort-Hervorhebung
Die Referenz hat ein statisches H1 mit blinkendem Caret und einem rot eingefärbten Wort („Ohne den Ballast.“). Wir haben das ausgebaut zu einer **Typewriter-Schleife mit fünf rotierenden Claims** (`Die Kompetenz einer Agentur. Ohne den Ballast.`, `Gefunden werden, wenn keiner mehr googelt.`, …). Begründung: liefert mehr Proof für „Diese Website ist das Beispiel“ und fängt den Bot-Crawl-Window besser ab.

### Project-Thumbs: echte Screenshots statt Mock-Browser-Chrome
Die Referenz zeichnet einen Fake-Browser mit gradientem Hintergrund nach. Wir laden **echte Screenshots** (`screenshots/gerwing.png` etc.). Begründung: Beweis statt Andeutung.

### Über-mich: Punkt-Liste statt Portrait-Frame
Die Referenz hat einen quadratischen Portrait-Platzhalter neben dem Text. Wir haben das ersetzt durch eine **strukturierte Vorteilsliste** (`Direkt mit dem Entwickler`, `Lektorat inklusive`, `27+ Jahre Praxis`, `100 % remote`). Begründung: Portrait ist schon im Hero, hier wäre es Doppelung. Die Liste verdichtet das USP-Set.

### Preise auf der Homepage: Teaser statt vollständige Cards
Die Referenz zeigt 4 Preis-Cards mit Beschreibungstext und einem footer-CTA. Wir haben das **auf 4 Pure-Teaser-Cards reduziert** (Typ + Preis + Foot-Note). Begründung: Volldarstellung lebt auf `/preise/`. Homepage soll eine Sektion lang sein, nicht zwei.

### Funnel-Section vor allem anderen
Die Referenz kennt keinen interaktiven Berater. Wir haben dazwischen einen **Berater-Funnel** (`#funnel`), der Erstgespräch-Anfragen vorstrukturiert. Begründung: Konversion. Memory `feedback_homepage_sections`.

### Section-Wechsel: `.section--alt` statt Inline-Style
Referenz schaltet `background:var(--bg-2)` per Inline-`style=""` auf den Section-Tag. Wir haben das in eine **Klasse** ausgelagert (`.section--alt` in `css/sections.css`). Sauberer und themable.

---

## 3. Verworfen

### React-Tweaks-Panel
Die Referenz lädt React, ReactDOM und Babel-Standalone, um ein Live-Preview-Tweaks-Panel anzubieten (Akzentfarbe wechseln, Headline-Variante, Card-Stil). Das ist **Editor-Tooling, nicht Production**. Nicht übernommen; das `omelette`-Script-Bundle wäre für Live-Visitors überflüssiger Ballast (>200 KB Babel allein) und passt nicht zum Performance-Anspruch.

### Caret-Cursor hinter H1
Statisch blinkender Caret als CSS-Pseudo-Element. Wurde durch den vollständigen Typewriter (s. o.) ersetzt. Der Cursor-Effekt ist im Typewriter integriert.

### Fake-Portrait-Frame im Hero
Die Referenz baut einen abstrakten Verlaufs-Platzhalter mit OSint-„portrait · jan-erik“-Label. Wir haben das durch das **echte Foto** (`portrait.webp`) ersetzt.

### Cloudflare-Email-Protection
Referenz nutzt `/cdn-cgi/l/email-protection`. Wir liefern die Mail-Adresse direkt, weil die Site nicht hinter Cloudflare läuft.

---

## 4. Folgeaufgaben (offene QA-Issues)

Aus der Übernahme sind drei QA-Tickets entstanden, die noch offen sind:

- **#18** Visueller Vergleich: aktuelle Seite vs. Referenz (Pixel-Diff, Section-Screenshots).
- **#19** EN-Sync prüfen: alle 13 englischen Seiten nach Design-Update.
- **#20** Unterseiten-Layouts prüfen und an neues Design anpassen.

Damit ist der Design-Strang abgeschlossen, sobald #18–#20 grün sind.

---

## 5. Empfehlung zum Aufräumen

Die Referenz-Datei `reference-design.html` (197 KB) liegt im Repo-Root. Sie ist Arbeitsmaterial, kein Produkt. Vorschlag: nach `docs/reference-design.html` verschieben oder ganz entfernen, sobald #18–#20 abgeschlossen sind. Der `omelette`-Inline-Skript-Block (Zeile 4) wäre bei einem versehentlichen Live-Deploy ein Sicherheits-Issue (postMessage zu `claude.ai`), darum nicht im Web-Root liegen lassen.
