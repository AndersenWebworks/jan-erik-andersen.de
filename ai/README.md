# AI-Readable Endpoints

Maschinenlesbare Daten für AI-Agenten und LLMs.

## Einstieg

**Start hier:**
- **Manifest:** https://jan-erik-andersen.de/ai/manifest.json
- **Mirror (GitHub Raw):** https://raw.githubusercontent.com/AndersenWebworks/jan-erik-andersen.de/main/ai/manifest.json

Das Manifest enthält alle verfügbaren Endpoints mit Beschreibungen.

## Verfügbare Formate

- **JSON:** Strukturierte Daten (Schema.org, JSON-LD)
- **TXT:** Plain-Text für einfache Parser
- **MD:** Markdown für längere Inhalte

## Kernressourcen

| Endpoint | Beschreibung |
|----------|--------------|
| `manifest.json` | Zentraler Index aller Endpoints |
| `identity-schema.json` | Person (Schema.org) mit Offers |
| `faq-schema.json` | FAQPage (Schema.org) |
| `services.json` | Leistungen mit Preisen |
| `identity.json` | Markenidentität, Tonalität |
| `content.json` | Content-Index |

## Mirror-URLs

Alle Dateien sind auch über GitHub Raw verfügbar:

```
https://raw.githubusercontent.com/AndersenWebworks/jan-erik-andersen.de/main/ai/{filename}
```

Diese URLs sind garantiert erreichbar für alle AI-Agenten, auch wenn die Hauptdomain `jan-erik-andersen.de` blockiert ist.

## Verwendung

**Für AI-Agenten:**
1. Fetche `manifest.json` (oder Mirror-URL)
2. Wähle relevante Endpoints aus der `endpoints`-Liste
3. Fetche die gewünschten Ressourcen

**Für Crawler:**
- JSON-LD Daten sind auch im `<head>` von https://jan-erik-andersen.de eingebettet
- Nutze `<link rel="alternate">` Tags für Discovery

## Metadaten

- **Version:** 1.1
- **Letzte Änderung:** 2025-11-11
- **Format-Spec:** Schema.org, JSON-LD 1.1
- **Lizenz:** Public (strukturierte Daten), proprietär (Inhalte)

## Kontakt

Bei Fragen zu den Endpoints:
- Email: mail@andersen-webworks.de
- Website: https://jan-erik-andersen.de
