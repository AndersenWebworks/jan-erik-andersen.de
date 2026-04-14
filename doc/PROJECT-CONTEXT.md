# Project Context fuer Claude-Instanzen

**Projekt:** jan-erik-andersen.de - Personal Brand Website
**Owner:** Jan-Erik Andersen
**Status:** Live, aktive Weiterentwicklung
**URL:** https://jan-erik-andersen.de
**Repository:** https://github.com/AndersenWebworks/jan-erik-andersen.de

---

## Was ist dieses Projekt?

Personal-Brand-Website fuer Erik Andersen (Andersen Webworks). Statisches HTML auf GitHub Pages. Kein CMS, kein Build, kein Framework. Push = live.

**Positionierung:** "Ihr Web-Betreuer" - alles aus einer Hand. KI-Sichtbarkeit (GEO/AVO) als eingebautes Feature. Expertenton, nicht Bewerbungston.

---

## Wichtigste Dateien (ZUERST LESEN)

### Public (im Repo)
1. **PROJECT_OVERVIEW.md** - Seitenstruktur, Design-System, Constraints
2. **doc/ARCHITECTURE.md** - AI-Native Web Prinzipien
3. **doc/LEARNINGS.md** - Chronologische Erkenntnisse

### Privat (.claude/context/ - gitignored, nur lokal)
4. **.claude/context/ERIK-PORTRAIT.md** - Wer Erik ist (Biografie, Karriere, Arbeitsweise, Haltung)
5. **.claude/context/PROJEKT-HISTORY.md** - Alle 50+ Projekte (vollstaendige Tabelle)
6. **.claude/context/POSITIONIERUNG-2026.md** - Strategieplan und Revenue-Modell
7. **.claude/context/MARKT-ANALYSE-2026.md** - Marktdaten Freelancer/WordPress/AI 2026

---

## Kritische Regeln

### Tonregeln (IMMER beachten)
1. Feststellen, nicht verkaufen
2. Daten mit Quellen, nicht Behauptungen
3. Arbeit beschreiben, nicht sich selbst
4. Kontaktdaten sind Information, nicht Einladung
5. Keine Vergleiche nach unten
6. Keine Verteidigungen
7. Die Seite IST der Beweis

### Erik ist Vibe Coder
- Er coded nicht selbst, er dirigiert Claude/AI-Tools
- Code muss selbsterklaerend sein
- Keine Over-Engineering, keine abstrakten Patterns
- Wenn er fragt "Ideen?" - erst antworten, nicht sofort umsetzen

---

## Technologie-Stack

**Hosting:** GitHub Pages
**Domain:** jan-erik-andersen.de (DNS: KAS A-Records)
**HTTPS:** Let's Encrypt (automatisch)
**Deployment:** git push origin main (1-2 Min bis live)

**Kein JavaScript** ausser:
- Dark Mode Toggle
- Hamburger Menu (ab 900px)
- GoatCounter Pixel (Tracking)

**Design v4.0:**
- Georgia Serif (H1-H4) + Inter Sans (Body)
- Cream #F9F5F0 / Warm Dark #1A1714
- CI-Rot #d40235 / Coral #E07060 (Dark)
- Max-Width 900px, Line-Height 1.75

---

## Projekt-Struktur

```
jan-erik-andersen.de/
├── index.html                    # Startseite (DE)
├── style.css                     # CSS v4.0
├── leistungen/index.html         # Leistungen
├── leistungen/ki-sichtbarkeit.html # GEO-Vertiefung
├── projekte/index.html           # Projekte + Mini-Cards
├── ueber/index.html              # Ueber mich
├── kontakt/index.html            # Kontakt
├── en/                           # Englische Version (6 Seiten)
├── de/                           # Impressum, Datenschutz, Barrierefreiheit
├── ai/                           # Maschinenlesbare Endpoints
│   ├── manifest.json             # Endpoint-Index (SSOT)
│   ├── services.json             # Services (Schema.org)
│   ├── services.txt              # Plain-Text-Spiegel
│   ├── identity-schema.json      # Person (Schema.org)
│   ├── identity.txt              # Plain-Text-Spiegel
│   ├── faq-schema.json           # FAQ
│   └── health.json               # System-Health
├── doc/                          # Dokumentation und Kontext
├── portrait.webp                 # Portrait-Foto
├── favicon.svg                   # Favicon
├── robots.txt, sitemap.xml       # SEO
├── llms.txt                      # LLM-Kontext
└── PROJECT_OVERVIEW.md           # Projektueberblick
```

---

## Deployment

```bash
git add -A
git commit -m "Description"
git push origin main
# Automatisch live nach 1-2 Min
```

NICHT verwenden: deploy.py (entfernt), FTP (nicht mehr noetig)

---

## Fuer neue Claude-Instanzen

Wenn du an jan-erik-andersen.de arbeitest:

1. Lies PROJECT_OVERVIEW.md (Struktur, Design, Constraints)
2. Lies doc/ERIK-PORTRAIT.md (wer Erik ist)
3. Lies doc/POSITIONIERUNG-2026.md (strategischer Kontext)
4. Verstehe: Push = live, kein Build
5. Beachte: Expertenton, nicht Bewerbungston
6. Erik coded nicht selbst - erklaere Aenderungen verstaendlich

---

## Kontakt und Ownership

**Owner:** Jan-Erik Andersen
**Email:** mail@andersen-webworks.de
**GitHub:** AndersenWebworks

---

Zuletzt aktualisiert: 14. April 2026
