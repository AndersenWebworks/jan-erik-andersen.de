# Druck: rastert Druckbilder (Text, Haarlinien, Flächen) für die Papierteile des Neubaus.
# Läuft mit dem System-Python (PIL), nicht in Blender. Blender ruft es über basis.druck() mit einer JSON-Auftragsliste auf:
#   python druck.py auftrag.json
# Ein Auftrag beschreibt ein Bild in Welt-Einheiten (w, h) und eine Pixeldichte (px je Einheit). Alle Maße der Befehle sind
# Welt-Einheiten, von oben links gemessen (x nach rechts, y nach unten), damit Bauskripte nie in Pixeln denken müssen.
# Befehle:
#   {"rect": [x, y, w, h], "fill": "#hex", "stroke": "#hex", "lw": Einheiten, "r": Eckradius, "dash": [an, aus]}
#   {"line": [x0, y0, x1, y1], "stroke": "#hex", "lw": Einheiten, "dash": [an, aus]}
#   {"circle": [cx, cy, r], "fill": "#hex", "stroke": "#hex", "lw": Einheiten}
#   {"text": "Absatz …" | ["Zeile", …], "x": .., "y": .., "w": max. Breite, "size": Schriftgröße (em), "lh": Zeilenabstand (em),
#    "font": "grotesk" | "serif" | "serif-kursiv", "col": "#hex", "align": "left|center|right", "track": Laufweite (em)}
#     Absätze als Liste von Absätzen: {"absaetze": ["…", "…"], "gap": Abstand (em)} – Umbruch nach Wörtern, nie Silbentrennung.
# Ergebnis je Auftrag: PNG unter "out" und eine Zeile JSON auf stdout mit den gesetzten Zeilen und ihren Kästen (Einheiten),
# damit die Textprüfung in Blender weiß, wo jede Zeile auf der Fläche steht.
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

HIER = os.path.dirname(os.path.abspath(__file__))
SCHRIFT = {
    "grotesk": os.path.join(HIER, "schriften", "SchibstedGrotesk.ttf"),
    "serif": os.path.join(HIER, "schriften", "Newsreader.ttf"),
    "serif-kursiv": os.path.join(HIER, "schriften", "NewsreaderItalic.ttf"),
}
SS = 3  # Überabtastung beim Zeichnen von Linien und Flächen (glatte Kanten), Text zeichnet FreeType selbst geglättet


def farbe(s, a=255):
    s = s.lstrip("#")
    if len(s) == 8:
        return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4, 6))
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def umbruch(font, text, maxw, track_px):
    worte, zeilen, cur = text.split(), [], ""
    for w in worte:
        probe = (cur + " " + w).strip()
        if cur and breite(font, probe, track_px) > maxw:
            zeilen.append(cur); cur = w
        else:
            cur = probe
    if cur:
        zeilen.append(cur)
    return zeilen


def breite(font, s, track_px):
    return font.getlength(s) + track_px * max(len(s) - 1, 0)


def zeichne_text(img, cmd, k):
    size = cmd["size"] * k
    font = ImageFont.truetype(SCHRIFT[cmd.get("font", "grotesk")], max(1, round(size)))
    track = cmd.get("track", 0) * size
    lh = cmd.get("lh", 1.3) * size
    x0, y0, maxw = cmd["x"] * k, cmd["y"] * k, cmd.get("w", 1e9) * k
    if "absaetze" in cmd:
        absaetze = cmd["absaetze"]
    elif isinstance(cmd["text"], list):
        absaetze = None
    else:
        absaetze = [cmd["text"]]
    zeilen = []  # (text, abstand davor in px)
    if absaetze is None:
        zeilen = [(z, 0) for z in cmd["text"]]
    else:
        for i, a in enumerate(absaetze):
            for j, z in enumerate(umbruch(font, a, maxw, track)):
                zeilen.append((z, cmd.get("gap", .6) * size if (i > 0 and j == 0) else 0))
    d = ImageDraw.Draw(img)
    col = farbe(cmd.get("col", "#303033"))
    asc, desc = font.getmetrics()
    y, kaesten, align = y0, [], cmd.get("align", "left")
    for z, gap in zeilen:
        y += gap
        bw = breite(font, z, track)
        x = x0 if align == "left" else (x0 + (maxw - bw) / 2 if align == "center" else x0 + maxw - bw)
        # Grundlinie so, dass die Versalhöhe mittig in der Zeilenhöhe steht
        base = y + (lh + size * .7) / 2
        if track:
            cx = x
            for ch in z:
                d.text((cx, base), ch, font=font, fill=col, anchor="ls")
                cx += font.getlength(ch) + track
        else:
            d.text((x, base), z, font=font, fill=col, anchor="ls")
        # Kasten der Zeile (Einheiten): Versalhöhe bis Unterlänge, für die Prüfung
        kaesten.append({"text": z, "x": x / k, "y": (base - size * .72) / k, "w": bw / k, "h": size * .72 / k, "em": cmd["size"]})
        y += lh
    return kaesten


def bild(auftrag):
    k = auftrag["px"]
    W, H = max(4, round(auftrag["w"] * k)), max(4, round(auftrag["h"] * k))
    grund = farbe(auftrag.get("bg", "#ffffff"))
    # Flächen und Linien überabgetastet zeichnen, dann verkleinern (saubere Haarlinien), Text danach in voller Auflösung
    gross = Image.new("RGBA", (W * SS, H * SS), grund)
    d = ImageDraw.Draw(gross)
    ks = k * SS
    texte = []
    for c in auftrag.get("cmds", []):
        if "text" in c or "absaetze" in c:
            texte.append(c); continue
        lw = max(1, round(c.get("lw", .01) * ks))
        if "rect" in c:
            x, y, w, h = [v * ks for v in c["rect"]]
            if c.get("dash"):
                strich(d, [(x, y), (x + w, y), (x + w, y + h), (x, y + h), (x, y)], c, ks, lw)
            else:
                r = c.get("r", 0) * ks
                d.rounded_rectangle([x, y, x + w, y + h], radius=r, fill=farbe(c["fill"]) if c.get("fill") else None,
                                    outline=farbe(c["stroke"]) if c.get("stroke") else None, width=lw if c.get("stroke") else 0)
        elif "line" in c:
            x0, y0, x1, y1 = [v * ks for v in c["line"]]
            if c.get("dash"):
                strich(d, [(x0, y0), (x1, y1)], c, ks, lw)
            else:
                d.line([x0, y0, x1, y1], fill=farbe(c["stroke"]), width=lw)
        elif "circle" in c:
            cx, cy, r = [v * ks for v in c["circle"]]
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=farbe(c["fill"]) if c.get("fill") else None,
                      outline=farbe(c["stroke"]) if c.get("stroke") else None, width=lw if c.get("stroke") else 0)
    img = gross.resize((W, H), Image.LANCZOS)
    kaesten = []
    for c in texte:
        kaesten += zeichne_text(img, c, k)
    img.convert("RGB").save(auftrag["out"], optimize=True)
    return {"out": auftrag["out"], "px": [W, H], "zeilen": kaesten}


def strich(d, pts, c, ks, lw):
    an, aus = [v * ks for v in c["dash"]]
    col = farbe(c["stroke"])
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        L = ((x1 - x0) ** 2 + (y1 - y0) ** 2) ** .5
        if L == 0:
            continue
        ux, uy, s = (x1 - x0) / L, (y1 - y0) / L, 0.0
        while s < L:
            e = min(s + an, L)
            d.line([x0 + ux * s, y0 + uy * s, x0 + ux * e, y0 + uy * e], fill=col, width=lw)
            s = e + aus


if __name__ == "__main__":
    auftraege = json.load(open(sys.argv[1], encoding="utf8"))
    print(json.dumps([bild(a) for a in auftraege]))
