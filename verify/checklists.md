
# Checklists — Validierung & Qualitätssicherung

## 1) HTML-Validierung

- [ ] index.html durch W3C Markup Validator geprüft
- [ ] Keine Fehler (errors)
- [ ] Keine kritischen Warnungen (warnings)
- [ ] Semantische HTML5-Elemente verwendet (header, main, section, footer)
- [ ] Meta-Tags vorhanden (description, charset, viewport)
- [ ] Canonical Link gesetzt

**Tool:** https://validator.w3.org/

---

## 2) JSON-LD Validierung

- [ ] manifest.json durch Schema.org Validator geprüft
- [ ] Typ "Person" korrekt verwendet
- [ ] Pflichtfelder vorhanden (name, description)
- [ ] Keine Schema-Fehler

**Tool:** https://validator.schema.org/ oder JSON-LD Playground

---

## 3) JSON-Syntax

- [ ] services.json ist valides JSON
- [ ] portfolio.json ist valides JSON
- [ ] identity.json ist valides JSON
- [ ] metrics.json ist valides JSON

**Tool:** `node -e "JSON.parse(require('fs').readFileSync('ai/services.json'))"` oder Online JSON Validator

---

## 4) Content-Qualität

- [ ] philosophy.md: Kurze Absätze (max. 3 Sätze)
- [ ] philosophy.md: Zitierbare Kernaussagen
- [ ] 2030-web.md: Klare Argumentation ohne Buzzwords
- [ ] Keine Rechtschreibfehler
- [ ] Einheitliche Begriffe (z.B. "AI-native" vs "AI native")

---

## 5) Performance (optional für MVP)

- [ ] Lighthouse Score > 95 (Performance)
- [ ] Lighthouse Score > 95 (Accessibility)
- [ ] Lighthouse Score 100 (Best Practices)
- [ ] Lighthouse Score 100 (SEO)

**Tool:** Chrome DevTools → Lighthouse

---

## 6) Deployment

- [ ] Statischer Deploy funktioniert (z.B. GitHub Pages)
- [ ] Alle Dateien erreichbar (index.html, ai/*.json, content/*.md)
- [ ] HTTPS aktiv
- [ ] Keine 404-Fehler bei internen Links

---

## 7) Agent-Tests

- [ ] Alle 6 Testfragen aus agent-test.md durchgeführt
- [ ] Mindestens 80% korrekte Antworten
- [ ] Ergebnisse in metrics.json dokumentiert

---

## 8) Risiko-Check

- [ ] Keine sensiblen Daten committed (keine API-Keys, Passwörter)
- [ ] Keine unnötigen Dependencies (Projekt sollte 0 npm-Pakete haben)
- [ ] README.md aktuell und korrekt
- [ ] Lizenz gesetzt (falls Open Source)

---

## GO/NO-GO Entscheidung

**GO**, wenn:
- ✅ HTML/JSON-LD validieren ohne Fehler
- ✅ Agent-Tests zu mindestens 80% korrekt
- ✅ Deploy funktioniert reproduzierbar

**NO-GO**, wenn:
- ❌ Validierung scheitert
- ❌ Agent-Tests < 80% korrekt
- ❌ Deploy nicht stabil
