# JEA Website Umbau – Session-Handoff + Strategie

> Stand: 04.05.2026 | Vorherige Session: 3c0213ca (abgebrochen bei Write-Permission-Timeout)

---

## Strategische Marketing-Ausrichtung

### Akquise-Kanal-Entscheidung

**Gewählt: SEO + KI-Sichtbarkeit als kombinierter Sog-Motor.**
Sekundär: Empfehlungs-Bestätiger (passiv – Bestandskunden empfehlen, Interessenten verifizieren auf der Site).

**Ausgeschlossen:** LinkedIn, Social Media, Kaltakquise. Erik ist kein aktiver Social-Media-Nutzer, LinkedIn ist überfüllt, Kaltakquise verboten.

### Positionierung

**Drei Themen-Spitzen (Magnete für SEO/GEO):**
1. **KI-Sichtbarkeit / GEO** – eigenes Feld, Eat-your-own-dog-food (Site als Eigenbeispiel), niedrige Konkurrenz
2. **BFSG-Compliance** – regulatorischer Druck seit Juni 2025, klarer Suchanlass, niedrige Konkurrenz
3. **Shops & Custom-Lösungen** – WooCommerce B2B, technisches Profil, klare Käufer-Intention

**Spitze ist Magnet, nicht Käfig:** Erik macht weiterhin alles (Webdesign, Frontend, PM), aber gefunden wird er über die drei Spitzen.

### Geschäftsmodell-Entscheidung

**Ziel: Retainer-Anteil ausbauen.** Projektarbeit ist instabil, Retainer ist entspannt. Haushalt braucht nicht viel – durchlaufende Retainer decken Fixkosten, Projekte werden Bonus.

**Retainer-Pakete (neu):**
| Paket | Preis/Monat | Stunden | Geeignet für |
|---|---|---|---|
| Basis | 200 EUR | 2,5 h | Einfache Website, Pflege, kleine Anpassungen |
| Standard | 400 EUR | 5 h | Mittlere Website, regelmäßige Erweiterungen, SEO-Pflege |
| Shop | 800 EUR | 10 h | Online-Shop oder Custom-Lösung, technische Weiterentwicklung |

Zielmarke: 5 Kunden x 400 EUR = 2.000 EUR/Monat recurring in 12 Monaten.

Mini-Retainer (15-80 EUR) laufen im Bestand weiter, werden aber nicht aktiv vermarktet.

### Tonalitäts-Regeln (Verbotsliste)

- Kein Agentur-Bashing (keine Comparison-Sections, keine roten X, keine "typische Agentur")
- Keine "Sie sparen X %"-Sprache (Discounter-Vibe, zieht Preis-Käufer an)
- Keine Verfügbarkeits-Badges ("Aktuell verfügbar" wirkt unter Niveau)
- Keine Arzt/Pflege-Metaphern (Hausarzt, Betreuer, Pflege)
- Keine Verteidigungen gegen Einwände, die keiner gestellt hat
- Keine Trust-Logos als Text-Pillen (echte SVGs oder weglassen)
- Kein "Kunden seit 2018" (Datenbasis hält nicht stand)
- Stating, nicht Pitching. Expertise zeigen, nicht bewerben.

### Funnel-Architektur

Der Funnel ist ein echtes Beratungstool (50+ Knoten), kein stumpfer Quiz-Funnel. Er empfiehlt auch gegen den eigenen Verkauf ("Standard ist Shopify oft besser").

**Technische Lösung:**
- Desktop: Modal via JS (800ms Delay nach Pageload), localStorage Dismiss-Memory
- Mobile: Block im Flow (kein Modal – Google Interstitial-Penalty vermeiden)
- `funnel-active` Klasse wird NUR per JS gesetzt, nie statisch im HTML
- Bots ohne JS sehen den vollen statischen Content (H1, Lead, alles)

### Roundtable-Erkenntnisse (übernommen vs. verworfen)

**Übernommen:**
- Verbotsliste Tonalität
- "Was ich löse"-Pattern (Problem → Lösung → Ergebnis) statt Feature-Listen
- Differenzierte CTAs je Seitenkontext
- FAQ-Ausbau für KI-Zitierbarkeit
- Kontaktseite-Ausbau (FAQ + Prozess + Preistransparenz)
- Mini-Stories für Projekte

**Verworfen:**
- "Web-Betreuer" als Selbstbezeichnung (kein Suchbegriff, semantisch schwach)
- Hausarzt-Analogie (Erik-Veto + semantisches Risiko)
- Retainer-Pyramide 15-40 / 80-200 / 400-800 (passt nicht zur Realität)
- "Kunden seit 2018" als zentrales Trust-Signal (zu viel Fluktuation)
- Funnel als Above-Fold-Hero ohne statische Schicht (SEO-Risiko)
- "73 % der B2B-Einkäufer recherchieren mit KI" (Quelle ungeprüft)

---

## Seitenkarte (Zielzustand)

| Pfad | Zweck | Status |
|---|---|---|
| `/` | Akquise-Magnet, Funnel, Themen-Verteiler | teilweise umgesetzt |
| `/leistungen/` | Pillar-Page (3 Themen oben + 4 weitere unten) | umgebaut |
| `/leistungen/ki-sichtbarkeit/` | Themen-Spitze 1 (NEU) | FEHLT |
| `/leistungen/bfsg-barrierefreiheit/` | Themen-Spitze 2 (NEU) | FEHLT |
| `/leistungen/shops-und-custom/` | Themen-Spitze 3 (NEU) | FEHLT |
| `/preise/` | Projekt-Pakete + Retainer-Pakete | noch nicht überarbeitet |
| `/projekte/` | 6-10 echte Cases mit Ergebnis-Zahl | noch nicht überarbeitet |
| `/ueber/` | Werdegang, Person | Remote-Block raus (erledigt) |
| `/faq/` | 15-20 Fragen für KI-Zitierbarkeit | noch nicht ausgebaut |
| `/kontakt/` | Drei Wege (Mail / Anruf / Funnel-Selbstauskunft) | noch nicht überarbeitet |

## Home-Sektionen (Zielzustand)

1. **Hero** – H1 + Lead (ohne Badge, ohne Trust-Pillen) ✅
2. **Funnel** – JS-Modal Desktop / Block Mobile ✅
3. **Drei Themen-Anker** – KI / BFSG / Shops als Cards ✅
4. **Stimmen** – Testimonials mit Schema.org Review-Markup ✅
5. **Kunden** – alle ~20 Logos mit Links zu Live-Sites ❌ FEHLT
6. **So arbeite ich** – 4 Schritte (Bashing aus Schritt 3 raus) ❌ TODO
7. **Pricing-Teaser** – Projekt + Retainer, Link zu /preise ❌ TODO
8. **FAQ-Top-7** – mit FAQPage-Schema ❌ TODO
9. **Kontakt** – drei Wege ❌ TODO

---

## Umsetzungs-Stand (04.05.2026, uncommitted)

### Erledigt (in Working Tree)

**index.html:**
- H1: "Damit Ihre Website auch gefunden wird, wenn keiner mehr googelt."
- Lead: KI + BFSG + direkter Kontakt
- `<title>` + og-Tags angepasst
- Verfügbarkeits-Badge raus
- Stats "80 EUR statt 150 EUR" → "20+ Live-Websites"
- Trust-Section (Text-Pillen) komplett raus
- `class="funnel-active"` aus `<html>` entfernt
- Funnel von vor Hero nach nach Hero verschoben
- 5 alte Service-Items → 3 Themen-Anker (KI / BFSG / Shops) mit Beleg-Boxen
- Testimonials nach oben verschoben + Schema.org Review-Markup
- Comparison-Section (#warum) komplett raus
- Remote-Defensiv-Section (#remote) komplett raus
- Tote Anker gefixt (3 Stellen)

**funnel.js:**
- Mobile-Detection (≤768px) → `funnel-inline`, kein Modal
- Desktop: 800ms Delay vor Modal

**style.css:**
- Funnel Desktop/Mobile Unterscheidung
- `.service-cta-row` + `.btn-text` Styles
- Testimonial-Styles

**leistungen/index.html:**
- Hero aktualisiert
- Neue Themen-Sektion oben (KI / BFSG / Shops → Links zu Landingpages)
- Alte Items darunter als "Weitere Leistungen" (Online-Shops raus, Doppelung)

### Offen (nächste Schritte, priorisiert)

**Priorität 1 – Tote Links fixen:**
1. `/leistungen/ki-sichtbarkeit/index.html` anlegen
2. `/leistungen/bfsg-barrierefreiheit/index.html` anlegen
3. `/leistungen/shops-und-custom/index.html` anlegen

**Priorität 2 – Home weiter:**
4. Kunden-Sektion (alle Logos, schwarze SVGs, Links zu Live-Sites)
5. Prozess-Sektion entschärfen (Bashing raus)
6. Pricing-Teaser mit Retainer-Verweis

**Priorität 3 – Subpages:**
7. `/preise/` – Sparen-Prozente raus, Retainer-Tabelle rein
8. `/faq/` – auf 15-20 Fragen ausbauen
9. `/projekte/` – 6-10 Cases mit Ergebnis-Zahlen

**Priorität 4 – Technik:**
10. `aggregateRating` mit 2 Reviews raus
11. `llms.txt` im Root
12. Sitemap.xml + robots.txt (3 neue URLs, Crawler-Allow)
13. Footer-Bug fixen (kaputte Impressum/Datenschutz-Links auf `/de/`)

**Priorität 5 – Aufräumen:**
14. `v1/`, `redesign/`, Test-Files → `archiv/`

---

## Arbeitsanweisungen für Folge-Session

- Erik hat gesagt: "mach weiter, ich vertrau dir" – Umsetzung mit Verifikation, keine Detaildiskussion
- Vor jeder Behauptung "existiert/funktioniert": VERIFIZIEREN via Tool
- Themen-Landingpages: Template aus existierenden Pages ableiten (gleicher Header/Footer/Nav)
- Jede Page braucht: H1, Substanz-Text (Problem → Lösung → Beleg), Service-Schema, CTA
- Schwarze SVGs liegen in `logos/` – alle verwenden
- Footer-Bug (kaputte `/de/`-Links): bewusst belassen, konsistent in neuen Pages, Fix als eigener Task
- Kein em-dash (—), immer Halbgeviertstrich (–) mit Leerzeichen
- Nach substantiellen Änderungen: Commit + Push anbieten
