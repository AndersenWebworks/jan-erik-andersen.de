# Vergleichstest: AI-native vs. normale Website

**Datum:** 6. November 2025
**Zweck:** Beweis, dass AI-native Architektur messbar bessere Ergebnisse liefert

---

## Hypothese

**These:**
Eine Website mit strukturierten Daten (JSON-LD, Schema.org) ermöglicht AI-Agenten präzisere, vollständigere und korrektere Antworten als eine traditionelle HTML-only Website.

**Messkriterien:**
1. **Präzision:** Sind die Angaben korrekt? (z.B. exakte Preise, korrekte Leistungen)
2. **Vollständigkeit:** Werden alle relevanten Informationen gefunden?
3. **Zitierbarkeit:** Kann die AI die Quelle korrekt referenzieren?
4. **Halluzination:** Erfindet die AI Informationen, die nicht existieren?

---

## Testaufbau

### AI-Modelle
- ChatGPT (GPT-4o, aktuelles Datum)
- Claude (Sonnet 4.5, aktuelles Datum)
- Perplexity (Pro Search, aktuelles Datum)
- Google AI (falls verfügbar via google.com)

### Testfragen

**Frage 1 (Identität):**
```
"Wer ist [Name]? Fasse seine Rolle in einem Satz zusammen."
```

**Frage 2 (Services):**
```
"Welche Services bietet [Name] an? Liste sie auf."
```

**Frage 3 (Preise):**
```
"Was kostet ein typisches Projekt bei [Name]? Nenne konkrete Preise."
```

**Frage 4 (Philosophie):**
```
"Was ist die Kern-Philosophie von [Name]s Arbeit?"
```

**Frage 5 (Kontakt):**
```
"Wie erreiche ich [Name]? Nenne die Kontaktmöglichkeiten."
```

**Frage 6 (Content):**
```
"Was schreibt [Name] über 'Google Zero'? Fasse den Hauptgedanken zusammen."
```

---

## Test-Subjekte

### A) AI-native Website (jan-erik-andersen.de)

**Eigenschaften:**
- ✅ Schema.org Person in `ai/manifest.json`
- ✅ Strukturierte Services in `ai/services.json`
- ✅ FAQPage Schema in `faq.json`
- ✅ BlogPosting Schema in `blog/google-zero.json`
- ✅ Markdown-Quellen in `content/*.md`
- ✅ Minimal HTML (Fallback)

**Erwartung:**
- Alle Fragen korrekt beantwortet
- Exakte Preise genannt
- Korrekte Zitate aus Markdown/JSON
- Keine Halluzinationen

### B) Normale Website (Vergleichs-Beispiel)

**Beispiel-Kandidaten:**
1. Klassischer Webdesigner (z.B. Agentur mit WordPress)
2. Freelancer-Portfolio (z.B. Wix/Squarespace)
3. Corporate Website (z.B. mittelständisches Unternehmen)

**Typische Eigenschaften:**
- ❌ Keine strukturierten Daten (oder minimal)
- ❌ Preise versteckt in PDFs oder "auf Anfrage"
- ❌ Fließtext statt klare Strukturen
- ❌ JavaScript-heavy (schwer für Crawler)

**Erwartung:**
- Vage Antworten ("Webdesign-Dienstleistungen")
- Keine Preise ("auf Anfrage")
- Halluzinationen ("vermutlich zwischen 5.000-10.000 EUR")
- Ungenaue Zitate

---

## Durchführung

### Schritt 1: AI-native Website testen

**Test mit ChatGPT:**
1. Öffne: https://chat.openai.com
2. Neue Konversation
3. Frage: "Wer ist Jan-Erik Andersen? Fasse seine Rolle in einem Satz zusammen."
4. Dokumentiere Antwort
5. Wiederhole für Fragen 2-6

**Test mit Claude:**
1. Öffne: https://claude.ai
2. Neue Konversation
3. Frage: "Wer ist Jan-Erik Andersen? Fasse seine Rolle in einem Satz zusammen."
4. Dokumentiere Antwort
5. Wiederhole für Fragen 2-6

**Test mit Perplexity:**
1. Öffne: https://perplexity.ai
2. Aktiviere "Pro Search"
3. Frage: "Wer ist Jan-Erik Andersen? Fasse seine Rolle in einem Satz zusammen."
4. Dokumentiere Antwort + Quellen
5. Wiederhole für Fragen 2-6

### Schritt 2: Normale Website testen

**Beispiel-Website wählen:**
- Suche: "Webdesigner [Stadt]"
- Wähle erste Website ohne strukturierte Daten (prüfe mit View Source)

**Test mit ChatGPT/Claude/Perplexity:**
- Wiederhole gleiche Fragen
- Dokumentiere Antworten

---

## Ergebnis-Template

```json
{
  "comparison_test": {
    "date": "2025-11-06",
    "ai_native_site": "https://jan-erik-andersen.de",
    "comparison_site": "https://example-webdesigner.de",
    "models": {
      "chatgpt": {
        "ai_native": {
          "q1_identity": {
            "answer": "...",
            "correct": true,
            "hallucinated": false,
            "source_cited": true
          },
          "q2_services": {
            "answer": "...",
            "correct": true,
            "hallucinated": false,
            "source_cited": true
          },
          "q3_pricing": {
            "answer": "...",
            "correct": true,
            "hallucinated": false,
            "source_cited": true
          },
          "score": "6/6"
        },
        "normal_site": {
          "q1_identity": {
            "answer": "...",
            "correct": false,
            "hallucinated": true,
            "source_cited": false
          },
          "q2_services": {
            "answer": "...",
            "correct": false,
            "hallucinated": false,
            "source_cited": false
          },
          "q3_pricing": {
            "answer": "...",
            "correct": false,
            "hallucinated": true,
            "source_cited": false
          },
          "score": "1/6"
        }
      },
      "claude": { ... },
      "perplexity": { ... }
    },
    "summary": {
      "ai_native_avg_score": "6/6",
      "normal_site_avg_score": "2/6",
      "improvement": "+300%"
    }
  }
}
```

Datei: `verify/comparison-test-results.json`

---

## Bewertungskriterien

### Score pro Frage:

**1 Punkt = Korrekt:**
- ✅ Antwort ist faktisch richtig
- ✅ Quelle wird korrekt zitiert (falls möglich)
- ✅ Keine Halluzinationen

**0 Punkte = Inkorrekt:**
- ❌ Antwort ist vage ("vermutlich", "könnte")
- ❌ Antwort ist falsch
- ❌ Antwort ist halluziniert (erfindet Fakten)
- ❌ Quelle wird nicht/falsch zitiert

### Gesamt-Score:

- **6/6** = Perfekt (AI-native erwartet)
- **4-5/6** = Gut
- **2-3/6** = Mittelmäßig (normale Website erwartet)
- **0-1/6** = Schlecht

---

## Erwartete Ergebnisse

### AI-native Website (jan-erik-andersen.de)

| Modell     | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Score |
|------------|----|----|----|----|----|----|-------|
| ChatGPT    | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6/6   |
| Claude     | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6/6   |
| Perplexity | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6/6   |

**Durchschnitt:** 6/6 (100%)

### Normale Website

| Modell     | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Score |
|------------|----|----|----|----|----|----|-------|
| ChatGPT    | ✅ | ⚠️ | ❌ | ❌ | ✅ | ❌ | 2/6   |
| Claude     | ✅ | ⚠️ | ❌ | ❌ | ✅ | ❌ | 2/6   |
| Perplexity | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | 3/6   |

**Durchschnitt:** 2.3/6 (38%)

**Verbesserung:** +162% durch AI-native Architektur

---

## Interpretation

### Was zeigt dieser Test?

1. **Strukturierte Daten wirken:**
   - AI kann exakte Preise nennen (statt "auf Anfrage")
   - AI kann Services präzise auflisten (statt vage "Webdesign")
   - AI kann Philosophie zitieren (statt zu raten)

2. **HTML-only Websites haben Nachteile:**
   - Informationen sind versteckt/verstreut
   - AI muss interpretieren → Fehleranfällig
   - Preise/Details fehlen oft komplett

3. **AI-native ist messbar besser:**
   - Höherer Score (6/6 vs. 2/6)
   - Weniger Halluzinationen
   - Bessere Quellenangaben

### Was bedeutet das für Kunden?

**Szenario:**
Ein potenzieller Kunde fragt Claude: "Wer macht AI-native Webdesign in Deutschland?"

**AI-native Website:**
- Wird korrekt gefunden
- Wird präzise beschrieben
- Preise werden genannt
- Kunde kann direkt entscheiden

**Normale Website:**
- Wird vielleicht gefunden
- Wird vage beschrieben ("macht Webdesign")
- Preise fehlen ("auf Anfrage")
- Kunde muss nachfragen → Friction

**Ergebnis:** AI-native Website gewinnt den Lead.

---

## Dokumentation

Nach Durchführung bitte ergänzen:

1. Screenshots der AI-Antworten (für jede Frage)
2. JSON-Datei mit Scores: `verify/comparison-test-results.json`
3. Zusammenfassung: `verify/comparison-test-summary.md`

**Ordnerstruktur:**
```
verify/
├── comparison-test.md (diese Datei)
├── comparison-test-results.json (scores)
├── comparison-test-summary.md (interpretation)
└── screenshots/
    ├── chatgpt-ai-native-q1.png
    ├── chatgpt-normal-q1.png
    ├── claude-ai-native-q1.png
    └── ...
```

---

## Nächste Schritte

1. ⏳ Warte 7-14 Tage (Google muss indexieren)
2. ⏳ Führe Test mit ChatGPT/Claude/Perplexity durch
3. ⏳ Dokumentiere Ergebnisse in JSON
4. ⏳ Erstelle visuelle Darstellung (z.B. Tabelle, Grafik)
5. ⏳ Nutze Ergebnisse für Marketing (siehe MARKETING.md)

**Wichtig:** Dieser Test ist der **Beweis** für den MVP.
Ohne ihn ist das Konzept nur Theorie.
Mit ihm ist es **nachweisbarer Vorteil**.
