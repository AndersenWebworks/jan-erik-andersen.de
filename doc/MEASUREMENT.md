# Semantic Survival Rate & Messmethoden

**Metriken für AI-native Web Architektur**

---
Version: 1.3
Letztes Update: 2025-11-15
Autor: Jan-Erik Andersen
---

## 🎯 Konzept

**Semantic Survival Rate (SSR)** misst, wie viel Information nach LLM-Fetch korrekt erhalten bleibt.

### Definition

```
SSR = (korrekt extrahierte Informationen / total relevante Informationen) × 100%
```

**Warum wichtig?**

- LLMs komprimieren Text automatisch ("lossy compression")
- Tonalität, Redundanz, Menütexte werden entfernt
- Nur **strukturierte Fakten** überleben

**Ziel:** SSR > 95% für alle kritischen Informationen

---

## 📊 Messmethode

### Standard-Test-Protokoll

1. **Fetch durchführen**
   ```
   "Lies https://jan-erik-andersen.de und beantworte folgende Fragen:"
   ```

2. **Standardisierte Fragen stellen:**

   | Kategorie | Frage |
   |-----------|-------|
   | **Services** | "Welche Leistungen werden angeboten? Nenne alle mit Preisen." |
   | **Kontakt** | "Wie kann ich Kontakt aufnehmen? Email, Telefon, Antwortzeit?" |
   | **Geo** | "Wo befindet sich das Unternehmen? Stadt, Land, Region?" |
   | **Identität** | "Wer ist der Betreiber? Name, Titel, Expertise?" |
   | **Timeline** | "Seit wann existiert das Unternehmen/die Person?" |

3. **Antworten validieren**
   ```python
   expected = {
       "services": ["Struktur-Audit", "GEO-Optimierung", "Brand Voice Definition"],
       "prices": ["400-600 EUR", "2.400-12.000 EUR", "1.800-4.800 EUR"],
       "email": "mail@andersen-webworks.de",
       "location": "Deutschland",
       "founded": "2010"
   }

   def validate_response(llm_response, expected):
       score = 0
       total = len(expected)
       for key, value in expected.items():
           if all(v in llm_response for v in value if isinstance(value, list)):
               score += 1
           elif value in llm_response:
               score += 1
       return (score / total) * 100
   ```

4. **SSR berechnen**
   ```
   SSR = (6 korrekte Antworten / 6 Fragen) × 100% = 100%
   ```

---

## 🧪 Test-Framework

### Python-Script für automatisierte Tests

```python
# tools/test-ssr.py
import anthropic  # oder openai für ChatGPT
import json

def fetch_and_test(url):
    """
    Fetcht Website via LLM und testet Semantic Survival Rate
    """
    client = anthropic.Anthropic()

    # Standardisierte Test-Fragen
    questions = [
        "Welche Leistungen werden angeboten? Nenne alle mit Preisen.",
        "Wie lautet die Email-Adresse?",
        "Wo befindet sich das Unternehmen?",
        "Wer ist der Betreiber? Name und Titel.",
        "Seit wann existiert das Unternehmen?"
    ]

    # Expected-Werte (aus SSOT)
    expected = {
        "services": ["Struktur-Audit", "GEO-Optimierung", "Brand Voice"],
        "prices": ["400-600", "2.400-12.000", "1.800-4.800"],
        "email": "mail@andersen-webworks.de",
        "location": "Deutschland",
        "name": "Jan-Erik Andersen",
        "title": "GEO Expert",
        "founded": "2010"
    }

    # Fetch via LLM
    prompt = f"Lies {url} und beantworte:\n\n" + "\n".join(questions)

    message = client.messages.create(
        model="claude-3-7-sonnet-20250219",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )

    response = message.content[0].text

    # Validiere Antworten
    score = 0
    total = len(expected)

    for key, values in expected.items():
        if isinstance(values, list):
            if all(v in response for v in values):
                score += 1
        else:
            if values in response:
                score += 1

    ssr = (score / total) * 100

    return {
        "url": url,
        "ssr": ssr,
        "response": response,
        "expected": expected,
        "passed": ssr >= 95
    }

# Test durchführen
result = fetch_and_test("https://jan-erik-andersen.de")

print(f"✅ Semantic Survival Rate: {result['ssr']}%")
print(f"{'✅ PASSED' if result['passed'] else '❌ FAILED'} (Threshold: 95%)")
```

---

## 🎯 Zielwerte

### Nach Datentyp

| Datentyp | Ziel-SSR | Begründung |
|----------|----------|-----------|
| **Strukturierte Daten** (JSON-LD, `<dl>`) | > 98% | Maschinen-optimiert, klare Struktur |
| **Natürlichsprachlicher Text** (Fließtext) | > 85% | Kompression entfernt Redundanz, aber Fakten bleiben |
| **Kombiniert** (HTML + JSON-LD) | > 95% | Balance aus Lesbarkeit und Struktur |

### Nach Kritikalität

| Information | Mindest-SSR | Konsequenz bei Unterschreitung |
|-------------|-------------|-------------------------------|
| **Preis** | 100% | Fehlzitat → Vertrauensverlust |
| **Kontakt** | 100% | Nicht erreichbar → Business-Verlust |
| **Services** | 95% | Unvollständige Darstellung |
| **Geo** | 90% | Regionale Sichtbarkeit reduziert |
| **Tonalität** | 0% | Wird immer komprimiert (akzeptiert) |

---

## 📈 Citation-Rate Tracking

**Citation-Rate = Wie oft wird die Seite von LLMs zitiert?**

### Messmethode

1. **Google Alerts für Marke + "laut"**
   ```
   "Jan-Erik Andersen" + "laut" + site:chatgpt.com
   ```

2. **Manuelle Stichproben**
   ```
   Frage an ChatGPT:
   "Wer bietet GEO-Optimierung in Deutschland an?"

   → Wird jan-erik-andersen.de genannt?
   ```

3. **Server-Logs analysieren**
   ```bash
   # User-Agent Filter für AI-Crawlers
   grep "GPTBot\|Claude-Web\|PerplexityBot" /var/log/nginx/access.log
   ```

4. **GitHub Pages Analytics**
   - Referrer-Tracking (falls verfügbar)
   - Traffic-Spikes nach AI-Fetch

### Zielwerte

| Metrik | Ziel | Status |
|--------|------|--------|
| **Fetch-Erfolgsrate** (HTTP 200) | 100% | ✅ Erreicht |
| **Citation-Rate** (bei relevanten Fragen) | > 50% | ⏳ Monitoring läuft |
| **Korrektheit der Zitate** | > 95% | ✅ Erreicht (6/6 bei Tests) |

---

## 🧠 Interpretation der Ergebnisse

### SSR > 95%
✅ **Optimal strukturiert**
- Alle kritischen Informationen überleben Lossy Compression
- Website ist AI-native

### SSR 80-95%
⚠️ **Verbesserungspotenzial**
- Einige Informationen gehen verloren
- Prüfe: Sind Preise/Kontakt im Fließtext? Früh im DOM?

### SSR < 80%
❌ **Strukturelle Probleme**
- LLM kann Inhalte nicht zuverlässig extrahieren
- Häufige Ursachen:
  - Informationen nur in Bildern
  - JavaScript-Abhängigkeit
  - Multi-Page-Struktur ohne Konsolidierung
  - Keine semantischen HTML-Elemente

---

## 🛠️ Optimierungs-Maßnahmen bei niedrigem SSR

### 1. Kritische Informationen früher im DOM platzieren
```html
<!-- ❌ Schlecht: Preis am Ende -->
<footer>
  <p>Preis: 2.400 EUR</p>
</footer>

<!-- ✅ Gut: Preis in Service-Sektion (oberhalb Fold) -->
<section id="services">
  <dl>
    <dt>GEO-Optimierung:</dt>
    <dd>2.400-12.000 EUR</dd>
  </dl>
</section>
```

### 2. Semantische HTML-Elemente nutzen
```html
<!-- ❌ Schlecht: Generic Div -->
<div>Telefon: +49 123 456</div>

<!-- ✅ Gut: Definition List -->
<dl>
  <dt>Telefon:</dt>
  <dd>+49 123 456</dd>
</dl>
```

### 3. JSON-LD als Bestätigung (nicht Ersatz)
```html
<!-- Fließtext (SSOT) -->
<p>Preis: 2.400 EUR</p>

<!-- JSON-LD (Validierung) -->
<script type="application/ld+json">
{
  "offers": {
    "price": "2400",
    "priceCurrency": "EUR"
  }
}
</script>
```

### 4. Plain-Text-Fallbacks für kritische Daten
```
/ai/services.txt

GEO-Optimierung
Preis: 2.400-12.000 EUR
Dauer: 2-4 Wochen
Kontakt: mail@andersen-webworks.de
```

---

## 📊 Langzeit-Monitoring

### Empfohlene Frequenz

| Test | Frequenz | Tool |
|------|----------|------|
| **SSR-Test** | Alle 2 Wochen | `tools/test-ssr.py` |
| **Citation-Rate** | Monatlich | Google Alerts + Stichproben |
| **SSOT-Konsistenz** | Bei jedem Commit | GitHub Action |
| **Lighthouse Score** | Wöchentlich | Google Lighthouse CLI |

### Benchmark-Tracking

```json
// benchmarks/ssr-history.json
{
  "2025-11-15": {
    "ssr": 100,
    "services": "100%",
    "contact": "100%",
    "geo": "100%"
  },
  "2025-12-01": {
    "ssr": 98,
    "services": "100%",
    "contact": "100%",
    "geo": "95%"
  }
}
```

**Trend-Analyse:**
- SSR steigt → Optimierungen wirken
- SSR sinkt → Neue Inhalte schlechter strukturiert

---

## ✅ AI-Native Site Checkliste

**Praktische Testmethode für Agent Visibility & Semantic Survival Rate**

### 1. FETCH-TEST (Single-URL-Verhalten)

**Frage an den Agenten:**
```
"Sieh dir jan-erik-andersen.de an – was erfährst du über Jan-Erik Andersen?"
```

**Prüfung:**
- [ ] Antwort basiert nur auf der Startseite
- [ ] Agent benennt Beruf/Rolle korrekt (GEO Expert, Webdesigner)
- [ ] Agent erkennt Ort oder Region (Deutschland, Mecklenburg-Vorpommern)
- [ ] Agent versteht Leistungsarten (GEO-Optimierung, BFSG-Compliance)
- [ ] Agent nennt Preise oder Paketpreise
- [ ] Agent nennt Kontaktmöglichkeit (Email)

**Wenn eine dieser Infos fehlt:** Sie steht nicht hoch genug im DOM oder ist zu implizit formuliert.

---

### 2. DOM-POSITION TEST (Priorität im HTML)

**Ziel:** Alle Kernfakten müssen im oberen Drittel des Quelltexts liegen.

**Check:**
- [ ] Name & Rolle in den ersten 15 Zeilen
- [ ] GEO-Angaben vor dem ersten Image-Block
- [ ] Preis oder Leistungsmodell **vor Testimonials**
- [ ] Kontakt (Mail) spätestens ⅔ nach Beginn des HTML-Bodies

**Test:** `view-source:https://jan-erik-andersen.de` im Browser öffnen

---

### 3. SEMANTISCHE DICHTE

**Ziel:** Text ist verlustfrei komprimierbar.

**Kriterien:**
- [ ] Keine Phrasen, keine doppelte Erklärung des Gleichen
- [ ] Jeder Satz trägt ein neues Faktum
- [ ] Keine vagen Begriffe („ganzheitlich", „maßgeschneidert", „individuell")
- [ ] Zahlen, Daten, Orte und Tools als harte Marker

**Metrik:**
```
Anzahl der semantischen Fakten ÷ Gesamtzeichen ≈ 0,25% oder höher
(= mind. 1 Fakt auf 400 Zeichen Text)
```

---

### 4. GEO-VALIDATION

**Fragen an Agenten:**
```
"In welcher Region arbeitet Jan-Erik Andersen?"
"Wo befindet sich sein Büro?"
```

**Erfolgsindikatoren:**
- ✅ Agent nennt "Deutschland" oder spezifische Region
- ❌ Agent sagt "nicht bekannt" oder rät falsch

**Check:**
- [ ] Ortsname im Fließtext mindestens 2×
- [ ] Funktionsbezug (z.B. "arbeitet remote aus …")
- [ ] Keine reine Footer-Erwähnung

---

### 5. PREIS & LEISTUNGS-EXTRAKTION

**Fragen an Agenten:**
```
"Was kostet seine Leistung?"
"Welche Art von Projekten übernimmt er?"
```

**Erfolgsindikatoren:**
- [ ] Agent gibt realistische Preisrange (z.B. 2.400-12.000 EUR)
- [ ] Nennt mind. 3 Leistungsbereiche korrekt (Struktur-Audit, GEO, BFSG)

---

### 6. LINK-INTEGRITÄT

**Ziel:** Agenten dürfen sich nicht verlaufen.

- [ ] Keine Navigation zu Unterseiten erforderlich
- [ ] Externe Links sind optional (GitHub, LinkedIn), nicht für Verständnis nötig
- [ ] Alle internen Verweise (`#anchor`) funktionieren

---

### 7. MACHINE-ROBUSTNESS TEST

**Werkzeug:** Eigene Prompt-Simulation

```
Sieh dir jan-erik-andersen.de an.
Erkläre in 100 Worten, wer das ist, was er anbietet, wo er tätig ist,
und für wen seine Leistungen gedacht sind.
```

**Messung:**
- **Recall-Rate:** Wie viel vom echten Text erkannt wird
- **Precision-Rate:** Wie viel davon korrekt wiedergegeben wird

**Zielwert:** ≥ 0,85 für beide = **AI-native-tauglich**

---

### 8. HUMAN VS. AGENT DIFF

**Vergleiche:**
1. Startseite im Browser (visuell)
2. Text, den der Agent liefert

**Markiere Differenzen:**
- Welche Inhalte "überleben"?
- Welche verschwinden?
- Welche werden falsch paraphrasiert?

**Das zeigt:** Wo dein Layout semantische Dichte frisst.

---

### 9. KONTROLL-FETCH FÜR JSON-LD (optional)

**Frage:**
```
"Welche strukturierten Daten erkennt du auf jan-erik-andersen.de?"
```

**Wenn Agent "keine" sagt:** Kein Problem. Erwartetes Verhalten.

**JSON-LD ist nicht verlässlich fetchbar**, dient nur Suchmaschinen.

---

### 10. ERGEBNISPROTOKOLL

| Test | Ergebnis | Fix nötig |
|------|----------|-----------|
| Berufsrolle erkannt | ✅ | - |
| GEO erkannt | ✅ | - |
| Preise erkannt | ✅ | - |
| Hauptleistungen erkannt | ✅ | - |
| Stil paraphrasiert | ⚠️ | akzeptabel |
| JSON-LD genutzt | ❌ | optional |

---

## 🔗 Weiterführende Dokumentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Voice Loss → Structure Persistence
- **[SSOT-PIPELINE.md](SSOT-PIPELINE.md)** — Konsistenz-Validierung
- **[LEARNINGS.md](LEARNINGS.md)** — Empirische Test-Ergebnisse

---

## 📝 Changelog

**v1.3 (2025-11-15)**
- Initiale Definition der Semantic Survival Rate
- Python-Test-Framework
- Citation-Rate Tracking-Methoden
- Benchmark-Tracking-Vorschlag

---

**Kontakt:**
Jan-Erik Andersen
mail@andersen-webworks.de
https://jan-erik-andersen.de
