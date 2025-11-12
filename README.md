# jan-erik-andersen.de

> **GEO Expert für Deutschland**
> AI-native Website, die zeigt, wie Unternehmen in der Post-Google-Ära durch strukturierte Daten sichtbar bleiben.

---

## Was ist das?

Eine **GEO-optimierte Onepager-Website**, die zwei Zielgruppen perfekt bedient:

1. **Menschen** — Sehen klare Nutzenversprechen, Leistungen, Preise
2. **Maschinen** (ChatGPT, Claude, Perplexity, Gemini) — Bekommen strukturierte Daten für präzise Antworten

**Das Besondere:** Die Website ist selbst der Beweis für das Konzept.

---

## Das Problem, das wir lösen

**59,7% aller Google-Anfragen** enden ohne Klick (SparkToro, 2024).
**AI-Agents fetchen nur eine URL** pro Antwort (Single-Fetch-Prinzip).

**Konkret:**
Wenn ein Kunde ChatGPT fragt *"Finde mir einen GEO-Experten"*, erscheinen nur Unternehmen mit strukturierten Daten auf **einer** Seite. Multi-Page-Websites mit `/services/`, `/about/`, `/contact/` → **unsichtbar**.

**Unsere Lösung:**
AI-Onepager mit allen Key Facts auf einer Seite. Strukturiert, semantisch, natürlichsprachlich.

---

## Projektstruktur

```
jan-erik-andersen.de/
├─ index.html                    # GEO-optimierter Onepager (DE)
├─ en/index.html                 # GEO-optimierter Onepager (EN)
├─ ai/
│  ├─ architecture.md            # AI-Native Web Architecture Prinzipien
│  ├─ services.json + .txt       # Leistungen mit Preisen
│  ├─ identity-schema.json + .txt # Person Schema.org
│  ├─ faq-schema.json + .txt     # FAQPage Schema.org
│  ├─ content.json + .txt        # Content-Index
│  ├─ health.json + .txt         # System-Health
│  ├─ publications.json + .txt   # Publikationen
│  └─ manifest.json + .txt       # Endpoint-Index
├─ verify/
│  ├─ proof-sequence.md          # Agent-Testanleitung
│  ├─ metrics.json               # Testergebnisse
│  └─ README.md                  # Test-Dokumentation
├─ tools/
│  └─ ai-visibility-test.py      # Python Test-Script
├─ README.md                     # Diese Datei
├─ VISION.md                     # Projekt-Vision
├─ MARKETING.md                  # Akquise-Strategie
├─ LEARNINGS.md                  # Erkenntnisse
└─ kindle-optimized.css          # 0 JS CSS-Only Dark Mode

```

---

## AI-Native Onepager-Architektur

### Layer 1: **Für Menschen** (index.html)

- Direkte, klare Sprache (keine Buzzwords)
- Schmerzpunkt → Lösung → Prozess
- Konkrete Zahlen: 59,7% Zero-Click, Single-Fetch-Prinzip
- Klare CTAs: "Kontakt", "Leistungen", "FAQ"
- Typografie: Minimalistisch, Kindle-inspiriert
- 0 Bytes JavaScript, 0 Frameworks

### Layer 2: **Für LLMs** (JSON-LD im HTML + /ai/*.json)

- **Onepager-Prinzip:** Alle Key Facts auf einer Seite
- **JSON-LD im `<head>`:** Schema.org Person, FAQPage, Services
- **Strukturierte Daten in /ai/:**
  - `services.json + .txt`: Services mit Preisen, Dauer, Deliverables
  - `identity-schema.json + .txt`: Person Schema.org
  - `faq-schema.json + .txt`: FAQPage Schema.org
  - `content.json + .txt`: Content-Index
  - `manifest.json + .txt`: Endpoint-Übersicht
- **Wow-Effekt:** LLMs lesen alle Infos beim ersten Fetch
- **Test:** Frage ChatGPT *"Was bietet Jan-Erik Andersen an?"* → Präzise Antwort mit Preisen

---

## Technische Spezifikation

### Was drin ist:

- ✅ **AI-Onepager** (alle Inhalte auf einer Seite)
- ✅ **Semantisches HTML** (`<dl>`, `<section>`, `<article>`)
- ✅ **JSON-LD** im `<head>` (Person, FAQPage, Offers)
- ✅ **Plain-text Mirrors** (.txt) für alle JSON-Dateien
- ✅ **CSS-Only Dark Mode** (kein JavaScript)
- ✅ **Framework-frei**, kein Build-Prozess
- ✅ **W3C-validiert, Schema.org-compliant**

### Was NICHT drin ist:

- ❌ JavaScript
- ❌ Build-Prozess
- ❌ Frameworks (React, Vue, etc.)
- ❌ Multi-Page-Struktur
- ❌ Externe Fonts oder Libraries

---

## Demo durchführen

### 1. Für Menschen (Browser-Test)

```bash
# Lokal testen
python -m http.server 8000

# Oder direkt öffnen
open http://localhost:8000
```

**Erwartung:** Professionelle GEO-optimierte Landingpage mit allen Key Facts.

### 2. Für LLMs (ChatGPT-Test)

**Öffne ChatGPT und frage:**

```
"Was bietet Jan-Erik Andersen an? Nenne Services und Preise."
```

**Erwartetes Ergebnis:**

```
Jan-Erik Andersen ist GEO Expert für Deutschland und bietet:

1. Struktur-Audit
   - Live-Test mit ChatGPT und Analyse der Website-Struktur
   - Dauer: 3-5 Tage
   - Ergebnis: 1-seitiger Maßnahmenplan

2. GEO-Optimierung
   - Website-Optimierung für ChatGPT, Perplexity, Gemini
   - Strukturierte Daten, AI-lesbare Inhalte
   - Dauer: 2-4 Wochen

3. Brand Voice Definition
   - Tonalität für AI-Dialoge
   - Antwortmuster, konsistente Repräsentation
   - Dauer: 1-2 Wochen

Kontakt: mail@andersen-webworks.de
Telefon: 038733 270015
Erreichbarkeit: Mo-Fr, 9-17 Uhr
```

**Das ist der Wow-Effekt.**

---

## Philosophie

### Structure as Integrity

Struktur ist nicht nur technisches Mittel, sondern Ausdruck von Verlässlichkeit.
Gut strukturierte Daten schaffen Vertrauen.

### Google Zero

Der Moment, in dem Suchmaschinen irrelevant werden.
AI-Agenten konsumieren Daten direkt aus strukturierten Quellen.
Wer dann keine semantische Signatur hat, ist **unsichtbar**.

### Single-Fetch-Prinzip

AI-Agents fetchen **eine URL** pro Antwort.
Multi-Page-Websites → unsichtbar.
AI-Onepager → alle Infos beim ersten Request.

---

## Deployment

**GitHub Pages:**

```bash
git push origin main
# Automatisch deployed via GitHub Pages
```

Kein Build-Prozess nötig. Die Dateien sind statisch.

---

## Validierung

### 1. HTML/CSS

```bash
# W3C Validator
https://validator.w3.org/

# Lighthouse
lighthouse https://jan-erik-andersen.de
```

**Ziel:** > 95 Score

### 2. Strukturierte Daten

```bash
# Schema.org Validator
https://validator.schema.org/

# JSON-LD Playground
https://json-ld.org/playground/
```

**Ziel:** Keine Fehler, keine Warnungen

### 3. LLM-Lesbarkeit

```bash
# ChatGPT Test
"Was bietet Jan-Erik Andersen an?"

# Claude Test
"Fasse die Services von Jan-Erik Andersen zusammen."

# Perplexity Test
"Wie kann ich Jan-Erik Andersen kontaktieren?"
```

**Ziel:** Umfassende, präzise Antworten mit konkreten Daten

---

## Success Metrics

✅ **Für Menschen:**
- Landingpage überzeugt ohne technisches Vorwissen
- Klare Schmerzpunkte, Lösungen
- Direkte, selbstbewusste Sprache

✅ **Für LLMs:**
- ChatGPT, Claude, Perplexity, Gemini geben präzise Antworten
- Alle Services, Preise, Kontaktdaten korrekt wiedergegeben
- Onepager-Prinzip: Alle Infos beim ersten Fetch

✅ **Technisch:**
- W3C-validiert
- Schema.org-compliant
- Lighthouse > 95
- 0 Bytes JavaScript

---

## Roadmap

### Phase 1: GEO-Optimierung (✅ Completed)

- [x] AI-Onepager (alle Inhalte auf einer Seite)
- [x] Semantisches HTML mit `<dl>`, `<section>`
- [x] JSON-LD Schema.org Markup
- [x] CSS-Only Dark Mode
- [x] EN-Version

### Phase 2: Live & Testing

- [x] Deploy auf jan-erik-andersen.de
- [x] GitHub Pages Setup
- [ ] Monitoring für AI-Citations
- [ ] A/B-Testing für CTAs

### Phase 3: Akquise

- [ ] LinkedIn-Kampagne starten
- [ ] Erste 10 kostenlose Struktur-Audits
- [ ] Case Studies von echten Kunden
- [ ] Testimonials sammeln

---

## Kontakt

**Jan-Erik Andersen**
GEO Expert | AI Search Optimization

- Website: [jan-erik-andersen.de](https://jan-erik-andersen.de)
- E-Mail: mail@andersen-webworks.de
- Telefon: 038733 270015
- LinkedIn: [linkedin.com/in/jan-erik-andersen](https://linkedin.com/in/jan-erik-andersen)

---

## Lizenz

Dieses Projekt ist ein Proof of Concept für GEO (Generative Engine Optimization).
Der Code ist frei verwendbar. Attribution erwünscht.

---

**Projekt:** jan-erik-andersen.de
**Status:** Live — GEO-Optimiert
**Datum:** 2025-11-12
