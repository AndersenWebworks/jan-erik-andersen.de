# Project Context für Claude-Instanzen

**Projekt:** andersen-signal v0.1 — AI-native Web Architecture MVP
**Owner:** Jan-Erik Andersen
**Status:** ✅ Live und abgeschlossen
**URL:** https://jan-erik-andersen.de
**Repository:** https://github.com/AndersenWebworks/jan-erik-andersen.de

---

## Was ist dieses Projekt?

**Ziel:** Beweis, dass strukturierte Websites von AI-Agenten besser gelesen werden können als traditionelle Websites.

**Ergebnis:** ✅ Erfolgreich bewiesen

**Kern-Prinzip:** "Websites als Dateninterfaces für AI-Agenten"

---

## Wichtigste Dateien (ZUERST LESEN)

1. **[doc/README.md](README.md)** — Dokumentations-Übersicht (Start hier!)
2. **[doc/LEARNINGS.md](LEARNINGS.md)** — KRITISCH: Alle Erkenntnisse (3 Phasen)
3. **[doc/ARCHITECTURE.md](ARCHITECTURE.md)** — AI-Native Web Prinzipien
4. **[doc/SSOT-PIPELINE.md](SSOT-PIPELINE.md)** — Datenfluss & Synchronisation
5. **[doc/MEASUREMENT.md](MEASUREMENT.md)** — Semantic Survival Rate & Tests
6. **[doc/FETCH-TEMPLATES.md](FETCH-TEMPLATES.md)** — Developer-Integration

---

## Kritische Erkenntnisse (MUST READ)

### 1. Traditional Hosting blockiert AI-Agents

**Problem:** ModSecurity/WAF auf Shared Hosting (KAS, All-Inkl) blockiert AI-Fetcher mit HTTP 400.

**Lösung:** JAMstack (GitHub Pages, Netlify, Cloudflare Pages)

**Details:** [verify/chatgpt-400-findings.md](../verify/chatgpt-400-findings.md)

### 2. ChatGPT hat Domain-Whitelist

**Problem:** Neu migrierte Domains sind nicht sofort für ChatGPT erreichbar.

**Workaround:** GitHub Raw URLs nutzen:
```
https://raw.githubusercontent.com/AndersenWebworks/jan-erik-andersen.de/main/ai/health.json
```

**Timeline:** 7-14 Tage bis Custom Domain funktioniert

### 3. Deployment-Workflow

**Aktuell:** GitHub Pages (automatisch)

```bash
# Änderungen machen
git add -A
git commit -m "Update"
git push origin main

# → Automatisches Deployment nach 1-2 Min
# → Live auf https://jan-erik-andersen.de
```

**NICHT MEHR:** FTP/deploy.py (deprecated, entfernt)

---

## Projekt-Struktur

```
jan-erik-andersen.de/
├── index.html / en/index.html  # Onepager (de/en)
├── barrierefreiheit.html       # BFSG-Erklärung
├── datenschutz.html / impressum.html
├── en/accessibility.html / en/privacy.html / en/imprint.html
├── ai/                         # Strukturierte Daten (JSON-LD + Plain-Text)
│   ├── manifest.json           # Endpoint-Index
│   ├── services.json / services.txt
│   ├── identity-schema.json / identity.txt
│   ├── faq-schema.json
│   └── health.json
├── doc/                        # Dokumentation
├── verify/                     # Test-Dokumentation
└── robots.txt, sitemap.xml     # SEO
```

---

## Häufige Aufgaben

### Content-Update

```bash
# 1. Datei ändern (z.B. ai/services.json)
vim ai/services.json

# 2. Commit & Push
git add ai/services.json
git commit -m "Update services pricing"
git push origin main

# 3. Warte 1-2 Min → Live
```

### AI-Daten & Plain-Text spiegeln

1. JSON-Datei anpassen (`ai/services.json`, `ai/identity-schema.json`, `ai/faq-schema.json`, …)
2. Passende `.txt`-Spiegel manuell synchron halten (`ai/services.txt`, `ai/identity.txt`)
3. Commit & Push — GitHub Action generiert nur zusätzliche Spiegel, wenn Verzeichnisse existieren (keine Blog-Abhängigkeit mehr)

**WICHTIG:** Siehe [SSOT-PIPELINE.md](SSOT-PIPELINE.md) für Synchronisations-Regeln und Konsistenz-Checks

### AI-Agent testen

**Sofort verfügbar (Raw URL):**
```
"Lies https://raw.githubusercontent.com/AndersenWebworks/jan-erik-andersen.de/main/ai/services.json und nenne alle Services"
```

**Nach Domain-Trust (7-14 Tage):**
```
"Lies https://jan-erik-andersen.de/ai/services.json und nenne alle Services"
```

---

## Test-Status

### ✅ Abgeschlossen

- HTML/JSON-LD Validierung
- AI-Agent-Test (6/6 Fragen korrekt)
- GitHub Pages Deployment
- ChatGPT via Raw URLs
- Alle Endpoints HTTP 200 OK

### ⏳ Pending

- Google Rich Results (braucht Crawling, 7-14 Tage)
- ChatGPT via Custom Domain (braucht Domain-Trust, 7-14 Tage)
- Google AI Snippets (30-60 Tage)

### 📊 Monitoring

**Google Search Console:**
- URL: https://search.google.com/search-console
- Property: jan-erik-andersen.de
- Verifiziert: ✅ (Meta-Tag in index.html)
- Sitemap eingereicht: ✅

**Zu prüfen (alle 2 Wochen):**
- Indexierte Seiten (Coverage)
- Rich Results (Enhancements)
- Performance (Search Performance)

---

## Technologie-Stack

**Hosting:** GitHub Pages
**Domain:** jan-erik-andersen.de (DNS: KAS A-Records)
**HTTPS:** Let's Encrypt (automatisch)
**CDN:** GitHub Global CDN
**Deployment:** git push origin main

**Keine Dependencies:**
- Kein JavaScript
- Kein CSS-Framework
- Kein Build-Prozess
- Nur statische HTML/JSON/MD

**Vorteile:**
- Lädt extrem schnell
- Funktioniert überall
- Kein Maintenance
- Kostenlos

---

## Troubleshooting

### "ChatGPT bekommt HTTP 400"

**Ursache:** Domain zu neu / nicht whitelisted

**Lösung:** Nutze GitHub Raw URLs (siehe oben)

**Timeline:** Nach 7-14 Tagen sollte Custom Domain funktionieren

### "Google Rich Results zeigt nichts"

**Ursache:** Noch nicht gecrawlt

**Lösung:**
1. Google Search Console → URL Inspection
2. Request Indexing
3. Warte 48h
4. Test erneut

### "Deployment funktioniert nicht"

**Check:**
```bash
# 1. GitHub Pages aktiviert?
# Settings → Pages → Source: main branch

# 2. CNAME-Datei vorhanden?
cat CNAME
# Sollte zeigen: jan-erik-andersen.de

# 3. DNS korrekt?
nslookup jan-erik-andersen.de
# Sollte zeigen: 185.199.10x.153
```

---

## Wichtige Links

**Live Site:** https://jan-erik-andersen.de
**GitHub Repo:** https://github.com/AndersenWebworks/jan-erik-andersen.de
**GitHub Pages Settings:** https://github.com/AndersenWebworks/jan-erik-andersen.de/settings/pages
**Google Search Console:** https://search.google.com/search-console

**Tests:**
- Rich Results: https://search.google.com/test/rich-results
- Schema Validator: https://validator.schema.org/
- DNS Check: https://www.whatsmydns.net/

---

## Kontakt & Ownership

**Owner:** Jan-Erik Andersen
**Email:** mail@jan-erik-andersen.de
**GitHub:** AndersenWebworks

---

## Version History

**v0.1** (7. Nov 2025)
- Initial MVP
- GitHub Pages Migration
- Alle Tests bestanden
- Dokumentation komplett

**Status:** ✅ Production-ready

---

## Für neue Claude-Instanzen

**Wenn User sagt "arbeite am jan-erik-andersen.de Projekt":**

1. ✅ Lies zuerst [LEARNINGS.md](../LEARNINGS.md) (WICHTIG!)
2. ✅ Lies [README.md](../README.md) für Struktur
3. ✅ Verstehe: GitHub Pages = Deployment (nicht FTP!)
4. ✅ Verstehe: Raw URLs für ChatGPT (Custom Domain braucht Zeit)
5. ✅ Check git status / git log für neueste Änderungen

**Wichtigste Regel:**
> Strukturierte Daten (JSON/MD) sind PRIMARY.
> HTML ist FALLBACK.
> AI-Agents lesen JSON, nicht HTML.

**Deployment:**
```bash
git add -A
git commit -m "Description"
git push origin main
# → Automatisch live nach 1-2 Min
```

**NICHT verwenden:**
- ❌ deploy.py (entfernt, deprecated)
- ❌ FTP (nicht mehr nötig)
- ❌ KAS-Server für Hosting (nur noch DNS)

---

---

## 🔗 Weiterführende Dokumentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Voice Loss → Structure Persistence, Drei-Layer-Architektur
- **[LEARNINGS.md](LEARNINGS.md)** — Chronologische Erkenntnisse (3 Phasen)
- **[SSOT-PIPELINE.md](SSOT-PIPELINE.md)** — Single Source of Truth & Synchronisation
- **[MEASUREMENT.md](MEASUREMENT.md)** — Semantic Survival Rate, AI-Native Checkliste
- **[FETCH-TEMPLATES.md](FETCH-TEMPLATES.md)** — Endpoint-Discovery, Developer-Integration

---

**Projekt-Status:** ✅ Abgeschlossen, dokumentiert, production-ready
**Zuletzt aktualisiert:** 15. November 2025
