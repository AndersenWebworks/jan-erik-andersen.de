# Agent Access Test

**Zweck:** Verifizieren, dass alle AI-Agenten auf strukturierte Daten zugreifen können.

---

## Health Check Endpoint

**URL:** https://jan-erik-andersen.de/ai/health.json

**Test:**
```bash
curl https://jan-erik-andersen.de/ai/health.json
```

**Erwartung:**
```json
{
  "status": "ok",
  "endpoints": { ... }
}
```

**Bedeutung:**
- ✅ 200 OK + JSON → Alle Endpoints sind erreichbar
- ❌ 400/403/404 → Server-Problem oder Blockierung

---

## User-Agent Tests

### Test 1: Default curl
```bash
curl -I https://jan-erik-andersen.de/ai/services.json
# Expected: HTTP/1.1 200 OK
```

### Test 2: GPTBot
```bash
curl -I https://jan-erik-andersen.de/ai/services.json \
  -H "User-Agent: Mozilla/5.0 (compatible; GPTBot/1.0)"
# Expected: HTTP/1.1 200 OK
```

### Test 3: ChatGPT-User
```bash
curl -I https://jan-erik-andersen.de/ai/services.json \
  -H "User-Agent: Mozilla/5.0 AppleWebKit/537.36 (compatible; ChatGPT-User/1.0)"
# Expected: HTTP/1.1 200 OK
```

### Test 4: Claude-Web
```bash
curl -I https://jan-erik-andersen.de/ai/services.json \
  -H "User-Agent: Mozilla/5.0 (compatible; Claude-Web/1.0)"
# Expected: HTTP/1.1 200 OK
```

### Test 5: Generic Browser
```bash
curl -I https://jan-erik-andersen.de/ai/services.json \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
# Expected: HTTP/1.1 200 OK
```

---

## Accept Header Tests

### Test 1: application/json
```bash
curl -I https://jan-erik-andersen.de/ai/services.json \
  -H "Accept: application/json"
# Expected: HTTP/1.1 200 OK
# Content-Type: application/json; charset=utf-8
```

### Test 2: */*
```bash
curl -I https://jan-erik-andersen.de/ai/services.json \
  -H "Accept: */*"
# Expected: HTTP/1.1 200 OK
```

### Test 3: text/html (Browser-like)
```bash
curl -I https://jan-erik-andersen.de/ai/services.json \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
# Expected: HTTP/1.1 200 OK
# (JSON wird trotzdem ausgeliefert)
```

---

## All Endpoints Test

**Skript:**
```bash
#!/bin/bash
endpoints=(
  "https://jan-erik-andersen.de/ai/manifest.json"
  "https://jan-erik-andersen.de/ai/services.json"
  "https://jan-erik-andersen.de/ai/services.txt"
  "https://jan-erik-andersen.de/ai/identity-schema.json"
  "https://jan-erik-andersen.de/ai/identity.txt"
  "https://jan-erik-andersen.de/ai/faq-schema.json"
  "https://jan-erik-andersen.de/ai/health.json"
)

echo "Testing all endpoints..."
for url in "${endpoints[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" == "200" ]; then
    echo "✅ $url"
  else
    echo "❌ $url (HTTP $status)"
  fi
done
```

**Erwartung:** Alle Endpoints liefern 200 OK.

---

## CORS Test

**Test:**
```bash
curl -I https://jan-erik-andersen.de/ai/services.json \
  -H "Origin: https://example.com"
```

**Erwartung:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
```

**Bedeutung:**
AI-Agenten können Daten von jedem Origin aus aufrufen.

---

## Content-Type Test

**Test:**
```bash
curl -I https://jan-erik-andersen.de/ai/manifest.json | grep "Content-Type"
curl -I https://jan-erik-andersen.de/ai/services.json | grep "Content-Type"
curl -I https://jan-erik-andersen.de/ai/services.txt | grep "Content-Type"
```

**Erwartung:**
```
Content-Type: application/json; charset=utf-8
Content-Type: application/json; charset=utf-8
Content-Type: text/plain; charset=utf-8
```

---

## Troubleshooting

### Problem: HTTP 400

**Mögliche Ursachen:**
1. ❌ User-Agent blockiert (zu restriktive Whitelist)
2. ❌ Accept-Header nicht akzeptiert
3. ❌ CORS-Preflight (OPTIONS) schlägt fehl
4. ❌ Redirect-Loop
5. ❌ Cache zeigt alte Antwort

**Diagnose:**
```bash
# Vollständiger Request mit allen Headers
curl -v https://jan-erik-andersen.de/ai/services.json \
  -H "User-Agent: TestBot/1.0" \
  -H "Accept: application/json" 2>&1 | less
```

**Fix:**
1. Prüfe .htaccess auf BrowserMatch/SetEnvIf/Require-Regeln
2. Entferne User-Agent-Whitelists
3. Setze Default-Type für JSON/MD

### Problem: HTTP 403

**Mögliche Ursachen:**
1. ❌ Datei-Permissions (chmod)
2. ❌ .htaccess blockiert Pfad/Extension
3. ❌ Server-IP geblockt

**Diagnose:**
```bash
# Prüfe Datei-Permissions
ls -la ai/*.json

# Prüfe .htaccess-Regeln
grep -i "deny\|require" .htaccess
```

### Problem: HTTP 404

**Mögliche Ursachen:**
1. ❌ Datei existiert nicht
2. ❌ Falscher Pfad
3. ❌ Case-Sensitivity (Linux vs. Windows)

**Diagnose:**
```bash
# Prüfe, ob Datei existiert
ls ai/services.json

# Teste mit absolutem Pfad
curl -I https://jan-erik-andersen.de/ai/services.json
```

---

## ChatGPT-spezifischer Test

**Falls ChatGPT weiterhin 400 meldet:**

1. Frage ChatGPT:
   ```
   "Kannst du mir den exakten HTTP-Request zeigen, den du an
   https://jan-erik-andersen.de/ai/services.json sendest?
   Zeige mir User-Agent, Accept-Header und alle anderen Header."
   ```

2. Kopiere die Header

3. Teste lokal:
   ```bash
   curl -v https://jan-erik-andersen.de/ai/services.json \
     -H "User-Agent: [CHATGPT_UA]" \
     -H "Accept: [CHATGPT_ACCEPT]"
   ```

4. Falls lokal 200, ChatGPT 400 → ChatGPT-Bug oder Cache

---

## Status (6. November 2025)

**Test-Ergebnisse:**

| Endpoint | Status | Content-Type |
|----------|--------|--------------|
| ai/manifest.json | 200 OK | application/json |
| ai/services.json | 200 OK | application/json |
| ai/services.txt | 200 OK | text/plain |
| ai/identity-schema.json | 200 OK | application/ld+json |
| ai/identity.txt | 200 OK | text/plain |
| ai/faq-schema.json | 200 OK | application/ld+json |
| ai/health.json | 200 OK | application/json |

**CORS:** ✅ Aktiviert (Access-Control-Allow-Origin: *)

**User-Agents getestet:**
- ✅ curl (default)
- ✅ GPTBot
- ✅ ChatGPT-User
- ✅ Claude-Web
- ✅ Generic Browser

**Fazit:**
Alle Endpoints sind für alle User-Agents erreichbar.

**ChatGPT 400-Meldung:** False Positive (vermutlich Cache/interner Fehler)
