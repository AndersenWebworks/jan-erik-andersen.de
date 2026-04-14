# PROJECT_OVERVIEW - jan-erik-andersen.de

## Projektziel

Personal-Brand-Website fuer Jan-Erik Andersen (Andersen Webworks).
Positionierung 2026: Alles aus einer Hand - Konzept, Design, Entwicklung, Betreuung.
KI-Sichtbarkeit (GEO/AVO) als eingebautes Feature, nicht als Hauptprodukt.
Expertenton, nicht Bewerbungston. KI-lesbar und menschenlesbar.

## Stack

- **Frontend:** Statisches HTML, CSS (kein Framework, kein Build-Tool)
- **Typografie:** Georgia (Serif, Headings) + Inter (Sans, Body) via Google Fonts
- **Design:** Editorial CSS v4.0 - Cream #F9F5F0 (Light), Warm Dark #1A1714 (Dark), CI-Rot #d40235
- **Layout:** Max-Width 900px, Line-Height 1.75, Double-Border Header/Footer, Pill-Toggle Controls
- **AI-Layer:** JSON-Endpoints unter /ai/ (Schema.org, JSON-LD, Plain-Text-Spiegel)
- **Hosting:** GitHub Pages (main Branch = live)
- **Tracking:** GoatCounter (Pixel, kein JS)

## Seitenstruktur

```
/                          Startseite (Hero + Kurzvorstellung + Leistungen + Projekte + KI-Sichtbarkeit + Kontakt)
/leistungen/               Drei Service-Cluster (Sichtbar werden, Besser arbeiten, Abgesichert bleiben)
/leistungen/ki-sichtbarkeit.html   GEO-Vertiefung (Edukation, Statistiken, Quellen)
/projekte/                 3 Feature-Cards (Gerwing, Runden, Scheja) + Mini-Card-Grid (weitere Kunden) + Pro Bono
/ueber/                    Bio, Disziplinen, Ablauf, Portrait
/kontakt/                  Kontaktdaten + Erstgespraech
/en/                       Englische Version (6 Seiten: /, services/, projects/, about/, contact/, services/ai-visibility.html)
/de/                       Impressum, Datenschutz, Barrierefreiheit
/ai/                       AI-Endpoints (manifest, identity, services, FAQ, health)
```

## Tonregeln

1. Feststellen, nicht verkaufen
2. Daten mit Quellen, nicht Behauptungen
3. Arbeit beschreiben, nicht sich selbst
4. Kontaktdaten sind Information, nicht Einladung
5. Keine Vergleiche nach unten
6. Keine Verteidigungen
7. Quellen wo moeglich
8. Die Seite IST der Beweis

## Constraints

- Kein JavaScript (ausser Dark Mode Toggle, Hamburger Menu, GoatCounter Pixel)
- DSGVO-konform
- BFSG-Barrierefreiheit (WCAG 2.1 AA)
- Performance-first (Lighthouse 95+)
- Keine Frameworks, keine Build-Tools
- Push = live (GitHub Pages)

## Design-System (v4.0)

- CI-Rot: #d40235 (Light), Coral #E07060 (Dark)
- Cream: #F9F5F0 (Light bg), Warm Dark: #1A1714 (Dark bg)
- Max-Width: 900px, Line-Height: 1.75
- Double-Border Header/Footer (3px double)
- Pill-Toggle Controls (99px border-radius)
- Mini-Card-Grid: .mini-card-grid + .mini-card
- Hamburger Menu ab 900px (aria-expanded, Auto-Close)

## Dokumentation

### Public (doc/ - im Repo)

| Datei | Inhalt |
|-------|--------|
| doc/ARCHITECTURE.md | AI-Native Web Prinzipien |
| doc/LEARNINGS.md | Chronologische Erkenntnisse |
| doc/PROJECT-CONTEXT.md | Technischer Kontext fuer Claude-Instanzen |
| doc/SSOT-PIPELINE.md | Datenfluss und Synchronisation |
| doc/FETCH-TEMPLATES.md | Developer-Integration AI-Endpoints |
| doc/MEASUREMENT.md | Semantic Survival Rate QA-Framework |
| doc/DOCS_REVIEW.md | Doku-Audit |

### Privat (.claude/context/ - gitignored)

| Datei | Inhalt |
|-------|--------|
| .claude/context/ERIK-PORTRAIT.md | Biografie, Karriere, Persoenlichkeit, Arbeitsweise |
| .claude/context/PROJEKT-HISTORY.md | Alle 50+ Projekte, alle Epochen, vollstaendige Tabelle |
| .claude/context/POSITIONIERUNG-2026.md | Strategieplan, Revenue-Modell, Akquise |
| .claude/context/MARKT-ANALYSE-2026.md | Freelancer-Markt, AI-Impact, BFSG, Konjunktur |

## Naechste Schritte

- H1-Diskussion: "Aus einer Hand" als Headline statt Subtitle?
- Betreuung prominenter positionieren (Cluster 03 -> durchgaengiges Thema?)
- Content-Qualitaetsdurchgang (Writing Style, Sprachstandard)
- Annemarie-Lektorat
- doc/ auf Alignment mit Positionierung 2026 pruefen
- 301-Redirect andersen-webworks.de -> jan-erik-andersen.de
