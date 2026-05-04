# Session-Handoff: JEA Website – CSS-Cleanup (nach QA vom 04.05.2026)

## Kontext
Die Website jan-erik-andersen.de wurde am 04.05.2026 von One-Page auf Multi-Page-Architektur umgebaut. Dabei wurde viel HTML umstrukturiert, aber die style.css hat ~1.000 Zeilen totes CSS aus entfernten Sektionen mitgeschleppt. Ein vollständiges QA-Audit (3 parallele Agents: Content, CSS, A11y) hat die Probleme identifiziert. Alle funktionalen Bugs sind gefixt – dieser Handoff betrifft ausschließlich CSS-Bereinigung.

## Aufgabe
Totes CSS aus `style.css` entfernen. Doppelte Selektoren auflösen. Breakpoints vereinheitlichen. Keine funktionalen Änderungen, kein HTML, kein Content.

## Regeln
- NUR style.css bearbeiten
- Vor JEDER Löschung per Grep prüfen, ob die Klasse in einer aktiven HTML-Datei vorkommt (exclude archiv/, tests/)
- Nach jeder größeren Löschung im Browser verifizieren (npx serve .)
- Zwischenstände committen (alle 3-4 Löschblöcke)
- Kein Git-Rollback, niemals

## Was gelöscht werden kann (QA-bestätigt, nicht in aktivem HTML)

### Entfernte Sektionen (große Blöcke)
- **Comparison Section** (~150 Zeilen ab ~3156): `.comparison-section`, `.comparison-grid`, `.comparison-card`, `.comparison-list`, `.comparison-proof`
- **Price Example/Comparison** (~60 Zeilen ab ~3244): `.price-example`, `.price-example--large`, `.price-example-title`, `.price-comparison`, `.price-old`, `.price-new`, `.price-arrow`, `.price-savings`, `.price-note`, `.price-column`, `.price-label`
- **Remote Section** (~12 Zeilen ab ~4797): `.remote-section`, `.remote-content`
- **Trust Logos / Availability Badge** (~20 Zeilen): `.trust-logos`, `.trust-logo`, `.availability-badge`
- **Alte Case-Study-Klassen** (~50 Zeilen ab ~3913): `.case-study-content`, `.case-study-details`, `.case-study-comparison`, `.case-study-link`
- **Pricing Extras**: `.pricing-savings`, `.pricing-compare`

### Alte Komponenten (nie in aktiven Seiten verwendet)
- **Zero-Click Chart** (~96 Zeilen ab ~1188): alle `.zc-*` Klassen
- **Evidence Cards** (~70 Zeilen ab ~1116): `.evidence-group`, `.evidence-item`, `.evidence-stat`, `.evidence-context`
- **Shift Flow Diagrams** (~62 Zeilen ab ~1286): `.shift-timeline-flex`, `.shift-flow`, `.shift-row`
- **Architecture Comparison** (~82 Zeilen ab ~1361): `.architecture-comparison-grid`, alle `.arch-*`
- **Generative UI Flow** (~52 Zeilen ab ~1446): `.genui-flow-grid`, `.diagram-step`, alle `.step-*`
- **Cluster Cards** (~67 Zeilen ab ~708): `.cluster-card`, `.cluster-grid`, `.cluster-number`, `.cluster-list`
- **Old Project Grid** (~52 Zeilen ab ~826): `.project-grid`, `.project-tag`, `.project-desc`
- **Mini Cards** (~45 Zeilen ab ~879): `.mini-card`, `.mini-card-grid`
- **Feature Story / Domain List** (~46 Zeilen ab ~778)
- **Homepage Intro** (~13 Zeilen ab ~995): `.homepage-intro`
- **Old About Grid** (~33 Zeilen ab ~959): `.about-grid`, `.about-photo`
- **Problem Statement** (~12 Zeilen ab ~700): `.problem-statement`
- **GEO Hint** (~13 Zeilen ab ~1041): `.geo-hint`

### Alte UI-Komponenten
- **Hamburger / Mobile Menu** (~125 Zeilen ab ~506): `.header-hamburger`, `.header-mobile-menu`, `.darkmode-checkbox-mobile`
- **Old BEM Buttons** (~15 Zeilen ab ~677): `.btn--primary`, `.btn--secondary`
- **Funnel Spotlight** (~13 Zeilen ab ~1619): `.funnel-spotlight`
- **Old standalone .testimonial** (~28 Zeilen ab ~3972): aktive Seiten nutzen `.testimonial-card`
- **Old .clients-further / .client-tag** (~37 Zeilen ab ~4836): ersetzt durch `.client-logos-grid`

### Alte Editorial-Komponenten (teilweise)
- `.editorial-pullquote`, `.chapter-mark`, `.end-mark`, `.ornament`, `.footer-proof` – NUR löschen wenn Grep bestätigt, dass sie in keinem aktiven File vorkommen. Einige editorial-* Klassen WERDEN noch auf /ueber/ verwendet (z.B. `.editorial-portrait`, `.editorial-sidebar`, `.editorial-contact`)

## Doppelte Selektoren auflösen

Diese Selektoren existieren doppelt mit widersprüchlichen Werten. Die SPÄTERE Definition ist die aktive (CSS-Cascade). Die FRÜHERE kann gelöscht werden:

| Selektor | Löschen (früher) | Behalten (später) |
|----------|-------------------|-------------------|
| `.btn` | ~Zeile 662 | ~Zeile 3026 |
| `.hero` | ~Zeile 633 | ~Zeile 3690 |
| `.project-card` + `:hover` | ~Zeile 833 | ~Zeile 3392 |
| `.contact-methods` | ~Zeile 1056 | ~Zeile 3595 |
| `.contact-method` | ~Zeile 1063 | ~Zeile 3602 |
| `.process-step` | ~Zeile 933 | ~Zeile 4694 |
| `.process-number` | ~Zeile 935 | ~Zeile 4701 |
| `.testimonials-grid` | ~Zeile 3093 | ~Zeile 3966 |
| `.testimonials-section` | ~Zeile 3088 | ~Zeile 4653 |

**VORSICHT**: Nur den alten Block löschen, NICHT den neuen. Bei `.btn` darauf achten, dass die alte Definition `.btn` UND `.btn--primary`/`.btn--secondary` umfasst – die BEM-Varianten können komplett weg, die Basis-`.btn` nur wenn sie im alten Block steht.

## Breakpoints vereinheitlichen

Zwei "Mobile"-Breakpoints koexistieren:
- `max-width: 600px` (5 Vorkommen, altes System)
- `max-width: 640px` (2 Vorkommen, neues System)

Entscheidung: auf **640px** vereinheitlichen. Die 600px-Regeln auf 640px ändern – ABER nur nach Prüfung, dass keine Konflikte mit bestehenden 640px-Regeln entstehen (gleiche Selektoren zusammenführen).

Außerdem: `.footer-content` (um Zeile 1090) hat doppelte `flex-wrap` und `gap` Properties – Duplikate entfernen.

## Erwartetes Ergebnis
- style.css ~1.000 Zeilen kürzer
- Keine doppelten Selektoren mehr
- Einheitliche Breakpoints: 1024 / 768 / 640 / 480
- Keine verwaisten Klassen für entfernte HTML-Sektionen
- Visuell identisch auf allen 26 aktiven Seiten (vor/nach Vergleich)

## Verifikation
Nach dem Cleanup alle Seiten im Browser prüfen (Desktop + Mobile):
- / (Homepage)
- /leistungen/ (+ 3 Landingpages)
- /projekte/
- /preise/
- /faq/
- /ueber/
- /kontakt/
- Jeweils auch /en/ Pendants
- Dark Mode auf allen Seiten
- Mobile (< 768px) auf allen Seiten

## Repo
`C:/Andersen/Webworks/GitHub/Webworks/jan-erik-andersen.de`
