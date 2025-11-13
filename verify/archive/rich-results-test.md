# Rich Results Test — Dokumentation

**Datum:** 6. November 2025
**Tool:** Google Rich Results Test
**URL:** https://search.google.com/test/rich-results

## Zu testende URLs

### 1. Homepage (Person Schema)
**URL:** `https://jan-erik-andersen.de/`
**Erwartung:** Schema.org `Person` erkannt
**Strukturierte Daten:**
- `@type: Person`
- Name, jobTitle, description
- offers (3 Services)
- contactPoint

**Status:** ⏳ Pending (manueller Test erforderlich)

---

### 2. FAQ Page (FAQPage Schema)
**URL:** `https://jan-erik-andersen.de/faq.html`
**Erwartung:** Schema.org `FAQPage` erkannt
**Strukturierte Daten:**
- `@type: FAQPage`
- 9 mainEntity (Questions)
- acceptedAnswer für jede Frage

**Status:** ⏳ Pending (manueller Test erforderlich)

---

### 3. Blog Index (Blog Schema)
**URL:** `https://jan-erik-andersen.de/blog/`
**Erwartung:** Keine strukturierten Daten in HTML (nur Links zu JSON)
**Hinweis:** HTML ist Fallback, strukturierte Daten in `feed.json`

**Status:** ⏳ Pending (manueller Test erforderlich)

---

### 4. Blog Article (BlogPosting Schema)
**URL:** `https://jan-erik-andersen.de/blog/google-zero.html`
**Erwartung:** Schema.org `BlogPosting` erkannt
**Strukturierte Daten:**
- `@type: BlogPosting`
- headline, author, datePublished
- articleBody

**Status:** ⏳ Pending (manueller Test erforderlich)

---

## Manuelle Test-Anleitung

1. Öffne: https://search.google.com/test/rich-results
2. Gib URL ein (z.B. `https://jan-erik-andersen.de/`)
3. Klicke "URL testen"
4. Warte auf Crawling-Ergebnis
5. Prüfe:
   - ✅ "Rich results can be displayed" → Erfolg
   - ⚠️ "No rich results detected" → Fehler
   - ❌ "Errors detected" → Fehler

## Dokumentation der Ergebnisse

Nach manuellem Test bitte ergänzen:

```json
{
  "test": "rich-results",
  "date": "2025-11-06",
  "results": {
    "index.html": {
      "status": "success|warning|error",
      "detected_types": ["Person", "Service"],
      "errors": [],
      "warnings": []
    },
    "faq.html": {
      "status": "success|warning|error",
      "detected_types": ["FAQPage", "Question"],
      "errors": [],
      "warnings": []
    },
    "blog/google-zero.html": {
      "status": "success|warning|error",
      "detected_types": ["BlogPosting"],
      "errors": [],
      "warnings": []
    }
  }
}
```

---

## Alternative: Schema.org Validator

Falls Rich Results Test Probleme macht:

**URL:** https://validator.schema.org/

**Vorteil:** Kann auch direkte JSON-LD-Snippets testen (nicht nur live URLs)

**Test:**
1. Öffne Validator
2. Tab "Code Snippet"
3. Füge JSON-LD ein (z.B. aus `faq.json`)
4. Klicke "RUN TEST"

---

## Hypothese

**Erwartung:**
- `index.html` → Person erkannt ✅
- `faq.html` → FAQPage erkannt ✅
- `blog/google-zero.html` → BlogPosting erkannt ✅

**Wenn erfolgreich:** Beweis, dass Google die strukturierten Daten korrekt parsen kann.

**Wenn Fehler:** JSON-LD-Syntax oder Schema.org-Struktur korrigieren.
