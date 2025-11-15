# Google Search Console — Setup-Anleitung

**Datum:** 6. November 2025
**Zweck:** Domain-Verifizierung + Sitemap-Einreichung für AI-Indexierung

---

## Schritt 1: Domain verifizieren

### Option A: HTML-Datei Upload (empfohlen)

1. Gehe zu: https://search.google.com/search-console
2. Klicke "Add property"
3. Wähle "URL prefix": `https://jan-erik-andersen.de`
4. Wähle Verifizierungsmethode: "HTML file"
5. Lade Verifizierungs-HTML herunter (z.B. `google1234567890abcdef.html`)
6. Lege Datei in Root-Verzeichnis: `c:\Andersen\Webworks\GitHub\Webworks\jan-erik-andersen.de\`
7. Deploye mit `python deploy.py`
8. Verifiziere in Google Search Console

### Option B: DNS TXT Record (bei KAS/All-Inkl)

1. Wähle Verifizierungsmethode: "DNS record"
2. Kopiere TXT-Wert (z.B. `google-site-verification=xyz123...`)
3. Gehe zu KAS-Admin-Panel: https://kasapi.kasserver.com/
4. Navigiere zu: Domains → DNS-Einstellungen → jan-erik-andersen.de
5. Füge TXT-Record hinzu:
   - **Typ:** TXT
   - **Host:** @ (oder leer)
   - **Wert:** `google-site-verification=xyz123...`
   - **TTL:** 3600
6. Speichern
7. Warte 10-60 Minuten (DNS-Propagation)
8. Verifiziere in Google Search Console

### Option C: HTML-Tag (falls .htaccess nicht funktioniert)

1. Wähle Verifizierungsmethode: "HTML tag"
2. Kopiere Meta-Tag: `<meta name="google-site-verification" content="xyz123...">`
3. Öffne `index.html`
4. Füge Meta-Tag in `<head>` ein (nach `<meta charset>`)
5. Deploye mit `python deploy.py`
6. Verifiziere in Google Search Console

---

## Schritt 2: Sitemap einreichen

1. In Google Search Console → linke Sidebar → "Sitemaps"
2. Klicke "Add a new sitemap"
3. Gib ein: `sitemap.xml`
4. Klicke "Submit"
5. Warte 24-48h auf Crawling

**Erwartung:**
- Google crawlt alle URLs in `sitemap.xml`
- Status: "Success" für alle URLs
- Structured Data wird erkannt (siehe "Enhancements")

---

## Schritt 3: Strukturierte Daten überwachen

### 3.1 Enhancements überprüfen

**Navigation:** Google Search Console → Enhancements

**Erwartete Meldungen:**
- ✅ "FAQ" → 1 page valid (faq.html)
- ✅ "Article" → 1 page valid (blog/google-zero.html)
- ⚠️ "Person" → Möglicherweise nicht als Enhancement, aber in JSON-LD vorhanden

### 3.2 Rich Results Status

**Navigation:** Google Search Console → Search results → Rich results

**Erwartung:**
- FAQPage: Detected
- BlogPosting: Detected
- Person: Detected (falls Google diese Entität prominent genug findet)

---

## Schritt 4: Index-Status prüfen

### 4.1 URL-Inspektion

**Test-URLs:**
1. `https://jan-erik-andersen.de/`
2. `https://jan-erik-andersen.de/faq.html`
3. `https://jan-erik-andersen.de/blog/google-zero.html`
4. `https://jan-erik-andersen.de/ai/manifest.json`

**Für jede URL:**
1. Klicke "URL Inspection" (oben)
2. Gib URL ein
3. Warte auf Ergebnis
4. Prüfe:
   - ✅ "URL is on Google" → Indexiert
   - ⚠️ "URL is not on Google" → Noch nicht indexiert
   - Klicke "View crawled page" → Siehst du strukturierte Daten?

### 4.2 Index-Beschleunigung

Falls URLs noch nicht indexiert:

1. Klicke "Request indexing"
2. Google crawlt innerhalb von 24-48h
3. Wiederhole für wichtige URLs

---

## Schritt 5: Performance überwachen

### 5.1 Search Performance

**Navigation:** Google Search Console → Performance → Search results

**Metriken:**
- **Clicks:** Wie oft wurde deine Seite in Google angeklickt?
- **Impressions:** Wie oft wurde deine Seite in Suchergebnissen angezeigt?
- **CTR:** Click-Through-Rate (Clicks / Impressions)
- **Position:** Durchschnittliche Position in Suchergebnissen

**Erwartung (nach 2-4 Wochen):**
- Impressions für Queries wie:
  - "AI-native Web Architect"
  - "strukturierte Daten Webdesign"
  - "Google Zero"
  - "Jan-Erik Andersen"

### 5.2 AI Overview Tracking (experimentell)

**Problem:** Google zeigt (noch) nicht an, ob deine Daten in AI-Snippets verwendet werden.

**Workaround:**
- Manuelle Tests mit Google AI (falls verfügbar)
- Tracke Impressions für informational Queries
- Nutze externe Tools (z.B. SEMrush, Ahrefs) um AI-Snippet-Erscheinungen zu monitoren

---

## Erwartete Timeline

| Zeitpunkt | Ereignis |
|-----------|----------|
| Tag 0 | Sitemap eingereicht |
| Tag 1-2 | Erste URLs gecrawlt |
| Tag 3-7 | Strukturierte Daten erkannt (Enhancements) |
| Tag 7-14 | Erste Impressions in Search Performance |
| Tag 14-30 | Stabile Indexierung, erste Rankings |
| Tag 30-60 | Mögliche Nutzung in AI-Snippets (Google SGE) |

---

## Dokumentation der Ergebnisse

Nach Setup bitte ergänzen:

```json
{
  "google_search_console": {
    "verification_date": "2025-11-XX",
    "verification_method": "HTML file | DNS TXT | HTML tag",
    "sitemap_submitted": "2025-11-XX",
    "status": {
      "indexed_pages": 0,
      "structured_data_detected": [],
      "rich_results": [],
      "errors": []
    }
  }
}
```

Datei: `verify/google-search-console-results.json`

---

## Troubleshooting

### Problem: "URL is not on Google"

**Lösung:**
1. Prüfe `robots.txt`: Ist URL erlaubt?
2. Prüfe `.htaccess`: Blockiert HTTPS-Redirect den Crawler?
3. Request Indexing manuell
4. Warte 48h

### Problem: "Structured Data not detected"

**Lösung:**
1. Prüfe JSON-LD-Syntax mit Schema.org Validator
2. Prüfe, ob `<script type="application/ld+json">` im HTML vorhanden
3. Prüfe "View crawled page" → Sieht Google das JSON-LD?

### Problem: "FAQ not showing as Enhancement"

**Lösung:**
1. Prüfe, ob `faq.html` mindestens 3 Fragen hat (Schema.org-Empfehlung)
2. Prüfe, ob `acceptedAnswer` korrekt formatiert ist
3. Warte 7-14 Tage (Google braucht Zeit für Enhancements)

---

## Nächste Schritte nach Setup

1. ✅ Domain verifiziert
2. ✅ Sitemap eingereicht
3. ⏳ Warte 24-48h auf ersten Crawl
4. ⏳ Prüfe "Enhancements" nach 7 Tagen
5. ⏳ Prüfe "Search Performance" nach 14 Tagen
6. ⏳ Teste Google AI-Snippet nach 30 Tagen

**Wichtig:** Dokumentiere alle Schritte in `verify/google-search-console-results.json`
