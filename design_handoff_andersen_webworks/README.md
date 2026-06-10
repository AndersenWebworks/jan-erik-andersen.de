# Handoff: Andersen Webworks — Website-Relaunch & Design-System

## Überblick
Verbesserter Relaunch der Website von **Jan-Erik Andersen / Andersen Webworks**
(Original: https://jan-erik-andersen.de). Ziel: dieselben Inhalte, aber schicker,
konversionsstärker und mit besserer UX. Kernstück ist der **Projekt-Kompass** — ein
interaktiver 4-Schritt-Funnel, der Besuchern in ~60 Sekunden eine passende Lösung,
einen Preisrahmen und den nächsten Schritt liefert.

Dieses Paket ist ein **Design-System + Styleguide** zum Nachbauen in einem echten Codebase.

---

## Über die Design-Dateien (bitte zuerst lesen)
Die HTML/CSS/JS-Dateien in diesem Bundle sind **Design-Referenzen** — Prototypen, die
Aussehen und Verhalten zeigen. Sie sind **nicht** als produktiver Code zum 1:1-Kopieren
gedacht.

**Aufgabe:** Diese Designs in der Zielumgebung neu umsetzen, mit deren etablierten
Mustern und Bibliotheken. Falls noch keine Umgebung existiert, das passendste Framework
wählen. Empfehlung für dieses Projekt:

- **Astro** oder **Next.js (App Router)** — die Seite ist überwiegend statisch/marketing.
- **Tailwind CSS** ODER schlichte CSS-Variablen (das mitgelieferte Token-System ist
  Framework-agnostisch und lässt sich direkt übernehmen).
- Der **Projekt-Kompass** ist reine Client-Logik (kein Backend) — ideal als einzelne
  React/Vue/Svelte-Komponente oder als Web Component.
- WordPress-Variante möglich (das Original läuft auf WordPress/YOOtheme Pro), dann die
  Tokens als CSS-Variablen ins Theme und den Kompass als eingebettetes Script.

---

## Fidelity: **High-Fidelity (hifi)**
Finale Farben, Typografie, Spacing und Interaktionen. **Pixelgenau nachbauen.**
Alle exakten Werte stehen unten unter „Design-Tokens".

---

## Dateien in diesem Bundle
| Datei | Zweck |
|---|---|
| `Andersen-Webworks.html` | Die komplette verbesserte Seite (One-Pager, alle Sektionen) |
| `site.css` | Vollständiges Stylesheet inkl. Dark-Mode, alle Komponenten |
| `site.js` | Theme-Toggle, Mobile-Menü, Scroll-Reveal, Logo-Marquee, Kompass-Höhensync |
| `projekt-kompass.html` | Der Projekt-Kompass (Funnel) als eigenständige Seite |
| `projekt-kompass.js` | Komplette Funnel-Logik + Preisberechnung (maßgeblich, siehe unten) |
| `Styleguide.html` + `styleguide.css/.js` | Adobe-XD-artiger Styleguide: Devices, Button-States, Mobile-Menü, Farben, Type, Komponenten, Kompass |
| `parts/*.html` | Einzel-Artboards: colors, type, buttons, components, mobile-menu |
| `content.md` | **Vollständiger Seiteninhalt** der Live-Seite inkl. aller Unterseiten (Texte, Preise, alle 20 FAQ, Case-Studies) |

> **Wichtig:** `content.md` ist die Single Source of Truth für **Texte/Copy**.
> Die 20 FAQ, drei ausführlichen Case-Studies und die Leistungs-Detailseiten stehen
> dort vollständig — im HTML-Prototyp sind sie teils gekürzt.

---

## Design-Tokens

### Farben — Light (Default)
| Token | Hex | Verwendung |
|---|---|---|
| `--bg` | `#faf9f6` | Seiten-Hintergrund (warmes Papier) |
| `--bg-2` | `#f2f1ec` | getönte Sektionen, Pills, Hover |
| `--bg-3` | `#e9e8e1` | Hover-Flächen, Platzhalter-Verläufe |
| `--ink` | `#191917` | Überschriften, primärer Button |
| `--ink-2` | `#4a4a45` | Fließtext |
| `--ink-3` | `#86857c` | Meta, Labels, Mono-Eyebrows |
| `--rule` | `#e4e3db` | Trennlinien, Karten-Rahmen |
| `--rule-2` | `#ceccc2` | Hover-Rahmen, Input-Border |
| `--accent` | `#a83a3a` | **Brandrot** — Links, CTA, aktive States, Caret |
| `--accent-2` | `#8f2f2f` | Accent-Button Hover |
| `--accent-soft` | `#fcf2f2` | Fläche hinter Akzent-Text, offene FAQ-Icons |
| `--card` | `#ffffff` | Karten-Flächen |
| Status „online" | `#3aa15a` | nur für Verfügbarkeits-Indikator |

### Farben — Dark (`[data-theme="dark"]` auf `<html>` bzw. `<body>`)
| Token | Hex |
|---|---|
| `--bg` | `#111110` |
| `--bg-2` | `#1a1a18` |
| `--bg-3` | `#232321` |
| `--ink` | `#f1f0ea` |
| `--ink-2` | `#b9b8b0` |
| `--ink-3` | `#807f77` |
| `--rule` | `#292926` |
| `--rule-2` | `#393833` |
| `--accent` | `#cf5757` (heller für Kontrast auf dunkel) |
| `--accent-soft` | `#2a1717` |
| `--card` | `#1a1a18` |

Das Token-System ist 1:1 in `site.css` im `:root`-Block definiert — direkt übernehmbar.

### Typografie
- **Sans:** `Inter` (400/500/600/700) — Inhalt & Hierarchie
- **Mono:** `JetBrains Mono` (400/500) — Eyebrows, Labels, Preise, technische Akzente
- Google Fonts Import:
  `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap`

| Rolle | Größe | Weight | Letter-Spacing | Line-Height |
|---|---|---|---|---|
| H1 / Display | `clamp(38px, 5.2vw, 68px)` | 600 | -0.032em | 1.02 |
| H2 | `clamp(28px, 3.4vw, 44px)` | 600 | -0.026em | 1.08 |
| H3 / Card | 20px | 600 | -0.015em | 1.08 |
| Lede | 18–19px | 400 | — | 1.55 (color `--ink-2`) |
| Body | 16px | 400 | — | 1.6 (color `--ink-2`) |
| Small | 13–14px | 400 | — | (color `--ink-3`) |
| Eyebrow / Mono | 11–12px | 500 | +0.07em | UPPERCASE, color `--ink-3` |

Headings: `text-wrap: balance`. Lede/Absätze: `text-wrap: pretty`.

### Spacing & Layout
- Content-Container: `max-width: 1180px`, seitliches Padding `32px` (Desktop) / `20px` (≤720px)
- Sektions-Padding vertikal: `96px` (Desktop) / `64px` (≤720px)
- Grid-Gutter: `20px` (Karten), `54px` (Hero-Split)
- Karten-Innenabstand: `22–28px`

### Radius
- Groß (Karten, Container): `16px` (`--radius`)
- Klein (Buttons, Inputs, Pills-Box, Icons): `11px` (`--radius-sm`)
- Pills (vollrund): `999px`
- Brand-Mark / Icon-Buttons: `9px`

### Schatten
- `--shadow`: `0 1px 2px rgba(20,20,18,.04), 0 6px 18px rgba(20,20,18,.05)`
- `--shadow-lg`: `0 2px 6px rgba(20,20,18,.05), 0 18px 44px rgba(20,20,18,.09)`
- Accent-Button Hover: `0 14px 30px rgba(168,58,58,.32)`

### Bewegung
- Standard-Easing: `cubic-bezier(.2,.7,.2,1)` (Token `--ease`)
- Button-Hover: `translateY(-2px)` + Schattenwechsel, 0.15s
- Karten-Hover: `translateY(-4px)` + `--shadow-lg`, 0.22s
- Pfeil `→` in CTAs: `translateX(3px)` bei Hover
- Scroll-Reveal: `opacity 0→1` + `translateY(22px→0)`, 0.7s, getriggert per IntersectionObserver (threshold 0.12)
- Alle Animationen unter `@media (prefers-reduced-motion: reduce)` deaktiviert

---

## Komponenten

### Buttons (3 Stufen)
Basis: `inline-flex`, `gap:9px`, `padding:12px 20px`, `radius:11px`, `font:14.5px/500`,
`box-shadow:--shadow`, Transition wie oben. Enthält oft `<span class="arr">→</span>`.

| Variante | Default | Hover |
|---|---|---|
| **Primary** (`.btn-primary`) | bg `--ink`, text `--bg` | `translateY(-2px)` + `--shadow-lg` |
| **Accent** (`.btn-accent`) | bg `--accent`, text `#fff` | `translateY(-2px)` + roter Glow-Schatten |
| **Ghost** (`.btn-ghost`) | transparent, text `--ink`, border `1px --rule-2`, kein Schatten | bg `--bg-3` |

Weitere States, die im Styleguide ausspezifiziert sind und umgesetzt werden sollen:
- **Active:** `translateY(0)`, Schatten zurück, leichtes `filter:brightness(.9)`
- **Focus:** `outline:2px solid` (Accent auf Ink-Button, Ink auf Accent-Button), `outline-offset:2px`
- **Disabled:** `opacity:.4`, kein Schatten, `cursor:not-allowed`
- **Loading:** Spinner (14px, `border:2px currentColor`, top transparent, rotierend) + Text „Senden…"

### Pills / Tags
`.pill`: Mono 11.5px, bg `--card`, border `1px --rule`, `padding:7px 13px`, `radius:999px`.
`.pill.accent`: bg `--accent-soft`, text `--accent`, randlos.

### Icon-Button
36×36px, `radius:9px`, border `1px --rule`, Icon 17px in `--ink-2`.
Hover: bg `--bg-3`, text `--ink`, border `--rule-2`.

### Sprachumschalter
`inline-flex` Segmented, border `1px --rule`, `radius:9px`, overflow hidden.
Buttons Mono 11.5px; aktiver Button bg `--ink`, text `--bg`.

### Karten
- **Projekt-Karte** (`.proj`): Logo-Fläche (16:9 Verlauf `--bg-2→--bg-3`, radiales rotes
  Glow oben rechts) + Body (Tags, H3, Beschreibung, Link mit Pfeil). Hover: `translateY(-4px)` + `--shadow-lg`.
- **Schwerpunkt-Karte** (`.focus`): 3px Accent-Balken oben, der bei Hover von links
  einfährt (`scaleX 0→1`); Nummer (Mono, Accent), H3, Text, „Beleg"-Box (`--bg-2`).
- **Preis-Karte** (`.price`): Mono-Label, großer Preis (30px/600) mit `<small>`-Einheit,
  Beschreibung, Häkchen-Liste. `.price.feat` = Accent-Border + Ring (`box-shadow:0 0 0 1px --accent`).
- **Testimonial** (`.test`): Sterne (Accent), Topic-Label, Zitat (16.5px, auto-Anführungs-
  zeichen via `::before`/`::after` mit `\201E`/`\201C`), Avatar (Initiale) + Name/Rolle.
- **Prozess-Schritt** (`.step`): nummeriertes Accent-Quadrat (38px, radius 11), H3, Text.

### Formularfelder (im Styleguide spezifiziert)
- Input: `padding:12px 14px`, `radius:10px`, border `1px --rule-2`, bg `--card`, 14.5px.
- **Focus:** border `--accent` + `box-shadow:0 0 0 3px --accent-soft`.
- **Error:** wie Focus + rote Fehlermeldung 12px darunter.
- Labels: 13px/500.

### FAQ-Akkordeon
Natives `<details>/<summary>` (zugänglich, kein JS nötig). Summary 16.5px/500,
`padding:22px 26px`. Plus-Icon (28px, `radius:8`, `--bg-2`) rotiert bei `[open]` um 45°
(→ ×) und wechselt zu `--accent-soft`. Body 14.5px, `color:--ink-2`, `max-width:820px`.

---

## Screens / Sektionen (Reihenfolge der One-Page-Seite)

> Layout-Konvention: jede Sektion `padding:96px 0`; abwechselnd normaler bg und
> `.tinted` (bg `--bg-2`, oben/unten 1px `--rule`) für Rhythmus. Section-Head:
> Eyebrow (Mono + roter Punkt) → H2 → Lede (`max-width:760px`, `margin-bottom:48px`).

### 1. Header (sticky)
- Sticky oben, `z-index:60`, `backdrop-filter: blur(12px) saturate(160%)`,
  halbtransparenter bg. Beim Scrollen (>8px) erscheint unten eine 1px `--rule`-Linie
  (Klasse `.scrolled` per JS).
- Links: Brand (32px Ink-Quadrat „A", dreht bei Hover -8°; Name + Mono-Untertitel
  „ANDERSEN WEBWORKS").
- Mitte: Nav-Links. „Leistungen" hat ein **Hover-Dropdown** (`.submenu`, 290px,
  3 Einträge mit Titel + Untertitel, fade+slide-in).
- Rechts: Theme-Toggle (Sonne/Mond), Sprachumschalter DE/EN, Accent-CTA „Erstgespräch →".
- **≤1000px:** Nav + Meta ausgeblendet, **Hamburger** (Menu-Button) erscheint.

### 2. Hero
- Split-Grid `1.05fr / 0.95fr` (ab ≤980px einspaltig).
- Links: Eyebrow, H1 mit rot eingefärbtem Teil + **blinkendem Caret** (3px, `--accent`,
  `blink 1.1s steps(1) infinite`), Lede (19px), zwei CTAs (Accent + Ghost), 4 Pills.
- Rechts (`position:sticky; top:96px`): **Projekt-Kompass** als eingebettetes iFrame
  (`#embed`), Höhe wird per postMessage synchronisiert. In React/Vue stattdessen direkt
  als Komponente einbinden.
- Darunter: **Stats-Leiste** (4 Spalten in einer Karte): 27+ / 50+ / 14+ / 20+,
  Zahl 38px mit Accent-„+", Label `--ink-3`. ≤720px → 2×2.

### 3. Logo-Wall
- `.tinted`-Streifen, Mono-Label zentriert, **Endlos-Marquee** (CSS `scrollx 46s linear
  infinite`, Track für nahtlose Schleife verdoppelt, pausiert bei Hover, seitliche
  Mask-Fades). 17 Kunden (siehe `content.md` → Logo-Wall). Aktuell Wortmarken-Chips;
  echte Logos einsetzen sobald verfügbar.

### 4. Projekte
- Section-Head + 3-Spalten-Grid (`.proj`-Karten): Gerwing, Runden Group, WBG Pooling.
- Texte/Links exakt aus `content.md`. Darunter CTA-Reihe.

### 5. Schwerpunkte (`.tinted`)
- 3 `.focus`-Karten: 01 KI-Sichtbarkeit, 02 BFSG & Barrierefreiheit, 03 Shops & Custom.
- Jeweils mit „Beleg"-Box. Volltexte der Detailseiten in `content.md`.

### 6. Leistungen
- 3 `.svc-col`-Spalten: „Neu bauen" / „Reparieren & verbessern" / „Laufend betreuen",
  je 3 Leistungen mit Mono-Preis rechts. Alle 9 Pakete + Preise in `content.md`.

### 7. Kundenstimmen (`.tinted`)
- 2 `.test`-Karten (Karin Chierchia, Corvin Jaedicke), 5,0/5. Zitate aus `content.md`.

### 8. Ablauf
- 4 `.step`-Karten (Erstgespräch → Konzept → Umsetzung → Launch & Betreuung).

### 9. Über (`.tinted`)
- Split `0.85fr / 1.15fr`: Portrait-Platzhalter links, rechts Text + 4 `.apoint`
  (Direkt mit dem Entwickler / Lektorat inklusive / 27+ Jahre / 100% remote) +
  Stationen-Pills. Vollständige Bio in `content.md`.

### 10. Preise
- 4 `.price`-Karten (Website *featured*, Shop, Analyse, Betreuung) + `.price-foot`
  (80 €/h-Hinweis + Accent-CTA). Details/Listen in `content.md`.

### 11. FAQ (`.tinted`)
- `.faq`-Akkordeon. Prototyp zeigt 5 Fragen — **im Codebase alle 20 aus `content.md`** rendern.

### 12. Kontakt
- Dunkle `.contact-card` (bg `--ink`, im Dark-Mode `--bg-2`): Eyebrow, H2, Lede,
  4er-Kontaktgrid (Mail, Telefon, LinkedIn, Standort), 6 „Versprechen" (Accent-Border-
  left), Accent-CTA. Alle Kontaktdaten in `content.md`.

### Footer
- Copyright + Footer-Links (inkl. Impressum, Datenschutz, Barrierefreiheit).

---

## Der Projekt-Kompass (Kern-Feature) — maßgeblich `projekt-kompass.js`

Interaktiver Funnel, der eine Empfehlung + Preisrahmen erzeugt. **Reine Frontend-Logik,
kein Backend.** Bitte 1:1 nach `projekt-kompass.js` umsetzen — dort steht die komplette
Datenstruktur und Preislogik.

### Flow (4 Schritte → Ergebnis)
1. **Bedarf** (single-select, 5 Optionen): Neue Website / Online-Shop / Redesign /
   Laufende Betreuung / Website-Analyse.
2. **Umfang** (single-select) — je nach Bedarf andere Optionen, jede mit Preis-Range
   und Paketname (z. B. Website → Landingpage / Firmenwebsite / Portal).
3. **Extras / Details** — bei manchen Pfaden Mehrfachauswahl (z. B. BFSG, KI-Sichtbarkeit,
   Mehrsprachig, Custom) mit Preis-Aufschlägen; bei anderen single-select.
4. **Timing** (single-select): So bald wie möglich / In 1–3 Monaten / Erst orientieren.

→ **Ergebnis-Screen:** dunkler Kopf mit Paketname + Preisrahmen („ab X € · typisch X–Y €"),
„Das ist dabei"-Checkliste (Basis-Leistungen + gewählte Extras), kontextabhängiger
„Nächster Schritt"-Text je nach Timing, **Accent-CTA mit vorausgefüllter `mailto:`-Mail**
(Zusammenfassung der Auswahl) und „↺ Nochmal starten".

### Verhalten
- Single-Select-Schritte **springen automatisch** weiter (190ms Delay für visuelles Feedback).
- Multi-Select-Schritte zeigen einen expliziten „Weiter / Überspringen"-Button.
- Fortschrittsbalken (4 Segmente), Zurück-Button, „Schritt N von 4".
- Preisberechnung: Summe aus Umfang-Range + Aufschlägen der gewählten Extras
  (siehe `computePrice()` / `addOpt()` in der JS).
- **Embed-Modus** (`#embed` im Hash oder als iFrame): postet eigene Höhe via
  `postMessage({type:'kp-height', h})` an den Parent; empfängt
  `{type:'aw-theme', theme}` zum Theme-Sync. In einer SPA entfällt das — direkt als
  Komponente einbinden und Theme über Context/Props steuern.

### State
```
{ step: 0..4, need: string|null, q2: string|null,
  q3: string|string[]|null, timing: string|null }
```
Alle Optionsdaten (Icons als inline-SVG, Preis-Ranges, Paketnamen, inkludierte
Leistungen, Timing-Texte) liegen als Objekte `NEEDS`, `FLOWS`, `TIMING`, `TIMING_COPY`
oben in `projekt-kompass.js`.

---

## Interaktionen & Verhalten (Zusammenfassung)
- **Theme-Toggle:** schaltet `data-theme` light/dark, in `localStorage` (`aw_theme`)
  gespeichert, Icon wechselt Sonne/Mond, synchronisiert eingebetteten Kompass.
- **Mobile-Menü:** Vollbild-Overlay, `transform:translateX(100%)→0` (0.38s), Body-Scroll
  gesperrt solange offen, schließt bei Link-Klick. Markup in `Andersen-Webworks.html`
  (`.mobile-menu`), gestaltete „offen"-Ansicht zusätzlich in `parts/mobile-menu.html`.
- **Sticky-Header:** Rule-Linie ab 8px Scroll.
- **Scroll-Reveal:** `.reveal`-Elemente faden beim Eintreten in den Viewport ein.
- **Logo-Marquee:** Endlosschleife, Hover-Pause.
- **Hover-Dropdown** für „Leistungen".
- **Responsive Breakpoints:** 1000px (Nav→Hamburger), 980px (Hero/Grids einspaltig),
  900px (Prozess/Testimonials/Kontakt-Grid), 720px (Stats 2×2, Padding kleiner), 520px.

---

## Assets (noch zu liefern)
Aktuell **Platzhalter** (Wortmarken / CSS-Verläufe). Für die finale Umsetzung vom Kunden:
- **Logo:** `andersen-webworks-logo.png` (statt „A"-Monogramm im Header)
- **Portrait:** `portrait.webp` (Über-Sektion)
- **Kunden-Logos (SVG/PNG):** Gerwing, Runden Group, WBG Pooling, Woodshed, CASARO,
  Dark Fortress, Goodgame Studios, Deep Silver FISHLABS, Daedalic, dcorr, Ecobyte,
  Planworks, RPLC, Rubetrans, Beachhouse, InnoGames, YOOtheme.
- **LinkedIn-Icon** im Header (Link: https://www.linkedin.com/in/andersen-erik/)
- Icons sonst: inline-SVG (Stroke-Style, `stroke-width` 1.6–1.8) — können durch eine
  Icon-Lib (z. B. Lucide) ersetzt werden, gleicher Stil.

## Kontaktdaten (für Footer/Impressum/Kontakt)
- mail@andersen-webworks.de · 038733 270015 (+4938733270015)
- LinkedIn /in/andersen-erik · Plau am See, Mecklenburg-Vorpommern
- © 2026 Andersen Webworks

---

## Empfohlene Umsetzungs-Reihenfolge
1. Tokens (`:root` aus `site.css`) ins Projekt übernehmen (CSS-Variablen oder
   Tailwind-Theme), Fonts einbinden.
2. Basis-Komponenten bauen: Button (3 Varianten + States), Pill, Karte, Input, Akkordeon.
3. Header + Mobile-Menü + Theme-Toggle.
4. Sektionen 2–12 nach `content.md` (Volltexte!) zusammensetzen.
5. **Projekt-Kompass** als eigene Komponente nach `projekt-kompass.js`.
6. Scroll-Reveal, Marquee, Hover-Feinschliff, `prefers-reduced-motion` respektieren.
7. A11y: Fokus-States, Tastaturbedienung, ARIA — das ist Markenkern (BFSG/WCAG 2.1 AA).
