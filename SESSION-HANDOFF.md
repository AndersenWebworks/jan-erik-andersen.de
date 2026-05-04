# Session-Handoff: JEA Website – Stand 05.05.2026

## Was in dieser Session passiert ist (04.–05.05.2026)

Kompletter Umbau von inkonsistentem Hybrid auf GEO-konforme Multi-Page-Architektur.
~30 Commits, alle gepusht.

### Architektur (final)
- **Homepage = Executive Summary** (GEO-Playbook-konform): Alle Kernfakten für KI zitierbar, Beweis zuerst
- **Seitenreihenfolge Homepage:** Hero → Funnel → Projekte → Testimonials → Themen-Anker → Prozess → About → Pricing → FAQ → Kontakt
- **Leistungen = Problem-orientiert:** Neu bauen / Reparieren & verbessern / Laufend betreuen
- **3 Landingpages:** KI-Sichtbarkeit, BFSG, Shops (Deep Dives mit eigenem Schema)
- **Projekte:** Exklusiver Portfolio-Content (Case Studies mit Screenshots, Logos, Pro Bono)
- **Kein Duplicate Content** zwischen Homepage und Unterseiten
- **DE/EN 1:1 Parität:** 26 aktive HTML-Dateien (13 DE + 13 EN)

### Features gebaut
- 6 Themen-Landingpages (3 DE + 3 EN) mit Service-Schema + FAQ
- Kunden-Logo-Sektion (15 Logos, Dark Mode Invert) auf /projekte/
- Retainer 200/400/800 EUR auf allen Seiten konsistent
- Projekt-Screenshots (Playwright) in Case Studies
- Mobile-Menü (Hamburger) in allen 26 Dateien
- Funnel: KI-Sichtbarkeits-Pfad, BFSG-Betroffenheitscheck, Selbsthilfe-Tipps
- Funnel: Kontextuelle Email-Drafts (Pfad des Users wird mitgeschickt)
- Constellation-Animation auf Funnel-Section begrenzt
- 20 FAQ mit FAQPage-Schema (nur auf /faq/)
- llms.txt, robots.txt (KI-Bots), sitemap.xml
- Darkmode: --color-bg-card ergänzt (fehlte komplett)
- A11y: aria-labels, Skip-Links, Heading-Hierarchie, details/summary CSS

### QA durchgeführt
- 3 parallele Audit-Agents (Content, CSS, HTML/A11y)
- Playwright Mobile + Dark Mode Screenshots für alle 7 DE-Seiten
- Alle internen Links verifiziert
- Pricing-Konsistenz über alle Dateien + Funnel
- Schema.org auf allen Seiten geprüft

## Was noch offen ist

### Prio 1: CSS-Cleanup (~1.000 Zeilen totes CSS)
Detaillierter Plan steht weiter unten (aus vorherigem Handoff übernommen).
Betrifft NUR style.css. Kein funktionaler Impact, aber Performance-Bloat.

### Prio 2: EN Funnel Email-Kontext
Die PATH_CONTEXT Map in funnel.js hat deutsche Labels. Für den EN Funnel
(en/funnel.json) braucht es eine EN-Version der Labels – oder eine
sprachunabhängige Lösung (Node-IDs statt Labels).

### Prio 3: Inhaltliche Feinarbeit
- Funnel Result-Texte weiter schärfen (weniger Artikel, mehr Empfehlung)
- Homepage-Schema (ProfessionalService) an neue Service-Cluster anpassen
- /ueber/ und /en/about/: Prozess auf 4 Schritte synchron (done), aber
  Inhalt der Über-mich-Seite könnte frischer sein (Roundtable-Empfehlung)

### Prio 4: Performance
- Bilder in screenshots/ sind unoptimierte PNGs (~200KB+). Zu WebP konvertieren
- CSS-Cleanup reduziert Dateigröße um ~20%

## CSS-Cleanup Plan (aus QA-Audit)

### Totes CSS entfernen (QA-bestätigt, nicht in aktivem HTML)

**Entfernte Sektionen:** Comparison (~150 Zeilen), Price Example (~60),
Remote (~12), Trust Logos (~20), alte Case-Study-Klassen (~50),
.pricing-savings, .pricing-compare

**Alte Komponenten:** Zero-Click Chart (~96), Evidence Cards (~70),
Shift Flow (~62), Architecture Comparison (~82), Generative UI Flow (~52),
Cluster Cards (~67), Old Project Grid (~52), Mini Cards (~45),
Feature Story (~46), Homepage Intro (~13), Old About Grid (~33),
Problem Statement (~12), GEO Hint (~13)

**Alte UI:** Hamburger/Mobile Menu CSS existiert und wird JETZT GENUTZT –
NICHT löschen! Aber: Old BEM Buttons (~15), Funnel Spotlight (~13),
Old .testimonial (~28), Old .clients-further (~37)

### Doppelte Selektoren auflösen
.btn, .hero, .project-card, .contact-methods, .process-step,
.testimonials-grid, .testimonials-section – jeweils frühere Definition löschen

### Breakpoints vereinheitlichen
600px (5x) und 640px (2x) → auf 640px vereinheitlichen

## Repo
`C:/Andersen/Webworks/GitHub/Webworks/jan-erik-andersen.de`
Branch: main, alles gepusht
