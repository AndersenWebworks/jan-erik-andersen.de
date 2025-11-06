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

1. **[README.md](../README.md)** — Projekt-Übersicht, Status, Struktur
2. **[LEARNINGS.md](../LEARNINGS.md)** — KRITISCH: Alle Erkenntnisse aus dem Projekt
3. **[GITHUB-PAGES-SETUP.md](../GITHUB-PAGES-SETUP.md)** — Hosting-Setup
4. **[verify/README.md](../verify/README.md)** — Test-Dokumentation

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
├── index.html              # Homepage (Person Schema eingebettet)
├── faq.html + faq.json     # FAQ (FAQPage Schema)
├── blog/                   # Blog (feed.json + BlogPosting Schema)
├── ai/                     # Strukturierte Daten (JSON-LD, JSON)
│   ├── manifest.jsonld     # Person/Organization
│   ├── services.json       # Services + Pricing
│   ├── portfolio.json      # Projects
│   ├── identity.json       # Brand voice
│   ├── index.json          # Data catalog
│   └── health.json         # Health check
├── content/                # Markdown content
│   ├── philosophy.md
│   └── 2030-web.md
├── verify/                 # Test-Dokumentation
└── robots.txt, sitemap.xml # SEO
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

### Neuen Blog-Post hinzufügen

1. Erstelle `blog/new-post.md` (Markdown)
2. Erstelle `blog/new-post.json` (BlogPosting Schema)
3. Erstelle `blog/new-post.html` (HTML Fallback)
4. Update `blog/feed.json` (füge neuen Post hinzu)
5. Commit & Push

**Muster:** Siehe `blog/google-zero.*`

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

**Projekt-Status:** ✅ Abgeschlossen, dokumentiert, production-ready
**Zuletzt aktualisiert:** 7. November 2025
