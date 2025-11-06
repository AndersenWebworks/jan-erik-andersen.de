# ChatGPT HTTP 400 — Findings

**Datum:** 6. November 2025

---

## Problem

**ChatGPT meldet HTTP 400 für alle JSON/MD/PHP-Dateien:**
- `https://jan-erik-andersen.de/ai/services.json` → 400
- `https://jan-erik-andersen.de/ai/health.json` → 400
- `https://jan-erik-andersen.de/ai/echo.php` → 400

**Lokale Tests (curl) zeigen alle 200 OK.**

---

## Kritische Erkenntnis

**Echo.php bekommt auch 400** → Problem ist **VOR PHP**, auf **Webserver-Ebene**.

**Das bedeutet:**
- ❌ Nicht .htaccess (wird für echo.php nicht ausgewertet, da 400 vor PHP kommt)
- ❌ Nicht PHP (wird nie ausgeführt)
- ✅ **Apache mod_security** (wahrscheinlich)
- ✅ **Rate Limiting** (wahrscheinlich)
- ✅ **WAF (Web Application Firewall)** (wahrscheinlich)
- ✅ **KAS/All-Inkl Server-Konfiguration** (wahrscheinlich)

---

## Hypothesen

### Hypothese 1: mod_security blockiert ChatGPT

**Symptome:**
- ChatGPT's Fetcher wird als "Bot" erkannt
- mod_security blockiert Requests ohne "Browser-like" Header
- 400 statt 403 (mod_security gibt oft 400 bei unbekannten UAs)

**Test:**
Server-Log prüfen auf:
```
ModSecurity: Access denied with code 400
```

**Fix:**
mod_security-Regel whitelisten oder deaktivieren für `/ai/*`

### Hypothese 2: Rate Limiting

**Symptome:**
- ChatGPT macht viele Requests in kurzer Zeit
- Server blockiert nach X Requests pro Minute
- 400 (Too Many Requests sollte 429 sein, aber manche Server geben 400)

**Test:**
- Warte 5 Minuten
- Teste erneut
- Falls dann 200 → Rate Limiting

**Fix:**
Rate Limit für `/ai/*` erhöhen oder deaktivieren

### Hypothese 3: Missing/Invalid Host Header

**Symptome:**
- ChatGPT sendet keinen Host-Header (HTTP/2 verwendet :authority)
- Apache erwartet Host-Header bei HTTP/1.1
- 400 Bad Request

**Test:**
Server-Log zeigt: "Host header missing"

**Fix:**
Apache HTTP/2-Konfiguration prüfen

### Hypothese 4: Content Negotiation Failure

**Symptome:**
- ChatGPT sendet Accept-Header, der nicht matched
- Apache's mod_negotiation gibt 400 bei Mismatch
- Aber: echo.php sollte immer funktionieren (keine Negotiation)

**Wahrscheinlichkeit:** Niedrig (echo.php bekommt auch 400)

---

## Was funktioniert (curl-Tests)

**Alle diese Tests geben 200 OK:**

```bash
# Default curl
curl -I https://jan-erik-andersen.de/ai/health.json
# Result: 200 OK

# GPTBot User-Agent
curl -I https://jan-erik-andersen.de/ai/health.json \
  -H "User-Agent: Mozilla/5.0 (compatible; GPTBot/1.0)"
# Result: 200 OK

# Python requests
curl -I https://jan-erik-andersen.de/ai/health.json \
  -H "User-Agent: python-requests/2.31.0"
# Result: 200 OK

# Empty User-Agent
curl -I https://jan-erik-andersen.de/ai/health.json -H "User-Agent:"
# Result: 200 OK

# Different Accept headers
curl -I https://jan-erik-andersen.de/ai/health.json -H "Accept: text/html"
# Result: 200 OK

curl -I https://jan-erik-andersen.de/ai/health.json -H "Accept: application/xml"
# Result: 200 OK
```

**Einziger Fehler:**
```bash
# Wrong Host header
curl -I https://jan-erik-andersen.de/ai/health.json -H "Host: example.com"
# Result: 421 Misdirected Request (nicht 400!)
```

---

## Was ChatGPT sieht

**Alle URLs geben 400:**
- `https://jan-erik-andersen.de/ai/health.json` → 400
- `https://jan-erik-andersen.de/ai/echo.php` → 400
- `https://www.jan-erik-andersen.de/ai/echo.php` → 400 (mit www)
- `http://jan-erik-andersen.de/ai/echo.php` → 400 (HTTP)

**Wichtig:** Auch echo.php (PHP-Skript, das IMMER 200 geben sollte) gibt 400.

---

## Nächste Schritte

### 1. Server-Logs prüfen (KAS/All-Inkl)

**Login:** https://kasapi.kasserver.com/

**Navigation:** Domains → jan-erik-andersen.de → Logs

**Suche nach:**
```
400
ModSecurity
Access denied
Rate limit
```

**Zeitfenster:**
6. November 2025, 23:00-23:30 UTC

### 2. mod_security temporär deaktivieren

**Falls möglich in KAS-Admin-Panel:**
- Domains → jan-erik-andersen.de → Security
- mod_security deaktivieren (temporär, für Test)
- ChatGPT erneut testen
- Falls 200 → mod_security ist das Problem

### 3. Rate Limit prüfen

**Falls KAS Rate Limiting zeigt:**
- Erhöhe Limit für `/ai/*`
- Oder: Whitelist ChatGPT's IPs

### 4. .htaccess Debug-Rule hinzufügen

**Temporär für echo.php:**

```apache
# Debug: Allow ALL requests to echo.php (bypass mod_security)
<Files "echo.php">
    SecRuleEngine Off
    Require all granted
</Files>
```

**Deploy, teste, entferne wieder.**

---

## Workaround für User

**Falls ChatGPT weiterhin blockiert bleibt:**

**Alternative 1: Direkter Browser-Test**
- Öffne https://jan-erik-andersen.de/ai/health.json im Browser
- Sollte JSON zeigen
- Screenshot an ChatGPT senden

**Alternative 2: curl-Output kopieren**
```bash
curl https://jan-erik-andersen.de/ai/health.json
```
- Output kopieren
- An ChatGPT senden
- ChatGPT kann JSON parsen

**Alternative 3: WebPageTest**
- https://www.webpagetest.org/
- URL: `https://jan-erik-andersen.de/ai/health.json`
- Screenshot zeigt JSON

---

## Dokumentation für Support

**Falls KAS/All-Inkl Support kontaktiert werden muss:**

**Subject:** HTTP 400 für JSON-Dateien bei bestimmten User-Agents

**Body:**
```
Hallo,

ich betreibe die Website jan-erik-andersen.de auf Ihrem Server.

Problem: Bestimmte User-Agents (z.B. ChatGPT's Fetcher) bekommen
HTTP 400 für alle JSON/PHP-Dateien unter /ai/*.

- curl-Tests funktionieren: 200 OK
- ChatGPT-Tests scheitern: 400 Bad Request
- Auch /ai/echo.php (PHP-Skript) gibt 400 → Problem vor PHP

Vermutung: mod_security oder Rate Limiting blockiert bestimmte User-Agents.

Bitte prüfen Sie:
1. Gibt es mod_security-Regeln, die diese Requests blockieren?
2. Gibt es Rate Limiting für /ai/*?
3. Können Sie die Logs für 6. Nov 2025, 23:00-23:30 UTC prüfen?

URLs zum Testen:
- https://jan-erik-andersen.de/ai/health.json
- https://jan-erik-andersen.de/ai/echo.php

Erwartung: HTTP 200 OK für alle User-Agents

Vielen Dank!
```

---

## Status

**Problem bestätigt:** ChatGPT bekommt HTTP 400

**Ursache:** Wahrscheinlich mod_security oder Rate Limiting auf Server-Ebene

**Lösung:** Server-Logs prüfen + KAS-Support kontaktieren

**Workaround:** Manuelle Tests im Browser funktionieren
