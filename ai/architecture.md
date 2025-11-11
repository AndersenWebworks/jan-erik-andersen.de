# AI-Native Web Architecture

**Erkenntnisse und Architektur-Prinzipien — Stand November 2025**

Version: 1.0
Autor: Jan-Erik Andersen
Letztes Update: 2025-11-11

---

## 🧱 Technische Realität 2025

### Das Webfetch-Problem

**AI-Agenten haben strenge Zugriffsbeschränkungen:**
- ChatGPT, Claude, Perplexity & Co. arbeiten mit Whitelists
- Viele Custom Domains sind blockiert (inkl. `jan-erik-andersen.de`)
- Selbst `raw.githubusercontent.com` ist für einige Agents gesperrt
- Mirror-URLs und alternative Hosts lösen das Problem NICHT zuverlässig

**Konsequenz:**
Externe JSON-Endpoints werden von Live-Query-Agents fast nie direkt gefetcht, auch wenn sie korrekt verlinkt sind.

### Was funktioniert (garantiert)

**Sichtbarer HTML-Text ist das einzige universelle Medium:**
- Alles im DOM ist potenziell lesbar
- Keine JavaScript-Nachladungen erforderlich
- Semantische HTML-Strukturen werden erkannt
- Natürlichsprachlicher Text wird extrahiert

---

## 🧩 Drei-Layer-Architektur

### Layer 1: Visible Hybrid Layer (HTML)

**Zweck:** Gleichzeitig menschlich lesbar UND maschinell parsbar

**Implementierung:**
```html
<section id="services">
  <h2>Leistungen</h2>
  <ul>
    <li>
      <h3>AI Visibility Refactor</h3>
      <dl class="service-details">
        <dt>Dauer:</dt> <dd>2-4 Wochen</dd>
        <dt>Preis:</dt> <dd>2.400-12.000 EUR (Festpreis)</dd>
        <dt>Leistung:</dt> <dd>JSON-LD, Schema.org, semantisches HTML</dd>
      </dl>
    </li>
  </ul>
</section>
```

**Prinzipien:**
- Semantische Elemente: `<dl>`, `<section>`, `<article>`, `<nav>`
- Key-Value-Paare für strukturierte Daten
- Natürlichsprachliche Formulierungen (dialog-tauglich)
- FAQ-Format für direkte Antworten
- Keine versteckten Daten, keine Cloaking-Tricks

**Zielgruppe:**
- Menschen (visuelle Darstellung)
- AI-Agents (Live-Queries, Echtzeit-Fetches)

---

### Layer 2: Semantic Metadata Layer (JSON-LD)

**Zweck:** Strukturierte Metadaten für Crawler und Indexierung

**Implementierung:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Jan-Erik Andersen",
  "offers": [
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "AI Visibility Refactor",
        "priceSpecification": {
          "minPrice": 2400,
          "maxPrice": 12000,
          "priceCurrency": "EUR"
        }
      }
    }
  ]
}
</script>
```

**Prinzipien:**
- Schema.org Vokabular
- JSON-LD im `<head>` eingebettet
- Vollständige Entity-Beschreibungen
- Keine Redundanz mit Layer 1 (ergänzt, verdoppelt nicht)

**Zielgruppe:**
- AI-Crawler (GPTBot, Claude-Web, Bingbot)
- Knowledge Graphs
- AI-Training-Daten
- Suchmaschinen (Google, Bing)

---

### Layer 3: Optional Enhancement Layer (JSON-Endpoints)

**Zweck:** Zukunftssicherheit und erweiterte Integration

**Implementierung:**
```
/ai/manifest.json          → Zentraler Index
/ai/identity-schema.json   → Person (Schema.org) mit Offers
/ai/faq-schema.json        → FAQPage (Schema.org)
/ai/services.json          → Detaillierte Service-Beschreibungen
/ai/agent-instructions.json → Presentation Guidelines (experimentell)
```

**Prinzipien:**
- Mirror-URLs zu GitHub Raw für bessere Erreichbarkeit
- Meta-Tags und Link-Tags für Discovery
- Robots.txt Extensions (experimentell)
- Versionierung und Timestamps

**Zielgruppe:**
- Fortgeschrittene AI-Integration
- Custom Agents mit Whitelist-Zugriff
- Zukünftige Standards
- Developer-Tools

**Status:** Experimentell, nicht für Production kritisch

---

## 🧭 Service-Positionierung

### Was funktioniert NICHT

❌ **"Zwei-Layer-Ansatz" (Human vs. LLM getrennt)**
→ LLMs rufen separate JSON-Layer nicht zuverlässig ab

❌ **User-Agent-basiertes Content Switching**
→ Gilt als Cloaking, SEO-Risiko, ethisch problematisch

❌ **Agent Instructions in separaten Dateien**
→ Werden bei Live-Queries nicht gelesen

❌ **Versteckte "LLM-only" Daten**
→ Funktioniert nur für Crawler, nicht für Live-Queries

### Was funktioniert (heute)

✅ **Hybrid Layer:** Eine Seite für Menschen UND Maschinen
✅ **Strukturierter Text:** `<dl>`, `<section>`, semantisches HTML
✅ **Natürlichsprachliche Formulierungen:** Dialog-tauglich, keine Keyword-Stuffing
✅ **JSON-LD im `<head>`:** Für Crawler-Indexierung
✅ **FAQ-Format:** Direkt extrahierbare Antworten

---

## 🧠 Strategische Implikation: "Google Zero"

### Paradigmenwechsel

**Von Clicks zu Citations:**
- Websites werden weniger besucht, mehr zitiert
- AI-Agents beantworten Fragen direkt (Zero-Click)
- Sichtbarer Content = neues API-Interface
- Traffic sinkt, Bedeutung steigt

### Agent Interaction Optimization (AIO)

**Neue Erfolgsmessung:**
- Wird deine Seite von AI-Agents korrekt referenziert?
- Werden deine Services mit Preisen genannt?
- Sind Kontaktdaten extrahierbar?
- Funktioniert die Tonalität im Dialog?

**NICHT mehr:**
- Ranking-Position in Suchergebnissen
- Click-Through-Rate
- Time-on-Site

---

## 🧬 Zukunftsmodell: AI-Native Web 2030

### Transparente Deklaration

```html
<header>
  <h1>Unternehmensname</h1>
  <nav aria-label="Perspektiven">
    <a href="/">Für Menschen</a>
    <a href="/ai/manifest.json">Für Maschinen</a>
  </nav>
</header>
```

**Prinzip:** Keine Cloaking-Tricks, sondern deklarierte Perspektiven

### Dreischichtige Struktur

1. **Visible Layer (HTML):** menschlich & maschinell lesbar, dialogfähig
2. **Semantic Layer (JSON-LD):** maschinenfreundliche Klassifikation
3. **Visual Layer (CSS/Design):** ästhetische Übersetzung

Startseiten = Agent-Entry-Points mit transparenter Wahl.

---

## 📋 Implementierungs-Checklist

### Basis (erforderlich)

- [ ] Semantisches HTML (`<dl>`, `<section>`, `<article>`)
- [ ] Strukturierte Key-Value-Paare für Services/Preise/Kontakt
- [ ] Natürlichsprachliche Formulierungen (keine Keywords)
- [ ] FAQ im HTML (direkt extrahierbar)
- [ ] JSON-LD im `<head>` (Person, Organization, FAQPage)

### Erweitert (empfohlen)

- [ ] Schema.org Offers mit Preisen
- [ ] Kontakt mit Erreichbarkeit und Response-Zeit
- [ ] Mirror-URLs für JSON-Endpoints
- [ ] Meta-Tags für AI-Discovery
- [ ] Robots.txt mit AI-Manifest-Hinweisen

### Optional (experimentell)

- [ ] `/ai/manifest.json` mit Endpoint-Index
- [ ] Agent Instructions (JSON)
- [ ] `.well-known/ai-manifest.json` (zukünftige Standards)
- [ ] TXT-Mirrors für einfache Parser

---

## 🎯 Service-Versprechen (ehrlich)

> **"Ich mache Websites AI-freundlich, indem ich Inhalte so strukturiere, dass LLMs sie direkt aus dem sichtbaren HTML verstehen – ohne separate JSON-Fetches zu benötigen."**

### Deliverables

1. **Semantisches HTML** (Services, Preise, FAQ, Kontakt)
2. **Natürlichsprachliche Formulierungen** (dialog-tauglich)
3. **JSON-LD im `<head>`** (Crawler-Indexierung, Knowledge Graphs)
4. **Optional: JSON-Endpoints** (für zukünftige Standards und erweiterte Integration)

### Differenzierung zu klassischem SEO

**SEO:** Keyword-Optimierung für Suchergebnisse
**AIO:** Dialog-Optimierung für AI-Antworten

**Technisch fast identisch, aber:**
- Fokus auf natürliche Sprache statt Keywords
- FAQ als Antwortvorlage statt Featured Snippet
- Strukturierte Daten für Dialoge statt Rankings

---

## 📚 Weiterführende Ressourcen

- [Schema.org](https://schema.org/) – Strukturierte Daten Vokabular
- [JSON-LD Specification](https://json-ld.org/) – Linked Data Format
- [Google Rich Results](https://developers.google.com/search/docs/appearance/structured-data) – Strukturierte Daten für Suchmaschinen
- [OpenAI GPTBot](https://platform.openai.com/docs/gptbot) – Crawler Documentation
- [Anthropic Claude-Web](https://support.anthropic.com/en/articles/8896518) – Web Fetch Documentation

---

## 📝 Changelog

**v1.0 (2025-11-11)**
- Initiale Dokumentation
- Drei-Layer-Architektur definiert
- Webfetch-Problematik dokumentiert
- Service-Positionierung geklärt

---

**Kontakt:**
Jan-Erik Andersen
mail@andersen-webworks.de
https://jan-erik-andersen.de