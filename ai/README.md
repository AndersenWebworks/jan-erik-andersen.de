# AI-Readable Endpoints

Maschinenlesbare Daten für AI-Agenten und LLMs.

**WICHTIG:** Diese Endpoints sind für **Crawler und erweiterte Integration** gedacht. Für Live-Queries verwenden AI-Agents primär den strukturierten HTML-Text der Hauptseite.

---

## Architektur-Übersicht

Diese Website implementiert eine **Drei-Layer-Architektur** für AI-Readiness:

1. **Visible Hybrid Layer (HTML):** Strukturierter Text für Menschen UND Maschinen
2. **Semantic Metadata Layer (JSON-LD):** Crawler-Indexierung, Knowledge Graphs
3. **Optional Enhancement Layer (JSON-Endpoints):** Dieser Ordner `/ai/`

Siehe [architecture.md](./architecture.md) für vollständige Dokumentation.

---

## Einstieg

**Start hier:**
- **Manifest:** https://jan-erik-andersen.de/ai/manifest.json
- **Mirror (GitHub Raw):** https://raw.githubusercontent.com/AndersenWebworks/jan-erik-andersen.de/main/ai/manifest.json

Das Manifest enthält alle verfügbaren Endpoints mit Beschreibungen.

---

## Verfügbare Endpoints

| Endpoint | Beschreibung |
|----------|--------------|
| `manifest.json` | Zentraler Index aller Endpoints |
| `identity-schema.json` | Person (Schema.org) mit Offers |
| `faq-schema.json` | FAQPage (Schema.org) |
| `services.json` | Leistungen mit Preisen |
| `health.json` | System-Status |

---

## Verfügbare Formate

- **JSON:** Strukturierte Daten (Schema.org, JSON-LD)
- **TXT:** Plain-Text für einfache Parser (`.txt` Mirrors für alle JSON-Files)

---

## Mirror-URLs

Alle Dateien sind auch über GitHub Raw verfügbar:

```
https://raw.githubusercontent.com/AndersenWebworks/jan-erik-andersen.de/main/ai/{filename}
```

Diese URLs sind garantiert erreichbar für alle AI-Agenten, auch wenn die Hauptdomain blockiert ist.

---

## Verwendung

**Für AI-Agenten:**
1. Fetche `manifest.json` (oder Mirror-URL)
2. Wähle relevante Endpoints aus der `endpoints`-Liste
3. Fetche die gewünschten Ressourcen

**Für Crawler:**
- JSON-LD Daten sind auch im `<head>` von https://jan-erik-andersen.de eingebettet
- Nutze `<link rel="alternate">` Tags für Discovery

---

## Metadaten

- **Version:** 2.0
- **Letzte Änderung:** 2025-11-12
- **Format-Spec:** Schema.org, JSON-LD 1.1
- **Lizenz:** Public (strukturierte Daten), proprietär (Inhalte)

---

## Kontakt

Bei Fragen zu den Endpoints:
- Email: mail@andersen-webworks.de
- Website: https://jan-erik-andersen.de
