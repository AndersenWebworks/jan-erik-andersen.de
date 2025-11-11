# AI Discovery Architecture

**Status:** Implementiert
**Version:** 1.1 (v0.2.1)
**Datum:** 2025-11-11
**Build:** 2025-11-11 21:04 UTC

## Zielbild

Die Website jan-erik-andersen.de ist jetzt vollständig AI-native optimiert mit automatischer Discovery-Funktionalität für LLMs.

## Implementierte Komponenten

### 1. Zentrales AI-Manifest

**Datei:** `/ai/manifest.json`

Zentrale Discovery-Datei, die alle maschinenlesbaren Endpunkte indexiert.

```json
{
  "version": "1.0",
  "site": {...},
  "endpoints": [
    {
      "id": "identity",
      "url": "https://jan-erik-andersen.de/ai/identity.json",
      "type": "Person",
      "format": "application/ld+json"
    },
    ...
  ]
}
```

### 2. HTML Head Discovery

**In:** `index.html` und `en/index.html`

```html
<!-- AI Discovery: Central manifest for machine-readable endpoints -->
<meta name="ai-endpoints" content="https://jan-erik-andersen.de/ai/manifest.json">
<link rel="alternate" type="application/json" href="https://jan-erik-andersen.de/ai/manifest.json" title="AI Manifest">
```

### 3. HTML Body Discovery (Footer)

**In:** `index.html` und `en/index.html` (Footer)

Sichtbarer `<details>`-Block mit allen 6 AI-Endpunkten:

```html
<details>
  <summary><strong>AI-Readable Endpoints</strong> (maschinenlesbare Daten)</summary>
  <ul>
    <li>📄 <a href="/ai/manifest.json">ai/manifest.json</a> — Zentraler Index</li>
    <li>👤 <a href="/ai/identity.json">ai/identity.json</a> — Markenidentität</li>
    <li>🛠️ <a href="/ai/services.json">ai/services.json</a> — Leistungen (Schema.org)</li>
    <li>💼 <a href="/ai/portfolio.json">ai/portfolio.json</a> — Referenzen</li>
    <li>📝 <a href="/ai/content.json">ai/content.json</a> — Content-Index</li>
    <li>💚 <a href="/ai/health.json">ai/health.json</a> — System-Status</li>
  </ul>
</details>
```

**Warum wichtig:** LLMs, die primär Body-Text parsen (z.B. ChatGPT Web Search), finden die URLs nur, wenn sie im Body-HTML verlinkt sind.

### 4. Content-Index

**Datei:** `/ai/content.json`

Index aller Markdown-Inhalte für LLMs:

- `philosophy.md` – Grundphilosophie
- `2030-web.md` – Vision der Web-Evolution
- `about.md` – Persönlicher Hintergrund
- `services.md` – Ausführliche Leistungsbeschreibungen

### 5. Schema.org-Harmonisierung

**Datei:** `/ai/services.json`

Alle Services wurden zu vollständigem Schema.org `@type: Service` transformiert mit:

- `@id` – Stabile URIs
- `serviceType` – Klare Typisierung
- `provider` – Person-Verlinkung
- `offers` – Preise & Verfügbarkeit
- `additionalProperty` – Strukturierte Metadaten (Dauer, Deliverables)

### 6. .txt/.json-Synchronisation

**Dateien:** `/ai/services.txt`, `/ai/identity.txt`

Die `.txt`-Varianten wurden mit den aktuellen Schema.org-JSON-Strukturen synchronisiert, um Konsistenz für Text-Parser zu gewährleisten.

## Wie LLMs die Daten finden

### Duale Discovery-Strategie

1. **Head-Parser (für Meta-Tag-basierte Crawler):**
   - Liest `<meta name="ai-endpoints">` im Head
   - Folgt `<link rel="alternate">` zum Manifest
   - Lädt `/ai/manifest.json`

2. **Body-Parser (für Text-basierte Crawler wie ChatGPT):**
   - Findet Footer-Links zu allen Endpunkten
   - Kann direkt auf einzelne JSONs zugreifen
   - Sieht Beschreibungen und Icons

3. **Endpoint-Discovery:**
   - Manifest listet alle 6 Endpunkte
   - Content-Index verlinkt Markdown-Dateien
   - Schema.org-konforme JSON-LD-Daten

## Vergleich vorher/nachher

| Kriterium | Vorher | Nachher |
|-----------|--------|---------|
| **Discovery** | Manuell (LLM muss URLs raten) | Automatisch via Manifest |
| **Head-Discovery** | Nur alternate links | Meta + Link mit Manifest |
| **Body-Discovery** | Keine | Footer mit allen 6 Endpunkten |
| **Indexierung** | Einzelne JSON-Dateien ohne Übersicht | Zentraler Index mit Typen |
| **Schema.org** | Teilweise in HTML, nicht in JSON | Vollständig in allen Endpoints |
| **Content-Verlinkung** | Markdown-Dateien nicht verlinkt | Content-Index mit Metadaten |
| **.txt/.json-Sync** | Veraltete Daten | Synchronisiert |

## Test-Kommandos

```bash
# JSON-Validierung
node -e "const fs = require('fs'); JSON.parse(fs.readFileSync('ai/manifest.json', 'utf8')); console.log('✓ Valid');"

# Manifest-Abruf (lokal)
curl http://localhost:8000/ai/manifest.json

# Manifest-Abruf (live)
curl https://jan-erik-andersen.de/ai/manifest.json
```

## Nächste Schritte (optional)

1. **HTTP-Header:** `Link: <.../ai/manifest.json>; rel="ai-manifest"` (wenn Serverconfig zugänglich)
2. **Robots.txt:** Explizite Erlaubnis für AI-Crawler
3. **Sitemap.xml:** AI-Endpunkte als `<url>` eintragen
4. **OpenGraph AI:** Experimentelle Meta-Tags für Social AI-Bots

## Dokumentation

- `/ai/manifest.json` – Manifest-Schema
- `/ai/content.json` – Content-Index-Schema
- `/ai/services.json` – Schema.org Service-Definitionen
- `/ai/identity.json` – Markenidentität
- `/ai/profile.json` – Persönliches Profil
- `/ai/health.json` – System-Status

---

**Technischer Standard erreicht:** ✅ 100% AI-native
**Behauptung validiert:** ✅ "Diese Website ist für KI optimiert" – korrekt und vollständig
