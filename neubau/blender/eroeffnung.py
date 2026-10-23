# Szene 1 Eröffnung (DREHBUCH-NEUBAU, Abschnitt 3.1). Baut Form, Animation und beide Kameraspuren, prüft und exportiert.
# Inhalte kommen aus neubau/szenen/eroeffnung.json. Normalerweise ruft das neubau/bauen.py auf; einzeln:
#   blender.exe -b --factory-startup --python neubau/blender/eroeffnung.py -- [--hochkant] [--proben] [--export] [--frames=0,120]
#
# Ablauf (Bilder 0…560, Scrollweg gleichmäßig):
#   0–12    Startbild: nur der Name (Papierlettern, Marke N4) steht auf dem Bogen, Kamera flach davor, keine Fläche im Bild.
#   14–62   Pop-up-Podest: ein Streifen aus dem Bogen faltet sich zur Stufe (Parallelfalz), die Lettern fahren mit hoch; Ortszeile und
#           Kernsatz drucken sich auf die Vorderseite (64–80). Kamera hebt sich und rahmt Name und Podest (D2).
#   124–262 Konstruktionsphase, gestrafft (basis.Konstruktion): Schnitt- und Falzlinien, Raster, Gerüst, Bleistiftspur, dann Hochklappen:
#           Schreibtisch (Platte hebt sich parallel, Beine schwenken nach unten), Rechner (Tower), Wegweiser (Pfosten mit drei Brettern).
#   238–292 Auf der Platte zeichnet sich die Skizze einer Website, das Blatt (Fuß, Hals, Schirm) steht auf und wird zum Bildschirm.
#   286–346 Leben auf dem Tisch: Tablett (Deko), Tastatur, Maus, Tasse, Becher mit Stiften, Pflanze, Lampe; das Kabel zeichnet sich
#           vom Bildschirm über die Platte, das Tischbein und den Bogen zum Rechner (Statuspunkt).
#   346–480 Die drei Sätze drucken sich nacheinander auf die drei Bretter des Wegweisers (346, 386, 426), Kamera still.
#   480–560 Kamera fährt zum Rechner; der Punkt der Schiene kommt am Statuspunkt an (Ausgang der Szene).
import importlib, json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import basis, szene
importlib.reload(basis)
from basis import PAL, KARTON as T, SPALT as G, material, karton, prisma, leer, anhaengen, klappe, bewegung, fenster, smm, sm, zylinder, faltpanel, gefaess, lettern
from mathutils import Vector, Euler, Matrix
import bpy

A = basis.args()
HOCH = "--hochkant" in sys.argv
ANORDNUNG = "hochkant" if HOCH else "breit"
SZ = szene.lade("eroeffnung")
FORM_HASH = szene.form_hash(SZ)
GEG, Z = SZ["gegenstaende"], SZ["zeiten"]
F_END = SZ["bilder"]
NEU = basis.NEUBAU
PROBEN = os.path.join(NEU, "proben", "eroeffnung", "blender")
os.makedirs(PROBEN, exist_ok=True)
SCHRIFTEN = os.path.join(basis.HIER, "schriften")


def ov(v):
    """Wert je Anordnung: {"breit": a, "hochkant": b} oder einfacher Wert."""
    return v[ANORDNUNG] if isinstance(v, dict) and ("breit" in v or "hochkant" in v) else v


def form(g):
    return {k: ov(v) for k, v in GEG[g]["form"].items()}


def lage(g):
    return GEG[g]["lage"][ANORDNUNG]


sc = basis.buehne(F_END, bogen=tuple(SZ["bogen"]))

# ---------------------------------------------------------------- Farben (kräftiger gegen den Bogen als in der ersten Fassung)
INK = PAL["tinte"]
def ink(a):
    c = [int(INK[i:i + 2], 16) for i in (1, 3, 5)]
    return "#%02x%02x%02x" % tuple(round(255 - (255 - v) * a) for v in c)
C = {"podest_vorn": "#e3e8f0", "podest_deck": "#d3dae6", "podest_hinten": "#b9c3d1", "platte": "#c9d1de", "bein": "#adb7c6", "kante": "#8b95a6",
     "gehaeuse": "#b4bdcb", "front": "#c9d1dd", "metall": "#a3aebd", "brett": "#f1f4fa", "pfosten": "#a9b3c2", "fuss": "#b7c0ce", "grau": "#99a4b4", "hell": "#e1e6ee"}
M = {k: material("E_" + k, v) for k, v in C.items()}
M["kante"] = material("Kante", C["kante"])
M["pkante"] = material("PodestKante", "#d3dae6")      # Kanten des Podests hell: im Startbild liegt der Streifen flach im Bogen und darf nicht als dunkle Linie hinter den Lettern stehen
M["tinte"] = material("Tinte", PAL["tinte"], rau=.7)
M["rot"] = material("Rot", PAL["rot"], rau=.6)
M["boden"] = material("E_boden", PAL["grau1"])
M["papier"] = material("Papier", PAL["papier"])


def druck_bild(name, w, h, px, bg, cmds):
    return basis.druck([{"name": name, "w": w, "h": h, "px": px, "bg": bg, "cmds": cmds}])[0]["out"]


def platzhalter(name):
    fl = SZ["druckflaechen"][name]
    return basis.druck([{"name": "platzhalter_" + name, "w": 1, "h": 1, "px": 4, "bg": PAL.get(fl["grund"], fl["grund"]), "cmds": []}])[0]["out"]


def fl_mat(name):
    fl = SZ["druckflaechen"][name]
    return material("Druck_" + name, PAL.get(fl["grund"], fl["grund"]), bild=platzhalter(name), rau=.9, einblenden=tuple(fl["einblenden"]) if fl.get("einblenden") else None)


# ================================================================ Podest (Parallelfalz): Vorderseite, Deck, Rückseite aus einem Streifen
PF = form("podest"); PL = lage("podest")
PW, PH, PD, PT = PF["breite"], PF["hoehe"], PF["tiefe"], PF["dicke"]
PX, PZ = PL["x"], PL["y"]            # PZ: Vorderfläche der Vorderseite
Z_POD = tuple(Z["podest"])
front = karton("P_Front", PW, PH, PT, mats={"vorn": M["podest_vorn"], "hinten": M["podest_hinten"], "rand": M["pkante"]}, mitte_x=True)
front.location = (PX, PZ, 0)
deck = karton("P_Deck", PW, PD, PT, mats={"vorn": M["podest_deck"], "hinten": M["podest_hinten"], "rand": M["pkante"]}, mitte_x=True, liegend=True)
deck.location = (PX, PZ + PT, PH + G)
back = karton("P_Back", PW, PH, PT, mats={"vorn": M["podest_hinten"], "hinten": M["podest_hinten"], "rand": M["pkante"]}, mitte_x=True)
back.location = (PX, PZ + PD, 0)
sch_pf = klappe("Sch_PFront", (PX, PZ + PT, 0), "x", -90, Z_POD, None, [front])
sch_pd = klappe("Sch_PDeck", (PX, PZ + PT, PH), "x", 90, Z_POD, None, [deck])
sch_pb = klappe("Sch_PBack", (PX, PZ + PD, PH), "x", 90, Z_POD, None, [back])
anhaengen(sch_pb, sch_pd); anhaengen(sch_pd, sch_pf)

# ---------------------------------------------------------------- Marke N4: Papierlettern auf dem Deck, Falzlinie darunter
MK = SZ["marke"]
ref, (rx0, rx1, rz0, rz1) = lettern("Marke_ref", MK["text"], {"aufrecht": os.path.join(SCHRIFTEN, "NewsreaderMarke.ttf"), "kursiv": os.path.join(SCHRIFTEN, "NewsreaderMarkeKursiv.ttf")}, 1.0, M["tinte"], MK["dicke"], MK["kursiv_ab"])
bpy.data.objects.remove(ref, do_unlink=True)
DOT_R = .085                                   # Radius des Schlusspunkts in em (Bestand wortmarke.js)
DOT_GAP = .02                                  # Abstand zum letzten Buchstaben in em
ges = (rx1 - rx0) + DOT_GAP + 2 * DOT_R
EM = ov(MK["breite"]) / ges                    # Schriftgröße so, dass Name samt Punkt die Zielbreite hat
name_ob, (nx0, nx1, nz0, nz1) = lettern("Marke", MK["text"], {"aufrecht": os.path.join(SCHRIFTEN, "NewsreaderMarke.ttf"), "kursiv": os.path.join(SCHRIFTEN, "NewsreaderMarkeKursiv.ttf")}, EM, M["tinte"], MK["dicke"], MK["kursiv_ab"])
ges_w = (nx1 - nx0) + (DOT_GAP + 2 * DOT_R) * EM
NAME_X = PX - ges_w / 2 - nx0                  # linker Nullpunkt des Textes in Weltkoordinaten
NAME_Y = PZ + PT + MK["abstand_vorn"]          # Vorderseite der Lettern auf dem Deck (Bauform)
NAME_Z = PH + G + PT + G - nz0                 # Oberseite des Decks (+ Spalt); tiefster Punkt der Rundungen (Überhang unter der Grundlinie) liegt auf dem Deck
name_ob.location = (NAME_X, NAME_Y, NAME_Z)
dot_ob = zylinder("Marke_Punkt", DOT_R * EM, MK["dicke"], 48, M["rot"])
dot_ob.rotation_euler = (-math.pi / 2, 0, 0)
dot_ob.location = (NAME_X + nx1 + DOT_GAP * EM + DOT_R * EM, NAME_Y, NAME_Z + nz0 + DOT_R * EM)
bpy.context.view_layer.update()
anhaengen(name_ob, sch_pd); anhaengen(dot_ob, sch_pd)

# ================================================================ Schreibtisch (Parallelfalz aus Platte und zwei Beinen)
DF = form("schreibtisch"); DL_ = lage("schreibtisch")
DW, DD, DH, DP, DB = DF["breite"], DF["tiefe"], DF["hoehe"], DF["platte"], DF["bein"]
DX, DY = DL_["x"], DL_["y"]
Z_TISCH = tuple(Z["tisch"])
plate = karton("D_Platte", DW, DD, DP, mats={"vorn": M["platte"], "hinten": M["bein"], "rand": M["kante"]}, mitte_x=True, liegend=True)
plate.location = (DX, DY, DH)
LG = DH - G                                      # Beinlänge: zwischen Beinoberkante und Platte bleibt der Spalt G (nichts berührt sich in der Ruhelage)
def bein(name, x_hinge, rot):
    b = karton(name, DD - 2 * G, LG, DB, mats={"vorn": M["bein"], "hinten": M["bein"], "rand": M["kante"]}, mitte_x=True)
    b.rotation_euler = (0, 0, rot); b.location = (x_hinge, DY + DD / 2, 0)
    return b
beinL = bein("D_BeinL", DX - DW / 2, -math.pi / 2)
beinR = bein("D_BeinR", DX + DW / 2, math.pi / 2)
abdruck_t = karton("D_Abdruck", DW - 2 * G, DD - 2 * G, .002, mats={"alle": M["boden"]}, mitte_x=True, liegend=True)
abdruck_t.location = (DX, DY + G, 0)
tisch_wurzel = leer("Tisch_Wurzel", (0, 0, 0))
sch_bl = klappe("Sch_BeinL", (DX - DW / 2, DY + DD / 2, LG), "y", 90, Z_TISCH, None, [beinL])
sch_br = klappe("Sch_BeinR", (DX + DW / 2, DY + DD / 2, LG), "y", -90, Z_TISCH, None, [beinR])
anhaengen(plate, tisch_wurzel); anhaengen(sch_bl, tisch_wurzel); anhaengen(sch_br, tisch_wurzel)
def tisch_hoehe(f):
    a = math.radians(90) * fenster(f, *Z_TISCH)        # Winkel der Beine gegen den Bogen: Unterkante der Platte = DH sin a + DB cos a
    return LG * math.sin(a) + DB * math.cos(a) + G - DH
bewegung(tisch_wurzel, lambda f: {"loc": Vector((0, 0, tisch_hoehe(f)))})
Z_TOP = DH + DP                                 # Oberseite der Platte in der Bauform (Weltkoordinaten)

# ---------------------------------------------------------------- Bildschirm auf der Platte (Fuß, Hals, Blatt mit Skizze -> Bild)
MF = form("monitor"); ML = lage("monitor")
XM, Y_HALS = DX + ML["x"], DY + ML["y_hals"]
FB, FT, FD = MF["fuss"]; NW, NH, NT = MF["hals"]; SW_, SH_, ST = MF["schirm"]
BZ, BZU, Z_SCHIRM = MF["rand_oben"], MF["kinn"], MF["z_schirm"]
NDW, NDH = SW_ - 2 * BZ, SH_ - BZ - BZU
fuss = karton("M_Fuss", FB, FT, FD, mats={"alle": M["metall"], "rand": M["kante"]}, liegend=True)
fuss.location = (XM - FB / 2, Y_HALS - NT - G - FT, Z_TOP + G)
hals = karton("M_Hals", NW, NH, NT, mats={"alle": M["metall"], "rand": M["kante"]})
hals.location = (XM - NW / 2, Y_HALS - NT, Z_TOP + G)

def web_cmds(w, h):
    """Die Website als Druckbefehle (Bildschirm) und als Linienliste (Skizze), Koordinaten in Einheiten des Anzeigefelds (w x h),
    Entwurf auf 1000 x 625 (Bestand eroeffnung.js)."""
    su, sv = w / 1000.0, h / 625.0
    boxen, linien = [], []
    def box(x, y, bw, bh, a, r=2):
        boxen.append({"rect": [x * su, y * sv, bw * su, bh * sv], "fill": ink(a), "r": r * su})
        linien.append(("rect", x * su, y * sv, bw * su, bh * sv))
    def txt(x, y, bw, bh, a):
        boxen.append({"rect": [x * su, y * sv, bw * su, bh * sv], "fill": ink(a), "r": bh * sv / 2})
        linien.append(("line", x * su, (y + bh / 2) * sv, (x + bw) * su, (y + bh / 2) * sv))
    box(60, 46, 118, 22, .85)
    for i in range(4): txt(600 + i * 88, 52, 62, 10, .4)
    boxen.append({"rect": [0, 100 * sv, w, 2 * sv], "fill": ink(.12)}); linien.append(("line", 0, 101 * sv, w, 101 * sv))
    box(60, 150, 430, 42, .82); box(60, 204, 300, 42, .82)
    for i, bw in enumerate((400, 380, 260)): txt(60, 276 + i * 24, bw, 10, .3)
    boxen.append({"rect": [60 * su, 362 * sv, 150 * su, 44 * sv], "fill": PAL["rot"], "r": 4 * su}); linien.append(("rect", 60 * su, 362 * sv, 150 * su, 44 * sv))
    boxen.append({"rect": [560 * su, 140 * sv, 380 * su, 280 * sv], "fill": ink(.07)})
    pl = [(560, 420), (560 + 380 * .32, 140 + 280 * .45), (560 + 380 * .55, 140 + 280 * .72), (560 + 380 * .7, 140 + 280 * .58), (940, 420)]
    for (a, b), (c, d) in zip(pl, pl[1:]):
        boxen.append({"line": [a * su, b * sv, c * su, d * sv], "stroke": ink(.3), "lw": 2.5 * su})
    linien.append(("rect", 560 * su, 140 * sv, 380 * su, 280 * sv)); linien.append(("line", 560 * su, 140 * sv, 940 * su, 420 * sv)); linien.append(("line", 940 * su, 140 * sv, 560 * su, 420 * sv))
    for c in range(3):
        X = 60 + c * 300
        box(X, 470, 150, 14, .7)
        for i, bw in enumerate((240, 220, 170)): txt(X, 500 + i * 20, bw, 8, .26)
    boxen.append({"rect": [0, 590 * sv, w, 2 * sv], "fill": ink(.12)})
    return boxen, linien

scr_cmds = [{"rect": [0, 0, SW_, SH_], "fill": ink(.86), "r": .04}, {"rect": [BZ, BZ, NDW, NDH], "fill": "#ffffff"}]
w_boxen, w_linien = web_cmds(NDW, NDH)
for c in w_boxen:
    c = json.loads(json.dumps(c))
    if "rect" in c: c["rect"][0] += BZ; c["rect"][1] += BZ
    if "line" in c: c["line"][0] += BZ; c["line"][2] += BZ; c["line"][1] += BZ; c["line"][3] += BZ
    scr_cmds.append(c)
scr_cmds.append({"circle": [SW_ / 2, SH_ - BZU / 2, .02], "fill": ink(.5)})
Z_BILD = (Z["bildschirm"][0], Z["bildschirm"][1])
mat_scr = material("M_Schirm", PAL["flaeche"], bild=druck_bild("web_front", SW_, SH_, 360, PAL["flaeche"], scr_cmds), einblenden=Z_BILD, rau=.8)
schirm = karton("M_Schirm", SW_, SH_, ST, mats={"vorn": mat_scr, "hinten": M["metall"], "rand": M["kante"]})
schirm.location = (XM - SW_ / 2, Y_HALS - NT - ST - G, Z_TOP + G + Z_SCHIRM)
Z_MON = tuple(Z["monitor"])
sch_mon = klappe("Sch_Monitor", (0, Y_HALS, Z_TOP + G), "x", -90, Z_MON, None, [hals, schirm])
anhaengen(fuss, tisch_wurzel); anhaengen(sch_mon, tisch_wurzel)

# ---------------------------------------------------------------- Dinge auf dem Tisch
def auf_platte(g):
    L = lage(g); return DX + L["x"], DY + L["y"]
# Tablett (Deko, ohne Text) mit Stift: liegt von Anfang an auf der Platte
TF = form("tablett"); tx, ty = auf_platte("tablett")
tablett_cmds = [{"rect": [.08, .08, TF["breite"] - .16, TF["tiefe"] - .16], "fill": "#cfd5df", "stroke": ink(.35), "lw": .008, "r": .05},
                {"rect": [.28, .2, TF["breite"] - .86, TF["tiefe"] - .4], "fill": "#eef1f6", "stroke": ink(.5), "lw": .01, "r": .03}]
for i in range(4):
    tablett_cmds.append({"circle": [TF["breite"] - .32, .3 + i * .22, .04], "fill": "#e4e8ef", "stroke": ink(.45), "lw": .006})
m_tab = material("E_tablett", C["grau"], bild=druck_bild("tablett", TF["breite"], TF["tiefe"], 220, C["grau"], tablett_cmds))
tablett = karton("E_Tablett", TF["breite"], TF["tiefe"], TF["dicke"], mats={"vorn": m_tab, "hinten": M["grau"], "rand": M["kante"]}, liegend=True, mitte_x=True)
tablett.location = (tx, ty, Z_TOP + G)
stift = karton("E_Stift", .05, .95, .045, mats={"alle": M["tinte"]}, liegend=True, mitte_x=True)
stift.rotation_euler = (0, 0, math.radians(-24)); stift.location = (tx + .28, ty + .2, Z_TOP + G + TF["dicke"] + G)
# Tastatur und Maus: flache Papierkörper mit Druck
KF = form("tastatur"); kx, ky = auf_platte("tastatur")
key_cmds = [{"rect": [.04, .04, KF["breite"] - .08, KF["tiefe"] - .08], "fill": "#dde2ea", "stroke": ink(.35), "lw": .008, "r": .04}]
rows = [(14, .0), (14, .0), (13, .08), (11, .15)]
for r, (n, off) in enumerate(rows):
    kw = (KF["breite"] - .3) / 14
    for i in range(n):
        key_cmds.append({"rect": [.15 + off + i * kw, .1 + r * .14, kw - .025, .1], "fill": "#f4f6fa", "stroke": ink(.3), "lw": .005, "r": .015})
m_key = material("E_tastatur", C["hell"], bild=druck_bild("tastatur", KF["breite"], KF["tiefe"], 200, C["hell"], key_cmds))
tastatur = karton("E_Tastatur", KF["breite"], KF["tiefe"], KF["dicke"], mats={"vorn": m_key, "hinten": M["grau"], "rand": M["kante"]}, liegend=True, mitte_x=True)
tastatur.location = (kx, ky, Z_TOP + G)
MsF = form("maus"); mx_, my_ = auf_platte("maus")
maus_cmds = [{"rect": [.03, .03, MsF["breite"] - .06, MsF["tiefe"] - .06], "fill": "#e6eaf1", "stroke": ink(.4), "lw": .008, "r": .12},
             {"line": [MsF["breite"] / 2, .05, MsF["breite"] / 2, .32], "stroke": ink(.4), "lw": .007}, {"line": [.04, .32, MsF["breite"] - .04, .32], "stroke": ink(.4), "lw": .007}]
m_maus = material("E_maus", C["hell"], bild=druck_bild("maus", MsF["breite"], MsF["tiefe"], 240, C["hell"], maus_cmds))
maus = karton("E_Maus", MsF["breite"], MsF["tiefe"], MsF["dicke"], mats={"vorn": m_maus, "hinten": M["grau"], "rand": M["kante"]}, liegend=True, mitte_x=True)
maus.location = (mx_, my_, Z_TOP + G)
for o in (tablett, stift, tastatur, maus):
    anhaengen(o, tisch_wurzel)

# Tasse, Becher (mit Stiften), Pflanze: Papiernetze, die sich aufstellen
ZD = Z["dinge"]; Tt = .016
FARBEN_G = {"alle": M["hell"]}
def netz_auf_platte(name, g, mat_aussen, mat_boden, auf_wand, versatz=2):
    F = form(g); x, y = auf_platte(g)
    boden, wande = gefaess(name, (x, y), Z_TOP + G, F["apothem"], F["hoehe"], F["ecken"], Tt, mat_aussen, mat_boden, auf_wand, versatz=versatz)
    return F, x, y, boden, wande
m_innen = material("E_innen", "#d9dee7")
m_kaffee = material("E_kaffee", "#7c8696", rau=.5)
F_t, tx_, ty_, tasse_boden, tasse_w = netz_auf_platte("Tasse", "tasse", M["hell"], m_kaffee, ZD["gefaesse"], ZD["gefaess_versatz"])
F_b, bx_, by_, becher_boden, becher_w = netz_auf_platte("Becher", "becher", M["grau"], m_innen, (ZD["gefaesse"][0] + 6, ZD["gefaesse"][1] + 6), ZD["gefaess_versatz"])
F_p, px_, py_, topf_boden, topf_w = netz_auf_platte("Topf", "pflanze", M["fuss"], m_innen, (ZD["gefaesse"][0] + 26, ZD["gefaesse"][1] + 20), ZD["gefaess_versatz"])
# Stifte im Becher: stehen vor den Wänden auf (die Wände schließen sich danach um sie)
stifte = []
for i, (az, lg, farbe) in enumerate(((20, .78, M["tinte"]), (140, .66, M["grau"]), (265, .86, M["tinte"]))):
    u = basis.richtung_vektor(az); r0 = .1
    p, g_, r_ = faltpanel(f"Stift{i}", (bx_ + u.x * r0, by_ + u.y * r0, Z_TOP + G + .02), az, .05, lg, .04, {"alle": farbe}, (ZD["gefaesse"][0] - 4 + i, ZD["gefaesse"][0] + 8 + i))
    stifte.append(p)
# Blätter der Pflanze: stehen zuerst auf, der Topf schließt sich danach um sie
blaetter = []
nb = F_p["blaetter"]
for i in range(nb):
    az = 360 * i / nb + 12
    u = basis.richtung_vektor(az); r0 = .1
    bl = prisma(f"Blatt{i}", [(0, 0), (.08, .26), (0, F_p["blatt_hoehe"]), (-.08, .26)], "y", .014, M["hell"] if i % 2 else M["grau"])
    psi = math.radians(180 - az)
    rah = leer(f"Blatt{i}_rahmen", Vector((px_ + u.x * r0, py_ + u.y * r0, Z_TOP + G + .02)))
    rah.rotation_euler = (0, 0, psi)
    gel = klappe(f"Blatt{i}_gelenk", (0, 0, 0), "x", 70, (ZD["blaetter"][0] + 2 * i, ZD["blaetter"][1] + 2 * i), None, [], eltern=rah)
    bl.parent = gel; bl.matrix_parent_inverse = Matrix.Identity(4); bl.location = (0, 0, 0); bl.rotation_euler = (math.radians(20), 0, 0)
    blaetter.append(bl)
kaffee_dummy = None
# Lampe: Fuß (flache Scheibe) liegt auf der Platte; Arm mit Kopf stellen sich vom Fuß aus nach oben auf
LF = form("lampe"); lx, ly = auf_platte("lampe")
FU_H = .014
lampe_fuss = zylinder("L_Fuss", LF["fuss_radius"], FU_H, 8, M["fuss"], ort=(lx, ly, Z_TOP + G))
Z_ARM = Z_TOP + G + FU_H + G
ARM_Y = ly - LF["fuss_radius"] * .45                       # Vorderfläche des Arms
lampe_arm = karton("L_Arm", .09, LF["arm_hoehe"], .03, mats={"alle": M["grau"], "rand": M["kante"]}, mitte_x=True)
lampe_arm.location = (lx, ARM_Y, Z_ARM)
kw_, kh_, kd_ = LF["kopf"]
lampe_kopf = prisma("L_Kopf", [(-kw_ / 2, 0), (kw_ / 2, 0), (kw_ * .2, kh_), (-kw_ * .2, kh_)], "y", .03, M["podest_vorn"], ursprung=(lx, ARM_Y + .03 + G, Z_ARM + LF["arm_hoehe"] - kh_ * .55))
sch_lampe = klappe("Sch_Lampe", (lx, ARM_Y, Z_ARM), "x", 90, ZD["lampe"], None, [lampe_arm, lampe_kopf])
anhaengen(lampe_fuss, tisch_wurzel)
# alles, was auf der Platte steht, hängt an der Tischwurzel (bewegt sich mit der Platte)
def an_tisch(o):
    anhaengen(o, tisch_wurzel)
for o in [tasse_boden, becher_boden, topf_boden]:
    an_tisch(o)
for o in bpy.data.objects:
    if o.type == "EMPTY" and o.parent is None and any(o.name.startswith(p) for p in ("Tasse_w", "Becher_w", "Topf_w", "Stift", "Blatt", "Sch_Lampe")):
        an_tisch(o)

# ================================================================ Rechner (Tower): Netz aus Boden, vier Wänden und Deckel (Klappmechanik wie der Röhrenmonitor, flaches Dach)
RF = form("rechner"); RL = lage("rechner")
RW, RD, RHH = RF["breite"], RF["tiefe"], RF["hoehe"]
RX, RY = RL["x"], RL["y_vorn"]
X0, X1 = RX - RW / 2, RX + RW / 2
FWR = RW + 2 * T
ZR = {k: tuple(v) for k, v in Z["rechner"].items()}
def tower_front_cmds():
    s = 1.0; Hh = RHH - G; cmds = [{"rect": [.05, .05, FWR - .1, Hh - .1], "fill": "#cfd6e0", "stroke": ink(.45), "lw": .01, "r": .03}]
    cmds += [{"rect": [.14, .12, FWR - .28, .15], "fill": "#bcc4d0", "stroke": ink(.5), "lw": .008, "r": .015}, {"line": [.24, .195, FWR - .5, .195], "stroke": ink(.55), "lw": .012}]
    cmds += [{"rect": [.14, .38, .42, .07], "fill": "#c8cfda", "stroke": ink(.42), "lw": .008, "r": .012}]
    ly_ = Hh - RF["led"][1]
    cmds += [{"circle": [T + RF["led"][0], ly_, .085], "fill": "#e3e7ee", "stroke": ink(.4), "lw": .01}]          # Fassung des Statuspunkts
    bx = FWR - .38
    cmds += [{"circle": [bx, ly_, .09], "fill": "#e3e7ee", "stroke": ink(.62), "lw": .012}, {"circle": [bx, ly_, .045], "stroke": ink(.62), "lw": .01}]
    for r in range(11):
        yy = .75 + r * .08
        for c_ in range(4):
            xx = .18 + (.1 if r % 2 else 0) + c_ * .2
            if xx + .12 < FWR - .14: cmds.append({"line": [xx, yy, xx + .12, yy], "stroke": ink(.34), "lw": .026})
    return cmds
m_tfront = material("T_Front", C["front"], bild=druck_bild("tower_front", FWR, RHH - G, 280, C["front"], tower_front_cmds()))
boden_r = karton("T_Boden", RW - 2 * G, RD - 2 * G, .002, mats={"alle": M["boden"]}, liegend=True)
boden_r.location = (X0 + G, RY + G, 0)
tfront = karton("T_Front", FWR, RHH - G, T, mats={"vorn": m_tfront, "hinten": M["front"], "rand": M["kante"]}, uv_hinten=(False, True))
tfront.location = (X0 - T, RY - T - G, 0)
trueck = karton("T_Rueck", FWR, RHH - G, T, mats={"alle": M["gehaeuse"], "rand": M["kante"]})
trueck.location = (X0 - T, RY + RD + G, 0)
def seite(name, x_hinge, rot):
    s = karton(name, RD - 2 * G, RHH - G, T, mats={"alle": M["gehaeuse"], "rand": M["kante"]}, mitte_x=True)
    s.rotation_euler = (0, 0, rot); s.location = (x_hinge, RY + RD / 2, 0)
    return s
tlinks = seite("T_Links", X0 - T - G, -math.pi / 2)
trechts = seite("T_Rechts", X1 + T + G, math.pi / 2)
tdeckel = karton("T_Deckel", FWR, RD + 2 * T, T, mats={"vorn": M["gehaeuse"], "hinten": M["gehaeuse"], "rand": M["kante"]}, liegend=True)
tdeckel.location = (X0 - T, RY - T, RHH + G)
bpy.context.view_layer.update()
sch_tf = klappe("Sch_TFront", (0, RY - T - G, 0), "x", 90, ZR["front"], None, [tfront])
y_h = RY + RD + T + G
sch_tr = klappe("Sch_TRueck", (0, y_h, 0), "x", -90, ZR["rueck"], None, [trueck])
A0 = tdeckel.matrix_world @ Vector((0, RD + 2 * T, 0)); B0 = tdeckel.matrix_world @ Vector((0, 0, 0))
L_D = RD + 2 * T; H_R = RHH - G
A1 = Vector((0, y_h + H_R + 2 * G, T)); B1 = Vector((0, y_h + H_R + 2 * G + L_D, T))
zur = lambda p: Vector((0, y_h - p.z, p.y - y_h))
A1r, B1r = zur(A1), zur(B1)
(py_d, pz_d), ang_d = basis.drehpunkt_2d((A0.y, A0.z), (B0.y, B0.z), (A1r.y, A1r.z), (B1r.y, B1r.z))
sch_td = klappe("Sch_TDeckel", (0, py_d, pz_d), "x", ang_d, ZR["deckel"], None, [tdeckel])
anhaengen(sch_td, sch_tr)
sch_tl = klappe("Sch_TLinks", (X0 - T - G, 0, 0), "y", -90, ZR["seiten"], None, [tlinks])
sch_trr = klappe("Sch_TRechts", (X1 + T + G, 0, 0), "y", 90, ZR["seiten"], None, [trechts])
# Statuspunkt: roter Punkt in der Fassung auf der Front, bewegt sich mit der Front
led = zylinder("T_Led", .06, .012, 32, M["rot"])
led.rotation_euler = (-math.pi / 2, 0, 0)
led.location = (X0 + RF["led"][0], RY - T - G - .0008 - .012, RF["led"][1])     # dicht vor der Frontfläche, in der gedruckten Fassung
bpy.context.view_layer.update()
anhaengen(led, sch_tf)

# ================================================================ Wegweiser: Fuß (liegt im Bogen), Pfosten mit drei Pfeilbrettern stellt sich dahinter auf
WF = form("wegweiser"); WL = lage("wegweiser")
WX, WY = WL["x"], WL["y"]
PB, PHH, PTT = WF["pfosten"]
FBW, FBD, FBT = WF["fuss"]
BW, BH, BT = WF["brett"]; SP, LU, UK = WF["spitze"], WF["luecke"], WF["unterkante"]
w_fuss = karton("W_Fuss", FBW, FBD, FBT, mats={"alle": M["fuss"], "rand": M["kante"]}, liegend=True, mitte_x=True)
w_fuss.location = (WX, WY - FBD - G, 0)
pfosten = karton("W_Pfosten", PB, PHH, PTT, mats={"vorn": M["pfosten"], "hinten": M["pfosten"], "rand": M["kante"]}, mitte_x=True)
pfosten.location = (WX, WY, 0)
bretter = []
for i in range(3):
    rechts = (i % 2 == 0)       # Spitze nach rechts, links, rechts
    um = [(0, 0), (BW - SP, 0), (BW, BH / 2), (BW - SP, BH), (0, BH)] if rechts else [(BW, 0), (BW, BH), (SP, BH), (0, BH / 2), (SP, 0)]
    b = prisma(f"W_Brett{i + 1}", um, "y", BT, M["brett"], ursprung=(WX - BW / 2, WY - BT - G, UK + (2 - i) * (BH + LU)))
    bretter.append((b, rechts))
Z_WEG = tuple(Z["wegweiser"])
sch_weg = klappe("Sch_Weg", (WX, WY + PTT, 0), "x", -90, Z_WEG, None, [pfosten] + [b for b, _ in bretter])
# Druckflächen der drei Sätze (leer, der Browser druckt)
FL_W, FL_H = BW - SP - .2, BH - .12
for i, (b, rechts) in enumerate(bretter):
    basis.druckflaeche(f"satz{i + 1}", b, "vorn", FL_W, FL_H, fl_mat(f"satz{i + 1}"), BT, x0=(.1 if rechts else SP + .1), z0=.06)

# ================================================================ Druckfläche Kern (Vorderseite des Podests: Ortszeile, Kernsatz)
basis.druckflaeche("kern", front, "vorn", PW, PH, fl_mat("kern"), PT, x0=-PW / 2, z0=0)

# ================================================================ Schiene und Punkt
FD_ = SZ["faden"]
TOR_EIN = (tuple(SZ["eingang"][ANORDNUNG]["faden"]["punkt"]), SZ["eingang"][ANORDNUNG]["faden"]["richtung_grad"])
TOR_AUS = (tuple(SZ["ausgang"][ANORDNUNG]["faden"]["punkt"]), SZ["ausgang"][ANORDNUNG]["faden"]["richtung_grad"])
bahn, kap, laenge = basis.bahn_g2(TOR_EIN, TOR_AUS, FD_["kontrolle"][ANORDNUNG], schritt=FD_["tor_schritt"])
BERICHT_BAHN = basis.bahn_bericht(bahn, kap, laenge)
print("BAHN", json.dumps(BERICHT_BAHN))
rail = basis.schiene("Schiene", bahn, breite=FD_["breite"])
pruef_faden = basis.faden_pruefkoerper(bahn, FD_["breite"] + .08)
FP = FD_["punkt"]
def _ramp(x):
    return smm(x)
S_TAB = []
acc = 0.0
for f in range(0, F_END + 1):
    v = 0.0
    if FP["start_bild"] <= f <= FP["ende_bild"]:
        v = _ramp((f - FP["start_bild"]) / FP["rampe"]) * _ramp((FP["ende_bild"] - f) / FP["rampe"])
        br = 0.0
        for a_, b_ in FP["lesen"]:
            br = max(br, smm((f - (a_ - 12)) / 12) * smm(((b_ + 12) - f) / 12))
        v *= 1 - FP["bremse"] * br
    acc += v
    S_TAB.append(acc)
S_TAB = [s / acc for s in S_TAB]
s_punkt = lambda f: S_TAB[min(F_END, max(0, int(round(f))))]
pkt = basis.punkt("Punkt", bahn, laenge, s_punkt, erscheint=(FP["start_bild"] - 10, FP["start_bild"] + 8))
def faden_zustand(f):
    n = len(bahn) - 1; sv = min(1, max(0, s_punkt(f))) * n
    i = min(n - 1, int(sv)); p = bahn[i].lerp(bahn[i + 1], sv - i); d = bahn[i + 1] - bahn[i]
    return {"punkt": [round(p.x, 4), round(p.y, 4)], "richtung_grad": round(math.degrees(math.atan2(d.x, d.y)), 2)}

# ---------------------------------------------------------------- Bewegung backen
basis.backen(F_END)
bpy.context.view_layer.update()

# ================================================================ Konstruktionsphase (gemeinsamer Baustein)
bau = basis.Konstruktion("Bau")
# Skizze der Website auf dem liegenden Blatt (Haarlinien auf der Vorderseite des Bildschirmblatts, wandern mit ihm)
sk0, sk1 = Z["skizze"]
bx_ = SW_ / 2
for k, l in enumerate(w_linien):
    e0 = sk0 + (sk1 - sk0 - 6) * k / max(1, len(w_linien) - 1)
    if l[0] == "rect":
        _, x, y, w_, h_ = l
        pts = [(x, y), (x + w_, y), (x + w_, y + h_), (x, y + h_), (x, y)]
        for (a, b), (c, d) in zip(pts, pts[1:]):
            bau.strich((BZ + a, -.0, SH_ - (BZ + b)), (BZ + c, -.0, SH_ - (BZ + d)), e0, 6, .5, normal=(0, -1, 0), eltern=schirm, breite=.008, aus=Z["bildschirm"][0] + 4)
    else:
        _, a, b, c, d = l
        bau.strich((BZ + a, -.0, SH_ - (BZ + b)), (BZ + c, -.0, SH_ - (BZ + d)), e0, 6, .45, normal=(0, -1, 0), eltern=schirm, breite=.007, aus=Z["bildschirm"][0] + 4)
# Rahmen der Anzeige
for (a, b), (c, d) in zip([(0, 0), (NDW, 0), (NDW, NDH), (0, NDH)], [(NDW, 0), (NDW, NDH), (0, NDH), (0, 0)]):
    bau.strich((BZ + a, 0, SH_ - (BZ + b)), (BZ + c, 0, SH_ - (BZ + d)), sk0 - 2, 8, .6, normal=(0, -1, 0), eltern=schirm, breite=.01, aus=Z["bildschirm"][0] + 4)

klapp_teile = [front, deck, back, plate, beinL, beinR, hals, schirm, tfront, tlinks, trechts, trueck, tdeckel, pfosten]
ab_bogen = {"P_Front": Z_POD[0], "P_Deck": Z_POD[0], "P_Back": Z_POD[0], "D_Platte": Z_TISCH[0], "D_BeinL": Z_TISCH[0], "D_BeinR": Z_TISCH[0],
            "M_Hals": Z_MON[0], "M_Schirm": Z_MON[0], "T_Front": ZR["front"][0], "T_Links": ZR["seiten"][0], "T_Rechts": ZR["seiten"][0], "T_Rueck": ZR["rueck"][0],
            "T_Deckel": ZR["rueck"][0], "W_Pfosten": Z_WEG[0]}
steht = {"P_Front": Z_POD[1], "P_Deck": Z_POD[1], "P_Back": Z_POD[1], "D_Platte": Z_TISCH[1], "D_BeinL": Z_TISCH[1], "D_BeinR": Z_TISCH[1],
         "M_Hals": Z_MON[1], "M_Schirm": Z_MON[1], "T_Front": ZR["front"][1], "T_Links": ZR["seiten"][1], "T_Rechts": ZR["seiten"][1], "T_Rueck": ZR["rueck"][1],
         "T_Deckel": ZR["deckel"][1], "W_Pfosten": Z_WEG[1], "T_Boden": ZR["front"][1], "D_Abdruck": Z_TISCH[1], "M_Fuss": Z_MON[1], "W_Fuss": Z_WEG[1]}
bau.schnitt(klapp_teile, 0, *Z["schnitt"], ab_bogen, nachbarn=[boden_r, abdruck_t, fuss, w_fuss])
bau.raster(-6.5, 12.5, -10, 12.5, *Z["raster"], aus=Z["raster_aus"])
bauform_frame = Z["tisch"][1] + 120   # alles steht (nach Monitor, vor den Sätzen)
n_ger = bau.geruest([front, deck, back, plate, beinL, beinR, tfront, tlinks, trechts, trueck, tdeckel, pfosten], *Z["geruest"], steht, frame_bauform=bauform_frame)
bau.spur([front, deck, back, plate, beinL, beinR, tfront, tlinks, trechts, trueck, pfosten], {k: v - 10 for k, v in ab_bogen.items()})
# Falzlinie der Marke (gestrichelt, bleibt) auf dem Deck unter den Lettern
fy = NAME_Y - (PZ + PT)
fx0 = NAME_X + nx0 - .06 * EM - PX; fx1 = NAME_X + nx0 + ges_w + .06 * EM - PX
m_ = max(2, int((fx1 - fx0) / .09))
for k in range(0, m_, 2):
    pa = Vector((fx0 + (fx1 - fx0) * k / m_, fy, PT)); pb = Vector((fx0 + (fx1 - fx0) * (k + 1) / m_, fy, PT))
    bau.strich(pa, pb, Z_POD[0] + 20, 6, .55, normal=(0, 0, 1), eltern=deck, breite=.014)
# Kabel: Bildschirm -> Platte -> Tischbein -> Bogen -> Rechner (zeichnet sich nach dem Aufstellen)
k0, k1 = Z["kabel"]
cable_w = .055
def lokal_platte(x, y):  # Weltpunkt (x, y) auf der Platte -> lokal im Plattenobjekt
    return Vector((x - DX, y - DY, DP))
yk = DY + 2.5
wp = [(XM, Y_HALS + .03), (XM, yk), (DX + DW / 2, yk)]
segs = list(zip(wp, wp[1:]))
tl = sum((Vector(b) - Vector(a)).length for a, b in segs) + DH * .9 + 3 + 1
t_ = k0
for a, b in segs:
    L = (Vector(b) - Vector(a)).length; d_ = (k1 - k0) * .22 * L / 2.0
    bau.strich(lokal_platte(*a), lokal_platte(*b), t_, d_, .92, normal=(0, 0, 1), eltern=plate, breite=cable_w); t_ += d_
# über die Kante und am Bein hinunter (Außenfläche des rechten Beins, lokal: x entlang der Tiefe, z Höhe, y = Außenfläche)
xl = yk - (DY + DD / 2)
bau.strich(Vector((xl, -0.0, DH + DP)), Vector((xl, -0.0, .0)), t_, (k1 - k0) * .2, .92, normal=(0, -1, 0), eltern=beinR, breite=cable_w); t_ += (k1 - k0) * .2
# über den Bogen zum Rechner (weiche Kurve), dann an der Außenseite der linken Rechnerwand hoch
kb, kk, kl = basis.bahn_g2(((DX + DW / 2 + .02, yk), 90), ((X0 - T - G - .35, RY + RD / 2), 90), [], schritt=1.2, n=60)
dur = (k1 - k0) * .46 / len(kb)
for i, (p, q) in enumerate(zip(kb, kb[1:])):
    bau.strich(Vector((p.x, p.y, .0011)), Vector((q.x, q.y, .0011)), t_ + dur * i, dur * 1.4, .92, normal=(0, 0, 1), breite=cable_w)
t_ += dur * len(kb)
bau.strich(Vector((X0 - T - G - .35, RY + RD / 2, .0011)), Vector((X0 - T - G - .0, RY + RD / 2, .0011)), t_, 3, .92, normal=(0, 0, 1), breite=cable_w)
bau_obs = bau.bauen()
print(f"BAU: {sum(len(v) for v in bau.striche.values())} Striche, Gerüstkanten {n_ger}, Objekte {[o.name for o in bau_obs][:8]}")

# ================================================================ Kameras: Einstellungen rahmen ihren Inhalt
KC = SZ["kamera"][ANORDNUNG]
VF = KC["vfov"]; ASP = KC["aspekt"][0] / KC["aspekt"][1]; BILD = tuple(KC["proben_aufloesung"])
KNAME = "Kamera_Handy" if HOCH else "Kamera_Desktop"
H = basis.huellpunkte
def alle_kinder(o):
    r = [o]
    for c in o.children_recursive: r.append(c)
    return [x for x in r if x.type == "MESH" and not x.name.startswith("druck:") and x.get("neubau_rolle") not in ("bau", "schiene")]
def teile_von(*wurzeln):
    out = []
    for w in wurzeln: out += alle_kinder(w)
    return out
objs_name = [name_ob, dot_ob]
objs_podest = [front, deck, back]
objs_tisch = [plate, beinL, beinR, abdruck_t]
objs_dinge = [tablett, tastatur, maus, tasse_boden, becher_boden, topf_boden, lampe_fuss, lampe_arm, lampe_kopf] + tasse_w + becher_w + topf_w
objs_monitor = [fuss, hals, schirm]
objs_tower = [boden_r, tfront, trueck, tlinks, trechts, tdeckel]
objs_weg = [w_fuss, pfosten] + [b for b, _ in bretter]
def rahmt(r):
    was = r["was"]
    if was == "name": return H(objs_name, [r["bild"]])
    if was == "podest_kern": return H(objs_name + objs_podest, [r["bild"]])
    if was == "buehne":
        a_, b_, st = r["bilder"]
        return H(objs_tisch + objs_monitor + objs_tower + objs_weg, list(range(a_, b_ + 1, st)))
    if was == "satz_welt": return H(objs_weg + (objs_tisch if r.get("mit_tisch") else []) + [schirm, fuss], [r["bild"]])
    if was == "schreibtisch_welt": return H(objs_tisch + objs_monitor + objs_dinge, [r["bild"]])
    if was == "wegweiser_welt": return H(objs_weg + [plate, beinL, beinR], [r["bild"]])
    if was == "rechner_welt": return H(objs_tower + [pkt], [r["bild"]])
    raise ValueError("unbekannt: rahmt " + was)
E = []
for e in KC["einstellungen"]:
    pts = []
    for r in e["rahmt"]:
        pts += rahmt(r)
    E.append({"name": e["name"], "f0": e["von"], "f1": e["bis"], "neigung": e["neigung"], "gier": e["gier"], "punkte": pts, "rand": e["rand"],
              "lage_v": e.get("lage_v", .5), "x_fest": None, "z_fest": e.get("z_fest")})
for e in E:
    e["ort"], e["verschiebung"] = basis.rahmen(e["punkte"], e["neigung"], e["gier"], VF, ASP, rand=e["rand"], lage_v=e["lage_v"], x_fest=e["x_fest"])
    if e["z_fest"] is not None and e["neigung"] == 0:
        e["ort"].z = e["z_fest"]          # Startbild: Kamera knapp über dem Papier, Horizont gerade hinter dem Namen
cam = basis.kamera(KNAME, VF)
basis._spuren.clear()
basis.kamerafahrt(cam, E, F_END, ASP)
basis.backen(F_END)
for e in E:
    print(f"EINSTELLUNG {e['name']}: Ort {tuple(round(v, 2) for v in e['ort'])}, Neigung {e['neigung']}, Verschiebung {e['verschiebung']:.3f}")

# ---------------------------------------------------------------- Eingang und Ausgang
def pose(e, f):
    return {"bild": f, "faden": faden_zustand(f),
            "kamera": {"ort": [e["ort"].x, e["ort"].y, e["ort"].z], "neigung": e["neigung"], "gier": e["gier"], "vfov": VF, "verschiebung": e["verschiebung"]}}
UEBERGANG = {"eingang": pose(E[0], 0), "ausgang": pose(E[-1], F_END)}
print("EINGANG", json.dumps(UEBERGANG["eingang"]), "AUSGANG", json.dumps(UEBERGANG["ausgang"]))

# ---------------------------------------------------------------- Prüfung
bericht = {"form_hash": FORM_HASH, "einstellungen": {}, "kollisionen": {}, "hinweise": {}, "uebergang": UEBERGANG, "bahn": BERICHT_BAHN}
alle_meshes = [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith("druck:") and o.get("neubau_rolle") not in ("bau", "schiene")
               and o.name not in ("Boden", "Bogen", "Pruef_Faden") and not o.name.startswith("Abdruck")]
teile = [o for o in alle_meshes if o.name not in ("D_Abdruck", "T_Boden")] + [pruef_faden]
# zulässig: Teile, die sich an ihrem gemeinsamen Falz berühren (der Karton biegt dort); der Faden ist auf das Papier gedruckt und
# liegt unter der Rechner-Front, solange sie noch flach im Bogen liegt
erlaubt = [("P_Front", "P_Deck"), ("P_Deck", "P_Back"), ("T_Rueck", "T_Deckel"), ("Pruef_Faden", "T_Front"), ("Pruef_Faden", "T_Led"), ("Punkt", "Pruef_Faden")]
kol = basis.kollisionen(teile, F_END, erlaubt=erlaubt, schritt=2)
for (a, b), fs in kol.items():
    bericht["kollisionen"][f"{a} x {b}"] = {"bilder": [f for f, n in fs][:12], "anzahl_bilder": len(fs)}
print("KOLLISIONEN:", json.dumps(bericht["kollisionen"], ensure_ascii=False) if bericht["kollisionen"] else "keine")
for e in E:
    aus = 0
    for f in range(e["f0"], e["f1"] + 1, 4):
        aus += len(basis.im_bild(cam, ASP, e["punkte"], f, rand=.005))
    bericht["einstellungen"][e["name"]] = {"punkte_ausserhalb": aus}
bericht["huelle"] = basis.huelle_xy([o for o in teile if o.name != "Pruef_Faden"] + [rail], list(range(0, F_END + 1, 20)))
print("PRUEFUNG", json.dumps(bericht, ensure_ascii=False, indent=1))
os.makedirs(os.path.join(NEU, "tmp"), exist_ok=True)
json.dump(bericht, open(os.path.join(NEU, "tmp", f"eroeffnung_{ANORDNUNG}_pruefung.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- Probebilder
pruef_faden.hide_render = True
if A["proben"]:
    frames = A["frames"] or [0, 40, 66, 150, 200, 240, 290, 340, 400, 480, 560]
    for f in frames:
        t1 = basis.probe(cam, f, os.path.join(PROBEN, f"{ANORDNUNG}_{f:03d}.png"), BILD[0], BILD[1], prozent=200 if HOCH else 100)
        print(f"PROBE {f}: {t1:.1f}s")

# ---------------------------------------------------------------- Export
if A["export"]:
    extras = {
        "szene": "eroeffnung", "frames": F_END, "fps": basis.FPS, "form_hash": FORM_HASH,
        "anordnung": ANORDNUNG, "kamera": {"name": KNAME, "vfov": VF, "aspekt": ASP},
        "licht": basis.LICHT, "pal": PAL,
        "einstellungen": [{k: e[k] for k in ("name", "f0", "f1")} for e in E],
        "lesestellen": [list(Z["lesen"])],
        "verschiebung": json.loads(cam["neubau_verschiebung"]),
        "druckflaechen": {"kern": {"w": PW, "h": PH}, **{f"satz{i + 1}": {"w": FL_W, "h": FL_H} for i in range(3)}},
        "faden_s": [round(s_punkt(f) * laenge, 5) for f in range(F_END + 1)],
        "bahn": BERICHT_BAHN,
        "bogen": SZ["bogen"], "huelle": bericht["huelle"],
        "uebergang": UEBERGANG,
    }
    out = os.path.join(NEU, "seite", "assets", f"eroeffnung-{ANORDNUNG}.glb")
    n = basis.export_glb(out, extras, draco="--draco" in sys.argv)
    print(f"EXPORT {out} {n / 1024:.0f} KB")
