# Projekt-Dokumentation

**jan-erik-andersen.de**
GEO-optimierter AI-Onepager | BFSG-konform | Stand: 2025-11-13

---

## 📚 Dokumentations-Übersicht

| Datei | Zweck | Für wen? |
|-------|-------|----------|
| **[LEARNINGS.md](LEARNINGS.md)** | Erkenntnisse aus dem Projekt (GEO = BFSG = SEO = ein Prinzip) | Alle |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | AI-Native Web Architecture, technische Prinzipien | Entwickler |
| **[PROJECT-CONTEXT.md](PROJECT-CONTEXT.md)** | Kontext für Claude-Instanzen, Troubleshooting | Claude/AI |

---

## 🎯 Kern-Erkenntnisse

### Ein Prinzip löst alles

**GEO, BFSG, SEO, Google Zero = nicht vier Optimierungen, sondern EIN Prinzip:**

```
Handkuratierter Text
  ├─ Semantisches HTML
  ├─ Fehlerfreiheit
  ├─ Präzision
  ├─ Konsistenz
  └─ Struktur
      ├─ GEO (AI-Agenten lesen)
      ├─ BFSG (Screenreader lesen)
      ├─ SEO (Google versteht besser)
      ├─ Google Zero (Snippets extrahierbar)
      └─ Citation-Rate (Agenten zitieren)
```

**Basis:**
- Alle Systeme (AI-Agenten, Screenreader, Google, Snippet-Parser) brauchen:
  1. **Semantisches HTML** (`<dl>`, `<section>`, `<article>`)
  2. **Klare Sprache** (Präzision > Generik)
  3. **Logischer Aufbau** (Hierarchie: `<h1>` → `<h2>` → `<h3>`)
  4. **Fehlerfreiheit** (Trust Signal)

**Details:** Siehe [LEARNINGS.md](LEARNINGS.md)

---

## 🧱 Technische Architektur

### AI-Onepager-Prinzip

**Problem:** AI-Agents fetchen nur **eine URL** pro Antwort (Single-Fetch-Prinzip)

**Lösung:** Alle Inhalte auf einer Seite

**Traditionelle Multi-Page-Website:**
```
/ → Startseite (Teaser)
/services/ → Details
/contact/ → Kontakt
/faq/ → FAQ
```
→ **AI-Agent sieht nur Teaser**

**GEO-optimierte Architektur:**
```
/ → Alle Key Facts auf einer Seite
    ├─ Services (mit Preisen)
    ├─ Kontakt
    ├─ FAQ
    └─ Prozess
```
→ **AI-Agent sieht alles beim ersten Fetch**

### Drei-Layer-Architektur

**Layer 1: Visible Hybrid Layer (HTML)**
- Semantisches HTML für Menschen UND Maschinen
- Alle Inhalte auf einer Seite
- Natürlichsprachliche Formulierungen

**Layer 2: Semantic Metadata Layer (JSON-LD im `<head>`)**
- Schema.org Person, FAQPage, Offers
- Für Crawler-Indexierung, Knowledge Graphs

**Layer 3: Optional Enhancement Layer (/ai/*.json)**
- Services, Content, Health, Publications
- Für erweiterte Integration
- Experimentell

**Details:** Siehe [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 💡 Barrierefreiheitsstärkungsgesetz (BFSG)

### GEO erfüllt automatisch 80% der BFSG-Anforderungen

**Gesetz gilt ab:** 28. Juni 2025
**Anforderungen:** WCAG 2.1 Level AA
**Strafen:** Bis 100.000 €

| **GEO-Maßnahme** | **BFSG-Anforderung** | **Match?** |
|------------------|---------------------|------------|
| Semantisches HTML | WCAG 1.3.1 (Info & Relationships) | ✅ 100% |
| Strukturierte Daten | WCAG 4.1.2 (Name, Role, Value) | ✅ 100% |
| Keine JavaScript-Abhängigkeit | WCAG 4.1.2 (Robust) | ✅ 100% |
| Klare Überschriften | WCAG 2.4.6 (Headings & Labels) | ✅ 100% |
| Logische Struktur | WCAG 1.3.2 (Meaningful Sequence) | ✅ 100% |

**Zusätzlich nötig:**
- Kontrast-Prüfung (min. 4.5:1)
- Tastaturnavigation + Fokus-Indikatoren
- ARIA-Labels
- Alt-Texte
- Barrierefreiheits-Erklärung

**Praktisches Beispiel:** [/barrierefreiheit.html](../barrierefreiheit.html)

---

## 🔧 Technische Specs

### Stack

- **HTML5** (semantisch, W3C-validiert)
- **CSS** (0 JavaScript, Dark Mode via prefers-color-scheme)
- **JSON-LD** (Schema.org compliant)
- **Hosting:** GitHub Pages (AI-friendly, keine ModSecurity-Blockierung)

### Dateien-Struktur

```
jan-erik-andersen.de/
├─ index.html                    # DE Onepager
├─ en/index.html                 # EN Onepager
├─ barrierefreiheit.html         # BFSG-Erklärung (WCAG 2.1 AA)
├─ kindle-optimized.css          # 0 JS Dark Mode
├─ ai/
│  ├─ manifest.json + .txt       # Endpoint-Index
│  ├─ identity-schema.json + .txt # Person Schema.org
│  ├─ faq-schema.json + .txt     # FAQPage Schema.org
│  └─ services.json + .txt       # Services + Pricing
├─ doc/
│  ├─ README.md                  # Diese Datei
│  ├─ LEARNINGS.md               # Erkenntnisse
│  ├─ ARCHITECTURE.md            # Architektur
│  └─ PROJECT-CONTEXT.md         # Claude-Kontext
├─ verify/                       # Tests
└─ tools/                        # Scripts
```

---

## 🧪 Tests & Validierung

### Lokal testen

```bash
python -m http.server 8000
open http://localhost:8000
```

### AI-Agent Test

**ChatGPT fragen:**
```
"Was bietet Jan-Erik Andersen an? Nenne Services und Preise."
```

**Erwartete Antwort:**
- Struktur-Audit (3-5 Tage, Maßnahmenplan)
- GEO + BFSG-Compliance (2-4 Wochen)
- Brand Voice Definition (1-2 Wochen)
- Kontakt: mail@andersen-webworks.de

### Validierung

```bash
# W3C Validator
https://validator.w3.org/

# Schema.org Validator
https://validator.schema.org/

# Lighthouse
lighthouse https://jan-erik-andersen.de

# WCAG Checker
https://wave.webaim.org/
```

**Ziele:**
- Lighthouse > 95
- 0 HTML-Fehler
- 0 Schema.org-Warnungen
- WCAG 2.1 AA-konform

---

## 📊 Deployment

### GitHub Pages (automatisch)

```bash
git add -A
git commit -m "Update"
git push origin main
# → Live nach 1-2 Minuten
```

**Kein Build-Prozess. Statische Dateien.**

### Wichtige Links

- **Live Site:** https://jan-erik-andersen.de
- **GitHub Repo:** https://github.com/AndersenWebworks/jan-erik-andersen.de
- **Google Search Console:** https://search.google.com/search-console

---

## 📈 Success Metrics

### Für Menschen

✅ Landingpage überzeugt ohne Vorkenntnisse
✅ Klare Schmerzpunkte → Lösungen → CTAs
✅ Dark Mode funktioniert ohne JavaScript

### Für AI-Agenten

✅ ChatGPT, Claude, Perplexity geben präzise Antworten
✅ Alle Services, Preise, Kontakt korrekt
✅ Single-Fetch: alle Infos auf einer Seite

### BFSG-Compliance

✅ WCAG 2.1 AA-konform
✅ Kontrast 17.40:1 (Text), 5.89:1 (Akzente)
✅ Tastaturnavigation 100%
✅ Barrierefreiheits-Erklärung vorhanden

### Technisch

✅ W3C-validiert
✅ Schema.org-compliant
✅ Lighthouse > 95
✅ 0 Bytes JavaScript

---

## 🎓 Wichtigste Learnings

### 1. Traditional Hosting blockiert AI-Agents

**Problem:** ModSecurity/WAF auf Shared Hosting blockiert AI-Fetcher (HTTP 400)

**Lösung:** JAMstack (GitHub Pages, Netlify, Cloudflare Pages)

### 2. GEO = BFSG = SEO = Ein Prinzip

**Nicht vier Services. Eine Optimierung mit mehreren Effekten.**

**Basis:** Semantisches HTML + Strukturierte Daten + Handkuratierte Texte

**Ergebnis:**
- AI-Agenten zitieren (GEO)
- Screenreader lesen (BFSG)
- Google versteht besser (SEO)
- Featured Snippets automatisch (Google Zero)

### 3. Handkuratierte Texte > AI-Texte > Fehlerhafte Texte

**Warum Agenten handkuratierte Texte bevorzugen:**
1. Fehlerfreiheit = Trust Signal
2. Präzision schlägt Generik
3. Konsistenz = Credibility
4. Struktur schlägt Prosa

### 4. Barrierefreiheit ist nicht nur Compliance

**AI-Agenten lesen wie Screenreader:**
- Beide ignorieren CSS/Design
- Beide brauchen semantische Struktur
- Beide folgen linearem Inhalt

**GEO-Optimierung = 80% BFSG-Compliance automatisch**

---

## 💰 Kosten & ROI

### Hosting-Vergleich

| Aspekt | Traditional Hosting | GitHub Pages |
|--------|---------------------|--------------|
| Kosten | 5€/Monat | ✅ Kostenlos |
| AI-Access | ❌ Blockiert (ModSecurity) | ✅ Funktioniert |
| CDN | ❌ Nein | ✅ Global CDN |
| SSL | 0€ (inklusive) | ✅ Let's Encrypt |
| **Total/Jahr** | **60€** | **0€** |

### Service-Positionierung

**Alt:** "Wir machen Ihre Website AI-ready" (vage)

**Neu:** "Wir optimieren Ihre Website für Struktur. Das Ergebnis: AI-sichtbar, BFSG-konform, SEO-optimiert, Snippet-ready."

**Preis:** 2.400 EUR (GEO + BFSG-Compliance-Paket)

**Deliverables:**
- GEO-Optimierung (Semantisches HTML, JSON-LD)
- WCAG 2.1 AA-Audit (Kontrast, Tastatur, Semantik)
- Barrierefreiheits-Erklärung
- Feedback-Prozess
- Dokumentation

---

## 🚀 Nächste Schritte

### Kurzfristig

- [ ] Google Search Console: Request Indexing
- [ ] Monitoring für AI-Citations
- [ ] A/B-Testing für CTAs

### Mittelfristig

- [ ] Google Rich Results testen (nach Crawling)
- [ ] ChatGPT Custom Domain (nach Domain-Trust, 7-14 Tage)
- [ ] Featured Snippets tracken

### Langfristig

- [ ] Case Studies von echten Kunden
- [ ] Blogpost: "GEO + BFSG: Ein Prinzip"
- [ ] LinkedIn-Kampagne

---

## 📞 Support & Kontakt

**Technische Fragen:** Siehe [ARCHITECTURE.md](ARCHITECTURE.md)
**Erkenntnisse:** Siehe [LEARNINGS.md](LEARNINGS.md)
**Claude-Kontext:** Siehe [PROJECT-CONTEXT.md](PROJECT-CONTEXT.md)

**Owner:** Jan-Erik Andersen
**Email:** mail@andersen-webworks.de
**Website:** https://jan-erik-andersen.de

---

**Version:** 1.1
**Status:** 🚀 Live — GEO + BFSG optimiert
**Letztes Update:** 13. November 2025
