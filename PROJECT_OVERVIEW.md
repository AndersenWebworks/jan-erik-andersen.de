# PROJECT_OVERVIEW – jan-erik-andersen.de

## Projektziel
Personal-Brand-Website fuer Jan-Erik Andersen (Andersen Webworks).
Neupositionierung 2026: Webentwicklung + digitale Tools + KI-Sichtbarkeit.
Expertenton, nicht Bewerbungston. KI-lesbar und menschenlesbar.

## Stack
- **Frontend:** Statisches HTML, CSS (kein Framework, kein Build-Tool)
- **Typografie:** Inter (Google Fonts)
- **Farben:** AW-Rot #d40235, Dark Mode
- **AI-Layer:** JSON-Endpoints unter `/ai/` (Schema.org, JSON-LD)
- **Hosting:** GitHub Pages (main Branch = live)
- **Tracking:** GoatCounter (Pixel, kein JS)

## Seitenstruktur
```
/                          Startseite (Executive Summary + Daten)
/leistungen/               Drei Service-Cluster mit Preisrahmen
/leistungen/ki-sichtbarkeit.html   GEO-Vertiefung (Edukation, Statistiken, Quellen)
/projekte/                 Runden Feature-Story, 4 Cards, weitere Kunden
/ueber/                    Bio als Fakten, Disziplinen, Ablauf
/kontakt/                  Kontaktdaten + "Erstgespraech kostenlos"
/en/                       Englische Version (NOCH NICHT auf neuen Stand)
/de/                       Impressum, Datenschutz, Barrierefreiheit
/ai/                       AI-Endpoints (manifest, identity, services, FAQ)
```

## Tonregeln
1. Feststellen, nicht verkaufen
2. Daten mit Quellen, nicht Behauptungen
3. Arbeit beschreiben, nicht sich selbst
4. Kontaktdaten sind Information, nicht Einladung
5. Keine Vergleiche nach unten
6. Keine Verteidigungen
7. Quellen wo moeglich
8. Die Seite IST der Beweis

## Constraints
- Kein JavaScript (ausser Dark Mode Toggle + GoatCounter Pixel)
- DSGVO-konform
- BFSG-Barrierefreiheit (WCAG 2.1 AA)
- Performance-first (Lighthouse 95+)
- Keine Frameworks, keine Build-Tools
- Push = live (GitHub Pages)

## Naechste Schritte
- Content-Qualitaetsdurchgang (Writing Style, Sprachstandard)
- Annemarie-Lektorat
- /en/ auf neue Struktur aktualisieren
- /ai/-Endpoints auf neue Service-Struktur pruefen
- 301-Redirect andersen-webworks.de → jan-erik-andersen.de
