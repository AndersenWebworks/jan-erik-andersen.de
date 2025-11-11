# AI Visibility Test Tool

Testet, wie AI-Agenten (ChatGPT, Claude, Perplexity, Gemini) deine Website sehen.

## Installation

```bash
pip install requests beautifulsoup4
```

## Usage

```bash
python ai-visibility-test.py https://example.com
```

## Was wird getestet?

### 1. Single-Fetch-Prinzip
- Nur die Startseite wird abgerufen (wie echte AI-Agenten)
- Keine Navigation zu Unterseiten

### 2. Extraktion
- **Basis-Info:** Title, Description, Headlines
- **Strukturierte Daten:** JSON-LD im `<head>`
- **Kontakt:** Email, Telefon
- **Services:** Strukturierte `<dl>`-Daten

### 3. Scoring
- AI Readiness Score (0-100%)
- Konkrete Empfehlungen

## Beispiel-Output

```
==================================================
🔍 AI VISIBILITY TEST
==================================================
URL: https://jan-erik-andersen.de
Domain: jan-erik-andersen.de
==================================================

📄 BASIS-INFORMATIONEN
Title: Jan-Erik Andersen — AI-native Web Architect
H1 Headlines: Jan-Erik Andersen
H2 Headlines: Zero-Click = Zero Navigation, AI-Onepager, Prozess

📊 STRUKTURIERTE DATEN
✅ 2 JSON-LD Block(s) gefunden
   Block 1: @type = Person
   Block 2: @type = FAQPage

📞 KONTAKTDATEN
✅ Emails: mail@andersen-webworks.de
✅ Telefonnummern: 038733 270015

🛠️  SERVICES
✅ 3 Service(s) gefunden:
   Service 1:
      Dauer: 3-5 Tage
      Preis: Auf Anfrage

📈 AI READINESS SCORE
Score: 9/10 (90%)
✅ EXZELLENT - Website ist gut strukturiert für AI-Agenten
```

## Use Cases

### 1. Sales-Call
```bash
# Live-Demo während des Calls
python ai-visibility-test.py https://kunde-website.de
```

### 2. Audit
```bash
# Mehrere Seiten testen
for url in kunde1.de kunde2.de kunde3.de; do
    python ai-visibility-test.py $url > reports/$url.txt
done
```

### 3. Before/After
```bash
# Vor Refactor
python ai-visibility-test.py https://kunde.de > before.txt

# Nach Refactor
python ai-visibility-test.py https://kunde.de > after.txt

# Vergleich
diff before.txt after.txt
```

## Limitations

- Simuliert nur das Fetch-Verhalten, nicht die AI-Intelligenz
- Keine semantische Analyse des Texts
- Keine Bewertung der Content-Qualität

## Roadmap

- [ ] Export als PDF-Report
- [ ] Screenshot der Seite
- [ ] Vergleich mit Mitbewerbern
- [ ] Citation-Simulation (wie würde ChatGPT diese Seite zitieren?)
