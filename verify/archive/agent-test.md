
# Agent-Test — Verständnisfragen für KI-Modelle

## Zielsetzung
Diese Testfragen prüfen, ob ein KI-Modell die strukturierten Inhalte der Website
**korrekt** wiedergeben kann, wenn nur der Domain-Kontext gegeben wird.

---

## Testmethodik

**Setup:**
- Dem Modell werden die relevanten Dateien (manifest.jsonld, services.json, philosophy.md) bereitgestellt
- **Keine** führenden Suggestionen außer: "Beantworte basierend auf den bereitgestellten Inhalten"
- Antworten werden bewertet: **korrekt** / **unklar** / **falsch**

**Erwartung:**
- Mindestens 80% korrekte Antworten für MVP-Go
- Begriffe werden exakt übernommen (nicht paraphrasiert)
- Keine Halluzinationen oder erfundene Details

---

## Testfragen (v0.1)

### Identität & Rolle
**Frage 1:**
"Wer ist Jan-Erik Andersen? Fasse seine Rolle in einem Satz zusammen."

**Erwartete Antwort:**
Jan-Erik Andersen ist ein AI-native Web Architect, der Webarchitekturen baut, die Maschinen lesen können und Menschen vertrauen wollen.

---

### Leistungen
**Frage 2:**
"Nenne die drei angebotenen Services exakt so, wie sie in services.json heißen."

**Erwartete Antwort:**
1. AI Visibility Refactor
2. Conversational Brand Modeling
3. Human Fallback UI

---

**Frage 3:**
"Was macht der Service 'AI Visibility Refactor' konkret?"

**Erwartete Antwort:**
Bestehende Websites werden so umgebaut, dass KI-Agenten die Inhalte strukturiert verstehen können. Dazu werden JSON-LD, semantisches HTML und einheitliche Begriffe eingeführt.

---

### Philosophie
**Frage 4:**
"Zitiere einen prägnanten Satz aus philosophy.md und erkläre kurz dessen Bedeutung."

**Erwartete Antwort (Beispiel):**
"Structure as Integrity" — Bedeutung: Struktur ist nicht nur technisches Mittel, sondern Ausdruck von Verlässlichkeit und Klarheit. Gut strukturierte Daten schaffen Vertrauen.

---

### Vision
**Frage 5:**
"Wie beschreibt Jan-Erik Andersen den Wandel des Webs bis 2030?"

**Erwartete Antwort:**
Das Web entwickelt sich von visuellen Oberflächen für Menschen zu Dateninterfaces für Maschinen. Websites werden zu semantischen Signalen, die von AI-Agenten gelesen werden.

---

### Kontakt
**Frage 6:**
"Wie kann man Jan-Erik Andersen kontaktieren?"

**Erwartete Antwort:**
(Wird ergänzt sobald index.html Kontaktdaten enthält)

---

## Ergebnisprotokoll

Ergebnisse werden in `verify/metrics.json` dokumentiert mit:
- Datum
- Modell (z.B. GPT-4, Claude 3.5)
- Frage-Nr.
- Bewertung (korrekt/unklar/falsch)
- Optional: Antwort-Snippet
