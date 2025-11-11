#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI Visibility Test Tool
Emuliert, wie verschiedene AI-Agenten (ChatGPT, Claude, Perplexity, Gemini)
Websites sehen und analysiert die extrahierbaren Informationen.
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json
import sys
from datetime import datetime

class AIVisibilityTester:
    """Testet, welche Informationen AI-Agenten von einer Website extrahieren können."""

    def __init__(self, url):
        self.url = url
        self.domain = urlparse(url).netloc
        self.html_content = None
        self.soup = None

    def fetch_page(self):
        """Holt die Startseite (simuliert Single-Fetch-Prinzip)."""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (compatible; AI-Agent-Simulator/1.0)'
            }
            response = requests.get(self.url, headers=headers, timeout=10)
            response.raise_for_status()
            self.html_content = response.text
            self.soup = BeautifulSoup(self.html_content, 'html.parser')
            return True
        except Exception as e:
            print(f"❌ Fehler beim Abrufen: {e}")
            return False

    def extract_structured_data(self):
        """Extrahiert JSON-LD strukturierte Daten aus dem <head>."""
        json_ld_scripts = self.soup.find_all('script', type='application/ld+json')
        structured_data = []

        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                structured_data.append(data)
            except:
                pass

        return structured_data

    def extract_basic_info(self):
        """Extrahiert Basis-Informationen (Title, Description, etc.)."""
        info = {
            'title': None,
            'description': None,
            'h1': [],
            'h2': []
        }

        # Title
        title_tag = self.soup.find('title')
        if title_tag:
            info['title'] = title_tag.get_text(strip=True)

        # Meta Description
        meta_desc = self.soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            info['description'] = meta_desc.get('content', '')

        # Überschriften
        for h1 in self.soup.find_all('h1'):
            info['h1'].append(h1.get_text(strip=True))

        for h2 in self.soup.find_all('h2')[:5]:  # Nur erste 5 H2
            info['h2'].append(h2.get_text(strip=True))

        return info

    def extract_contact_info(self):
        """Extrahiert Kontaktdaten (Email, Telefon, Adresse)."""
        contact = {
            'emails': [],
            'phones': [],
            'address': None
        }

        # Email-Adressen
        for a in self.soup.find_all('a', href=True):
            if a['href'].startswith('mailto:'):
                email = a['href'].replace('mailto:', '')
                contact['emails'].append(email)

        # Telefonnummern (einfache Heuristik)
        text = self.soup.get_text()
        import re
        phones = re.findall(r'\+?\d[\d\s\-\(\)]{8,}\d', text)
        contact['phones'] = list(set(phones[:3]))  # Max 3 unique

        return contact

    def extract_services(self):
        """Extrahiert Service-Informationen."""
        services = []

        # Suche nach <dl> mit class="service-details"
        service_lists = self.soup.find_all('dl', class_='service-details')

        for dl in service_lists:
            service = {}
            dts = dl.find_all('dt')
            dds = dl.find_all('dd')

            for dt, dd in zip(dts, dds):
                key = dt.get_text(strip=True).rstrip(':')
                value = dd.get_text(strip=True)
                service[key] = value

            if service:
                services.append(service)

        return services

    def analyze(self):
        """Führt die vollständige Analyse durch."""
        print(f"\n{'='*70}")
        print(f"🔍 AI VISIBILITY TEST")
        print(f"{'='*70}")
        print(f"URL: {self.url}")
        print(f"Domain: {self.domain}")
        print(f"Test-Zeit: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*70}\n")

        if not self.fetch_page():
            return

        # 1. Basis-Informationen
        print("📄 BASIS-INFORMATIONEN (aus HTML)")
        print("-" * 70)
        basic = self.extract_basic_info()
        print(f"Title: {basic['title']}")
        print(f"Description: {basic['description']}")
        print(f"H1 Headlines: {', '.join(basic['h1']) if basic['h1'] else 'Keine gefunden'}")
        print(f"H2 Headlines: {', '.join(basic['h2'][:3]) if basic['h2'] else 'Keine gefunden'}")
        print()

        # 2. Strukturierte Daten
        print("📊 STRUKTURIERTE DATEN (JSON-LD im <head>)")
        print("-" * 70)
        structured = self.extract_structured_data()
        if structured:
            print(f"✅ {len(structured)} JSON-LD Block(s) gefunden")
            for i, data in enumerate(structured, 1):
                print(f"   Block {i}: @type = {data.get('@type', 'Unknown')}")
        else:
            print("❌ Keine strukturierten Daten gefunden")
        print()

        # 3. Kontaktdaten
        print("📞 KONTAKTDATEN")
        print("-" * 70)
        contact = self.extract_contact_info()
        if contact['emails']:
            print(f"✅ Emails gefunden: {', '.join(contact['emails'])}")
        else:
            print("❌ Keine Emails gefunden")

        if contact['phones']:
            print(f"✅ Telefonnummern gefunden: {', '.join(contact['phones'])}")
        else:
            print("❌ Keine Telefonnummern gefunden")
        print()

        # 4. Services
        print("🛠️  SERVICES/ANGEBOTE")
        print("-" * 70)
        services = self.extract_services()
        if services:
            print(f"✅ {len(services)} Service(s) mit strukturierten Daten gefunden:")
            for i, service in enumerate(services, 1):
                print(f"\n   Service {i}:")
                for key, value in service.items():
                    print(f"      {key}: {value}")
        else:
            print("❌ Keine strukturierten Service-Daten gefunden")
        print()

        # 5. Bewertung
        print("📈 AI READINESS SCORE")
        print("-" * 70)
        score = 0
        max_score = 10

        if basic['title']:
            score += 1
        if basic['description']:
            score += 1
        if basic['h1']:
            score += 1
        if structured:
            score += 2
        if contact['emails']:
            score += 2
        if services:
            score += 2
        if basic['h2']:
            score += 1

        percentage = int((score / max_score) * 100)

        print(f"Score: {score}/{max_score} ({percentage}%)")
        print()

        if percentage >= 80:
            print("✅ EXZELLENT - Website ist gut strukturiert für AI-Agenten")
        elif percentage >= 60:
            print("⚠️  GUT - Basis vorhanden, aber Optimierungspotenzial")
        elif percentage >= 40:
            print("⚠️  MITTEL - Wichtige Informationen fehlen")
        else:
            print("❌ SCHLECHT - Website ist für AI-Agenten schwer lesbar")

        print()
        print("💡 EMPFEHLUNG")
        print("-" * 70)

        recommendations = []

        if not structured:
            recommendations.append("• JSON-LD strukturierte Daten im <head> hinzufügen")
        if not services:
            recommendations.append("• Services mit <dl>-Tags strukturiert darstellen")
        if not contact['emails']:
            recommendations.append("• Email-Adresse sichtbar auf der Startseite platzieren")
        if not basic['h2']:
            recommendations.append("• Klare H2-Überschriften für Sektionen verwenden")

        if recommendations:
            for rec in recommendations:
                print(rec)
        else:
            print("✅ Keine kritischen Mängel gefunden!")

        print()
        print("="*70)
        print("TEST ABGESCHLOSSEN")
        print("="*70)

def main():
    if len(sys.argv) < 2:
        print("Usage: python ai-visibility-test.py <URL>")
        print("Beispiel: python ai-visibility-test.py https://jan-erik-andersen.de")
        sys.exit(1)

    url = sys.argv[1]
    if not url.startswith('http'):
        url = 'https://' + url

    tester = AIVisibilityTester(url)
    tester.analyze()

if __name__ == "__main__":
    main()