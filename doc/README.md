# Projekt-Dokumentation

**jan-erik-andersen.de**
GEO-optimierter AI-Onepager | BFSG-konform | Stand: 2025-11-15

---
Version: 1.3
Letztes Update: 2025-11-15
Autor: Jan-Erik Andersen
---

## 📚 Dokumentations-Übersicht

| Datei | Zweck | Für wen? |
|-------|-------|----------|
| **[LEARNINGS.md](LEARNINGS.md)** | Chronologische Erkenntnisse (3 Phasen) | Alle |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | AI-Native Web Prinzipien + Voice Loss | Entwickler |
| **[SSOT-PIPELINE.md](SSOT-PIPELINE.md)** | Datenfluss & Synchronisation | Entwickler |
| **[MEASUREMENT.md](MEASUREMENT.md)** | Semantic Survival Rate & Tests | Marketing/QA |
| **[FETCH-TEMPLATES.md](FETCH-TEMPLATES.md)** | Developer-Integration | Entwickler |
| **[PROJECT-CONTEXT.md](PROJECT-CONTEXT.md)** | Claude-Kontext & Troubleshooting | AI/Claude |

---

## 🎯 Kern-Erkenntnis

**Ein Prinzip löst alles:**
```
Handkuratierter Text + Semantisches HTML + Struktur
→ GEO (AI-Agents) + BFSG (Screenreader) + SEO (Google) + Citation-Rate
```

**Details:** [LEARNINGS.md](LEARNINGS.md) — Phase 2, Erkenntnis #6

---

## 🧱 Technische Architektur

### Drei-Layer-Prinzip

1. **HTML** (Visible Hybrid Layer) — Für Menschen UND Maschinen
2. **JSON-LD** (Semantic Metadata im `<head>`) — Für Crawler & Knowledge Graphs
3. **JSON + .txt** (Optional Enhancement `/ai/*.json + .txt`) — Für Parser & CLI-Bots

**Details:** [ARCHITECTURE.md](ARCHITECTURE.md) — Drei-Layer-Architektur

---

## 🔧 Technische Specs

**Stack:**
- HTML5 (semantisch, 0 JavaScript)
- CSS (Dark Mode via `prefers-color-scheme`)
- JSON-LD (Schema.org compliant)
- Plain-Text Fallbacks (`.txt` für Screenreader/CLI)
- Hosting: GitHub Pages (AI-friendly, keine ModSecurity)

**Dateienstruktur:** Siehe [PROJECT-CONTEXT.md](PROJECT-CONTEXT.md) — Projekt-Struktur

---

## 📊 Success Metrics

- ✅ **Semantic Survival Rate > 95%** → [MEASUREMENT.md](MEASUREMENT.md)
- ✅ **WCAG 2.1 AA konform** → [/barrierefreiheit.html](../barrierefreiheit.html)
- ✅ **Lighthouse Score > 95**
- ✅ **Citation-Rate Tracking** → [MEASUREMENT.md](MEASUREMENT.md)

---

## 🧪 Tests & Validierung

**AI-Agent Test:**
```bash
# Frage an ChatGPT/Claude:
"Sieh dir jan-erik-andersen.de an – was erfährst du über Jan-Erik Andersen?"
```

**Erwartete Antwort:**
- Beruf: GEO Expert, Webdesigner
- Ort: Deutschland
- Services: Struktur-Audit, GEO-Optimierung, BFSG-Compliance
- Preise: 400-600 EUR, 2.400-12.000 EUR, 1.800-4.800 EUR
- Kontakt: mail@andersen-webworks.de

**Checkliste:** [MEASUREMENT.md](MEASUREMENT.md) — AI-Native Site Checkliste

---

## 🚀 Deployment

```bash
# Änderungen machen
git add -A
git commit -m "Update"
git push origin main

# → Live nach 1-2 Minuten auf https://jan-erik-andersen.de
```

**Details:** [PROJECT-CONTEXT.md](PROJECT-CONTEXT.md) — Deployment-Workflow

---

## 📦 Wichtigste Learnings

### Phase 1: Infrastruktur (6.-7. Nov)
- Traditional Hosting blockiert AI-Agents → JAMstack nutzen
- GitHub Pages ist AI-friendly
- git push = Deployment

### Phase 2: Empirische Tests (13. Nov)
- GEO = BFSG = SEO = ein Prinzip (Struktur + Wahrheit)
- Handkuratierte Texte > AI-Texte
- Accessibility braucht sichtbare Patterns (Skip-Link, Dark-Mode-Toggle)

### Phase 3: Systemische Konsequenzen (15. Nov)
- Voice Loss → Structure Persistence (Content ist Datenträger)
- Semantic Survival Rate als Metrik (Ziel: > 95%)
- SSOT-Pipeline erforderlich (JSON ↔ .txt synchronisiert)

**Vollständige Details:** [LEARNINGS.md](LEARNINGS.md)

---

## 🔗 Wichtige Links

**Live Site:** https://jan-erik-andersen.de
**GitHub Repo:** https://github.com/AndersenWebworks/jan-erik-andersen.de
**Google Search Console:** https://search.google.com/search-console

**Validierung:**
- W3C Validator: https://validator.w3.org/
- Schema.org Validator: https://validator.schema.org/
- WCAG Checker: https://wave.webaim.org/

---

## 📞 Support & Kontakt

**Technische Fragen:** Siehe [ARCHITECTURE.md](ARCHITECTURE.md)
**Erkenntnisse:** Siehe [LEARNINGS.md](LEARNINGS.md)
**Claude-Kontext:** Siehe [PROJECT-CONTEXT.md](PROJECT-CONTEXT.md)
**Developer-Integration:** Siehe [FETCH-TEMPLATES.md](FETCH-TEMPLATES.md)

**Owner:** Jan-Erik Andersen
**Email:** mail@andersen-webworks.de
**Website:** https://jan-erik-andersen.de

---

**Version:** 1.3
**Status:** 🚀 Live — GEO + BFSG + SSOT optimiert
**Letztes Update:** 15. November 2025
