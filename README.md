# jan-erik-andersen.de

> **GEO Expert für Deutschland**
> AI-native Website: Struktur als Prinzip. ChatGPT-sichtbar. BFSG-konform. SEO-optimiert.

---

## Was ist das?

Eine **GEO-optimierte Website**, die **ein Prinzip** demonstriert:

**Semantisches HTML + Strukturierte Daten + Handkuratierte Texte**

Das Ergebnis:
- ✅ **AI-Agenten** zitieren die Website (GEO)
- ✅ **Screenreader** lesen korrekt (BFSG-konform, WCAG 2.1 AA)
- ✅ **Google** versteht den Kontext besser (SEO ohne Tricks)
- ✅ **Featured Snippets** automatisch (Google Zero)

**Nicht vier Projekte. Ein Prinzip.**

---

## Das Problem, das wir lösen

**59,7% aller Google-Anfragen** enden ohne Klick (SparkToro, 2024).
**AI-Agents fetchen nur eine URL** pro Antwort (Single-Fetch-Prinzip).
**BFSG gilt seit 28. Juni 2025** – Strafen bis 100.000 €.

**Konkret:**
- Kunde fragt ChatGPT: *"Finde mir einen GEO-Experten"*
- Erscheinen nur Websites mit **strukturierten Daten auf einer Seite**
- Multi-Page-Websites mit `/services/`, `/about/` → **unsichtbar**

**Unsere Lösung:**
AI-Onepager mit allen Key Facts. Semantisch, strukturiert, handkuratiert.

---

## Technische Specs

### Was drin ist:

- ✅ **AI-Onepager** (alle Inhalte auf einer Seite)
- ✅ **Semantisches HTML** (`<dl>`, `<section>`, `<article>`)
- ✅ **JSON-LD** im `<head>` (Person, FAQPage, Offers)
- ✅ **WCAG 2.1 AA-konform** (Kontrast 17.40:1, Tastaturnavigation)
- ✅ **CSS-Only Dark Mode** (0 JavaScript)
- ✅ **Framework-frei**, kein Build-Prozess

### Was NICHT drin ist:

- ❌ JavaScript
- ❌ Frameworks (React, Vue, etc.)
- ❌ Multi-Page-Struktur
- ❌ Generische AI-Texte

---

## Quick Start

### Lokal testen

```bash
python -m http.server 8000
open http://localhost:8000
```

### AI-Agent testen

**ChatGPT fragen:**
```
"Was bietet Jan-Erik Andersen an? Nenne Services und Kontakt."
```

**Erwartetes Ergebnis:**
- Struktur-Audit (3-5 Tage, Maßnahmenplan)
- GEO + BFSG-Compliance (2-4 Wochen)
- Brand Voice Definition (1-2 Wochen)
- Kontakt: mail@andersen-webworks.de

---

## Projekt-Struktur

```
jan-erik-andersen.de/
├─ index.html                    # GEO-optimierter Onepager (DE)
├─ en/index.html                 # EN-Version
├─ barrierefreiheit.html         # BFSG-Erklärung (WCAG 2.1 AA)
├─ ai/
│  ├─ manifest.json              # Endpoint-Index
│  ├─ identity-schema.json       # Person Schema.org
│  ├─ faq-schema.json            # FAQPage Schema.org
│  └─ services.json              # Leistungen
├─ doc/
│  ├─ README.md                  # 📚 HAUPTDOKUMENTATION
│  ├─ LEARNINGS.md               # Erkenntnisse (GEO = BFSG = SEO)
│  ├─ ARCHITECTURE.md            # Technische Architektur
│  └─ PROJECT-CONTEXT.md         # Kontext für Claude
├─ verify/                       # Tests & Validierung
├─ tools/                        # Scripts
└─ kindle-optimized.css          # 0 JS Dark Mode
```

---

## 📚 Dokumentation

**Alle Dokumentation ist in `/doc/` konsolidiert:**

- **[doc/README.md](doc/README.md)** — Projektübersicht, Installation, Demo
- **[doc/LEARNINGS.md](doc/LEARNINGS.md)** — Erkenntnisse: GEO = BFSG = SEO = ein Prinzip
- **[doc/ARCHITECTURE.md](doc/ARCHITECTURE.md)** — AI-Native Web Architecture
- **[doc/PROJECT-CONTEXT.md](doc/PROJECT-CONTEXT.md)** — Kontext für Claude-Instanzen

**Spezial-Dokumentation:**
- **[barrierefreiheit.html](barrierefreiheit.html)** — BFSG-Erklärung (WCAG 2.1 AA)
- **[verify/README.md](verify/README.md)** — Test-Dokumentation
- **[tools/README.md](tools/README.md)** — Python Test-Scripts

---

## Deployment

**GitHub Pages (automatisch):**

```bash
git add -A
git commit -m "Update"
git push origin main
# → Live nach 1-2 Minuten
```

**Kein Build-Prozess. Statische Dateien.**

---

## Philosophie

### Struktur als Prinzip

**AI-Agenten, Screenreader, Google, Snippet-Parser – alle brauchen dasselbe:**

1. **Semantisches HTML** (Struktur)
2. **Fehlerfreie Texte** (Vertrauen)
3. **Präzise Sprache** (Klarheit)
4. **Logischer Aufbau** (Hierarchie)

**Nicht vier Optimierungen. Ein Prinzip: Struktur.**

### GEO statt SEO

| **SEO (alt)** | **GEO (neu)** |
|---------------|---------------|
| Keywords | Natürliche Sprache |
| Ranking | Zitation in AI-Antworten |
| Click-Through-Rate | Citation-Rate |
| Multi-Page | AI-Onepager |

### Google Zero

Der Moment, in dem Suchmaschinen irrelevant werden.
AI-Agenten konsumieren Daten direkt.
Wer keine semantische Signatur hat, ist **unsichtbar**.

---

## Success Metrics

✅ **Für Menschen:**
- Landingpage überzeugt ohne Vorkenntnisse
- Klare Schmerzpunkte → Lösungen → CTAs

✅ **Für AI-Agenten:**
- ChatGPT, Claude, Perplexity geben präzise Antworten
- Alle Services, Preise, Kontakt korrekt

✅ **BFSG-Compliance:**
- WCAG 2.1 AA-konform
- Kontrast 17.40:1 (Text), 5.89:1 (Akzente)
- Barrierefreiheits-Erklärung vorhanden

✅ **Technisch:**
- W3C-validiert
- Schema.org-compliant
- Lighthouse > 95
- 0 Bytes JavaScript

---

## Status

**Version:** 1.1
**Status:** 🚀 Live — GEO + BFSG optimiert
**URL:** [jan-erik-andersen.de](https://jan-erik-andersen.de)
**Letztes Update:** 13. November 2025

---

## Kontakt

**Jan-Erik Andersen**
GEO Expert | AI Search Optimization

- Website: [jan-erik-andersen.de](https://jan-erik-andersen.de)
- E-Mail: mail@andersen-webworks.de
- Telefon: 038733 270015

---

**Lizenz:** Proof of Concept für GEO (Generative Engine Optimization).
Code frei verwendbar. Attribution erwünscht.
