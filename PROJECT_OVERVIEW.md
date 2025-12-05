# PROJECT_OVERVIEW – jan-erik-andersen.de

## Projektziel
AI-native Portfolio-Website für Jan-Erik Andersen (Andersen Webworks).
Struktur-first: maschinenlesbar für KI-Agenten UND menschenlesbar.

## Stack
- **Frontend:** Statisches HTML, CSS (kein Framework)
- **AI-Layer:** JSON-Endpoints unter `/ai/` (Schema.org, JSON-LD)
- **Hosting:** GitHub Pages / JAMstack
- **Versionierung:** manifest.json als SSOT (v2.15 aktuell)

## Architektur (3 Layer)
1. **Visible Hybrid Layer** – Semantic HTML für Menschen + Maschinen
2. **Semantic Metadata Layer** – JSON-LD in `<head>`
3. **Optional Enhancement Layer** – `/ai/`-Endpoints für erweiterte Integration

## Sprachen
- Deutsch: `/index.html`, `/de/`
- Englisch: `/en/`

## Constraints
- Kein JavaScript (außer minimal für Interaktion)
- DSGVO-konform (GoatCounter Pixel-Tracking)
- Performance-first (Core Web Vitals)
- Keine Frameworks, keine Build-Tools

## Definition of Done (Projektebene)
- Alle HTML-Seiten validieren (W3C)
- Alle JSON-Endpoints sind syntaktisch korrekt
- manifest.json und Footer-Version synchron
- .txt-Mirrors sind aktuell
- Lighthouse-Score >90
