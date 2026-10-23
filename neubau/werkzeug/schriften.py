#!/usr/bin/env python
# Erzeugt die statischen Schriftschnitte der Marke und der Titel aus der variablen Newsreader des Bestands
# (entwurf-2026-11/seite/fonts/NewsreaderN4*.woff2, nur gelesen) und legt sie nach neubau/blender/schriften/ (OFL, siehe dort).
#   NewsreaderMarke.ttf         Marke N4, aufrecht   (wght 380, opsz 72)   Blender-Lettern und Browser
#   NewsreaderMarkeKursiv.ttf   Marke N4, kursiv     (wght 340, opsz 72)
#   NewsreaderTitel.ttf         Titel                (wght 580, opsz 36)   kräftiger als der Fließtext-Schnitt
# Aufruf: python neubau/werkzeug/schriften.py   (nur nötig, wenn sich die Schnitte ändern; die Dateien liegen im Repo)
import os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HIER = os.path.dirname(os.path.abspath(__file__))
NEUBAU = os.path.dirname(HIER)
QUELLE = os.path.join(os.path.dirname(NEUBAU), "entwurf-2026-11", "seite", "fonts")
ZIEL = os.path.join(NEUBAU, "blender", "schriften")

SCHNITTE = [
    ("NewsreaderN4.woff2", "NewsreaderMarke.ttf", {"wght": 380, "opsz": 72}),
    ("NewsreaderN4-Italic.woff2", "NewsreaderMarkeKursiv.ttf", {"wght": 340, "opsz": 72}),
    ("NewsreaderN4.woff2", "NewsreaderTitel.ttf", {"wght": 580, "opsz": 36}),
]

for q, z, achsen in SCHNITTE:
    f = TTFont(os.path.join(QUELLE, q))
    f = instancer.instantiateVariableFont(f, achsen)
    f.flavor = None
    f.save(os.path.join(ZIEL, z))
    print("geschrieben", z, achsen)
