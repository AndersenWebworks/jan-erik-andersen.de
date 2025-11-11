# Dokumentations-Index

**Projekt:** andersen-signal v0.3
**Status:** ✅ Production-ready (GEO Score: 9.5/10)

---

## 📋 Start Here

**Für neue Claude-Instanzen:**
1. [.claude/PROJECT-CONTEXT.md](.claude/PROJECT-CONTEXT.md) — ⭐ ZUERST LESEN
2. [README.md](README.md) — Projekt-Übersicht
3. [LEARNINGS.md](LEARNINGS.md) — Kritische Erkenntnisse

**Für Menschen:**
1. [README.md](README.md) — Projekt-Übersicht
2. [LEARNINGS.md](LEARNINGS.md) — Was wir gelernt haben
3. [GITHUB-PAGES-SETUP.md](GITHUB-PAGES-SETUP.md) — Wie man hostet

---

## 📚 Haupt-Dokumentation

| Datei | Zweck | Wichtigkeit |
|-------|-------|-------------|
| [README.md](README.md) | Projekt-Übersicht, Struktur, Status | ⭐⭐⭐ |
| [CHANGELOG.md](CHANGELOG.md) | **NEU:** Versionshistorie & Updates | ⭐⭐⭐ |
| [geo-audit-2025.md](geo-audit-2025.md) | **NEU:** Vollständiges GEO-Audit (9.5/10) | ⭐⭐⭐ |
| [research-ai-web-2025.md](research-ai-web-2025.md) | **NEU:** GEO-Lexikon (35+ Quellen) | ⭐⭐⭐ |
| [LEARNINGS.md](LEARNINGS.md) | Alle Erkenntnisse aus dem Projekt | ⭐⭐⭐ |
| [GITHUB-PAGES-SETUP.md](GITHUB-PAGES-SETUP.md) | Hosting-Setup Schritt-für-Schritt | ⭐⭐⭐ |
| [VISION.md](VISION.md) | Projekt-Vision & Konzept | ⭐⭐ |
| [MARKETING.md](MARKETING.md) | Business-Modell & Pricing | ⭐⭐ |

---

## 🧪 Test-Dokumentation (verify/)

| Datei | Zweck |
|-------|-------|
| [verify/validation-results-2025-01-11.md](verify/validation-results-2025-01-11.md) | **NEU:** Schema-Validierung + Citation-Tests | ⭐⭐⭐ |
| [verify/README.md](verify/README.md) | Test-Übersicht & Matrix |
| [verify/agent-test.md](verify/agent-test.md) | 6 Test-Fragen für AI-Agents |
| [verify/checklists.md](verify/checklists.md) | Validierungs-Checklisten |
| [verify/metrics.json](verify/metrics.json) | Test-Ergebnisse (6/6 korrekt) |
| [verify/comparison-test.md](verify/comparison-test.md) | Vergleichstest AI-native vs. normal |
| [verify/google-search-console.md](verify/google-search-console.md) | Google Search Console Setup |
| [verify/rich-results-test.md](verify/rich-results-test.md) | Rich Results Test-Anleitung |
| [verify/agent-access-test.md](verify/agent-access-test.md) | Endpoint-Access-Tests |

---

## 🐛 Debug-Dokumentation

| Datei | Problem | Status |
|-------|---------|--------|
| [verify/chatgpt-400-findings.md](verify/chatgpt-400-findings.md) | ChatGPT HTTP 400 Problem | ✅ Gelöst (GitHub Pages) |
| [verify/chatgpt-400-debug.md](verify/chatgpt-400-debug.md) | Test-Beweise für 400-Problem | ✅ Dokumentiert |
| [verify/chatgpt-debug-request.md](verify/chatgpt-debug-request.md) | Header-Analyse-Anleitung | ℹ️ Referenz |
| [verify/rich-results-debug.md](verify/rich-results-debug.md) | Rich Results Cache-Problem | ⏳ Pending (Google) |

---

## 📝 Content-Dateien

| Datei | Typ | Zweck |
|-------|-----|-------|
| [content/philosophy.md](content/philosophy.md) | Markdown | Philosophie "Structure as Integrity" |
| [content/2030-web.md](content/2030-web.md) | Markdown | Vision: Web als Dateninterface |
| [blog/google-zero.md](blog/google-zero.md) | Markdown | Artikel-Quelle |

---

## 🔧 Technische Dateien

| Datei | Zweck |
|-------|-------|
| [llms.txt](llms.txt) | **NEU:** AI-Discovery-Datei für LLMs | ⭐⭐⭐ |
| [robots.txt](robots.txt) | Crawler-Anweisungen + Sitemap-Link |
| [sitemap.xml](sitemap.xml) | Alle URLs (HTML + JSON/MD) |
| [CNAME](CNAME) | GitHub Pages Custom Domain |
| [.gitignore](.gitignore) | Git-Ignore-Regeln |

---

## 🌐 Website-Dateien

### HTML (Human Fallback)

| Datei | Schema.org Type |
|-------|----------------|
| [index.html](index.html) | Person |
| [faq.html](faq.html) | FAQPage |
| [blog/index.html](blog/index.html) | - (minimal fallback) |
| [blog/google-zero.html](blog/google-zero.html) | BlogPosting |

### JSON (AI Primary)

| Datei | Typ | Beschreibung |
|-------|-----|--------------|
| [ai/manifest.jsonld](ai/manifest.jsonld) | JSON-LD | Person/Organization Schema |
| [ai/services.json](ai/services.json) | JSON | Services + Pricing |
| [ai/portfolio.json](ai/portfolio.json) | JSON | Projekt-Referenzen |
| [ai/identity.json](ai/identity.json) | JSON | Brand Voice |
| [ai/index.json](ai/index.json) | JSON | Data Catalog (Meta) |
| [ai/health.json](ai/health.json) | JSON | Health Check Endpoint |
| [faq.json](faq.json) | JSON-LD | FAQPage Schema |
| [blog/feed.json](blog/feed.json) | JSON | Blog Feed |
| [blog/google-zero.json](blog/google-zero.json) | JSON | BlogPosting Schema |

---

## 📊 Status-Übersicht (v0.3 - Stand: 11. Januar 2025)

### ✅ Abgeschlossen

- ✅ **Schema-Fixes:** Preis-Datentypen korrigiert (String → Number)
- ✅ **llms.txt:** AI-Discovery-Datei implementiert
- ✅ **GEO-Audit:** Vollständig dokumentiert (Score: 9.5/10)
- ✅ **Research:** 35+ Industrie-Quellen analysiert
- ✅ **Citation-Tests:** 100% Erfolgsrate (Claude)
- ✅ **Schema-Validierung:** JSON-LD konform
- ✅ Website live & optimiert

### ⏳ Pending

- [ ] Google Rich Results Test durchführen
- [ ] Manual Citation-Tests (ChatGPT/Perplexity)
- [ ] Person Image hinzufügen (mittlere Priorität)
- [ ] Citation-Tracking Setup
- [ ] SISTRIX AI-Mode Trial

### 📈 Monitoring

- GEO-Score: 9.5/10 (Top 2%)
- Schema-Konformität: ✅ Validiert
- Citation-Rate: Baseline zu etablieren

---

## 🔗 Wichtige Links

**Live Site:**
- https://jan-erik-andersen.de
- https://andersenwebworks.github.io/jan-erik-andersen.de/ (GitHub Pages URL)

**Repository:**
- https://github.com/AndersenWebworks/jan-erik-andersen.de

**Admin:**
- https://github.com/AndersenWebworks/jan-erik-andersen.de/settings/pages (GitHub Pages)
- https://search.google.com/search-console (Google Search Console)
- https://kasapi.kasserver.com/ (KAS - nur noch DNS)

**Tests:**
- https://search.google.com/test/rich-results (Rich Results Test)
- https://validator.schema.org/ (Schema.org Validator)
- https://www.whatsmydns.net/ (DNS Check)

---

## 🎯 Quick Reference

### Deployment

```bash
git add -A
git commit -m "Update"
git push origin main
# → Live nach 1-2 Min
```

### AI-Agent Test (ChatGPT)

**Sofort (Raw URL):**
```
"Lies https://raw.githubusercontent.com/AndersenWebworks/jan-erik-andersen.de/main/ai/services.json"
```

**Nach Domain-Trust (7-14 Tage):**
```
"Lies https://jan-erik-andersen.de/ai/services.json"
```

### Health Check

```bash
curl https://jan-erik-andersen.de/ai/health.json
# Erwartung: {"status": "ok", ...}
```

---

## 📞 Support

**Fragen zum Projekt?**
→ Lies [.claude/PROJECT-CONTEXT.md](.claude/PROJECT-CONTEXT.md)

**Technische Probleme?**
→ Siehe Troubleshooting in [GITHUB-PAGES-SETUP.md](GITHUB-PAGES-SETUP.md)

**ChatGPT 400-Problem?**
→ Siehe [verify/chatgpt-400-findings.md](verify/chatgpt-400-findings.md)

---

**Zuletzt aktualisiert:** 11. Januar 2025
**Projekt-Version:** v0.3
**GEO-Score:** 9.5/10 (Top 2% aller Websites)
**Projekt-Status:** ✅ Production-ready & GEO-optimiert
