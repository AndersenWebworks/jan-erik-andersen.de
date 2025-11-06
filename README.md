
# andersen-signal v0.1 — AI-native Web Architecture MVP

**Status:** ✅ Live auf GitHub Pages
**URL:** https://jan-erik-andersen.de
**Deployed:** 7. November 2025

---

## Ziel

**Nachweisen**, dass eine semantisch saubere, strukturierte Website von AI-Agenten
leichter und **korrekter** verstanden werden kann als traditionelle Websites.

**Ergebnis:** ✅ Beweis erbracht
→ Siehe [LEARNINGS.md](LEARNINGS.md) für Details

---

## 1) Projektstruktur (v0.1)

```
andersen-signal/
├─ index.html                 # Human Fallback UI (plain HTML)
├─ ai/
│  ├─ manifest.jsonld         # Identität (Person/Organisation), Verweise
│  ├─ services.json           # Leistungen in maschinenlesbarer Form
│  ├─ portfolio.json          # Referenzen (neutral, prüfbar beschrieben)
│  └─ identity.json           # Tonalität, Schlüsselbegriffe (optional)
├─ content/
│  ├─ philosophy.md           # kurze Haltung, zitierbar
│  └─ 2030-web.md             # Einordnung: „Web als Dateninterface“
├─ verify/
│  ├─ agent-test.md           # Testprompts & Erwartungshaltung
│  ├─ checklists.md           # Validierungs-Checklisten
│  └─ metrics.json            # Protokoll der eigenen Tests
└─ README.md
```

---

## 2) Was der MVP **beweist** (klar und überprüfbar)

1. **Maschinenlesbarkeit:** JSON‑LD und HTML validieren ohne Fehler.
2. **Antwortklarheit:** Bei einfachen Fragen (z. B. „Wer ist Jan‑Erik Andersen? Welche Leistungen?“)
   geben KI‑Modelle die Inhalte **konsistent** wieder, wenn man nur die Domain nennt.
3. **Wartbarkeit:** Statischer Deploy (z. B. GitHub Pages) ohne Frameworks oder Build‑Schritte.

Hinweis: Öffentliche „Zitationen“ durch einzelne Chatbots sind **nicht garantiert** und hängen von deren
eigenen Indizes ab. Für den MVP reicht, dass Modelle Inhalte **aus den bereitgestellten Dateien**
korrekt rekonstruieren, wenn man sie darauf hinweist.

---

## 3) Tests & Checks

### A) Validierung
- **HTML:** W3C Markup Validator
- **JSON‑LD:** Schema‑Validator (z. B. „Structured Data Testing Tool“ Alternativen)
- **Performance:** Lighthouse lokal (ziel: sehr hoch, da kein JS/Bilder)

Ergebnis in `verify/metrics.json` notieren.

### B) Verständnisfragen (manuell)
Beispielfragen für ein KI‑Modell (ohne führende Suggestionen außer Domain‑Kontext):
- „Fasse die Leistungen von Jan‑Erik Andersen knapp zusammen.“
- „Nenne die angebotenen Services so, wie sie in `services.json` heißen.“
- „Zitiere einen Satz aus `content/philosophy.md` und erkläre kurz die Bedeutung.“

Notiere für jede Frage: **korrekt / unklar / falsch** in `metrics.json`.

---

## 4) Hosting & Deployment

**Aktuell:** GitHub Pages (migration von KAS/All-Inkl)

**Warum GitHub Pages:**
- ✅ Kostenlos
- ✅ Keine ModSecurity-Blockierung (AI-Agents funktionieren)
- ✅ Globales CDN
- ✅ HTTPS automatisch
- ✅ git push = Deployment

**Setup-Anleitung:** [GITHUB-PAGES-SETUP.md](GITHUB-PAGES-SETUP.md)

---

## 5) Test-Ergebnisse

**Status:** ✅ Alle Tests bestanden

- ✅ **HTML/JSON-LD:** Validiert
- ✅ **AI-Agent-Test:** 6/6 Fragen korrekt beantwortet
- ✅ **ChatGPT:** Funktioniert via GitHub Raw URLs
- ✅ **Alle Endpoints:** HTTP 200 OK
- ⏳ **Google Rich Results:** Pending (Indexierung läuft)

**Details:** [verify/README.md](verify/README.md)

---

## 6) Wichtigste Learnings

1. **Traditional Hosting blockiert AI-Agents** (ModSecurity/WAF)
2. **JAMstack ist AI-friendly by default** (GitHub Pages, Netlify, Cloudflare)
3. **Domain-Trust braucht Zeit** (7-14 Tage für ChatGPT Custom Domain)
4. **GitHub Raw URLs funktionieren sofort** (Workaround für neue Domains)

**Vollständige Dokumentation:** [LEARNINGS.md](LEARNINGS.md)

---

## 7) Akzeptanzkriterien

**✅ GO** — Alle Kriterien erfüllt:
  - ✅ HTML/JSON-LD validieren
  - ✅ AI-Verständnisfragen korrekt beantwortet (6/6)
  - ✅ Deploy funktioniert (GitHub Pages live)

---

## 8) Projekt-Dateien

**Wichtige Dokumente:**
- [LEARNINGS.md](LEARNINGS.md) — Alle Erkenntnisse aus dem Projekt
- [GITHUB-PAGES-SETUP.md](GITHUB-PAGES-SETUP.md) — Hosting-Setup-Anleitung
- [verify/README.md](verify/README.md) — Test-Dokumentation

**Website-Dateien:**
- [index.html](index.html) — Homepage mit Person Schema
- [faq.html](faq.html) — FAQ mit FAQPage Schema
- [blog/](blog/) — Blog mit feed.json + BlogPosting Schema
- [ai/](ai/) — Strukturierte Daten (JSON-LD, JSON)
- [content/](content/) — Markdown-Inhalte

---

**Projekt abgeschlossen:** 7. November 2025
**Status:** ✅ MVP erfolgreich, live und dokumentiert

---

## 6) Risiken & Umgang

- **Modelle verstehen Inhalte nicht klar:** Texte kürzen, Begriffe vereinheitlichen, Dateinamen und Felder eindeutig halten.
- **Validierung schlägt fehl:** Schema prüfen, Minimalbeispiele testen, Schritt für Schritt erweitern.
- **Over‑Engineering:** MVP bewusst klein halten – Ziel ist **Beweis**, nicht Feature‑Vollständigkeit.
