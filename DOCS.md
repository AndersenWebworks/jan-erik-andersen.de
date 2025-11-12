# Projekt-Dokumentation

**jan-erik-andersen.de**
GEO-optimierter AI-Onepager | Stand: 2025-11-12

---

## 📚 Übersicht

| Datei | Zweck |
|-------|-------|
| [README.md](README.md) | Projekt-Übersicht, Struktur, Installation |
| [ai/architecture.md](ai/architecture.md) | AI-Native Web Architecture Prinzipien |
| [verify/README.md](verify/README.md) | Test-Dokumentation |
| [tools/README.md](tools/README.md) | Python AI-Visibility Test |

---

## 🎯 Kern-Prinzipien

### AI-Onepager

**Traditionelle Websites:**
```
/ → Startseite (Teaser)
/services/ → Details
/contact/ → Kontakt
/faq/ → FAQ
```
→ **Problem:** AI-Agents fetchen nur **eine URL** (Single-Fetch-Prinzip)
→ **Ergebnis:** Details unsichtbar

**GEO-optimierte Architektur:**
```
/ → Alle Key Facts auf einer Seite
    ├─ Services (mit Preisen)
    ├─ Kontakt
    ├─ FAQ
    └─ Prozess
```
→ **Lösung:** Alle Informationen beim ersten Fetch
→ **Ergebnis:** 100% AI-lesbar

### Drei-Layer-Architektur

**Layer 1: Visible Hybrid Layer (HTML)**
- Semantisches HTML (`<dl>`, `<section>`, `<article>`)
- Alle Inhalte auf einer Seite
- Natürlichsprachliche Formulierungen
- Für Menschen UND Maschinen

**Layer 2: Semantic Metadata Layer (JSON-LD im `<head>`)**
- Schema.org Person, FAQPage, Offers
- Für Crawler-Indexierung
- Knowledge Graphs

**Layer 3: Optional Enhancement Layer (/ai/*.json)**
- Services, Content, Health, Publications
- Für erweiterte Integration
- Experimentell

---

## 🔧 Technische Specs

### Stack

- **HTML5** (semantisch, W3C-validiert)
- **CSS** (0 JavaScript, Dark Mode via CSS-only)
- **JSON-LD** (Schema.org compliant)
- **Hosting:** GitHub Pages (AI-friendly)

### Dateien

```
jan-erik-andersen.de/
├─ index.html                    # DE Onepager
├─ en/index.html                 # EN Onepager
├─ kindle-optimized.css          # 0 JS Dark Mode
├─ ai/
│  ├─ architecture.md            # Prinzipien
│  ├─ services.json + .txt       # Services
│  ├─ identity-schema.json + .txt
│  ├─ faq-schema.json + .txt
│  ├─ content.json + .txt
│  ├─ health.json + .txt
│  ├─ publications.json + .txt
│  └─ manifest.json + .txt
├─ verify/                       # Tests
├─ tools/                        # Scripts
└─ DOCS.md                       # Diese Datei
```

---

## 🧪 Tests

### Lokal

```bash
python -m http.server 8000
open http://localhost:8000
```

### AI-Agent Test

**ChatGPT:**
```
"Was bietet Jan-Erik Andersen an? Nenne Services und Preise."
```

**Erwartete Antwort:**
- Struktur-Audit (3-5 Tage, 1-seitiger Maßnahmenplan)
- GEO-Optimierung (2-4 Wochen, strukturierte Daten)
- Brand Voice Definition (1-2 Wochen, Tonalitäts-Profil)
- Kontakt: mail@andersen-webworks.de

### Validierung

```bash
# W3C Validator
https://validator.w3.org/

# Schema.org Validator
https://validator.schema.org/

# Lighthouse
lighthouse https://jan-erik-andersen.de
```

**Ziel:** > 95 Score, 0 Fehler

---

## 📊 Deployment

```bash
git add -A
git commit -m "Update"
git push origin main
# → Live nach 1-2 Minuten (GitHub Pages)
```

**Kein Build-Prozess.** Statische Dateien.

---

## 📞 Support

**Technische Fragen:**
Siehe [ai/architecture.md](ai/architecture.md)

**Tests:**
Siehe [verify/README.md](verify/README.md)

**Scripts:**
Siehe [tools/README.md](tools/README.md)

---

**Version:** 1.0
**Status:** Production
**Datum:** 2025-11-12
