# GitHub Pages Setup

**Repository:** https://github.com/AndersenWebworks/jan-erik-andersen.de

---

## Schritt 1: GitHub Pages aktivieren

1. Gehe zu: https://github.com/AndersenWebworks/jan-erik-andersen.de/settings/pages

2. **Source:**
   - Branch: `main`
   - Folder: `/ (root)`

3. Klicke **Save**

4. **Warte 1-2 Minuten**

5. **URL:** https://andersenwebworks.github.io/jan-erik-andersen.de/

---

## Schritt 2: Custom Domain einrichten

### 2.1 In GitHub

1. Bleibe auf: https://github.com/AndersenWebworks/jan-erik-andersen.de/settings/pages

2. **Custom domain:**
   - Eingabe: `jan-erik-andersen.de`
   - Klicke **Save**

3. **Enforce HTTPS:** ✅ Aktivieren (nach DNS-Propagation)

### 2.2 DNS-Einträge (bei KAS/All-Inkl)

**Option A: CNAME (empfohlen)**

Login: https://kasapi.kasserver.com/

Navigation: Domains → DNS-Einstellungen → jan-erik-andersen.de

**Einträge:**

| Typ | Name | Ziel | TTL |
|-----|------|------|-----|
| CNAME | @ | andersenwebworks.github.io | 3600 |
| CNAME | www | andersenwebworks.github.io | 3600 |

**Wichtig:** Lösche vorher alte A-Records für @ und www.

**Option B: A-Records (falls CNAME nicht möglich)**

| Typ | Name | Ziel | TTL |
|-----|------|------|-----|
| A | @ | 185.199.108.153 | 3600 |
| A | @ | 185.199.109.153 | 3600 |
| A | @ | 185.199.110.153 | 3600 |
| A | @ | 185.199.111.153 | 3600 |
| CNAME | www | andersenwebworks.github.io | 3600 |

**GitHub Pages IPs:** (Stand 2025, prüfe: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain)

### 2.3 DNS-Propagation warten

**Zeit:** 5 Minuten - 24 Stunden (meist <1 Stunde)

**Prüfen:**
```bash
# Windows
nslookup jan-erik-andersen.de

# Erwartung:
# Non-authoritative answer:
# Name:    andersenwebworks.github.io
# Addresses: 185.199.108.153, ...
```

**Online-Check:** https://www.whatsmydns.net/#CNAME/jan-erik-andersen.de

---

## Schritt 3: HTTPS aktivieren

1. Warte bis DNS propagiert ist (Schritt 2.3)

2. Gehe zurück zu: https://github.com/AndersenWebworks/jan-erik-andersen.de/settings/pages

3. **Enforce HTTPS:** ✅ Aktivieren

4. **Warte 1-2 Minuten** (GitHub generiert Let's Encrypt Zertifikat)

5. **Teste:** https://jan-erik-andersen.de

**Erwartung:** Website lädt mit grünem Schloss (HTTPS)

---

## Schritt 4: Testen

### 4.1 HTML-Seiten

```bash
curl -I https://jan-erik-andersen.de/
# Erwartung: HTTP 200 OK
```

Browser: https://jan-erik-andersen.de

### 4.2 JSON-Dateien

```bash
curl https://jan-erik-andersen.de/ai/health.json
# Erwartung: HTTP 200 OK + JSON
```

**Wichtig:** Teste auch mit ChatGPT!

### 4.3 AI-Agent Test

**ChatGPT:**
```
"Lies https://jan-erik-andersen.de/ai/health.json und zeige mir den Inhalt"
```

**Erwartung:** JSON wird angezeigt, kein 400-Fehler

### 4.4 Alle Endpoints

```bash
# Test-Skript
urls=(
  "https://jan-erik-andersen.de/"
  "https://jan-erik-andersen.de/ai/manifest.jsonld"
  "https://jan-erik-andersen.de/ai/services.json"
  "https://jan-erik-andersen.de/ai/health.json"
  "https://jan-erik-andersen.de/blog/feed.json"
  "https://jan-erik-andersen.de/faq.json"
)

for url in "${urls[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  echo "$url → $status"
done
```

**Erwartung:** Alle URLs → 200 OK

---

## Schritt 5: Google Search Console aktualisieren

1. Gehe zu: https://search.google.com/search-console

2. **Property:** jan-erik-andersen.de

3. **URL Inspection:** Teste einige URLs neu

4. **Request Indexing:** Wichtige Seiten neu crawlen lassen

**Wichtig:** Verifizierungs-Meta-Tag bleibt im HTML, funktioniert weiter.

---

## Schritt 6: Deployment-Workflow

### Änderungen deployen:

```bash
# 1. Dateien ändern
vim index.html

# 2. Commit
git add -A
git commit -m "Update content"

# 3. Push → automatisches Deployment
git push origin main

# 4. Warte 1-2 Minuten
# 5. Änderungen sind live
```

**Kein FTP mehr nötig!**

---

## Troubleshooting

### Problem: "404 - There isn't a GitHub Pages site here"

**Lösung:**
1. Prüfe GitHub Settings → Pages → Source = main branch
2. Warte 2-3 Minuten
3. Cache leeren (Ctrl+Shift+R)

### Problem: "DNS_PROBE_FINISHED_NXDOMAIN"

**Lösung:**
1. DNS noch nicht propagiert → warte
2. Prüfe DNS-Einträge (nslookup)
3. Prüfe CNAME → andersenwebworks.github.io (ohne https://)

### Problem: "Your connection is not private"

**Lösung:**
1. HTTPS noch nicht aktiviert → GitHub Settings → Enforce HTTPS
2. Warte 5 Minuten (Zertifikat-Generierung)
3. Cache leeren

### Problem: CSS/JS lädt nicht

**Lösung:**
1. Prüfe Pfade (relativ vs. absolut)
2. GitHub Pages root ist `/`, nicht `/jan-erik-andersen.de/`
3. Alle Links sollten relativ sein (`/ai/services.json`, nicht `/jan-erik-andersen.de/ai/services.json`)

---

## Vorteile gegenüber KAS

| Feature | KAS | GitHub Pages |
|---------|-----|--------------|
| Kosten | ~5€/Monat | ✅ Kostenlos |
| AI-Agent-Zugriff | ❌ Blockiert (ModSecurity) | ✅ Funktioniert |
| Deployment | ❌ FTP/Python-Skript | ✅ git push |
| HTTPS | ✅ Ja | ✅ Ja (automatisch) |
| CDN | ❌ Nein | ✅ Ja (weltweit) |
| Version Control | ❌ Nein | ✅ Git |
| Uptime | ~99% | ~99.9% |
| PHP | ✅ Ja | ❌ Nein (nicht nötig) |

---

## Nächste Schritte

1. ⏳ GitHub Pages aktivieren (Schritt 1)
2. ⏳ DNS ändern (Schritt 2)
3. ⏳ HTTPS aktivieren (Schritt 3)
4. ⏳ Testen (Schritt 4)
5. ⏳ ChatGPT testen (kein 400 mehr!)

**Zeitaufwand:** 15 Minuten + DNS-Propagation (1-24h)

---

## Status

**Aktuell:** KAS (mit ModSecurity-Problemen)
**Ziel:** GitHub Pages (AI-friendly)
**Migration:** ⏳ Pending

**Nach Migration:**
- ✅ ChatGPT funktioniert
- ✅ Alle AI-Agents funktionieren
- ✅ Kostenlos
- ✅ Schneller (CDN)
- ✅ Einfacheres Deployment
