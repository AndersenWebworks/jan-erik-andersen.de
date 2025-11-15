# Fetch-Templates für AI-Agents

**Developer-Integration für AI-native Websites**

---
Version: 1.3
Letztes Update: 2025-11-15
Autor: Jan-Erik Andersen
---

## 🎯 Konzept

**Fetch-Templates** sind standardisierte Methoden, mit denen AI-Agents strukturierte Daten von Websites abrufen können.

**Ziel:**
- Entwickler können AI-native Websites programmatisch abfragen
- Konsistente Endpoint-Discovery
- Fallback-Strategien für blockierte Domains

---

## 📡 Standard-Fetch-Template

### Basis-Fetch (Python)

```python
import anthropic

client = anthropic.Anthropic()

# Standard AI-Agent Fetch
message = client.messages.create(
    model="claude-3-7-sonnet-20250929",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "Lies https://jan-erik-andersen.de und fasse zusammen: Wer, Was, Wo, Kontakt, Preise"
    }]
)

print(message.content[0].text)
```

**Erwarteter Output:**
```
Jan-Erik Andersen ist GEO Expert aus Deutschland.
Leistungen: Struktur-Audit (400-600 EUR), GEO-Optimierung (2.400-12.000 EUR), Brand Voice (1.800-4.800 EUR)
Kontakt: mail@andersen-webworks.de
```

---

## 🔍 Endpoint-Discovery

### Standard: /ai/manifest.json

**Alle AI-native Websites sollten einen Manifest-Endpoint haben:**

```
https://jan-erik-andersen.de/ai/manifest.json
```

**Struktur:**

```json
{
  "@context": "https://schema.org",
  "@type": "DataCatalog",
  "name": "Jan-Erik Andersen AI Data Catalog",
  "description": "Strukturierte Daten für AI-Agents",
  "url": "https://jan-erik-andersen.de",
  "dataset": [
    {
      "@type": "Dataset",
      "name": "Services",
      "url": "https://jan-erik-andersen.de/ai/services.json",
      "alternate": "https://raw.githubusercontent.com/AndersenWebworks/jan-erik-andersen.de/main/ai/services.json",
      "encodingFormat": "application/json"
    },
    {
      "@type": "Dataset",
      "name": "Identity",
      "url": "https://jan-erik-andersen.de/ai/identity-schema.json",
      "encodingFormat": "application/ld+json"
    }
  ]
}
```

**Fetch via Python:**

```python
import requests

# Discovery
manifest = requests.get("https://jan-erik-andersen.de/ai/manifest.json").json()

# Iterate über Datasets
for dataset in manifest['dataset']:
    print(f"Dataset: {dataset['name']}")
    print(f"URL: {dataset['url']}")

    # Fetch einzelnes Dataset
    data = requests.get(dataset['url']).json()
    print(data)
```

---

## 🚧 Fallback-Strategien für blockierte Domains

**Problem:** ChatGPT/Claude können Custom Domains blockieren (Domain-Whitelist).

### Strategie 1: GitHub Raw URLs

```python
# Custom Domain (kann blockiert sein)
primary_url = "https://jan-erik-andersen.de/ai/services.json"

# GitHub Raw Fallback (meist verfügbar)
fallback_url = "https://raw.githubusercontent.com/AndersenWebworks/jan-erik-andersen.de/main/ai/services.json"

try:
    response = requests.get(primary_url, timeout=5)
    if response.status_code == 200:
        data = response.json()
except:
    # Fallback auf GitHub Raw
    response = requests.get(fallback_url, timeout=5)
    data = response.json()
```

### Strategie 2: LLM-Fetch statt direkter Request

```python
# Statt HTTP-Request: LLM fetchen lassen
prompt = f"Lies {primary_url} und gib mir alle Services mit Preisen als JSON zurück"

message = client.messages.create(
    model="claude-3-7-sonnet-20250929",
    max_tokens=2048,
    messages=[{"role": "user", "content": prompt}]
)

# LLM gibt JSON zurück (wenn erfolgreich gefetcht)
response_text = message.content[0].text
```

**Vorteil:** LLM umgeht Domain-Blockierungen
**Nachteil:** Lossy Compression (siehe [MEASUREMENT.md](MEASUREMENT.md))

---

## 📋 Agent-Instructions Discovery

### HTML-Header-Deklaration

**Websites sollten AI-Endpoints im `<head>` deklarieren:**

```html
<head>
  <link rel="alternate" type="application/json" href="/ai/manifest.json" title="AI Manifest">
  <link rel="alternate" type="application/ld+json" href="/ai/identity-schema.json" title="Identity Schema">
  <link rel="alternate" type="text/plain" href="/ai/services.txt" title="Services Plain-Text">
</head>
```

**Fetch via BeautifulSoup:**

```python
from bs4 import BeautifulSoup
import requests

html = requests.get("https://jan-erik-andersen.de").text
soup = BeautifulSoup(html, 'html.parser')

# Finde alle AI-Endpoints
endpoints = soup.find_all('link', rel='alternate')

for endpoint in endpoints:
    content_type = endpoint.get('type')
    url = endpoint.get('href')
    title = endpoint.get('title')

    print(f"{title}: {url} ({content_type})")
```

**Output:**
```
AI Manifest: /ai/manifest.json (application/json)
Identity Schema: /ai/identity-schema.json (application/ld+json)
Services Plain-Text: /ai/services.txt (text/plain)
```

---

## 🧩 robots.txt AI-Extensions (experimentell)

**Einige Websites deklarieren AI-Endpoints in robots.txt:**

```
# Standard Crawling Rules
User-agent: GPTBot
Allow: /

# Experimentelle AI-Manifest Discovery
AI-Manifest: /ai/manifest.json
AI-Identity: /ai/identity-schema.json
AI-FAQ: /ai/faq-schema.json
```

**Fetch via Python:**

```python
robots_txt = requests.get("https://jan-erik-andersen.de/robots.txt").text

# Parse AI-Extensions
for line in robots_txt.split('\n'):
    if line.startswith('AI-'):
        key, value = line.split(': ', 1)
        print(f"{key}: {value}")
```

**Status:** Experimentell, noch kein offizieller Standard.

---

## 🔧 Best Practices

### 1. Nutze GitHub Raw URLs für sofortigen Zugriff

```python
# Empfohlene URL-Struktur
primary = "https://jan-erik-andersen.de/ai/services.json"
mirror = "https://raw.githubusercontent.com/AndersenWebworks/jan-erik-andersen.de/main/ai/services.json"

# Beide URLs im manifest.json deklarieren
```

### 2. Fallback auf Custom Domain nach Domain-Trust (7-14 Tage)

```python
# Nach 7-14 Tagen sollte Custom Domain funktionieren
import time

def fetch_with_retry(url, max_retries=3, delay=2):
    for i in range(max_retries):
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                return response.json()
        except:
            if i < max_retries - 1:
                time.sleep(delay)
    return None
```

### 3. Cache-Management

```python
import json
from datetime import datetime, timedelta

# Simple File-Cache
CACHE_FILE = "cache/jan-erik-andersen.json"
CACHE_TTL = timedelta(hours=24)

def fetch_cached(url):
    # Prüfe Cache
    try:
        with open(CACHE_FILE) as f:
            cache = json.load(f)
            timestamp = datetime.fromisoformat(cache['timestamp'])

            if datetime.now() - timestamp < CACHE_TTL:
                return cache['data']
    except:
        pass

    # Fetch frisch
    data = requests.get(url).json()

    # Cache speichern
    with open(CACHE_FILE, 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'data': data
        }, f)

    return data
```

### 4. Plain-Text Fallbacks nutzen

```python
# Wenn JSON-Parsing fehlschlägt: Plain-Text verwenden
try:
    data = requests.get("https://jan-erik-andersen.de/ai/services.json").json()
except:
    # Fallback auf .txt
    text = requests.get("https://jan-erik-andersen.de/ai/services.txt").text
    # Einfaches Parsing
    print(text)
```

---

## 📊 Beispiel: Vollständiger Fetch-Workflow

```python
import requests
import json
from typing import Dict, Optional

class AIWebsiteFetcher:
    """Robuster Fetcher für AI-native Websites"""

    def __init__(self, base_url: str, github_mirror: Optional[str] = None):
        self.base_url = base_url
        self.github_mirror = github_mirror

    def fetch_manifest(self) -> Dict:
        """Fetcht AI-Manifest (mit Fallback)"""
        urls = [
            f"{self.base_url}/ai/manifest.json",
            f"{self.github_mirror}/ai/manifest.json" if self.github_mirror else None
        ]

        for url in filter(None, urls):
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    return response.json()
            except:
                continue

        raise Exception("Manifest not found")

    def fetch_all_datasets(self) -> Dict[str, Dict]:
        """Fetcht alle Datasets aus Manifest"""
        manifest = self.fetch_manifest()
        datasets = {}

        for dataset in manifest.get('dataset', []):
            name = dataset['name']
            url = dataset['url']

            try:
                data = requests.get(url, timeout=5).json()
                datasets[name] = data
            except:
                # Fallback auf alternate URL
                alt_url = dataset.get('alternate')
                if alt_url:
                    data = requests.get(alt_url, timeout=5).json()
                    datasets[name] = data

        return datasets

# Verwendung
fetcher = AIWebsiteFetcher(
    base_url="https://jan-erik-andersen.de",
    github_mirror="https://raw.githubusercontent.com/AndersenWebworks/jan-erik-andersen.de/main"
)

# Alle Daten fetchen
datasets = fetcher.fetch_all_datasets()

print(f"Services: {datasets['Services']}")
print(f"Identity: {datasets['Identity']}")
```

---

## 🧪 Validierung

**Test, ob eine Website AI-native ist:**

```python
def validate_ai_native(url: str) -> bool:
    """Prüft, ob Website AI-native Endpoints hat"""

    checks = {
        "manifest": f"{url}/ai/manifest.json",
        "services": f"{url}/ai/services.json",
        "identity": f"{url}/ai/identity-schema.json"
    }

    results = {}

    for name, endpoint in checks.items():
        try:
            response = requests.get(endpoint, timeout=5)
            results[name] = response.status_code == 200
        except:
            results[name] = False

    # Mindestens manifest + 1 Dataset erforderlich
    is_ai_native = results['manifest'] and any([results['services'], results['identity']])

    return is_ai_native

# Test
is_valid = validate_ai_native("https://jan-erik-andersen.de")
print(f"AI-native: {is_valid}")
```

---

## 🔗 Weiterführende Dokumentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Drei-Layer-Architektur
- **[SSOT-PIPELINE.md](SSOT-PIPELINE.md)** — Datenfluss & Synchronisation
- **[MEASUREMENT.md](MEASUREMENT.md)** — Semantic Survival Rate

---

## 📝 Changelog

**v1.3 (2025-11-15)**
- Initiale Dokumentation der Fetch-Templates
- Python-Beispiele für Endpoint-Discovery
- Fallback-Strategien dokumentiert
- Vollständiger Fetcher-Workflow

---

**Kontakt:**
Jan-Erik Andersen
mail@andersen-webworks.de
https://jan-erik-andersen.de
