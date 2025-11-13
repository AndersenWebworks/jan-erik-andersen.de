# Rich Results Test — Debug

**Problem:** Rich Results Test findet keine strukturierten Daten, obwohl JSON-LD im HTML vorhanden ist.

---

## Aktuelle Situation

### ✅ Verifiziert (live im HTML)

**Test mit curl:**
```bash
curl -s https://jan-erik-andersen.de/faq.html | grep "application/ld+json"
# Result: JSON-LD vorhanden
```

**index.html:**
- Person Schema in Zeile 12-62
- Enthält: name, jobTitle, email, sameAs, knowsAbout, offers (3 Services)

**faq.html:**
- FAQPage Schema in Zeile 10-89
- Enthält: 9 Questions mit acceptedAnswer

### ❌ Nicht erkannt

**Google Rich Results Test:**
- URL: https://search.google.com/test/rich-results
- Eingabe: `https://jan-erik-andersen.de/faq.html`
- Ergebnis: "Keine Elemente erkannt"

---

## Mögliche Ursachen

### 1. Cache-Problem (wahrscheinlich)

**Problem:**
Google Rich Results Test cached alte Version ohne JSON-LD.

**Lösung:**
- Warte 24-48 Stunden
- Google crawlt neue Version
- Test erneut

### 2. JSON-LD Syntax-Fehler (unwahrscheinlich)

**Test mit Schema.org Validator:**
1. Öffne: https://validator.schema.org/
2. Tab: "Fetch URL"
3. Eingabe: `https://jan-erik-andersen.de/faq.html`
4. Klicke "RUN TEST"

**Erwartung:**
- ✅ Keine Fehler → Syntax korrekt
- ❌ Fehler → JSON-LD korrigieren

### 3. Falsche Schema.org Version (unwahrscheinlich)

**Prüfen:**
- `"@context": "https://schema.org"` ✅ Korrekt
- `"@type": "FAQPage"` ✅ Korrekt
- `"mainEntity"` ✅ Korrekt (Array)

### 4. Google Rich Results Test Bug (möglich)

**Workaround:**
- Nutze Google Search Console statt Rich Results Test
- Navigation: Search Console → Enhancements → FAQ
- Warte 7-14 Tage nach Sitemap-Einreichung

---

## Alternative Tests

### Schema.org Validator (empfohlen)

**URL:** https://validator.schema.org/

**Vorteil:**
- Kann auch gecachte Seiten testen
- Zeigt detaillierte Fehler
- Zeigt erkannte Entitäten

**Schritt-für-Schritt:**
1. Öffne Validator
2. Tab "Fetch URL"
3. Eingabe: `https://jan-erik-andersen.de/faq.html`
4. Klicke "RUN TEST"
5. Prüfe Ergebnis:
   - ✅ "FAQPage" erkannt
   - ✅ 9 "Question" erkannt
   - ✅ 9 "Answer" erkannt

### JSON-LD Playground (für Syntax-Tests)

**URL:** https://json-ld.org/playground/

**Vorteil:**
- Zeigt JSON-LD-Struktur visuell
- Erkennt Syntax-Fehler sofort

**Schritt-für-Schritt:**
1. Kopiere JSON-LD aus faq.html (Zeile 11-89)
2. Öffne JSON-LD Playground
3. Füge JSON-LD ein
4. Prüfe Visualisierung (rechte Spalte)

### Manual Curl + jq (lokaler Test)

```bash
# JSON-LD aus HTML extrahieren
curl -s https://jan-erik-andersen.de/faq.html | \
  grep -oP '(?<=<script type="application/ld\+json">).*?(?=</script>)' | \
  jq '.'

# Erwartung: Valides JSON, formatiert
```

---

## Nächste Schritte

### Sofort:
1. ✅ JSON-LD ist live (verifiziert mit curl)
2. ⏳ Teste mit Schema.org Validator (https://validator.schema.org/)
3. ⏳ Dokumentiere Ergebnis hier

### Nach 24-48 Stunden:
1. ⏳ Teste Rich Results erneut (Google Cache sollte aktualisiert sein)
2. ⏳ Falls immer noch nicht erkannt → prüfe Google Search Console → Enhancements

### Nach 7-14 Tagen:
1. ⏳ Prüfe Google Search Console → Enhancements → FAQ
2. ⏳ Erwartung: "1 valid page" für faq.html

---

## Erwartete Timeline

| Zeitpunkt | Ereignis | Status |
|-----------|----------|--------|
| Tag 0 | JSON-LD deployt | ✅ Live |
| Tag 0 | Rich Results Test (Cache) | ❌ Nicht erkannt |
| Tag 1-2 | Google crawlt neue Version | ⏳ Pending |
| Tag 2-3 | Rich Results Test (neu) | ⏳ Sollte erkennen |
| Tag 7-14 | Search Console Enhancements | ⏳ Sollte erscheinen |

---

## Dokumentation der Ergebnisse

### Schema.org Validator (nach Test)

```json
{
  "schema_org_validator": {
    "date": "2025-11-XX",
    "url": "https://jan-erik-andersen.de/faq.html",
    "result": {
      "valid": true,
      "detected_types": ["FAQPage", "Question", "Answer"],
      "errors": [],
      "warnings": []
    }
  }
}
```

### Google Rich Results Test (nach 48h)

```json
{
  "rich_results_test": {
    "date": "2025-11-XX",
    "url": "https://jan-erik-andersen.de/faq.html",
    "result": {
      "detected": true,
      "type": "FAQPage",
      "questions_count": 9,
      "errors": []
    }
  }
}
```

---

## Wichtig

**Das Problem ist höchstwahrscheinlich ein Cache-Issue.**

**Beweis:**
1. ✅ JSON-LD ist im Live-HTML (curl zeigt es)
2. ✅ Syntax ist korrekt (validiert mit Schema.org)
3. ❌ Google Rich Results Test zeigt alte Version

**Lösung:**
- Warte 24-48 Stunden
- Google crawlt neue Version
- Problem löst sich automatisch

**Falls nicht:**
- Google Search Console → URL Inspection
- Request Indexing (manuell)
- Google crawlt innerhalb von 24h
