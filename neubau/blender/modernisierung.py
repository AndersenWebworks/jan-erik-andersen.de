# Szene 4 Modernisierung (DREHBUCH-NEUBAU, Abschnitt 3 → 4). Baut Form, Animation und beide Kameraspuren, prüft und exportiert.
# Inhalte kommen aus neubau/szenen/modernisierung.json. Normalerweise ruft das neubau/bauen.py auf; einzeln:
#   blender.exe -b --factory-startup --python neubau/blender/modernisierung.py -- [--hochkant] [--proben] [--export] [--frames=0,120]
#   Zwei Anordnungen aus derselben Beschreibung (Drehbuch 1a.7: am Handy einfacher, nicht bloß kleiner):
#     breit    (Desktop):  Röhrenmonitor links, Flachbildschirm rechts daneben, die Blöcke wandern quer durchs Bild.
#     hochkant (Handy):    Flachbildschirm hinter dem Röhrenmonitor, die Blöcke wandern im Bild von unten nach oben.
#
# Ziel: Wer eine alte Seite hat, erkennt sich wieder; das Bild zeigt, dass beim Umzug nichts verloren geht. Ausdrücklich ruhig.
# Ablauf (Bilder 0…380, Scrollweg gleichmäßig):
#   0–12   Eingang: Titelkarte „Modernisierung“ steht vorn, Röhrenmonitor und Flachbildschirm liegen als bedruckter Bastelbogen flach.
#   12–126 Konstruktionsphase, gestrafft (gemeinsamer Baustein basis.Konstruktion): Schnitt- und Falzlinien zeichnen sich (12–40),
#          Raster (24–48), Gerüst der Bauform im Raum (36–66), Bleistiftspur auf den Flächen (58–70), dann Hochklappen:
#          Röhrenmonitor 68–118 (Front, Seiten, Rückwand mit Deckel), Flachbildschirm 96–126.
#   150–248 Vier Inhaltsblöcke lösen sich nacheinander vom Röhrenmonitor, wenden sich (alte Gestaltung -> neue) und rasten im
#          Flachbildschirm ein; Bewegung quer durchs Bild, Kamera steht.
#   262–312 Der Röhrenmonitor legt sich flach in den Bogen zurück: Rückwand mit Deckel nach hinten, Seiten nach außen, zuletzt die
#          Front nach vorn. Ihre Innenseite liegt oben, dort druckt sich der Text ein (306–322).
#   324–380 Lesestelle: Kamera still, frontal (kein Gieren), Blick von schräg oben.
#
# Einstellungsliste (Kamera rahmt den Inhalt, nicht den Punkt; Rangfolge Handlung > Text > Punkt; nie Rollen; Neigung steigt nur):
#   Desktop 16:9, vfov 30°
#     D1 Eingang und Bau (0–100): Titelkarte ganz, Bastelbogen beider Geräte ganz, Gerüst der Bauform ganz; Neigung 26°, frontal.
#     D2 Handlung (140–252): beide Geräte ganz nebeneinander, halbnah, dazu die Flugbahnen aller Blöcke mit Luft; Neigung 27°.
#     D3 Lesestelle (324–380): Front mit beiden Sätzen ganz, Flachbildschirm mit neuer Seite daneben, Netz im Bogen; Neigung 56°.
#   Handy 9:19,5, vfov 50° (Handy wird einfacher, nicht kleiner)
#     H1 Eingang und Bau (0–100): Titelkarte ganz, Röhrenmonitor (flach und als Gerüst) ganz; Flachbildschirm darf fehlen. Neigung 26°.
#     H2 Handlung (140–252): beide Geräte ganz, Blockbahnen; Titelkarte unten im Bild. Neigung 30°.
#     H3 Lesestelle (324–380): nur die Front mit beiden Sätzen, Text mindestens 16 px; ringsum Raum (Netz, Bogen). Neigung 58°.
import importlib, json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import basis, szene
importlib.reload(basis)
from basis import PAL, KARTON as T, SPALT as G, material, karton, prisma, leer, anhaengen, klappe, bewegung, fenster, smm, sm
from mathutils import Vector, Euler, Matrix
import bpy

# Alle Inhaltswerte (Maße, Lagen, Zeiten, Kamera, Text) stehen in neubau/szenen/modernisierung.json; dieses Skript baut nur die Form.
# Text wird hier nicht gedruckt: Blender legt benannte leere Druckflächen an ("druck:titel", "druck:lesestelle"), der Browser zeichnet.
A = basis.args()
HOCH = "--hochkant" in sys.argv
ANORDNUNG = "hochkant" if HOCH else "breit"
SZ = szene.lade("modernisierung")
FORM_HASH = szene.form_hash(SZ)
GEG, Z, BL = SZ["gegenstaende"], SZ["zeiten"], SZ["bloecke"]
F_END = SZ["bilder"]
NEU = os.path.join(basis.NEUBAU)
PROBEN = os.path.join(NEU, "proben", "modernisierung", "blender")
os.makedirs(PROBEN, exist_ok=True)
lage = lambda g: GEG[g]["lage"][ANORDNUNG]
ov = lambda v: v[ANORDNUNG] if isinstance(v, dict) and ("breit" in v or "hochkant" in v) else v

sc = basis.buehne(F_END, bogen=tuple(SZ["bogen"]))

# ---------------------------------------------------------------- Maße
# Röhrenmonitor (links): Keilgehäuse, Front y in [-T,0], Rückwand y in [D, D+T]
_am = GEG["alter_monitor"]["form"]
CX, W, D, HF, HB = lage("alter_monitor")["x"], _am["breite"], _am["tiefe"], _am["hoehe_vorn"], _am["hoehe_hinten"]
X0, X1 = CX - W / 2, CX + W / 2
S_DACH = (HB - HF) / D                       # Steigung der Dachebene (z = HF + s*y)
zp = lambda y: HF + S_DACH * y
# Bildschirm (Glas) auf der Front: Maße in Druckkoordinaten der Front (von oben links)
FW = W + 2 * T                               # Breite der Front
DW, DH = _am["anzeige"]["breite"], _am["anzeige"]["hoehe"]   # Anzeigefläche alt
DX0, DY0 = (FW - DW) / 2, _am["anzeige"]["oben"]             # oben links der Anzeigefläche auf der Front
# Flachbildschirm (rechts): Fuß, Hals, Bildschirm 16:10
_nm = GEG["neuer_monitor"]["form"]
XF = lage("neuer_monitor")["x"]
NW, NH, NT = _nm["hals"]
SW_, SH_, ST = _nm["schirm"]                 # Bildschirmplatte
BZ, BZU = _nm["rand_oben"], _nm["kinn"]      # Rand oben/seitlich, Kinn unten
NDW, NDH = SW_ - 2 * BZ, SH_ - BZ - BZU      # neue Anzeigefläche
Y_HALS = lage("neuer_monitor")["y_hals"]     # Rückseite des Halses = Scharnier
Z_SCHIRM = _nm["z_schirm"]                   # Unterkante Bildschirmplatte
# Blöcke: alte Lage (Druckkoordinaten der alten Anzeige), neue Lage auf der neuen Anzeige, Maßstab S
S = BL["skalierung"]
ALT = {k: tuple(v) for k, v in BL["alte_lage"].items()}
def neu_lage():
    hs = [ALT["kopf"][3] * S, ALT["bild"][3] * S, ALT["karten"][3] * S]
    gap = (NDH - sum(hs)) / 4
    bw = ALT["kopf"][2] * S
    mx = (NDW - bw) / 2
    y1 = gap; y2 = y1 + hs[0] + gap; y3 = y2 + hs[1] + gap
    cw = ALT["bild"][2] * S
    return {"kopf": (mx, y1, bw, hs[0]), "text": (mx, y2, cw, hs[1]), "bild": (mx + bw - cw, y2, cw, hs[1]), "karten": (mx, y3, bw, hs[2])}
NEUL = neu_lage()
BT = BL["dicke"]                             # Dicke der Blöcke

# ---------------------------------------------------------------- Drucke
INK = PAL["tinte"]
def ink(a):
    # Tinte mit Deckkraft a auf hellem Grund, als Vollfarbe vorgemischt (kein Alpha im Druck)
    c = [int(INK[i:i + 2], 16) for i in (1, 3, 5)]
    return "#%02x%02x%02x" % tuple(round(255 - (255 - v) * a) for v in c)

PX = 300   # Pixel je Einheit für Gerätedrucke
auftraege = []
# Front des Röhrenmonitors außen: Gehäusefront, Glaswulst, alte Anzeige mit Vertiefungen der Blöcke, Knöpfe im Kinn
front_cmds = [
    {"rect": [DX0 - .11, DY0 - .11, DW + .22, DH + .22], "fill": "#c4c7cd", "stroke": ink(.3), "lw": .008, "r": .16},
    {"rect": [DX0, DY0, DW, DH], "fill": "#dfe1e7", "stroke": ink(.55), "lw": .01, "r": .1},
]
for k, (x, y, w, h) in ALT.items():
    front_cmds.append({"rect": [DX0 + x, DY0 + y, w, h], "fill": "#d3d6dc", "stroke": ink(.22), "lw": .005})
chin_y = DY0 + DH + (HF - DY0 - DH) / 2
for cx in (FW - .55, FW - .3):
    front_cmds.append({"circle": [cx, chin_y, .085], "fill": "#c9ccd2", "stroke": ink(.5), "lw": .008})
for i in range(3):
    front_cmds.append({"line": [FW - .78 + i * .1, chin_y - .06, FW - .78 + i * .1, chin_y + .06], "stroke": ink(.3), "lw": .008})
front_cmds.append({"rect": [.3, chin_y - .035, .5, .07], "fill": "#c4c7cd", "stroke": ink(.3), "lw": .005, "r": .03})
auftraege.append({"name": "crt_front", "w": FW, "h": HF, "px": PX, "bg": PAL["grau3"], "cmds": front_cmds})
# Innenseite der Front: Lesestelle – hier leer, der Text kommt im Browser auf die Druckfläche "druck:lesestelle"
EM = .145
# Deckel außen: Lüftungsschlitze
L_DACH = (D + 2 * T) * math.sqrt(1 + S_DACH ** 2)
vent = []
for r in range(6):
    yy = L_DACH - .35 - r * .13
    for a, b in ((.4, 1.05), (FW - 1.05, FW - .4)):
        vent.append({"line": [a, yy, b, yy], "stroke": ink(.28), "lw": .018})
auftraege.append({"name": "crt_deckel", "w": FW, "h": L_DACH, "px": 160, "bg": PAL["grau2"], "cmds": vent})
# Flachbildschirm vorn: dunkler Rahmen, weiße Anzeige mit gestrichelten Feldern des neuen Rasters
scr = [{"rect": [0, 0, SW_, SH_], "fill": ink(.86), "r": .04},
       {"rect": [BZ, BZ, NDW, NDH], "fill": "#ffffff"}]
for k, (x, y, w, h) in NEUL.items():
    scr.append({"rect": [BZ + x, BZ + y, w, h], "stroke": ink(.25), "lw": .006, "dash": [.04, .03]})
scr.append({"circle": [SW_ / 2, SH_ - BZU / 2, .022], "fill": ink(.5)})
auftraege.append({"name": "flach_front", "w": SW_, "h": SH_, "px": PX, "bg": PAL["flaeche"], "cmds": scr})
# Titelkarte: Fläche und Maße hier, der Titel selbst kommt im Browser auf "druck:titel"
_tk = GEG["titelkarte"]["form"]
TW, TH = _tk["breite"], _tk["hoehe"]

# Blöcke: Vorderseite alte Gestaltung (Rahmen mit Fase, graue Flächen, Gedränge), Rückseite neue (weiß, Haarlinien, Luft).
# Beide Seiten auf einem Bild: links alt, rechts neu (Atlas), die UVs der Rückseite zeigen auf die rechte Hälfte.
def lines(x, y, w, n, gap, th, a, ws=(1,)):
    return [{"rect": [x, y + i * gap, w * ws[i % len(ws)], th], "fill": ink(a), "r": th / 2} for i in range(n)]
def fase(x, y, w, h):
    return [{"line": [x, y, x + w, y], "stroke": "#ffffff", "lw": .012}, {"line": [x, y, x, y + h], "stroke": "#ffffff", "lw": .012},
            {"line": [x, y + h, x + w, y + h], "stroke": ink(.45), "lw": .012}, {"line": [x + w, y, x + w, y + h], "stroke": ink(.45), "lw": .012}]
def alt_art(k, w, h):
    c = [{"rect": [0, 0, w, h], "fill": "#e2e4ea"}] + fase(.006, .006, w - .012, h - .012)
    if k == "kopf":
        c = [{"rect": [0, 0, w, h], "fill": ink(.7)}] + fase(.006, .006, w - .012, h - .012)
        c += [{"rect": [.04, .04, .5, h - .08], "fill": "#dddfe5"}]
        c += [{"rect": [w - (5 - i) * .21 - .02, .06, .18, h - .12], "fill": "#cfd1d7"} for i in range(5)]
    elif k == "bild":
        c += [{"rect": [.05, .05, w - .1, h * .68], "fill": "#c8cad0", "stroke": ink(.4), "lw": .008},
              {"line": [.05, .05, w - .05, .05 + h * .68], "stroke": ink(.4), "lw": .008},
              {"line": [w - .05, .05, .05, .05 + h * .68], "stroke": ink(.4), "lw": .008}]
        c += lines(.05, h * .82, w * .5, 1, 0, .03, .45)
    elif k == "text":
        c += [{"rect": [.05, .05, w * .7, .055], "fill": ink(.75)}] + lines(.05, .16, w - .1, 7, .048, .024, .35, (1, .94, 1, .88, .97, 1, .55))
    elif k == "karten":
        cw = (w - .1) / 3
        for i in range(3):
            X = .03 + i * (cw + .02)
            c += [{"rect": [X, .03, cw, h - .06], "fill": "#dbdde3", "stroke": ink(.5), "lw": .007},
                  {"rect": [X + .03, .07, cw * .6, .045], "fill": ink(.7)}] + lines(X + .03, .15, cw - .06, 3, .04, .02, .32, (1, .9, .7))
    return c
def neu_art(k, w, h):
    c = [{"rect": [0, 0, w, h], "fill": "#ffffff"}]
    if k == "kopf":
        c += [{"rect": [.05, h * .3, .4, h * .4], "fill": ink(.85), "r": .02}]
        c += [{"rect": [w - (4 - i) * .3 - .05, h * .44, .2, h * .12], "fill": ink(.4), "r": .015} for i in range(4)]
        c += [{"line": [0, h - .006, w, h - .006], "stroke": ink(.15), "lw": .006}]
    elif k == "bild":
        c += [{"rect": [0, 0, w, h], "fill": "#eef1f6", "r": .02},
              {"line": [0, h, w * .32, h * .45], "stroke": ink(.35), "lw": .01}, {"line": [w * .32, h * .45, w * .55, h * .72], "stroke": ink(.35), "lw": .01},
              {"line": [w * .55, h * .72, w * .7, h * .58], "stroke": ink(.35), "lw": .01}, {"line": [w * .7, h * .58, w, h], "stroke": ink(.35), "lw": .01},
              {"circle": [w * .74, h * .28, h * .08], "stroke": ink(.35), "lw": .01}]
    elif k == "text":
        c += [{"rect": [0, h * .06, w * .86, h * .13], "fill": ink(.85), "r": .015}, {"rect": [0, h * .24, w * .58, h * .13], "fill": ink(.85), "r": .015}]
        c += lines(0, h * .5, w * .92, 3, h * .08, h * .035, .3, (1, .94, .66))
        c += [{"rect": [0, h * .78, w * .34, h * .14], "fill": PAL["rot"], "r": .02}]
    elif k == "karten":
        cw = (w - .16) / 3
        for i in range(3):
            X = i * (cw + .08)
            c += [{"rect": [X + .004, .004, cw - .008, h - .008], "stroke": ink(.18), "lw": .006, "r": .025},
                  {"rect": [X + .05, .06, cw * .5, .04], "fill": ink(.75), "r": .02}] + lines(X + .05, .14, cw - .1, 3, .055, .022, .28, (1, .9, .68))
    return c
BPX = 360
for k, (x, y, w, h) in ALT.items():
    cmds = alt_art(k, w, h)
    for c in neu_art(k, w, h):   # rechte Hälfte des Atlas
        c = json.loads(json.dumps(c))
        for key in ("rect", "line", "circle"):
            if key in c:
                c[key][0] += w + .02
                if key == "line":
                    c[key][2] += w + .02
        cmds.append(c)
    auftraege.append({"name": "block_" + k, "w": 2 * w + .02, "h": h, "px": BPX, "bg": "#ffffff", "cmds": cmds})

erg = {a["name"]: r for a, r in zip(auftraege, basis.druck(auftraege))}
def platzhalter(name):
    """Kleines einfarbiges Bild, damit der Exporter UV und Textur-Steckplatz der leeren Druckfläche anlegt."""
    fl = SZ["druckflaechen"][name]
    return basis.druck([{"name": "platzhalter_" + name, "w": 1, "h": 1, "px": 4, "bg": PAL[fl["grund"]] if fl["grund"] in PAL else fl["grund"], "cmds": []}])[0]["out"]

# ---------------------------------------------------------------- Zeitachse
F_SCHNITT, F_RASTER, F_GERUEST = tuple(Z["schnitt"]), tuple(Z["raster"]), tuple(Z["geruest"])
AUF = {k: tuple(v) for k, v in Z["aufklappen"].items()}
AB = {k: tuple(v) for k, v in Z["umlegen"].items()}
F_TEXT = tuple(SZ["druckflaechen"]["lesestelle"]["einblenden"])
F_SEITE = tuple(Z["alte_seite"])   # alte Seite erscheint auf dem Röhrenmonitor
F_LESEN = tuple(Z["lesen"])

# ---------------------------------------------------------------- Materialien
M = {
    "papier": material("Papier", PAL["papier"]),
    "kante": material("Kante", PAL["kante"]),
    "gehaeuse": material("Gehaeuse", PAL["grau2"]),
    "boden": material("CRT_Boden", PAL["grau1"]),
    "metall": material("Metall", PAL["metall"]),
    "flaeche": material("Flaeche", PAL["flaeche"]),
    "crt_front": material("CRT_Front", PAL["grau3"], bild=erg["crt_front"]["out"]),
    "crt_innen": material("CRT_Innen", PAL["flaeche"], rau=.9),
    "crt_deckel": material("CRT_Deckel", PAL["grau2"], bild=erg["crt_deckel"]["out"]),
    "flach_front": material("Flach_Front", PAL["flaeche"], bild=erg["flach_front"]["out"]),
    "titel": material("Titel", PAL["flaeche"], rau=.9),
}

# ---------------------------------------------------------------- Röhrenmonitor
# Abdruck im Bogen (Boden des Gehäuses): nur ein Hauch Karton, die rechte Wand legt sich beim Flachlegen darauf
BODEN_T = .002
crt_boden = karton("CRT_Boden", W - 2 * G, D - 2 * G, BODEN_T, mats={"alle": M["boden"]}, liegend=True)
crt_boden.location = (X0 + G, G, 0)
front = karton("CRT_Front", FW, HF - G, T, mats={"vorn": M["crt_front"], "hinten": M["crt_innen"], "rand": M["kante"]}, uv_hinten=(False, True))
front.location = (X0 - T, -T - G, 0)
H_RUECK = zp(D + T) - G
rueck = karton("CRT_Rueck", FW, H_RUECK, T, mats={"alle": M["gehaeuse"], "rand": M["kante"]})
rueck.location = (X0 - T, D + G, 0)
def seitenumriss():
    return [(G, 0), (D - G, 0), (D - G, zp(D - G) - G), (G, zp(G) - G)]
links = prisma("CRT_Links", seitenumriss(), "x", T, M["gehaeuse"], ursprung=(X0 - T - G, 0, 0))
rechts = prisma("CRT_Rechts", seitenumriss(), "x", T, M["gehaeuse"], ursprung=(X1 + G, 0, 0))
# Deckel: liegt mit der Unterseite auf der Dachebene, von der Vorderkante (y=-T) bis hinter die Rückwand
deckel = karton("CRT_Deckel", FW, L_DACH, T, mats={"vorn": M["crt_deckel"], "rand": M["kante"], "hinten": M["gehaeuse"]}, liegend=True)
deckel.location = (X0 - T, -T, zp(-T) + G)
deckel.rotation_euler = (math.atan(S_DACH), 0, 0)
bpy.context.view_layer.update()

# Klappen: in Ruhe liegt alles flach im Bogen (Innenseiten oben), klappt in der Konstruktionsphase hoch und am Ende wieder flach:
# Rückwand mit Deckel nach hinten, Seiten nach außen, Front nach vorn (Innenseite mit den Sätzen oben).
sch_rueck = klappe("Sch_Rueck", (0, D + T + G, 0), "x", -90, AUF["rueck"], AB["rueck"], [rueck])
# Deckel: Drehpunkt relativ zur liegenden Rückwand so, dass er flach hinter der Rückwand liegt (Innenseite oben)
A0 = (deckel.matrix_world @ Vector((0, L_DACH, 0)))  # hintere Unterkante (Strecke A0 -> B0 = Unterseite von hinten nach vorn)
B0 = (deckel.matrix_world @ Vector((0, 0, 0)))
y_h = D + T + G
A1 = Vector((0, y_h + H_RUECK + 2 * G, T)); B1 = Vector((0, y_h + H_RUECK + 2 * G + L_DACH, T))
def zurueck(p):  # Lage vor dem Umlegen der Rückwand (Rückwand dreht -90° um (y_h, 0))
    y, z = p.y - y_h, p.z
    return Vector((0, y_h - z, y))
A1r, B1r = zurueck(A1), zurueck(B1)
(py, pz), ang = basis.drehpunkt_2d((A0.y, A0.z), (B0.y, B0.z), (A1r.y, A1r.z), (B1r.y, B1r.z))
sch_deckel = klappe("Sch_Deckel", (0, py, pz), "x", ang, AUF["deckel"], AB["deckel"], [deckel])
anhaengen(sch_deckel, sch_rueck)
print(f"DECKEL Drehpunkt y={py:.3f} z={pz:.3f} Winkel={ang:.1f}")
sch_links = klappe("Sch_Links", (X0 - T - G, 0, 0), "y", -90, AUF["seiten"], AB["seiten"], [links])
# rechte Wand klappt nach innen auf den Abdruck (Außenseite oben): so bleibt rechts Platz für den Flachbildschirm
sch_rechts = klappe("Sch_Rechts", (X1 + G, 0, BODEN_T + G), "y", -90, AUF["seiten"], AB["seiten"], [rechts])
sch_front = klappe("Sch_Front", (0, -T - G, 0), "x", 90, AUF["front"], AB["front"], [front])

# ---------------------------------------------------------------- Flachbildschirm: steht nach dem Hochklappen rechts neben dem Röhrenmonitor
FUSS_B, FUSS_T, FUSS_D = _nm["fuss"]
fuss = karton("Flach_Fuss", FUSS_B, FUSS_T, FUSS_D, mats={"alle": M["metall"], "rand": M["kante"]}, liegend=True)
fuss.location = (XF - FUSS_B / 2, Y_HALS - NT - G - FUSS_T, 0)
hals = karton("Flach_Hals", NW, NH, NT, mats={"alle": M["metall"], "rand": M["kante"]})
hals.location = (XF - NW / 2, Y_HALS - NT, 0)
schirm = karton("Flach_Schirm", SW_, SH_, ST, mats={"vorn": M["flach_front"], "hinten": M["metall"], "rand": M["kante"]})
schirm.location = (XF - SW_ / 2, Y_HALS - NT - ST - G, Z_SCHIRM)
sch_flach = klappe("Sch_Flach", (0, Y_HALS, 0), "x", -90, AUF["flach"], None, [hals, schirm])

# ---------------------------------------------------------------- Titelkarte (Zelt): Vorderseite lehnt 18° zurück, Stütze dahinter
TX, TY = lage("titelkarte")["x"], lage("titelkarte")["y"]
TD, TNEIG = _tk["dicke"], math.radians(_tk["neigung_grad"])
titel = karton("Titel", TW, TH, TD, mats={"vorn": M["titel"], "rand": M["kante"], "hinten": M["flaeche"]}, uv_hinten=(True, False))
titel.location = (TX - TW / 2, TY, 0); titel.rotation_euler = (-TNEIG, 0, 0)
stuetze = karton("Titel_Stuetze", TW, TH, TD, mats={"alle": M["flaeche"], "rand": M["kante"]})
bpy.context.view_layer.update()
top_y = TY + TH * math.sin(TNEIG) + TD
stuetze.location = (TX - TW / 2, top_y + TH * math.sin(TNEIG) + .005, 0); stuetze.rotation_euler = (TNEIG, 0, 0)

# ---------------------------------------------------------------- Druckflächen (leer; der Browser druckt den Text darauf)
def fl_mat(name):
    fl = SZ["druckflaechen"][name]
    grund = PAL.get(fl["grund"], fl["grund"])
    return material("Druck_" + name, grund, bild=platzhalter(name), rau=.9, einblenden=tuple(fl["einblenden"]) if fl.get("einblenden") else None)
druck_lesestelle = basis.druckflaeche("lesestelle", front, "hinten", FW, HF - G, fl_mat("lesestelle"), T)
druck_titel = basis.druckflaeche("titel", titel, "vorn", TW, TH, fl_mat("titel"), TD)

# ---------------------------------------------------------------- Gegenstände als Gruppen (Versatz und Drehung aus der Szenendatei)
def gruppen_bau(name, objekte, pivot):
    g = GEG[name]
    e, M_ = basis.gruppe(name, objekte, pivot, g.get("versatz", [0, 0, 0]), g.get("drehung_z", 0))
    return M_
M_ALT = gruppen_bau("alter_monitor", [crt_boden, sch_rueck, sch_links, sch_rechts, sch_front], (CX, D / 2, 0))
M_NEU = gruppen_bau("neuer_monitor", [fuss, sch_flach], (XF, Y_HALS, 0))
M_TIT = gruppen_bau("titelkarte", [titel, stuetze], (TX, TY, 0))
ROT_Z = lambda name: math.radians(GEG[name].get("drehung_z", 0))

# ---------------------------------------------------------------- Blöcke
F_BLOCK = {k: tuple(v) for k, v in BL["zeiten"].items()}
HOVER, RISE = dict(BL["schweben"]), dict(BL["anheben"])
if HOCH:
    RISE.update(BL.get("anheben_hochkant", {}))   # breitester Block: höher über den Deckel (Kollisionsprüfung)
bpy.context.view_layer.update()
blocks = {}
def welt_front_alt(x, y):  # Druckkoordinate auf der alten Anzeige -> Weltpunkt vor der Front (außen)
    return M_ALT @ Vector((X0 - T + DX0 + x, -T - G - .004 - BT / 2, HF - G - (DY0 + y)))
def welt_schirm(x, y):     # Druckkoordinate auf der neuen Anzeige -> Weltpunkt vor dem Schirm (stehend)
    sx = XF - SW_ / 2 + BZ + x
    return M_NEU @ Vector((sx, Y_HALS - NT - ST - G - .004 - BT * S / 2, Z_SCHIRM + SH_ - (BZ + y)))
for k, (x, y, w, h) in ALT.items():
    mat = material("Block_" + k, "#ffffff", bild=erg["block_" + k]["out"], rau=.8)
    b = karton("Block_" + k, w, h, BT, mats={"vorn": mat, "hinten": mat, "rand": M["kante"]}, uv_hinten=(False, True), zentriert=True)
    # Atlas: Vorderseite linke Hälfte, Rückseite rechte Hälfte
    me = b.data; uv = me.uv_layers[0]; aw = 2 * w + .02
    for p in me.polygons:
        for li in p.loop_indices:
            u, v = uv.data[li].uv
            if p.normal.y > .5:      # Rückseite
                uv.data[li].uv = ((w + .02 + u * w) / aw, v)
            elif p.normal.y < -.5:   # Vorderseite
                uv.data[li].uv = (u * w / aw, v)
    pa = welt_front_alt(x + w / 2, y + h / 2)
    nx, ny, nw, nh = NEUL[k]
    pb = welt_schirm(nx + nw / 2, ny + nh / 2)
    f0, f1 = F_BLOCK[k]
    def fn(f, pa=pa, pb=pb, f0=f0, f1=f1, k=k):
        t = min(1, max(0, (f - f0) / (f1 - f0)))
        e = smm(t)
        arc = math.sin(math.pi * t)
        if HOCH:
            # über den Röhrenmonitor hinweg nach hinten zum Flachbildschirm (kubische Bahn, erst vor und hoch, dann von vorn heran)
            P1 = pa + Vector((0, -.9, 3.0 + RISE[k])); P2 = pb + Vector((0, -1.6, 1.2 + RISE[k] * .5))
            u = e; m = 1 - u
            p = pa * (m ** 3) + P1 * (3 * m * m * u) + P2 * (3 * m * u * u) + pb * (u ** 3)
        else:
            p = pa.lerp(pb, e) + Vector((0, -HOVER[k] * arc, RISE[k] * arc))
        kr = smm((t - .15) / .65)
        s_ = 1 + (S - 1) * smm((t - .1) / .75)
        if f < f0:   # die alte Seite erscheint erst, wenn der Röhrenmonitor steht (Bildschirm schaltet sich ein)
            s_ = smm((f - F_SEITE[0]) / (F_SEITE[1] - F_SEITE[0]))
        return {"loc": p, "rot": Euler((math.pi * kr, 0, ROT_Z("alter_monitor") + (ROT_Z("neuer_monitor") - ROT_Z("alter_monitor")) * e), "XYZ"), "scale": Vector((s_, s_, s_))}
    bewegung(b, fn)
    b["neubau"] = json.dumps({"block": k, "zeit": [f0, f1], "start": "alter_monitor", "ende": "neuer_monitor"})
    blocks[k] = b

# ---------------------------------------------------------------- Schiene und Punkt (Tore aus der Szenendatei, Krümmung 0 an den Toren)
FD_ = SZ["faden"]
TOR_EIN = (tuple(SZ["eingang"][ANORDNUNG]["faden"]["punkt"]), SZ["eingang"][ANORDNUNG]["faden"]["richtung_grad"])
TOR_AUS = (tuple(SZ["ausgang"][ANORDNUNG]["faden"]["punkt"]), SZ["ausgang"][ANORDNUNG]["faden"]["richtung_grad"])
bahn, kap, laenge = basis.bahn_g2(TOR_EIN, TOR_AUS, FD_["kontrolle"][ANORDNUNG], schritt=ov(FD_["tor_schritt"]))
BERICHT_BAHN = basis.bahn_bericht(bahn, kap, laenge)
print("BAHN", json.dumps(BERICHT_BAHN))
rail = basis.schiene("Schiene", bahn, breite=FD_["breite"])
pruef_faden = basis.faden_pruefkoerper(bahn, FD_["breite"] + .08)
FP = FD_["punkt"]
S_TAB, acc = [], 0.0
for f in range(0, F_END + 1):
    v = smm(f / FP["rampe"]) * smm((F_END - f) / FP["rampe"])
    br = 0.0
    for a_, b_ in FP["lesen"]:
        br = max(br, smm((f - (a_ - 12)) / 12) * smm(((b_ + 12) - f) / 12))
    acc += v * (1 - FP["bremse"] * br); S_TAB.append(acc)
S_TAB = [x / acc for x in S_TAB]
s_punkt = lambda f: S_TAB[min(F_END, max(0, int(round(f))))]
def faden_zustand(f):
    n = len(bahn) - 1; sv = min(1, max(0, s_punkt(f))) * n
    i = min(n - 1, int(sv)); p = bahn[i].lerp(bahn[i + 1], sv - i); d = bahn[i + 1] - bahn[i]
    return {"punkt": [round(p.x, 4), round(p.y, 4)], "richtung_grad": round(math.degrees(math.atan2(d.x, d.y)), 2)}
pkt = basis.punkt("Punkt", bahn, laenge, s_punkt)

# ---------------------------------------------------------------- Bewegung backen
basis.backen(F_END)
bpy.context.view_layer.update()

# ---------------------------------------------------------------- Konstruktionsphase (gemeinsamer Baustein)
bau = basis.Konstruktion("Bau")
klapp_teile = [front, links, rechts, rueck, deckel, hals, schirm]
ab_bogen = {"CRT_Front": AUF["front"][0], "CRT_Links": AUF["seiten"][0], "CRT_Rechts": AUF["seiten"][0], "CRT_Rueck": AUF["rueck"][0],
            "CRT_Deckel": AUF["rueck"][0], "Flach_Hals": AUF["flach"][0], "Flach_Schirm": AUF["flach"][0]}
steht = {"CRT_Front": AUF["front"][1], "CRT_Links": AUF["seiten"][1], "CRT_Rechts": AUF["seiten"][1], "CRT_Rueck": AUF["rueck"][1],
         "CRT_Deckel": AUF["deckel"][1], "Flach_Hals": AUF["flach"][1], "Flach_Schirm": AUF["flach"][1], "CRT_Boden": AUF["front"][1], "Flach_Fuss": AUF["flach"][1]}
bau.schnitt(klapp_teile, 0, *F_SCHNITT, ab_bogen, nachbarn=[crt_boden, fuss])
bau.raster(-6.5, 6.5, -2.5, 6.5, *F_RASTER, aus=Z["raster_aus"])
n_ger = bau.geruest([crt_boden, front, links, rechts, rueck, deckel, fuss, hals, schirm], *F_GERUEST, steht, frame_bauform=Z["bauform"])
bau.spur(klapp_teile, {k: v - 10 for k, v in ab_bogen.items()})
bau_obs = bau.bauen()
print(f"BAU: {sum(len(v) for v in bau.striche.values())} Striche, Gerüstkanten {n_ger}, Objekte {[o.name for o in bau_obs]}")

# ---------------------------------------------------------------- Kameras: Einstellungen rahmen ihren Inhalt
KC = SZ["kamera"][ANORDNUNG]
VF = KC["vfov"]; ASP = KC["aspekt"][0] / KC["aspekt"][1]; BILD = tuple(KC["proben_aufloesung"])
KNAME = "Kamera_Handy" if HOCH else "Kamera_Desktop"
geraete_stehend = [crt_boden, front, rueck, links, rechts, deckel, fuss, hals, schirm]
netz = [crt_boden, front, rueck, links, rechts, deckel]
RAHMEN_TEXT = SZ["druckflaechen"]["lesestelle"]["rahmen"]   # Textblock auf der Innenseite der Front (Druckkoordinaten), nur zum Rahmen der Kamera
def flaeche_zu_welt(x, y):
    return front.matrix_world @ Vector((x, T, y))
def text_punkte():
    # Ecken des Textblocks auf der Innenseite der Front im liegenden Zustand
    sc.frame_set(F_END); bpy.context.view_layer.update()
    x0, y0, x1, y1 = RAHMEN_TEXT
    pts = [flaeche_zu_welt(x, y) for x in (x0, x1) for y in (y0, y1)]
    sc.frame_set(0)
    return pts
def front_mitte_x():
    sc.frame_set(F_END); bpy.context.view_layer.update()
    x = (front.matrix_world @ Vector((FW / 2, 0, 0))).x
    sc.frame_set(0)
    return x
H = basis.huellpunkte
alles_flach = H([titel, stuetze] + klapp_teile + [crt_boden, fuss], [0])
bauform = H(geraete_stehend, [Z["bauform"]]) + H([front, links, rechts, rueck, deckel, hals, schirm], list(range(*Z["aufbau_bilder"])))
def rahmt(r):
    was = r["was"]
    if was == "alles_flach": return alles_flach
    if was == "bauform": return bauform
    if was == "geraete_und_bloecke":
        a_, b_, st = r["bilder"]; return H(geraete_stehend + list(blocks.values()), list(range(a_, b_ + 1, st)))
    if was == "front_schirm_fuss": return H([front, schirm, fuss], [r.get("bild", F_END)])
    if was == "lesetext": return text_punkte()
    if was == "netz": return H(netz + [schirm], [r.get("bild", F_END)])
    raise ValueError("unbekannt: rahmt " + was)
E = []
for e in KC["einstellungen"]:
    pts = []
    for r in e["rahmt"]:
        pts += rahmt(r)
    E.append({"name": e["name"], "f0": e["von"], "f1": e["bis"], "neigung": e["neigung"], "gier": e["gier"], "punkte": pts, "rand": e["rand"],
              "lage_v": e.get("lage_v", .5), "x_fest": front_mitte_x() if e.get("x_fest") == "front_mitte" else None})
for e in E:
    e["ort"], e["verschiebung"] = basis.rahmen(e["punkte"], e["neigung"], e["gier"], VF, ASP, rand=e["rand"], lage_v=e["lage_v"], x_fest=e["x_fest"])
cam = basis.kamera(KNAME, VF)
basis._spuren.clear()
basis.kamerafahrt(cam, E, F_END, ASP)
basis.backen(F_END)
for e in E:
    print(f"EINSTELLUNG {e['name']}: Ort {tuple(round(v, 2) for v in e['ort'])}, Neigung {e['neigung']}, Verschiebung {e['verschiebung']:.3f}")

# ---------------------------------------------------------------- Eingang und Ausgang der Szene (Vorbereitung für Übergänge)
def pose(e, f):
    return {"bild": f, "faden": faden_zustand(f),
            "kamera": {"ort": [e["ort"].x, e["ort"].y, e["ort"].z], "neigung": e["neigung"], "gier": e["gier"], "vfov": VF, "verschiebung": e["verschiebung"]}}
UEBERGANG = {"eingang": pose(E[0], 0), "ausgang": pose(E[-1], F_END)}
print("EINGANG", json.dumps(UEBERGANG["eingang"]), "AUSGANG", json.dumps(UEBERGANG["ausgang"]))

# ---------------------------------------------------------------- Prüfung (Form; der Text wird im Browser geprüft: neubau/werkzeug/browser.mjs pruefen)
bericht = {"form_hash": FORM_HASH, "einstellungen": {}, "kollisionen": {}, "hinweise": {}, "uebergang": UEBERGANG, "bahn": BERICHT_BAHN}
teile = [crt_boden, front, rueck, links, rechts, deckel, fuss, hals, schirm, titel, stuetze, pkt] + list(blocks.values())
# zulässig: Teile, die sich an ihrem gemeinsamen Falz berühren (der Karton biegt dort)
erlaubt = [("Titel", "Titel_Stuetze"), ("CRT_Rueck", "CRT_Deckel")]
kol = basis.kollisionen(teile + [pruef_faden], F_END, erlaubt=erlaubt, schritt=1)
for (a, b), fs in kol.items():
    if "Punkt" in (a, b) and "Pruef_Faden" in (a, b):
        continue
    bericht["kollisionen"][f"{a} x {b}"] = {"bilder": [f for f, n in fs][:12], "anzahl_bilder": len(fs)}
print("KOLLISIONEN:", json.dumps(bericht["kollisionen"], ensure_ascii=False) if bericht["kollisionen"] else "keine")
# Einstellungen: Gegenstand ganz im Bild über den Haltebereich
for e in E:
    aus = 0
    for f in range(e["f0"], e["f1"] + 1, 4):
        aus += len(basis.im_bild(cam, ASP, e["punkte"], f, rand=.005))
    bericht["einstellungen"][e["name"]] = {"punkte_ausserhalb": aus}
# Durchgehend (Hinweise, ohne Sollwert): Röhrenmonitor-Netz beim Umlegen und Hochklappen im Bild
aus_um = sum(len(basis.im_bild(cam, ASP, basis.huellpunkte(netz, [f]), f, rand=0)) for f in range(252, F_LESEN[0] + 1, 4))
aus_auf = sum(len(basis.im_bild(cam, ASP, basis.huellpunkte([front, links, rueck, deckel], [f]), f, rand=0)) for f in range(60, 141, 4))
bericht["hinweise"][f"{ANORDNUNG}: Netz beim Umlegen 252–324 im Bild"] = {"punkte_ausserhalb": aus_um}
bericht["hinweise"][f"{ANORDNUNG}: Röhrenmonitor beim Hochklappen 60–140 im Bild"] = {"punkte_ausserhalb": aus_auf}
bericht["huelle"] = basis.huelle_xy([o for o in teile if o.name != "Pruef_Faden"] + [rail, titel], list(range(0, F_END + 1, 20)))
print("PRUEFUNG", json.dumps(bericht, ensure_ascii=False, indent=1))
os.makedirs(os.path.join(NEU, "tmp"), exist_ok=True)
json.dump(bericht, open(os.path.join(NEU, "tmp", f"modernisierung_{ANORDNUNG}_pruefung.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- Probebilder (Form und Bewegung; Text zeigt nur der Browser)
pruef_faden.hide_render = True
if A["proben"]:
    frames = A["frames"] or [52, 166, 236, 352]
    for f in frames:
        t1 = basis.probe(cam, f, os.path.join(PROBEN, f"{ANORDNUNG}_{f:03d}.png"), BILD[0], BILD[1], prozent=200 if HOCH else 100)
        print(f"PROBE {f}: {t1:.1f}s")

# ---------------------------------------------------------------- Export
if A["export"]:
    extras = {
        "szene": "modernisierung", "frames": F_END, "fps": basis.FPS, "form_hash": FORM_HASH,
        "anordnung": ANORDNUNG, "kamera": {"name": KNAME, "vfov": VF, "aspekt": ASP},
        "licht": basis.LICHT, "pal": PAL,
        "einstellungen": [{k: e[k] for k in ("name", "f0", "f1")} for e in E],
        "lesestellen": [list(F_LESEN)],
        "verschiebung": json.loads(cam["neubau_verschiebung"]),
        "gruppen": {n: {"pivot": json.loads(o["neubau"])["pivot"], "versatz": GEG[n].get("versatz", [0, 0, 0]), "drehung_z": GEG[n].get("drehung_z", 0)}
                    for n, o in (("alter_monitor", bpy.data.objects["Gruppe_alter_monitor"]), ("neuer_monitor", bpy.data.objects["Gruppe_neuer_monitor"]),
                                 ("titelkarte", bpy.data.objects["Gruppe_titelkarte"]))},
        "bloecke": {k: json.loads(b["neubau"]) for k, b in blocks.items()},
        "druckflaechen": {"lesestelle": {"w": FW, "h": HF - G}, "titel": {"w": TW, "h": TH}},
        "uebergang": UEBERGANG, "faden_s": [round(s_punkt(f) * laenge, 5) for f in range(F_END + 1)], "bahn": BERICHT_BAHN, "bogen": SZ["bogen"], "huelle": bericht["huelle"],
    }
    out = os.path.join(NEU, "seite", "assets", f"modernisierung-{ANORDNUNG}.glb")
    n = basis.export_glb(out, extras, draco="--draco" in sys.argv)
    print(f"EXPORT {out} {n / 1024:.0f} KB")
