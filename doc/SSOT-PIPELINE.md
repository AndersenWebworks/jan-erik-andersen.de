# SSOT-Pipeline Architektur

**Single Source of Truth für strukturierte Daten**

---
Version: 1.3
Letztes Update: 2025-11-15
Autor: Jan-Erik Andersen

---

## 🎯 Konzept

**SSOT = Single Source of Truth**

In einem AI-nativen Web müssen strukturierte Daten aus **einer einzigen Quelle** stammen, um Inkonsistenzen zu vermeiden. LLMs prüfen Informationen gegen mehrere Quellen — Widersprüche führen zur Abwertung der gesamten Quelle.

**Problem bei manueller Pflege:**
```
services.json sagt: "Preis: 2.400-12.000 EUR"
services.txt sagt: "Preis: 2.500-12.000 EUR"
→ LLM erkennt Inkonsistenz → Quelle "unsicher"
```

**Lösung: SSOT-Pipeline**
```
manifest.json (SSOT — zentrale Wahrheit)
    ↓
services.json ↔ services.txt (synchron halten)
identity-schema.json ↔ identity.txt
faq-schema.json (kein .txt, da HTML-Accordion primär)
```

---

## 🔄 Datenfluss-Architektur

### Layer-Hierarchie

```
Ebene 1: HTML (Visible Layer)
    ↓ (extrahiert)
Ebene 2: JSON-LD im <head> (Semantic Metadata)
    ↓ (validiert)
Ebene 3: /ai/*.json (Strukturierte Rohdaten)
    ↔ (spiegelt)
Ebene 4: /ai/*.txt (Plain-Text Fallback)
```

**Synchronisations-Regeln:**

1. **HTML ist SSOT für sichtbare Inhalte**
   - Services, Preise, FAQ, Kontakt stehen im Fließtext
   - JSON-LD im `<head>` **dupliziert** diese Daten (nicht erweitert)

2. **JSON-LD ist SSOT für Schema.org-Typen**
   - Person, Organization, FAQPage, Offers
   - Muss **konsistent** mit HTML sein

3. **/ai/*.json ist SSOT für strukturierte Endpoints**
   - `services.json`, `identity-schema.json`, `faq-schema.json`
   - Können **mehr Details** enthalten als HTML (aber keine Widersprüche)

4. **/ai/*.txt ist MIRROR von /ai/*.json**
   - Keine eigenständigen Inhalte
   - Automatisch generiert oder manuell synchron gehalten

---

## 🛠️ Implementierung

### Aktueller Status (jan-erik-andersen.de)

**Manuelle Synchronisation:**
```bash
# 1. JSON-Datei bearbeiten
vim ai/services.json

# 2. Passenden .txt-Mirror synchron halten
vim ai/services.txt

# 3. Commit & Push
git add ai/services.json ai/services.txt
git commit -m "Update services: Preis angepasst"
git push origin main
```

**Problem:** Fehleranfällig, erfordert Disziplin

---

### Zukünftige Automation (Vorschlag)

**GitHub Action: JSON → TXT Sync Validator**

```yaml
# .github/workflows/validate-ssot.yml
name: Validate SSOT

on:
  push:
    paths:
      - 'ai/*.json'
      - 'ai/*.txt'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Validate JSON ↔ TXT Sync
        run: |
          # Prüft services.json ↔ services.txt UND identity-schema.json ↔ identity.txt
          python tools/validate-ssot.py

      - name: Fail on inconsistency
        if: failure()
        run: echo "❌ SSOT-Inkonsistenz erkannt!"
```

**Validator-Script:**

```python
# tools/validate-ssot.py
import json
from pathlib import Path

def validate_services():
    data = json.loads(Path('ai/services.json').read_text(encoding='utf-8'))
    txt = Path('ai/services.txt').read_text(encoding='utf-8')

    for entry in data.get('itemListElement', []):
        name = entry['name']
        duration = next((prop['value'] for prop in entry.get('additionalProperty', [])
                         if prop.get('name') == 'Dauer'), None)
        price = entry['offers']['priceSpecification']['price']

        assert name in txt, f"Service '{name}' fehlt in services.txt"
        if duration:
            assert duration in txt, f"Dauer '{duration}' fehlt in services.txt"
        assert price in txt, f"Preis '{price}' fehlt in services.txt"

    print("✅ services.json ↔ services.txt synchron")

def validate_identity():
    person = json.loads(Path('ai/identity-schema.json').read_text(encoding='utf-8'))
    txt = Path('ai/identity.txt').read_text(encoding='utf-8')

    critical_fields = [
        person['name'],
        person['jobTitle'],
        person['email'],
        "Andersen Webworks"
    ]

    for field in critical_fields:
        assert field in txt, f"'{field}' fehlt in identity.txt"

    print("✅ identity-schema.json ↔ identity.txt synchron")

if __name__ == '__main__':
    validate_services()
    validate_identity()
```

**Pflichtfelder, die synchron bleiben müssen**

| Datensatz | JSON-Quelle | Erwartung im Plain-Text |
|-----------|-------------|-------------------------|
| Services  | `itemListElement[].name` | exakte Service-Namen in `ai/services.txt` |
| Services  | `additionalProperty[].value (Dauer)` | Dauer-Angabe in `ai/services.txt` |
| Services  | `offers.priceSpecification.price` | Preis-Text (z. B. „auf Anfrage“) |
| Identity  | `name`, `jobTitle`, `email`, `worksFor.name` | Entsprechende Textzeilen in `ai/identity.txt` |

---

## ✅ Konsistenz-Checklist

Das Validierungsscript liegt in `tools/validate-ssot.py`. Vor jedem Commit/Push:

### Vor jedem Commit prüfen:

- [ ] **manifest.json** enthält alle Endpoints
- [ ] **services.json** ↔ **services.txt** identisch (Preise, Namen, Dauer)
- [ ] **identity-schema.json** ↔ **identity.txt** identisch (Name, Email, Ort)
- [ ] **faq-schema.json** ↔ HTML-Accordion identisch (Fragen, Antworten)
- [ ] Keine Encoding-Fehler in `.txt` (UTF-8)
- [ ] Keine Tippfehler-Abweichungen

### Automatisierte Validierung (empfohlen):

```bash
# Lokaler Test vor Commit
python tools/validate-ssot.py

# Output bei Erfolg:
# ✅ services.json ↔ services.txt synchron
# ✅ identity-schema.json ↔ identity.txt synchron

# Output bei Fehler:
# ❌ Preis 2400 fehlt in services.txt
# ❌ SSOT-Inkonsistenz erkannt!
```

---

## 🧪 Warum Redundanz erlaubt (sogar erwünscht) ist

**Klassisches Webdesign:** "DRY" (Don't Repeat Yourself)
**AI-native Web:** "Redundant but Consistent"

**Begründung:**

1. **Verschiedene Parser, verschiedene Fähigkeiten:**
   - LLMs lesen HTML
   - Screenreader lesen `.txt`
   - Developer-Tools lesen JSON
   - Jeder Layer muss **eigenständig funktionieren**

2. **Fehlertoleranz:**
   - Wenn JSON-Parsing fehlschlägt, bleibt `.txt` verfügbar
   - Wenn HTML-Parser Probleme hat, bleibt JSON-LD verfügbar

3. **Validation durch Kreuzvergleich:**
   - LLMs **prüfen** Informationen gegen mehrere Quellen
   - Konsistente Redundanz = **Vertrauenssignal**
   - Inkonsistente Redundanz = **Misstrauenssignal**

**Regel:**
> Redundanz ist kein Fehler, sondern **Architektur** — solange sie konsistent ist.

---

## 📊 SSOT-Mapping

### Zentrale Wahrheitsquellen

| Datentyp | SSOT | Mirrors | Sync-Methode |
|----------|------|---------|--------------|
| **Services** | `ai/services.json` | `ai/services.txt` | Manuell / GitHub Action |
| **Identity** | `ai/identity-schema.json` | `ai/identity.txt` | Manuell / GitHub Action |
| **FAQ** | HTML `<details>` Accordion | `ai/faq-schema.json` | Manuell |
| **Preise** | HTML `<dl>` + JSON-LD | `ai/services.json` | Manuell |
| **Kontakt** | HTML Footer | JSON-LD Person | Manuell |

**Wichtig:**
- HTML ist **immer primär** (für Menschen)
- JSON-LD ist **immer validierend** (für Maschinen)
- `.txt` ist **immer Fallback** (für einfache Parser)

---

## 🔗 Weiterführende Dokumentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Drei-Layer-Architektur
- **[MEASUREMENT.md](MEASUREMENT.md)** — Semantic Survival Rate (Konsistenz-Test)
- **[FETCH-TEMPLATES.md](FETCH-TEMPLATES.md)** — Endpoint-Discovery für Entwickler

---

## 📝 Changelog

**v1.3 (2025-11-15)**
- Initiale Dokumentation der SSOT-Pipeline
- Validator-Script-Vorlage
- GitHub Action Vorschlag
- Konsistenz-Checklist

---

**Kontakt:**
Jan-Erik Andersen
mail@andersen-webworks.de
https://jan-erik-andersen.de
