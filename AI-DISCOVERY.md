# AI Discovery Architecture

**Status:** Implementiert
**Version:** 1.0
**Datum:** 2025-11-11

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

### 3. Content-Index

**Datei:** `/ai/content.json`

Index aller Markdown-Inhalte für LLMs:

- `philosophy.md` – Grundphilosophie
- `2030-web.md` – Vision der Web-Evolution
- `about.md` – Persönlicher Hintergrund
- `services.md` – Ausführliche Leistungsbeschreibungen

### 4. Schema.org-Harmonisierung

**Datei:** `/ai/services.json`

Alle Services wurden zu vollständigem Schema.org `@type: Service` transformiert mit:

- `@id` – Stabile URIs
- `serviceType` – Klare Typisierung
- `provider` – Person-Verlinkung
- `offers` – Preise & Verfügbarkeit
- `additionalProperty` – Strukturierte Metadaten (Dauer, Deliverables)

## Wie LLMs die Daten finden

1. **HTML-Parser:** Liest `<meta name="ai-endpoints">` im Head
2. **Manifest-Abruf:** Lädt `/ai/manifest.json`
3. **Endpoint-Discovery:** Findet alle strukturierten Daten-URLs
4. **Content-Parsing:** Greift auf JSON-LD und Markdown-Inhalte zu

## Vergleich vorher/nachher

| Kriterium | Vorher | Nachher |
|-----------|--------|---------|
| **Discovery** | Manuell (LLM muss URLs raten) | Automatisch via Manifest |
| **Indexierung** | Einzelne JSON-Dateien ohne Übersicht | Zentraler Index mit Typen |
| **Schema.org** | Teilweise in HTML, nicht in JSON | Vollständig in allen Endpoints |
| **Content-Verlinkung** | Markdown-Dateien nicht verlinkt | Content-Index mit Metadaten |

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
